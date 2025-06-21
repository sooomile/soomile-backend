import { Request, Response } from 'express';
import * as stationService from '../services/station.service';
import { StatusCodes } from 'http-status-codes';

export const getAirQualityByGu = async (req: Request, res: any) => {
  try {
    const { guName } = req.params;

    if (!guName) {
      return res.sendError(StatusCodes.BAD_REQUEST, 'A Gu name is required in the URL path.');
    }

    const airQualityData = await stationService.getAirQualityByGu(guName);
    res.sendSuccess(StatusCodes.OK, 'Successfully retrieved air quality data.', airQualityData);
  } catch (error: any) {
    // Service layer에서 발생한 에러를 구체적으로 처리
    if (error.message.includes('Station not found')) {
      return res.sendError(StatusCodes.NOT_FOUND, error.message);
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('not available')) {
      return res.sendError(StatusCodes.SERVICE_UNAVAILABLE, error.message);
    }
    // 그 외의 에러는 서버 에러로 처리
    res.sendError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
}; 