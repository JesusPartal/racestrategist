import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as catalogService from '../services/catalog.service';

const router = Router();
router.use(authMiddleware);

router.get('/events', (_req: Request, res: Response) => {
  res.json(catalogService.getEvents());
});

router.get('/vehicles', (req: Request, res: Response) => {
  const eventId = req.query.eventId as string | undefined;
  res.json(catalogService.getVehicles(eventId));
});

export default router;
