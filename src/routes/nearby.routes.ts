import { Router } from 'express';
import * as nearbyController from '../controllers/nearby.controller';

const router = Router();

router.get('/daycares/:daycareId/nearby-stations', nearbyController.getNearbyStations);

export default router; 