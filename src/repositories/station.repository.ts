import { Station, IStation } from '../models/station.model';

/**
 * stationCode를 기준으로 측정소 정보를 데이터베이스에서 찾습니다.
 * @param stationCode 측정소 코드
 * @returns IStation document 또는 null
 */
export const findByStationCode = async (stationCode: number): Promise<IStation | null> => {
  return Station.findOne({ stationCode }).exec();
};

/**
 * 측정소 이름(구 이름)으로 측정소 정보를 찾습니다.
 * @param stationName 측정소 이름 (e.g., '종로구')
 * @returns IStation document 또는 null
 */
export const findByStationName = async (stationName: string): Promise<IStation | null> => {
  return Station.findOne({ stationName: stationName }).exec();
};

/**
 * 모든 측정소 목록을 반환합니다.
 * @returns IStation document array
 */
export const findAll = async (): Promise<IStation[]> => {
  return Station.find({}).exec();
}; 