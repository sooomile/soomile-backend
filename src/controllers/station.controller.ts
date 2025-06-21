import { Request, Response } from 'express';
import * as stationService from '../services/station.service';
import { StatusCodes } from 'http-status-codes';

export const getAirQualityByStationCode = async (req: Request, res: any) => {
  try {
    const stationCode = parseInt(req.params.stationCode, 10);
    if (isNaN(stationCode)) {
      return res.sendError(StatusCodes.BAD_REQUEST, 'Invalid station code.');
    }

    const airQualityData = await stationService.getAirQuality(stationCode);
    res.sendSuccess(StatusCodes.OK, 'Successfully retrieved air quality data.', airQualityData);
  } catch (error: any) {
    // Service layer에서 발생한 에러를 구체적으로 처리
    if (error.message === 'Station not found') {
      return res.sendError(StatusCodes.NOT_FOUND, error.message);
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('not available')) {
      return res.sendError(StatusCodes.SERVICE_UNAVAILABLE, error.message);
    }
    // 그 외의 에러는 서버 에러로 처리
    res.sendError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
}; 