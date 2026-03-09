// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import "./VaultRegistry.sol";
import "../gov/RiskManager.sol";

/**
 * @title VaultFactory
 * @dev UUPS Upgradeable factory contract for spinning up new ZibaXeer CopyTradingVaults.
 * Validates gladiator eligibility through the RiskManager before deploying a proxy.
 */
contract VaultFactory is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    address public vaultImplementation;
    VaultRegistry public registry;
    RiskManager public riskManager;

    event VaultDeployed(address indexed leader, address indexed vaultProxy);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address initialOwner, 
        address _vaultImplementation,
        address _registry,
        address _riskManager
    ) initializer public {
        __Ownable_init(initialOwner);
        
        vaultImplementation = _vaultImplementation;
        registry = VaultRegistry(_registry);
        riskManager = RiskManager(_riskManager);
    }

    /**
     * @dev Deploys a new CopyTradingVault proxy for the caller
     */
    function createVault(
        string memory vaultName,
        address assetToken,
        address dexAdapter,
        address revenueSplitter
    ) external returns (address) {
        // Enforce the Argus reputation check via the RiskManager
        require(riskManager.validateTrade(msg.sender), "Leader ineligible for vault creation");

        // Prepare initialization data for the new clone
        // Function signature: initialize(address,string,address,address,address,address)
        bytes memory initData = abi.encodeWithSignature(
            "initialize(address,string,address,address,address,address)",
            msg.sender, // leader
            vaultName,
            assetToken,
            address(riskManager),
            dexAdapter,
            revenueSplitter
        );

        // Deploy UUPS proxy pointing to active implementation
        ERC1967Proxy proxy = new ERC1967Proxy(vaultImplementation, initData);
        address vaultAddress = address(proxy);
        
        // Log in the central directory
        registry.registerVault(msg.sender, vaultAddress);
        
        emit VaultDeployed(msg.sender, vaultAddress);
        
        return vaultAddress;
    }

    // System configurations
    function setVaultImplementation(address _impl) external onlyOwner {
        vaultImplementation = _impl;
    }

    function setDependencies(address _registry, address _riskManager) external onlyOwner {
        registry = VaultRegistry(_registry);
        riskManager = RiskManager(_riskManager);
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}
