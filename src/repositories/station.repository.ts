import { Station, IStation } from '../models/station.model';

/**
 * stationCode를 기준으로 측정소 정보를 데이터베이스에서 찾습니다.
 * @param stationCode 측정소 코드
 * @returns IStation document 또는 null
 */
export const findByStationCode = async (stationCode: number): Promise<IStation | null> => {
  return Station.findOne({ stationCode }).exec();
}; 