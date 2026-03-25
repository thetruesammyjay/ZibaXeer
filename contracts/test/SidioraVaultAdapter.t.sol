// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {SidioraVaultAdapter} from "../src/adapters/SidioraVaultAdapter.sol";
import {ISidioraTradingAccount} from "../src/interfaces/ISidioraTradingAccount.sol";

contract MockERC20 is ERC20 {
    address public failFrom;
    address public failTo;
    bool public failEnabled;

    constructor() ERC20("Mock USD", "mUSD") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function setTransferFailure(address from, address to, bool enabled) external {
        failFrom = from;
        failTo = to;
        failEnabled = enabled;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        if (failEnabled && _msgSender() == failFrom && to == failTo) {
            return false;
        }

        return super.transfer(to, amount);
    }
}

contract MockSidioraTradingAccount is ISidioraTradingAccount {
    struct DelegatePermissions {
        bool canTrade;
        bool canWithdraw;
        bool canModifyMargin;
        uint256 expiry;
    }

    mapping(address => DelegatePermissions) internal delegates;

    address public lastRemovedDelegate;
    address public lastDepositToken;
    uint256 public lastDepositAmount;
    address public lastWithdrawToken;
    uint256 public lastWithdrawAmount;

    function deposit(address _token, uint256 _amount) external override {
        lastDepositToken = _token;
        lastDepositAmount = _amount;

        bool transferred = IERC20(_token).transferFrom(msg.sender, address(this), _amount);
        require(transferred, "TRANSFER_FROM_FAILED");
    }

    function withdraw(address _token, uint256 _amount) external override {
        lastWithdrawToken = _token;
        lastWithdrawAmount = _amount;

        bool transferred = IERC20(_token).transfer(msg.sender, _amount);
        require(transferred, "TRANSFER_FAILED");
    }

    function addDelegate(
        address _delegate,
        bool _canTrade,
        bool _canWithdraw,
        bool _canModifyMargin,
        uint256 _expiry
    ) external override {
        delegates[_delegate] = DelegatePermissions({
            canTrade: _canTrade,
            canWithdraw: _canWithdraw,
            canModifyMargin: _canModifyMargin,
            expiry: _expiry
        });
    }

    function removeDelegate(address _delegate) external override {
        delete delegates[_delegate];
        lastRemovedDelegate = _delegate;
    }

    function getDelegate(address delegate) external view returns (DelegatePermissions memory) {
        return delegates[delegate];
    }
}

contract SidioraVaultAdapterTest is Test {
    SidioraVaultAdapter internal adapter;
    MockSidioraTradingAccount internal tradingAccount;
    MockERC20 internal token;

    address internal owner = address(0xA11CE);
    address internal mirrorBot = address(0xB07);
    address internal newMirrorBot = address(0xB0B);

    function setUp() public {
        tradingAccount = new MockSidioraTradingAccount();
        token = new MockERC20();

        SidioraVaultAdapter implementation = new SidioraVaultAdapter();
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            abi.encodeWithSelector(
                SidioraVaultAdapter.initialize.selector,
                owner,
                address(tradingAccount),
                mirrorBot
            )
        );
        adapter = SidioraVaultAdapter(address(proxy));

        token.mint(address(adapter), 1_000_000 ether);
        token.mint(address(tradingAccount), 1_000_000 ether);
    }

    function test_AuthorizeMirrorBot_SetsExpectedPermissions() public {
        vm.prank(owner);
        adapter.authorizeMirrorBot();

        MockSidioraTradingAccount.DelegatePermissions memory d = tradingAccount.getDelegate(mirrorBot);
        assertTrue(d.canTrade);
        assertFalse(d.canWithdraw);
        assertTrue(d.canModifyMargin);
        assertEq(d.expiry, type(uint256).max);
    }

    function test_RotateMirrorBot_RevokesOldAndAuthorizesNew() public {
        vm.startPrank(owner);
        adapter.authorizeMirrorBot();
        adapter.rotateMirrorBot(newMirrorBot, block.timestamp + 7 days);
        vm.stopPrank();

        assertEq(tradingAccount.lastRemovedDelegate(), mirrorBot);
        assertEq(adapter.mirrorBotAddress(), newMirrorBot);

        MockSidioraTradingAccount.DelegatePermissions memory newPerms = tradingAccount.getDelegate(newMirrorBot);
        assertTrue(newPerms.canTrade);
        assertFalse(newPerms.canWithdraw);
        assertTrue(newPerms.canModifyMargin);
        assertEq(newPerms.expiry, block.timestamp + 7 days);
    }

    function test_RevokeMirrorBot_RemovesDelegate() public {
        vm.prank(owner);
        adapter.revokeMirrorBot();

        assertEq(tradingAccount.lastRemovedDelegate(), mirrorBot);
    }

    function test_DepositMargin_TransfersFromAdapterIntoTradingAccount() public {
        uint256 amount = 250 ether;

        vm.prank(owner);
        adapter.depositMargin(address(token), amount);

        assertEq(token.balanceOf(address(adapter)), 1_000_000 ether - amount);
        assertEq(token.balanceOf(address(tradingAccount)), 1_000_000 ether + amount);
        assertEq(tradingAccount.lastDepositToken(), address(token));
        assertEq(tradingAccount.lastDepositAmount(), amount);
    }

    function test_WithdrawMargin_TransfersFromTradingAccountBackToOwner() public {
        uint256 amount = 300 ether;
        uint256 ownerBalanceBefore = token.balanceOf(owner);

        vm.prank(owner);
        adapter.withdrawMargin(address(token), amount);

        assertEq(token.balanceOf(owner), ownerBalanceBefore + amount);
        assertEq(tradingAccount.lastWithdrawToken(), address(token));
        assertEq(tradingAccount.lastWithdrawAmount(), amount);
    }

    function test_WithdrawMargin_RevertsWhenTokenTransferToOwnerFails() public {
        token.setTransferFailure(address(adapter), owner, true);

        vm.prank(owner);
        vm.expectRevert();
        adapter.withdrawMargin(address(token), 1 ether);
    }

    function test_DepositMargin_RevertsOnZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert(SidioraVaultAdapter.InvalidAmount.selector);
        adapter.depositMargin(address(token), 0);
    }

    function test_OnlyOwnerCanManageDelegates() public {
        vm.expectRevert();
        adapter.authorizeMirrorBot();

        vm.expectRevert();
        adapter.revokeMirrorBot();

        vm.expectRevert();
        adapter.rotateMirrorBot(newMirrorBot, block.timestamp + 1 days);
    }
}
