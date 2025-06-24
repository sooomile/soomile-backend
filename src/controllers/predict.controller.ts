import { Request, Response } from 'express';
import * as predictService from '../services/predict.service';
import { StatusCodes } from 'http-status-codes';
import axios from 'axios';
import * as stationService from '../services/station.service';
import dayjs from 'dayjs';
import * as daycareRepository from '../repositories/daycare.repository';
import * as stationRepository from '../repositories/station.repository';
import { calculateDistance } from '../utils/distance.util';

function getPm10Grade(pm10: number): string {
  if (pm10 <= 30) return '좋음';
  if (pm10 <= 80) return '보통';
  if (pm10 <= 150) return '나쁨';
  return '매우나쁨';
}

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

    // 병렬로 구이름, 예보 데이터 생성
    const [guName, forecastData] = await Promise.all([
      stationService.getGuNameFromCoords(latitude, longitude),
      predictService.getDailyForecast(latitude, longitude)
    ]);
    // 오늘(실시간) pm10/grade
    const todayAir = await stationService.getAirQualityByGu(guName);
    const today = dayjs().format('YYYY-MM-DD');
    const todayResult = {
      date: today,
      pm10: todayAir.pm10,
      grade: getPm10Grade(todayAir.pm10)
    };
    // 예보 데이터 외부 AI API POST
    const response: any = await axios.post(
      'http://52.78.84.125:8000/predict/bundle',
      { data: forecastData }
    );
    const { data } = response.data;
    const forecastResults = data.map((item: any) => ({
      ...item,
      grade: getPm10Grade(item.pm10)
    }));
    res.sendSuccess(200, 'Successfully retrieved weather forecast and air quality data.', [todayResult, ...forecastResults]);
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
    // 병렬로 어린이집, 측정소 목록, 예보 데이터 생성
    const [daycare, allStations, forecastData] = await Promise.all([
      daycareRepository.findById(daycareId),
      stationRepository.findAll(),
      predictService.getDailyForecastByDaycareId(daycareId)
    ]);
    if (!daycare) throw new Error('Daycare not found');
    const { latitude, longitude } = daycare;
    // 가장 가까운 측정소 찾기
    let minDist = Infinity;
    let nearestStation = null;
    for (const station of allStations) {
      const dist = calculateDistance(latitude, longitude, station.latitude, station.longitude);
      if (dist < minDist) {
        minDist = dist;
        nearestStation = station;
      }
    }
    if (!nearestStation) throw new Error('No station found');
    const guName = nearestStation.stationName;
    // 오늘(실시간) pm10/grade
    const todayAir = await stationService.getAirQualityByGu(guName);
    const today = dayjs().format('YYYY-MM-DD');
    const todayResult = {
      date: today,
      pm10: todayAir.pm10,
      grade: getPm10Grade(todayAir.pm10)
    };
    // 예보 데이터 외부 AI API POST
    const response: any = await axios.post(
      'http://52.78.84.125:8000/predict/bundle',
      { data: forecastData }
    );
    const { data } = response.data;
    const forecastResults = data.map((item: any) => ({
      ...item,
      grade: getPm10Grade(item.pm10)
    }));
    res.sendSuccess(200, 'Successfully retrieved weather forecast and air quality data.', [todayResult, ...forecastResults]);
  } catch (error: any) {
    res.sendError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

// 예보 데이터는 predict.service.ts에서 캐싱 적용됨