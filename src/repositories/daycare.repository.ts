import { Daycare, IDaycare } from '../models/daycare.model';

/**
 * 어린이집 이름으로 검색하여 5개의 결과를 반환합니다.
 * @param daycareName 검색할 어린이집 이름
 * @returns IDaycare document array
 */
export const findByName = async (daycareName: string): Promise<IDaycare[]> => {
  return Daycare.find({
    daycareName: new RegExp(daycareName, 'i') // 'i' for case-insensitive
  })
  .limit(5)
  .select('daycareName address') // Select only the required fields
  .exec();
}; 