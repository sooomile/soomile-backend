import { Request, Response } from 'express';
import * as predictService from '../services/predict.service';
import { StatusCodes } from 'http-status-codes';
import axios from 'axios';

export const getWeatherForecast = async (req: Request, res: any) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.sendError(StatusCodes.BAD_REQUEST, 'Latitude (lat) and longitude (lng) are required query parameters.');
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (isNaN(latitude) || isNaN(longitude)) {
        return res.sendError(StatusCodes.BAD_REQUEST, 'Invalid latitude or longitude format.');
    }

    const forecastData = await predictService.getDailyForecast(latitude, longitude);
    const response: any = await axios.post(
      'http://52.78.84.125:8000/predict/bundle',
      { data: forecastData }
    );
    const { data } = response.data;
    res.sendSuccess(200, 'Success.', data);
  } catch (error: any) {
    res.sendError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const predictByDaycareId = async (req: Request, res: any) => {
  try {
    const { daycareId } = req.params;
    if (!daycareId) {
      return res.sendError(StatusCodes.BAD_REQUEST, 'daycareId is required.');
    }
    // 1. 예보 데이터 생성
    const forecastData = await predictService.getDailyForecastByDaycareId(daycareId);
    // 2. 외부 API로 POST
    const response: any = await axios.post(
      'http://52.78.84.125:8000/predict/bundle',
      { data: forecastData }
    );
    // 3. 외부 API 응답에서 data 추출
    const { data } = response.data;
    // 4. 최종 포맷으로 반환
    res.sendSuccess(200, 'Success.', data);
  } catch (error: any) {
    res.sendError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
}; 