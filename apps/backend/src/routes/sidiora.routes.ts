import { Router } from 'express';
import {
    freezeSidioraMirroringController,
    getSidioraMirroringStatusController,
    getSidioraPolicyController,
    getSidioraTraceAuditController,
    unfreezeSidioraMirroringController,
    updateSidioraPolicyController,
} from '../controllers/sidiora.controller';

const router = Router();

router.get('/policy', getSidioraPolicyController);
router.put('/policy', updateSidioraPolicyController);
router.get('/mirroring/status', getSidioraMirroringStatusController);
router.get('/mirroring/trace/:traceId', getSidioraTraceAuditController);
router.post('/mirroring/freeze/:vault', freezeSidioraMirroringController);
router.post('/mirroring/unfreeze/:vault', unfreezeSidioraMirroringController);

export default router;
