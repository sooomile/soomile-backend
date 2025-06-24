import axios from 'axios';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import { dfs_xy_conv } from '../utils/predict.util';
import { getGuNameFromCoords } from './station.service';
import * as daycareRepository from '../repositories/daycare.repository';
import * as stationRepository from '../repositories/station.repository';
import { calculateDistance } from '../utils/distance.util';
import { getCache, setCache } from '../utils/cache.util';

dotenv.config();

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const API_BASE_URL = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';

// API 응답 아이템 타입
interface WeatherApiItem {
  baseDate: string;
  baseTime: string;
  category: 'TMP' | 'WSD' | 'PCP' | 'TMN' | 'TMX' | string;
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
  nx: number;
  ny: number;
}

interface WeatherApiBody {
  dataType: string;
  items: {
      item: WeatherApiItem[];
  };
  pageNo: number;
  numOfRows: number;
  totalCount: number;
}

interface WeatherApiHeader {
  resultCode: string;
  resultMsg: string;
}

interface WeatherApiResponse {
  response?: {
      header: WeatherApiHeader;
      body: WeatherApiBody;
  };
}

// 최종 반환될 일별 예보 데이터 타입
export interface DailyForecastWithGu {
  date: string;
  기온: number;
  강수량: number;
  풍속: number;
  구이름: string;
  month: number;
}

// API 호출 및 데이터 가공
export const getDailyForecast = async (latitude: number, longitude: number): Promise<DailyForecastWithGu[]> => {
  const cacheKey = `forecast:${latitude},${longitude}`;
  const cached = getCache<DailyForecastWithGu[]>(cacheKey);
  if (cached) return cached;

  const { x, y } = dfs_xy_conv(Number(latitude), Number(longitude));
  const guName = await getGuNameFromCoords(Number(latitude), Number(longitude));

  // 2. API 호출을 위한 base_date, base_time 계산
  const now = dayjs();
  let baseDate = now.format('YYYYMMDD');
  let baseTime = '0200'; // Default time

  // API는 02, 05, 08, 11, 14, 17, 20, 23시 10분 이후에 데이터 제공
  const availableTimes = [2, 5, 8, 11, 14, 17, 20, 23];
  let currentHour = now.hour();
  let apiHour = availableTimes.slice().reverse().find(t => t <= currentHour);

  if (apiHour === undefined) {
    // 전날 23시 데이터 사용
    baseDate = now.subtract(1, 'day').format('YYYYMMDD');
    apiHour = 23;
  }
  
  // 10분이 지나야 데이터가 안정적으로 넘어오므로, 10분 마진을 둠
  if (now.hour() === apiHour && now.minute() < 10) {
      const currentApiTimeIndex = availableTimes.indexOf(apiHour);
      if(currentApiTimeIndex > 0) {
          apiHour = availableTimes[currentApiTimeIndex - 1];
      } else { // 현재 시간이 2시 10분 이전일 경우
          baseDate = now.subtract(1, 'day').format('YYYYMMDD');
          apiHour = 23;
      }
  }

  baseTime = apiHour.toString().padStart(2, '0') + '00';
  
  // 3. API 호출
  try {
    const response = await axios.get<WeatherApiResponse>(API_BASE_URL, {
      params: {
        serviceKey: WEATHER_API_KEY,
        numOfRows: 1000, // 충분한 데이터 확보
        pageNo: 1,
        dataType: 'JSON',
        base_date: baseDate,
        base_time: baseTime,
        nx: x,
        ny: y,
      }
    });

    const responseData = response.data;
    const responseHeader = responseData.response?.header;
    const responseBody = responseData.response?.body;

    if (responseHeader?.resultCode !== '00' || !responseBody?.items?.item) {
        console.error('Weather API non-success response:', JSON.stringify(responseData, null, 2));
        throw new Error(responseHeader?.resultMsg || 'Failed to fetch weather data or the data is empty.');
    }

    const items = responseBody.items.item;

    // 4. 내일과 모레 데이터만 필터링 및 가공
    const tomorrow = now.add(1, 'day').format('YYYYMMDD');
    const dayAfterTomorrow = now.add(2, 'day').format('YYYYMMDD');

    const dailyData: Record<string, any> = {
      [tomorrow]: { temps: [], winds: [], precips: [] },
      [dayAfterTomorrow]: { temps: [], winds: [], precips: [] },
    };

    items.forEach(item => {
      if (item.fcstDate === tomorrow || item.fcstDate === dayAfterTomorrow) {
        switch (item.category) {
          case 'TMP':
            dailyData[item.fcstDate].temps.push({
              time: item.fcstTime,
              value: parseFloat(item.fcstValue)
            });
            break;
          case 'WSD':
            dailyData[item.fcstDate].winds.push(parseFloat(item.fcstValue));
            break;
          case 'PCP':
            // "강수없음" 등 문자열 처리
            const precipValue = item.fcstValue.replace(/[^0-9.]/g, '');
            dailyData[item.fcstDate].precips.push(parseFloat(precipValue) || 0);
            break;
        }
      }
    });

    // 5. 최종 데이터 형태로 변환
    const result: DailyForecastWithGu[] = [];
    for (const date in dailyData) {
      const data = dailyData[date];
      if (data.temps.length === 0) continue;

      const tempSum = data.temps.reduce(
        (a: number, b: { time: string, value: number }) => a + b.value,
        0
      );
      const windSum = data.winds.reduce((a: number, b: number) => a + b, 0);
      const precipSum = data.precips.reduce((a: number, b: number) => a + b, 0);

      result.push({
        date: dayjs(date, 'YYYYMMDD').format('YYYY-MM-DD'),
        month: Number(dayjs(date, 'YYYYMMDD').format('M')),
        기온: data.temps.length > 0 ? Math.round(tempSum / data.temps.length) : 0,
        강수량: parseFloat(precipSum.toFixed(1)),
        풍속: data.winds.length > 0 ? parseFloat((windSum / data.winds.length).toFixed(1)) : 0,
        구이름: guName,
      });
    }
    setCache(cacheKey, result, 300); // 5분 캐싱
    return result;

  } catch (error: any) {
    if (error.isAxiosError) {
        console.error('Axios error calling Weather API:', JSON.stringify(error.response?.data, null, 2));
    } else {
        console.error('Error in getDailyForecast:', error.message);
    }
    // 에러를 다시 던져서 상위 컨트롤러에서 처리하도록 함
    throw new Error('An error occurred while fetching weather forecast data.');
  }
};

export const getDailyForecastByDaycareId = async (daycareId: string): Promise<DailyForecastWithGu[]> => {
  const cacheKey = `forecast:daycare:${daycareId}`;
  const cached = getCache<DailyForecastWithGu[]>(cacheKey);
  if (cached) return cached;

  // 1. 어린이집 정보 조회
  const daycare = await daycareRepository.findById(daycareId);
  if (!daycare) throw new Error('Daycare not found');
  const { latitude, longitude } = daycare;

  // 2. 모든 측정소 조회 후 가장 가까운 측정소 찾기
  const allStations = await stationRepository.findAll();
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

  // 3. 기존 날씨 예보 데이터 조회
  const { x, y } = dfs_xy_conv(Number(latitude), Number(longitude));
  // 기존 getDailyForecast 로직 복사 (구이름만 nearestStation 기준으로 통일)
  const now = dayjs();
  let baseDate = now.format('YYYYMMDD');
  let baseTime = '0200';
  const availableTimes = [2, 5, 8, 11, 14, 17, 20, 23];
  let currentHour = now.hour();
  let apiHour = availableTimes.slice().reverse().find(t => t <= currentHour);
  if (apiHour === undefined) {
    baseDate = now.subtract(1, 'day').format('YYYYMMDD');
    apiHour = 23;
  }
  if (now.hour() === apiHour && now.minute() < 10) {
    const currentApiTimeIndex = availableTimes.indexOf(apiHour);
    if(currentApiTimeIndex > 0) {
      apiHour = availableTimes[currentApiTimeIndex - 1];
    } else {
      baseDate = now.subtract(1, 'day').format('YYYYMMDD');
      apiHour = 23;
    }
  }
  baseTime = apiHour.toString().padStart(2, '0') + '00';
  try {
    const response = await axios.get<WeatherApiResponse>(API_BASE_URL, {
      params: {
        serviceKey: WEATHER_API_KEY,
        numOfRows: 1000,
        pageNo: 1,
        dataType: 'JSON',
        base_date: baseDate,
        base_time: baseTime,
        nx: x,
        ny: y,
      }
    });
    const responseData = response.data;
    const responseHeader = responseData.response?.header;
    const responseBody = responseData.response?.body;
    if (responseHeader?.resultCode !== '00' || !responseBody?.items?.item) {
      throw new Error(responseHeader?.resultMsg || 'Failed to fetch weather data or the data is empty.');
    }
    const items = responseBody.items.item;
    const tomorrow = now.add(1, 'day').format('YYYYMMDD');
    const dayAfterTomorrow = now.add(2, 'day').format('YYYYMMDD');
    const dailyData: Record<string, any> = {
      [tomorrow]: { temps: [], winds: [], precips: [] },
      [dayAfterTomorrow]: { temps: [], winds: [], precips: [] },
    };
    items.forEach(item => {
      if (item.fcstDate === tomorrow || item.fcstDate === dayAfterTomorrow) {
        switch (item.category) {
          case 'TMP':
            dailyData[item.fcstDate].temps.push({
              time: item.fcstTime,
              value: parseFloat(item.fcstValue)
            });
            break;
          case 'WSD':
            dailyData[item.fcstDate].winds.push(parseFloat(item.fcstValue));
            break;
          case 'PCP':
            const precipValue = item.fcstValue.replace(/[^0-9.]/g, '');
            dailyData[item.fcstDate].precips.push(parseFloat(precipValue) || 0);
            break;
        }
      }
    });
    const result: DailyForecastWithGu[] = [];
    for (const date in dailyData) {
      const data = dailyData[date];
      if (data.temps.length === 0) continue;
      const tempSum = data.temps.reduce((a: number, b: { time: string, value: number }) => a + b.value, 0);
      const windSum = data.winds.reduce((a: number, b: number) => a + b, 0);
      const precipSum = data.precips.reduce((a: number, b: number) => a + b, 0);
      result.push({
        date: dayjs(date, 'YYYYMMDD').format('YYYY-MM-DD'),
        month: Number(dayjs(date, 'YYYYMMDD').format('M')),
        기온: data.temps.length > 0 ? Math.round(tempSum / data.temps.length) : 0,
        강수량: parseFloat(precipSum.toFixed(1)),
        풍속: data.winds.length > 0 ? parseFloat((windSum / data.winds.length).toFixed(1)) : 0,
        구이름: guName,
      });
    }
    setCache(cacheKey, result, 300); // 5분 캐싱
    return result;
  } catch (error: any) {
    throw new Error('An error occurred while fetching weather forecast data.');
  }
}; 