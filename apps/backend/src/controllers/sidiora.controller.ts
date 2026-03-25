import { Request, Response } from 'express';
import {
    freezeVaultMirroring,
    getSidioraPolicy,
    isVaultFrozen,
    listFrozenVaults,
    unfreezeVaultMirroring,
    updateSidioraPolicy,
} from '../services/sidioraPolicy.service';
import {
    sidioraMirrorResultQueue,
    sidioraMirrorSignalQueue,
    sidioraRiskAlertQueue,
} from '../queues/sidiora.queues';
import { getSidioraAuditStats, getSidioraTraceAudit } from '../services/sidioraAudit.service';

function normalizePathParam(value: string | string[] | undefined): string {
    if (Array.isArray(value)) {
        return (value[0] ?? '').trim();
    }

    return (value ?? '').trim();
}

export const getSidioraPolicyController = async (_req: Request, res: Response) => {
    return res.status(200).json({
        success: true,
        data: getSidioraPolicy(),
    });
};

export const updateSidioraPolicyController = async (req: Request, res: Response) => {
    try {
        const policy = updateSidioraPolicy(req.body ?? {});
        return res.status(200).json({ success: true, data: policy });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid policy patch';
        return res.status(400).json({ success: false, message });
    }
};

export const getSidioraMirroringStatusController = async (_req: Request, res: Response) => {
    const [signalWaiting, signalActive, resultWaiting, alertWaiting, auditStats] = await Promise.all([
        sidioraMirrorSignalQueue.getWaitingCount(),
        sidioraMirrorSignalQueue.getActiveCount(),
        sidioraMirrorResultQueue.getWaitingCount(),
        sidioraRiskAlertQueue.getWaitingCount(),
        getSidioraAuditStats(),
    ]);

    return res.status(200).json({
        success: true,
        data: {
            status: 'ok',
            queues: {
                signalWaiting,
                signalActive,
                resultWaiting,
                alertWaiting,
            },
            frozenVaults: listFrozenVaults(),
            audit: auditStats,
            sequencerReachability: 'unknown',
            timestamp: new Date().toISOString(),
        },
    });
};

export const getSidioraTraceAuditController = async (req: Request, res: Response) => {
    const traceId = normalizePathParam(req.params.traceId);
    if (!traceId) {
        return res.status(400).json({ success: false, message: 'traceId parameter is required' });
    }

    const traceAudit = await getSidioraTraceAudit(traceId);
    if (!traceAudit) {
        return res.status(404).json({ success: false, message: 'Trace audit not found' });
    }

    return res.status(200).json({
        success: true,
        data: traceAudit,
    });
};

export const freezeSidioraMirroringController = async (req: Request, res: Response) => {
    const vaultAddress = normalizePathParam(req.params.vault);
    if (!vaultAddress) {
        return res.status(400).json({ success: false, message: 'vault parameter is required' });
    }

    freezeVaultMirroring(vaultAddress);

    return res.status(200).json({
        success: true,
        data: {
            vaultAddress,
            frozen: true,
        },
    });
};

export const unfreezeSidioraMirroringController = async (req: Request, res: Response) => {
    const vaultAddress = normalizePathParam(req.params.vault);
    if (!vaultAddress) {
        return res.status(400).json({ success: false, message: 'vault parameter is required' });
    }

    unfreezeVaultMirroring(vaultAddress);

    return res.status(200).json({
        success: true,
        data: {
            vaultAddress,
            frozen: isVaultFrozen(vaultAddress),
        },
    });
};
