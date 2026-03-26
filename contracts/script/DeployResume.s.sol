// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {ArgusOracle} from "../src/oracle/ArgusOracle.sol";
import {PaxDexAdapter} from "../src/adapters/PaxDexAdapter.sol";
import {RiskManager} from "../src/gov/RiskManager.sol";
import {RevenueSplitter} from "../src/gov/RevenueSplitter.sol";
import {VaultRegistry} from "../src/core/VaultRegistry.sol";
import {CopyTradingVault} from "../src/core/CopyTradingVault.sol";
import {VaultFactory} from "../src/core/VaultFactory.sol";

/**
 * @title DeployResumeScript
 * @dev Resumes deployment from ArgusOracle proxy onwards.
 *      ZibaXeerToken and ArgusOracle implementation are already deployed on-chain.
 *
 *  Confirmed on-chain:
 *    ZibaXeerToken       → 0x0386aAd01a0bd92543021b631168A721270d96C1
 *    ArgusOracle impl    → 0x4B5ed7524C554BecdF01D7BEED9cCfBa751C38b0
 */
contract DeployResumeScript is Script {
    // ─── Already deployed ─────────────────────────────────────────────────────
    address constant ARGUS_ORACLE_IMPL = 0x4B5ed7524C554BecdF01D7BEED9cCfBa751C38b0;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployerAddress    = vm.envAddress("DEPLOYER_ADDRESS");
        address paxDexRouter       = vm.envAddress("PAX_DEX_ROUTER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        console.log("-----------------------------------------");
        console.log("Resuming ZibaXeer Deployment on ChainID", block.chainid);
        console.log("-----------------------------------------");

        // 1. ArgusOracle Proxy (using already-deployed implementation)
        ERC1967Proxy oracleProxy = new ERC1967Proxy(
            ARGUS_ORACLE_IMPL,
            abi.encodeWithSelector(ArgusOracle.initialize.selector, deployerAddress)
        );
        console.log("ArgusOracle Proxy deployed at:", address(oracleProxy));

        // 2. PaxDex Adapter (UUPS)
        PaxDexAdapter adapterImpl = new PaxDexAdapter();
        ERC1967Proxy adapterProxy = new ERC1967Proxy(
            address(adapterImpl),
            abi.encodeWithSelector(PaxDexAdapter.initialize.selector, deployerAddress, paxDexRouter)
        );
        console.log("PaxDexAdapter Proxy deployed at:", address(adapterProxy));

        // 3. Risk Manager (UUPS)
        RiskManager riskManagerImpl = new RiskManager();
        ERC1967Proxy riskManagerProxy = new ERC1967Proxy(
            address(riskManagerImpl),
            abi.encodeWithSelector(RiskManager.initialize.selector, deployerAddress, address(oracleProxy))
        );
        console.log("RiskManager Proxy deployed at:", address(riskManagerProxy));

        // 4. Revenue Splitter (UUPS)
        RevenueSplitter splitterImpl = new RevenueSplitter();
        ERC1967Proxy splitterProxy = new ERC1967Proxy(
            address(splitterImpl),
            abi.encodeWithSelector(
                RevenueSplitter.initialize.selector,
                deployerAddress,
                deployerAddress, // Treasury
                1000,            // 10% leader cut
                200              // 2% protocol fee
            )
        );
        console.log("RevenueSplitter Proxy deployed at:", address(splitterProxy));

        // 5. Vault Registry (UUPS)
        VaultRegistry registryImpl = new VaultRegistry();
        ERC1967Proxy registryProxy = new ERC1967Proxy(
            address(registryImpl),
            abi.encodeWithSelector(VaultRegistry.initialize.selector, deployerAddress)
        );
        console.log("VaultRegistry Proxy deployed at:", address(registryProxy));

        // 6. CopyTradingVault implementation
        CopyTradingVault vaultImpl = new CopyTradingVault();
        console.log("CopyTradingVault Implementation deployed at:", address(vaultImpl));

        // 7. Vault Factory (UUPS)
        VaultFactory factoryImpl = new VaultFactory();
        ERC1967Proxy factoryProxy = new ERC1967Proxy(
            address(factoryImpl),
            abi.encodeWithSelector(
                VaultFactory.initialize.selector,
                deployerAddress,
                address(vaultImpl),
                address(registryProxy),
                address(riskManagerProxy)
            )
        );
        console.log("VaultFactory Proxy deployed at:", address(factoryProxy));

        // 8. Link: register factory in registry
        VaultRegistry(address(registryProxy)).setAuthorizedFactory(address(factoryProxy));
        console.log("-> Registered VaultFactory in VaultRegistry");

        vm.stopBroadcast();
        console.log("Deployment Complete.");
    }
}
