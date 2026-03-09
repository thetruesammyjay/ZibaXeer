"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZIBAXEER_ADDRESSES = exports.VaultRegistryABI = exports.RevenueSplitterABI = exports.RiskManagerABI = exports.ZibaXeerTokenABI = exports.VaultFactoryABI = exports.CopyTradingVaultABI = void 0;
// Export ABIs natively
var CopyTradingVault_json_1 = require("./abis/CopyTradingVault.json");
Object.defineProperty(exports, "CopyTradingVaultABI", { enumerable: true, get: function () { return __importDefault(CopyTradingVault_json_1).default; } });
var VaultFactory_json_1 = require("./abis/VaultFactory.json");
Object.defineProperty(exports, "VaultFactoryABI", { enumerable: true, get: function () { return __importDefault(VaultFactory_json_1).default; } });
var ZibaXeerToken_json_1 = require("./abis/ZibaXeerToken.json");
Object.defineProperty(exports, "ZibaXeerTokenABI", { enumerable: true, get: function () { return __importDefault(ZibaXeerToken_json_1).default; } });
var RiskManager_json_1 = require("./abis/RiskManager.json");
Object.defineProperty(exports, "RiskManagerABI", { enumerable: true, get: function () { return __importDefault(RiskManager_json_1).default; } });
var RevenueSplitter_json_1 = require("./abis/RevenueSplitter.json");
Object.defineProperty(exports, "RevenueSplitterABI", { enumerable: true, get: function () { return __importDefault(RevenueSplitter_json_1).default; } });
var VaultRegistry_json_1 = require("./abis/VaultRegistry.json");
Object.defineProperty(exports, "VaultRegistryABI", { enumerable: true, get: function () { return __importDefault(VaultRegistry_json_1).default; } });
// Global Protocol Addresses (HyperPaxeer Chain 125)
exports.ZIBAXEER_ADDRESSES = {
    VAULT_FACTORY: process.env.VAULT_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000',
    // We can add the proxy addresses here as we deploy them to testnet/mainnet
};
