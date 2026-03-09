// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {RiskManager} from "../src/gov/RiskManager.sol";
import {ArgusOracle} from "../src/oracle/ArgusOracle.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract RiskManagerTest is Test {
    RiskManager public riskManager;
    ArgusOracle public oracle;
    
    address public owner = address(0x1);
    address public leader = address(0x2);
    address public vault = address(0x3);

    function setUp() public {
        vm.startPrank(owner);
        
        // 1. Deploy Argus Oracle
        ArgusOracle oracleImpl = new ArgusOracle();
        ERC1967Proxy oracleProxy = new ERC1967Proxy(
            address(oracleImpl),
            abi.encodeWithSelector(ArgusOracle.initialize.selector, owner)
        );
        oracle = ArgusOracle(address(oracleProxy));

        // 2. Deploy Risk Manager
        RiskManager riskImpl = new RiskManager();
        ERC1967Proxy riskProxy = new ERC1967Proxy(
            address(riskImpl),
            abi.encodeWithSelector(RiskManager.initialize.selector, owner, address(oracle))
        );
        riskManager = RiskManager(address(riskProxy));
        
        vm.stopPrank();
    }

    function test_Initialize_Success() public view {
        assertEq(riskManager.owner(), owner);
        assertEq(address(riskManager.argusOracle()), address(oracle));
        assertEq(riskManager.MIN_REPUTATION_SCORE(), 600);
    }

    function test_ValidateTrade_Passes() public {
        vm.prank(owner);
        oracle.updateMetrics(leader, 650, 60, 0, 1);
        
        vm.prank(vault);
        bool isValid = riskManager.validateTrade(leader);
        assertTrue(isValid);
    }

    function test_ValidateTrade_FailsReputation() public {
        vm.prank(owner);
        oracle.updateMetrics(leader, 500, 40, 0, 1);
        
        vm.prank(vault);
        vm.expectRevert("Leader reputation below threshold");
        riskManager.validateTrade(leader);
    }

    function test_TriggerCircuitBreaker() public {
        vm.prank(owner);
        riskManager.triggerCircuitBreaker(vault, "Emergency");
        assertTrue(riskManager.isVaultFrozen(vault));
        
        vm.prank(vault);
        vm.expectRevert("Vault is frozen");
        riskManager.validateTrade(leader);
    }
}
