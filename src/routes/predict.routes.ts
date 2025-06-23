import { Router } from 'express';
import * as predictController from '../controllers/predict.controller';

const router = Router();

// e.g., GET /predict/forecast?lat=37.5665&lng=126.9780
router.get('/forecast', predictController.getWeatherForecast);
router.get('/:daycareId', predictController.predictByDaycareId);

export default router; 