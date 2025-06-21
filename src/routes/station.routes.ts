import { Router } from 'express';
import * as stationController from '../controllers/station.controller';

const router = Router();

router.get('/stations/air-quality', stationController.getAirQualityByCoords);
router.get('/stations/:guName/air-quality', stationController.getAirQualityByGu);

export default router; 