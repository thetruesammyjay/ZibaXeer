// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title VaultRegistry
 * @dev UUPS Upgradeable central directory for the ZibaXeer protocol.
 * Tracks all officially deployed Vaults and their mapping to designated Leaders.
 */
contract VaultRegistry is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    
    // vault address => is registered
    mapping(address => bool) public isRegisteredVault;
    
    // leader address => list of live vaults they manage
    mapping(address => address[]) public leaderToVaults;
    
    // Address of the authorized VaultFactory allowed to write to this registry
    address public authorizedFactory;

    event VaultRegistered(address indexed leader, address indexed vault);
    event FactoryUpdated(address indexed oldFactory, address indexed newFactory);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) initializer public {
        __Ownable_init(initialOwner);
    }

    modifier onlyFactory() {
        require(msg.sender == authorizedFactory, "Caller is not the authorized Factory");
        _;
    }

    function setAuthorizedFactory(address _factory) external onlyOwner {
        emit FactoryUpdated(authorizedFactory, _factory);
        authorizedFactory = _factory;
    }

    /**
     * @dev Add a deployed vault to the central directory
     */
    function registerVault(address leader, address vault) external onlyFactory {
        isRegisteredVault[vault] = true;
        leaderToVaults[leader].push(vault);
        emit VaultRegistered(leader, vault);
    }
    
    function getVaultsByLeader(address leader) external view returns (address[] memory) {
        return leaderToVaults[leader];
    }
    
    function isValidVault(address vault) external view returns (bool) {
        return isRegisteredVault[vault];
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}
