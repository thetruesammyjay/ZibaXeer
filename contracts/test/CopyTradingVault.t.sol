// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {ZibaXeerToken} from "../src/core/ZibaXeerToken.sol";
import {ArgusOracle} from "../src/oracle/ArgusOracle.sol";
import {PaxDexAdapter} from "../src/adapters/PaxDexAdapter.sol";
import {RiskManager} from "../src/gov/RiskManager.sol";
import {RevenueSplitter} from "../src/gov/RevenueSplitter.sol";
import {VaultRegistry} from "../src/core/VaultRegistry.sol";
import {CopyTradingVault} from "../src/core/CopyTradingVault.sol";
import {VaultFactory} from "../src/core/VaultFactory.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockAsset is ERC20 {
    constructor() ERC20("Mock USD", "mUSD") {}
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CopyTradingVaultTest is Test {
    ZibaXeerToken public token;
    ArgusOracle public oracle;
    PaxDexAdapter public adapter;
    RiskManager public riskManager;
    RevenueSplitter public splitter;
    VaultRegistry public registry;
    CopyTradingVault public vaultImpl;
    VaultFactory public factory;
    
    MockAsset public mockAsset;
    
    address public owner = address(0x1);
    address public leader = address(0x2);
    address public follower = address(0x3);
    address public treasury = address(0x4);
    address public router = address(0x5);

    function setUp() public {
        vm.startPrank(owner);
        
        // 1. Setup Oracle
        ArgusOracle oracleImpl = new ArgusOracle();
        ERC1967Proxy oracleProxy = new ERC1967Proxy(address(oracleImpl), abi.encodeWithSelector(ArgusOracle.initialize.selector, owner));
        oracle = ArgusOracle(address(oracleProxy));

        // 2. Setup Risk Manager
        RiskManager riskImpl = new RiskManager();
        ERC1967Proxy riskProxy = new ERC1967Proxy(address(riskImpl), abi.encodeWithSelector(RiskManager.initialize.selector, owner, address(oracle)));
        riskManager = RiskManager(address(riskProxy));

        // 3. Setup Splitter
        RevenueSplitter splitterImpl = new RevenueSplitter();
        ERC1967Proxy splitterProxy = new ERC1967Proxy(address(splitterImpl), abi.encodeWithSelector(RevenueSplitter.initialize.selector, owner, treasury, 1000, 200));
        splitter = RevenueSplitter(address(splitterProxy));

        // 4. Setup Adapter
        PaxDexAdapter adapterImpl = new PaxDexAdapter();
        ERC1967Proxy adapterProxy = new ERC1967Proxy(address(adapterImpl), abi.encodeWithSelector(PaxDexAdapter.initialize.selector, owner, router));
        adapter = PaxDexAdapter(address(adapterProxy));

        // 5. Setup Registry
        VaultRegistry registryImpl = new VaultRegistry();
        ERC1967Proxy registryProxy = new ERC1967Proxy(address(registryImpl), abi.encodeWithSelector(VaultRegistry.initialize.selector, owner));
        registry = VaultRegistry(address(registryProxy));

        // 6. Setup Vault Implementation & Factory
        vaultImpl = new CopyTradingVault();
        VaultFactory factoryImpl = new VaultFactory();
        ERC1967Proxy factoryProxy = new ERC1967Proxy(
            address(factoryImpl), 
            abi.encodeWithSelector(VaultFactory.initialize.selector, owner, address(vaultImpl), address(registry), address(riskManager))
        );
        factory = VaultFactory(address(factoryProxy));

        // 7. Link systems
        registry.setAuthorizedFactory(address(factory));
        
        // 8. Prepare Leader 
        oracle.updateMetrics(leader, 650, 60, 0, 1);
        
        // 9. Prepare Mock Asset
        mockAsset = new MockAsset();

        vm.stopPrank();
    }

    function test_CreateVault_Success() public {
        vm.prank(leader);
        address newVaultAddress = factory.createVault("Alpha Strategy", address(mockAsset), address(adapter), address(splitter));
        
        assertTrue(newVaultAddress != address(0));
        assertTrue(registry.isValidVault(newVaultAddress));
        
        CopyTradingVault deployedVault = CopyTradingVault(newVaultAddress);
        assertEq(deployedVault.leader(), leader);
        assertEq(deployedVault.baseAsset(), address(mockAsset));
        assertEq(deployedVault.vaultName(), "Alpha Strategy");
    }

    function test_CreateVault_RevertIfLowReputation() public {
        vm.prank(owner);
        oracle.updateMetrics(leader, 500, 40, 0, 1);
        
        vm.prank(leader);
        vm.expectRevert("Leader reputation below threshold");
        factory.createVault("Alpha Strategy", address(mockAsset), address(adapter), address(splitter));
    }

    function test_DepositAndWithdraw() public {
        vm.prank(leader);
        address vaultAddress = factory.createVault("Alpha Strategy", address(mockAsset), address(adapter), address(splitter));
        CopyTradingVault vault = CopyTradingVault(vaultAddress);
        
        // Follower deposits
        uint256 depositAmt = 1000 ether;
        mockAsset.mint(follower, depositAmt);
        
        vm.startPrank(follower);
        mockAsset.approve(vaultAddress, depositAmt);
        vault.subscribe(depositAmt);
        vm.stopPrank();

        assertEq(mockAsset.balanceOf(vaultAddress), depositAmt);
        (uint256 deposited1, ) = vault.followers(follower);
        assertEq(deposited1, depositAmt);

        // Follower withdraws
        vm.startPrank(follower);
        vault.unsubscribe(depositAmt);
        vm.stopPrank();
        
        assertEq(mockAsset.balanceOf(vaultAddress), 0);
        (uint256 deposited2, ) = vault.followers(follower);
        assertEq(deposited2, 0);
        assertEq(mockAsset.balanceOf(follower), depositAmt); // Returned explicitly 
    }
}
