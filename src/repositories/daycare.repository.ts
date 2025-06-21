import { Daycare, IDaycare } from '../models/daycare.model';

/**
 * 어린이집 이름으로 검색하여 일치하는 모든 결과를 반환합니다.
 * @param daycareName 검색할 어린이집 이름
 * @returns IDaycare document array
 */
export const findByName = async (daycareName: string): Promise<IDaycare[]> => {
  return Daycare.find({
    daycareName: new RegExp(daycareName, 'i') // 'i' for case-insensitive
  })
  .select('_id daycareName address latitude longitude') // 위도, 경도 필드 추가
  .exec();
};

/**
 * ID로 어린이집 정보를 찾습니다.
 * @param id 조회할 어린이집의 ID
 * @returns IDaycare document 또는 null
 */
export const findById = async (id: string): Promise<IDaycare | null> => {
  return Daycare.findById(id).exec();
}; 