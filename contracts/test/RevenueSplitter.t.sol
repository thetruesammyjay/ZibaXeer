// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {RevenueSplitter} from "../src/gov/RevenueSplitter.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MOCK") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract RevenueSplitterTest is Test {
    RevenueSplitter public splitter;
    MockERC20 public mockToken;
    
    address public owner = address(0x1);
    address public treasury = address(0x2);
    address public leader = address(0x3);
    address public vault = address(0x4);

    uint256 public constant LEADER_SHARE_BPS = 1000; // 10%
    uint256 public constant PROTOCOL_FEE_BPS = 200;  // 2%

    function setUp() public {
        vm.startPrank(owner);
        
        RevenueSplitter splitterImpl = new RevenueSplitter();
        ERC1967Proxy splitterProxy = new ERC1967Proxy(
            address(splitterImpl),
            abi.encodeWithSelector(
                RevenueSplitter.initialize.selector, 
                owner, 
                treasury, 
                LEADER_SHARE_BPS, 
                PROTOCOL_FEE_BPS
            )
        );
        splitter = RevenueSplitter(address(splitterProxy));
        
        mockToken = new MockERC20();
        
        vm.stopPrank();
    }

    function test_Initialize_Success() public view {
        assertEq(splitter.owner(), owner);
        assertEq(splitter.protocolTreasury(), treasury);
        assertEq(splitter.leaderShareBps(), LEADER_SHARE_BPS);
        assertEq(splitter.protocolFeeBps(), PROTOCOL_FEE_BPS);
    }

    function test_SplitProfit_Success() public {
        uint256 totalProfit = 10000;
        
        // Mint tokens to the vault, as it holds the funds
        mockToken.mint(vault, totalProfit);
        
        vm.startPrank(vault);
        // Vault approves splitter to pull funds
        mockToken.approve(address(splitter), totalProfit);
        
        uint256 remainingProfit = splitter.splitProfit(
            address(mockToken), 
            totalProfit,
            leader 
        );
        vm.stopPrank();

        uint256 expectedLeaderShare = (totalProfit * LEADER_SHARE_BPS) / 10000;
        uint256 expectedProtocolFee = (totalProfit * PROTOCOL_FEE_BPS) / 10000;
        uint256 expectedRemaining = totalProfit - expectedLeaderShare - expectedProtocolFee;

        assertEq(mockToken.balanceOf(leader), expectedLeaderShare);
        assertEq(mockToken.balanceOf(treasury), expectedProtocolFee);
        assertEq(remainingProfit, expectedRemaining);
        
        // The remaining profit should be left inside the vault
        assertEq(mockToken.balanceOf(vault), expectedRemaining);
    }

    function test_SetTreasury_RevertIfNotOwner() public {
        vm.prank(leader);
        vm.expectRevert(); 
        splitter.setTreasury(address(0x5));
    }

    function test_SetTreasury_Success() public {
        vm.prank(owner);
        splitter.setTreasury(address(0x5));
        assertEq(splitter.protocolTreasury(), address(0x5));
    }
}
