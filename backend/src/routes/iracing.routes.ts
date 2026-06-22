import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as iracingService from '../services/iracing-api.service';

const router = Router();
router.use(authMiddleware);

router.get('/cars', async (_req: Request, res: Response) => {
  try {
    const cars = await iracingService.getCars();
    res.json(cars);
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Failed to fetch iRacing cars' });
  }
});

router.get('/driver/:custId', async (req: Request, res: Response) => {
  try {
    const custId = parseInt(req.params.custId as string, 10);
    if (isNaN(custId)) { res.status(400).json({ error: 'Invalid customer ID' }); return; }
    const driver = await iracingService.getDriverByCustId(custId);
    if (!driver) { res.status(404).json({ error: 'Driver not found' }); return; }
    res.json(driver);
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Failed to fetch driver from iRacing' });
  }
});

router.post('/sync', async (_req: Request, res: Response) => {
  try {
    iracingService.clearCache();
    const cars = await iracingService.getCars(true);
    res.json({ synced: true, count: cars.length });
  } catch (err: any) {
    res.status(502).json({ error: err.message || 'Failed to sync iRacing cars' });
  }
});

export default router;
