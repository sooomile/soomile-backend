import axios from 'axios';
import * as stationRepository from '../repositories/station.repository';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dotenv.config();

const SEOUL_API_KEY = process.env.SEOUL_API_KEY;
const API_BASE_URL = 'http://openapi.seoul.go.kr:8088';

const VWORLD_API_KEY = process.env.VWORLD_API_KEY;
const VWORLD_API_URL = 'http://api.vworld.kr/req/address';

dayjs.extend(customParseFormat);

// API 응답 데이터에 대한 타입 정의 (실제 API 응답과 일치시킴)
interface ApiAirQualityRow {
  MSRDATE: string; // Corrected from MSRDT
  MSRRGN_NM: string;
  MSRSTENAME: string; // Corrected from MSRSTE_NM
  PM10: string; // Type changed to string
  PM25: string; // Type changed to string
  NITROGEN: string; // Type changed to string
  OZONE: string; // Type changed to string
  CARBON: string; // Type changed to string
  GRADE: string; // Corrected from IDEX_NM
}

// API의 전체 응답 구조에 대한 타입 정의
interface SeoulApiResult {
  CODE: string;
  MESSAGE: string;
}

interface SeoulApiResponseContainer {
  list_total_count: number;
  RESULT: SeoulApiResult;
  row: ApiAirQualityRow[];
}

interface SeoulApiFullResponse {
  ListAirQualityByDistrictService: SeoulApiResponseContainer;
}

// 서비스 함수가 반환할 데이터 타입 정의
export interface AirQualityData {
  date: string;
  '구이름': string;
  grade: string;
  pm10: number;
  pm25: number;
  '오존': number;
  '일산화탄소': number;
  latitude: number;
  longitude: number;
}

interface VWorldAddressItem {
  structure: {
    level2: string; // '구' 이름
  }
}

interface VWorldResponse {
  response: {
    status: string;
    result: VWorldAddressItem[];
  }
}

/**
 * 위도와 경도를 사용하여 해당 위치의 '구' 이름을 반환합니다.
 * @param latitude 위도
 * @param longitude 경도
 * @returns 구 이름 (e.g., '종로구')
 */
export const getGuNameFromCoords = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const response = await axios.get<VWorldResponse>(VWORLD_API_URL, {
      params: {
        service: 'address',
        request: 'getAddress',
        version: '2.0',
        crs: 'epsg:4326',
        point: `${longitude},${latitude}`,
        format: 'json',
        type: 'both',
        key: VWORLD_API_KEY,
      }
    });

    const data = response.data;
    
    if (data.response.status !== 'OK' || !data.response.result || data.response.result.length === 0) {
      throw new Error('Could not determine address from coordinates.');
    }

    const guName = data.response.result[0].structure.level2;
    if (!guName) {
      throw new Error('Could not determine Gu name from coordinates.');
    }

    return guName;

  } catch (error) {
    console.error('Error fetching data from VWorld API:', error);
    throw new Error('Failed to get Gu name from coordinates.');
  }
}

export const getAirQualityByGu = async (guName: string): Promise<AirQualityData> => {
  // 1. 구 이름으로 우리 DB에서 측정소 정보를 찾습니다. (Repository 사용)
  const station = await stationRepository.findByStationName(guName);
  if (!station) {
    throw new Error('Station not found for the given Gu name');
  }

  // 2. 찾은 측정소의 stationCode를 사용하여 API 요청 URL을 생성합니다.
  const serviceName = 'ListAirQualityByDistrictService';
  const url = `${API_BASE_URL}/${SEOUL_API_KEY}/json/${serviceName}/1/1/${station.stationCode}`;
  
  // 3. API 호출 (응답 데이터에 대한 타입 명시)
  const response = await axios.get<SeoulApiFullResponse>(url);
  const responseData = response.data;

  // 4. API 자체 에러 응답 확인
  const apiResult = responseData.ListAirQualityByDistrictService?.RESULT;
  if (!apiResult || apiResult.CODE !== 'INFO-000') {
    throw new Error(apiResult?.MESSAGE || 'Failed to fetch air quality data from Seoul API');
  }

  // 5. 실제 데이터(row) 추출 및 반환
  const airQuality = responseData.ListAirQualityByDistrictService?.row?.[0];
  if (!airQuality) {
    throw new Error('Air quality data is not available for the requested station.');
  }

  const formattedDate = dayjs(airQuality.MSRDATE, 'YYYYMMDDHHmm').format('YYYY년 MM월 DD일 HH시');

  // 6. 우리 서비스에 맞게 데이터 형식 변환 (타입 변환 추가)
  return {
    date: formattedDate,
    '구이름': airQuality.MSRSTENAME,
    grade: airQuality.GRADE,
    pm10: parseFloat(airQuality.PM10),
    pm25: parseFloat(airQuality.PM25),
    '오존': parseFloat(airQuality.OZONE),
    '일산화탄소': parseFloat(airQuality.CARBON),
    latitude: station.latitude,
    longitude: station.longitude,
  };
};

/**
 * 위도/경도를 기반으로 대기 질 정보를 조회합니다.
 * 1. 위도/경도로 '구'이름을 찾습니다.
 * 2. '구'이름으로 기존 대기 질 정보 조회 서비스를 호출합니다.
 * @param latitude 위도
 * @param longitude 경도
 * @returns AirQualityData
 */
export const getAirQualityByCoords = async (latitude: number, longitude: number): Promise<AirQualityData> => {
  // 1. 위도/경도로 구 이름 찾기
  const guName = await getGuNameFromCoords(latitude, longitude);

  // 2. 찾은 구 이름으로 기존 서비스 호출
  return getAirQualityByGu(guName);
}; 