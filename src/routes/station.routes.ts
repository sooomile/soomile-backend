import { Router } from 'express';
import * as stationController from '../controllers/station.controller';

const router = Router();

router.get('/stations/:stationCode/air-quality', stationController.getAirQualityByStationCode);

export default router; 