import { prisma } from '@zibaxeer/db';
import {
    SidioraMirrorExecutionResultPayload,
    SidioraMirrorSignalPayload,
} from '@zibaxeer/types';

let isAuditTableReady = false;

async function ensureAuditTable() {
    if (isAuditTableReady) {
        return;
    }

    await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS sidiora_mirror_decisions (
            trace_id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            reason TEXT,
            policy_version TEXT NOT NULL,
            vault_address TEXT NOT NULL,
            leader_address TEXT NOT NULL,
            follower_address TEXT,
            sidiora_account TEXT,
            sequencer_request_id TEXT,
            signal_payload TEXT NOT NULL,
            risk_snapshot TEXT NOT NULL,
            decision_timestamp TIMESTAMPTZ NOT NULL,
            duplicate_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;

    isAuditTableReady = true;
}

export async function recordSidioraMirrorDecision(
    signal: SidioraMirrorSignalPayload,
    result: SidioraMirrorExecutionResultPayload,
    policyVersion: string
) {
    await ensureAuditTable();

    const signalPayload = JSON.stringify(signal);
    const riskSnapshot = JSON.stringify(result.riskSnapshot);
    const decisionAt = new Date(result.timestamp * 1000);

    await prisma.$executeRaw`
        INSERT INTO sidiora_mirror_decisions (
            trace_id,
            status,
            reason,
            policy_version,
            vault_address,
            leader_address,
            follower_address,
            sidiora_account,
            sequencer_request_id,
            signal_payload,
            risk_snapshot,
            decision_timestamp,
            updated_at,
            last_seen_at
        )
        VALUES (
            ${result.traceId},
            ${result.status},
            ${result.reason},
            ${policyVersion},
            ${result.vaultAddress},
            ${result.leaderAddress},
            ${result.followerAddress},
            ${result.sidioraAccount},
            ${result.sequencerRequestId},
            ${signalPayload},
            ${riskSnapshot},
            ${decisionAt},
            NOW(),
            ${decisionAt}
        )
        ON CONFLICT (trace_id)
        DO UPDATE SET
            status = EXCLUDED.status,
            reason = EXCLUDED.reason,
            policy_version = EXCLUDED.policy_version,
            vault_address = EXCLUDED.vault_address,
            leader_address = EXCLUDED.leader_address,
            follower_address = EXCLUDED.follower_address,
            sidiora_account = EXCLUDED.sidiora_account,
            sequencer_request_id = EXCLUDED.sequencer_request_id,
            signal_payload = EXCLUDED.signal_payload,
            risk_snapshot = EXCLUDED.risk_snapshot,
            decision_timestamp = EXCLUDED.decision_timestamp,
            updated_at = NOW(),
            last_seen_at = EXCLUDED.last_seen_at
    `;
}

export async function recordSidioraDuplicateTrace(traceId: string) {
    await ensureAuditTable();

    await prisma.$executeRaw`
        INSERT INTO sidiora_mirror_decisions (
            trace_id,
            status,
            reason,
            policy_version,
            vault_address,
            leader_address,
            follower_address,
            sidiora_account,
            sequencer_request_id,
            signal_payload,
            risk_snapshot,
            decision_timestamp,
            duplicate_count,
            updated_at,
            last_seen_at
        )
        VALUES (
            ${traceId},
            'DUPLICATE_IGNORED',
            'TRACE_ID_ALREADY_PROCESSED',
            'unknown',
            'unknown',
            'unknown',
            'unknown',
            'unknown',
            'unknown',
            '{}',
            '{}',
            NOW(),
            1,
            NOW(),
            NOW()
        )
        ON CONFLICT (trace_id)
        DO UPDATE SET
            duplicate_count = sidiora_mirror_decisions.duplicate_count + 1,
            updated_at = NOW(),
            last_seen_at = NOW()
    `;
}

export async function getSidioraTraceAudit(traceId: string) {
    await ensureAuditTable();

    const rows = await prisma.$queryRaw<Array<{
        trace_id: string;
        status: string;
        reason: string | null;
        policy_version: string;
        vault_address: string;
        leader_address: string;
        follower_address: string | null;
        sidiora_account: string | null;
        sequencer_request_id: string | null;
        signal_payload: string;
        risk_snapshot: string;
        decision_timestamp: Date;
        duplicate_count: number;
        created_at: Date;
        updated_at: Date;
        last_seen_at: Date;
    }>>`
        SELECT *
        FROM sidiora_mirror_decisions
        WHERE trace_id = ${traceId}
        LIMIT 1
    `;

    return rows[0] ?? null;
}

export async function getSidioraAuditStats() {
    await ensureAuditTable();

    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*)::bigint AS count
        FROM sidiora_mirror_decisions
    `;

    return {
        totalTraces: Number(rows[0]?.count ?? 0n),
    };
}
