// Export ABIs natively
export { default as CopyTradingVaultABI } from './abis/CopyTradingVault.json';
export { default as VaultFactoryABI } from './abis/VaultFactory.json';
export { default as ZibaXeerTokenABI } from './abis/ZibaXeerToken.json';
export { default as RiskManagerABI } from './abis/RiskManager.json';
export { default as RevenueSplitterABI } from './abis/RevenueSplitter.json';
export { default as VaultRegistryABI } from './abis/VaultRegistry.json';

// Global Protocol Addresses (HyperPaxeer Chain 125)
export const ZIBAXEER_ADDRESSES = {
    VAULT_FACTORY: process.env.VAULT_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000',
    // We can add the proxy addresses here as we deploy them to testnet/mainnet
} as const;
