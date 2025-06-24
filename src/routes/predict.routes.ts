import { Router } from 'express';
import * as predictController from '../controllers/predict.controller';

const router = Router();

router.get('/forecast', predictController.getWeatherForecast);
router.get('/:daycareId', predictController.predictByDaycareId);

export default router; 