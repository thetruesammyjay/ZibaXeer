#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# ZibaXeer — PaxScan (BlockScout) Contract Verification Script
#
# Verifies all 8 ZibaXeer implementation contracts on paxscan.paxeer.app
# using Foundry's forge verify-contract with the BlockScout verifier.
#
# Usage (from contracts/ directory):
#   bash verify-all.sh
#
# Requirements:
#   - forge installed and in PATH  (foundryup installs it)
#   - Run from the contracts/ directory
#   - No API key needed — PaxScan/BlockScout is open
# ─────────────────────────────────────────────────────────────────────────────

set -e

VERIFIER_URL="https://paxscan.paxeer.app/api/"
CHAIN=125
COMPILER="0.8.21"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ZibaXeer — PaxScan Contract Verification           ║"
echo "║  Chain: HyperPaxeer (${CHAIN}) | BlockScout          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

verify_impl() {
    local ADDRESS="$1"
    local CONTRACT_PATH="$2"
    local NAME="$3"

    echo "▶  Verifying ${NAME} at ${ADDRESS}..."

    forge verify-contract "${ADDRESS}" "${CONTRACT_PATH}" \
        --verifier blockscout \
        --verifier-url "${VERIFIER_URL}" \
        --chain "${CHAIN}" \
        --compiler-version "${COMPILER}" \
        --evm-version london \
        --via-ir \
        --watch

    echo "   ✓ ${NAME} submitted"
    echo ""
    sleep 3
}

verify_proxy() {
    local PROXY_ADDRESS="$1"
    local IMPL_ADDRESS="$2"
    local INIT_CALLDATA="$3"
    local NAME="$4"

    echo "▶  Verifying ${NAME} Proxy at ${PROXY_ADDRESS}..."

    local CONSTRUCTOR_ARGS
    CONSTRUCTOR_ARGS=$(cast abi-encode "constructor(address,bytes)" "${IMPL_ADDRESS}" "${INIT_CALLDATA}")

    forge verify-contract "${PROXY_ADDRESS}" \
        "lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol:ERC1967Proxy" \
        --verifier blockscout \
        --verifier-url "${VERIFIER_URL}" \
        --chain "${CHAIN}" \
        --compiler-version "${COMPILER}" \
        --evm-version london \
        --via-ir \
        --constructor-args "${CONSTRUCTOR_ARGS}" \
        --watch

    echo "   ✓ ${NAME} Proxy submitted"
    echo ""
    sleep 3
}

# ─── Implementations ──────────────────────────────────────────────────────────

verify_impl \
    "0x0386aad01a0bd92543021b631168a721270d96c1" \
    "src/core/ZibaXeerToken.sol:ZibaXeerToken" \
    "ZibaXeerToken"

verify_impl \
    "0x4b5ed7524c554becdf01d7beed9ccfba751c38b0" \
    "src/oracle/ArgusOracle.sol:ArgusOracle" \
    "ArgusOracle"

verify_impl \
    "0x3888dcaeddd74bf7e0cfbd73a5588707dde296dc" \
    "src/adapters/PaxDexAdapter.sol:PaxDexAdapter" \
    "PaxDexAdapter"

verify_impl \
    "0x72967250469db170ebd71f9330af8d2bd234b794" \
    "src/gov/RiskManager.sol:RiskManager" \
    "RiskManager"

verify_impl \
    "0x5334c1ef1ec83fe76c3aee531c59a29b61e8fdaa" \
    "src/gov/RevenueSplitter.sol:RevenueSplitter" \
    "RevenueSplitter"

verify_impl \
    "0xfd74f35ca7194da31a9e378de6b8400f5a218f84" \
    "src/core/VaultRegistry.sol:VaultRegistry" \
    "VaultRegistry"

verify_impl \
    "0x9c9823e9f5aece56343f5423055bd7cf83dbe49f" \
    "src/core/CopyTradingVault.sol:CopyTradingVault" \
    "CopyTradingVault"

verify_impl \
    "0xb451f66fcf41bff655f082a7f5402ad0dfe0645d" \
    "src/core/VaultFactory.sol:VaultFactory" \
    "VaultFactory"

# ─── Proxies (optional — uncomment if you want proxies verified too) ──────────
# Each proxy's constructor args match what the broadcast file shows it was
# deployed with. These use the standard OZ ERC1967Proxy bytecode.

# verify_proxy \
#     "0x4dec4245c4fd697d2419fa9e262404a4e1524f14" \
#     "0x4b5ed7524c554becdf01d7beed9ccfba751c38b0" \
#     "0xc4d66de8000000000000000000000000dc4988e240ffc9d51e1e3ab853577102d6d20fd6" \
#     "ArgusOracle"

# verify_proxy \
#     "0x705ce315ea1108c314d289df205c4875d3a8a04b" \
#     "0x3888dcaeddd74bf7e0cfbd73a5588707dde296dc" \
#     "0x485cc955000000000000000000000000dc4988e240ffc9d51e1e3ab853577102d6d20fd6000000000000000000000000afd60d9930294f8f83ab98ec698bbad888469c4c" \
#     "PaxDexAdapter"

# verify_proxy \
#     "0xd3a558e2627b5b0f6e7ba76cf92052f3743f3df1" \
#     "0x72967250469db170ebd71f9330af8d2bd234b794" \
#     "0x485cc955000000000000000000000000dc4988e240ffc9d51e1e3ab853577102d6d20fd60000000000000000000000004dec4245c4fd697d2419fa9e262404a4e1524f14" \
#     "RiskManager"

# verify_proxy \
#     "0xc990ae725e0c0e3fc80a947558ff9605a483dff1" \
#     "0x5334c1ef1ec83fe76c3aee531c59a29b61e8fdaa" \
#     "0xeb990c59000000000000000000000000dc4988e240ffc9d51e1e3ab853577102d6d20fd6000000000000000000000000dc4988e240ffc9d51e1e3ab853577102d6d20fd600000000000000000000000000000000000000000000000000000000000003e800000000000000000000000000000000000000000000000000000000000000c8" \
#     "RevenueSplitter"

# verify_proxy \
#     "0x6f7e1d9d047c59b02709db7ecbfd4ceda2db49fd" \
#     "0xfd74f35ca7194da31a9e378de6b8400f5a218f84" \
#     "0xc4d66de8000000000000000000000000dc4988e240ffc9d51e1e3ab853577102d6d20fd6" \
#     "VaultRegistry"

# verify_proxy \
#     "0x578cf920c59a454c1945ab260a5ee3958e49aeed" \
#     "0xb451f66fcf41bff655f082a7f5402ad0dfe0645d" \
#     "0xf8c8765e000000000000000000000000dc4988e240ffc9d51e1e3ab853577102d6d20fd60000000000000000000000009c9823e9f5aece56343f5423055bd7cf83dbe49f0000000000000000000000006f7e1d9d047c59b02709db7ecbfd4ceda2db49fd000000000000000000000000d3a558e2627b5b0f6e7ba76cf92052f3743f3df1" \
#     "VaultFactory"

echo "════════════════════════════════════════════════════════"
echo "  All 8 implementations submitted for verification."
echo "  View results at: https://paxscan.paxeer.app"
echo "════════════════════════════════════════════════════════"
