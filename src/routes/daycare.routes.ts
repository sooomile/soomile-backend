import { Router } from 'express';
import * as daycareController from '../controllers/daycare.controller';

const router = Router();

// e.g., GET /daycares?name=한성
router.get('/daycares', daycareController.searchDaycares);

export default router; 