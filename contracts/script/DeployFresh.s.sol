// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {ZibaXeerToken} from "../src/core/ZibaXeerToken.sol";
import {ArgusOracle} from "../src/oracle/ArgusOracle.sol";
import {PaxDexAdapter} from "../src/adapters/PaxDexAdapter.sol";
import {RiskManager} from "../src/gov/RiskManager.sol";
import {RevenueSplitter} from "../src/gov/RevenueSplitter.sol";
import {VaultRegistry} from "../src/core/VaultRegistry.sol";
import {CopyTradingVault} from "../src/core/CopyTradingVault.sol";
import {VaultFactory} from "../src/core/VaultFactory.sol";

/**
 * @title DeployFresh
 * @dev Full fresh deployment — no dependency on previous runs.
 *      Run after clearing nonce drift from earlier attempts.
 */
contract DeployFresh is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployerAddress    = vm.envAddress("DEPLOYER_ADDRESS");
        address paxDexRouter       = vm.envAddress("PAX_DEX_ROUTER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        console.log("-------------------------------------------");
        console.log("ZibaXeer Fresh Deploy on ChainID", block.chainid);
        console.log("-------------------------------------------");

        // 1. ZBX Token
        ZibaXeerToken zbxToken = new ZibaXeerToken();
        console.log("ZibaXeerToken:", address(zbxToken));

        // 2. ArgusOracle
        ArgusOracle oracleImpl = new ArgusOracle();
        bytes memory oracleInit = abi.encodeCall(ArgusOracle.initialize, (deployerAddress));
        address oracleProxy = address(new ERC1967Proxy(address(oracleImpl), oracleInit));
        console.log("ArgusOracle Proxy:", oracleProxy);

        // 3. PaxDexAdapter
        PaxDexAdapter adapterImpl = new PaxDexAdapter();
        bytes memory adapterInit = abi.encodeCall(PaxDexAdapter.initialize, (deployerAddress, paxDexRouter));
        address adapterProxy = address(new ERC1967Proxy(address(adapterImpl), adapterInit));
        console.log("PaxDexAdapter Proxy:", adapterProxy);

        // 4. RiskManager
        RiskManager riskImpl = new RiskManager();
        bytes memory riskInit = abi.encodeCall(RiskManager.initialize, (deployerAddress, oracleProxy));
        address riskProxy = address(new ERC1967Proxy(address(riskImpl), riskInit));
        console.log("RiskManager Proxy:", riskProxy);

        // 5. RevenueSplitter
        RevenueSplitter splitterImpl = new RevenueSplitter();
        bytes memory splitterInit = abi.encodeCall(
            RevenueSplitter.initialize,
            (deployerAddress, deployerAddress, 1000, 200)
        );
        address splitterProxy = address(new ERC1967Proxy(address(splitterImpl), splitterInit));
        console.log("RevenueSplitter Proxy:", splitterProxy);

        // 6. VaultRegistry
        VaultRegistry registryImpl = new VaultRegistry();
        bytes memory registryInit = abi.encodeCall(VaultRegistry.initialize, (deployerAddress));
        address registryProxy = address(new ERC1967Proxy(address(registryImpl), registryInit));
        console.log("VaultRegistry Proxy:", registryProxy);

        // 7. CopyTradingVault (implementation only)
        CopyTradingVault vaultImpl = new CopyTradingVault();
        console.log("CopyTradingVault Impl:", address(vaultImpl));

        // 8. VaultFactory
        VaultFactory factoryImpl = new VaultFactory();
        bytes memory factoryInit = abi.encodeCall(
            VaultFactory.initialize,
            (deployerAddress, address(vaultImpl), registryProxy, riskProxy)
        );
        address factoryProxy = address(new ERC1967Proxy(address(factoryImpl), factoryInit));
        console.log("VaultFactory Proxy:", factoryProxy);

        // 9. Wire up registry → factory
        VaultRegistry(registryProxy).setAuthorizedFactory(factoryProxy);
        console.log("-> VaultFactory registered in VaultRegistry");

        vm.stopBroadcast();
        console.log("Done.");
    }
}
