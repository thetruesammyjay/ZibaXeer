// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title ArgusOracle
 * @dev UUPS Upgradeable Oracle bridging the off-chain Argus Risk Engine.
 * Allows governance/automation to post gladiator reputation scores and risk metrics on-chain.
 */
contract ArgusOracle is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    struct Metrics {
        uint256 reputationScore; // 0-1000
        uint256 winRate; // Basis points (e.g. 5500 = 55%)
        uint256 maxDrawdown; // Basis points
        uint256 signalCount; // Total trades processed by Argus
        uint256 lastUpdated;
    }

    mapping(address => Metrics) public gladiatorMetrics;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) initializer public {
        __Ownable_init(initialOwner);
    }

    /**
     * @dev Called by the Argus off-chain relayer to update a gladiator's risk metrics
     */
    function updateMetrics(
        address gladiator,
        uint256 reputationScore,
        uint256 winRate,
        uint256 maxDrawdown,
        uint256 signalCount
    ) external onlyOwner {
        gladiatorMetrics[gladiator] = Metrics({
            reputationScore: reputationScore,
            winRate: winRate,
            maxDrawdown: maxDrawdown,
            signalCount: signalCount,
            lastUpdated: block.timestamp
        });
    }

    function getReputationScore(address gladiator) external view returns (uint256) {
        return gladiatorMetrics[gladiator].reputationScore;
    }

    function getPerformanceMetrics(address gladiator) external view returns (Metrics memory) {
        return gladiatorMetrics[gladiator];
    }

    function isEligible(address gladiator, uint256 minScoreThreshold) external view returns (bool) {
        return gladiatorMetrics[gladiator].reputationScore >= minScoreThreshold;
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        onlyOwner
        override
    {}
}
