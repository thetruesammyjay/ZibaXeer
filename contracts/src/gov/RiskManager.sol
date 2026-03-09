// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "../oracle/ArgusOracle.sol";

/**
 * @title RiskManager
 * @dev UUPS Upgradeable contract responsible for enforcing protocol safety constraints.
 * It interfaces with the ArgusOracle and determines if a vault trade is allowed.
 */
contract RiskManager is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    ArgusOracle public argusOracle;
    
    // Core risk parameters
    uint256 public constant MAX_SLIPPAGE_BPS = 500; // 5% max slippage out the gate
    uint256 public constant MIN_REPUTATION_SCORE = 600; // Require decent Argus score

    // Vault-specific breaker state
    mapping(address => bool) public isVaultFrozen;
    
    // Events
    event VaultFrozen(address indexed vault, string reason);
    event OracleUpdated(address indexed newOracle);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner, address _argusOracle) initializer public {
        __Ownable_init(initialOwner);
        argusOracle = ArgusOracle(_argusOracle);
    }

    function setArgusOracle(address _argusOracle) external onlyOwner {
        argusOracle = ArgusOracle(_argusOracle);
        emit OracleUpdated(_argusOracle);
    }

    /**
     * @dev Validates whether a generated trade signal violates global parameters
     */
    function validateTrade(address vaultLeader) external view returns (bool) {
        require(!isVaultFrozen[msg.sender], "Vault is frozen");
        
        bool isEligible = argusOracle.isEligible(vaultLeader, MIN_REPUTATION_SCORE);
        require(isEligible, "Leader reputation below threshold");
        
        return true;
    }

    /**
     * @dev Protocol admins can freeze vaults in emergency drawdown scenarios
     */
    function triggerCircuitBreaker(address vault, string calldata reason) external onlyOwner {
        isVaultFrozen[vault] = true;
        emit VaultFrozen(vault, reason);
    }
    
    /**
     * @dev Recover a vault
     */
    function unfreezeVault(address vault) external onlyOwner {
        isVaultFrozen[vault] = false;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}
