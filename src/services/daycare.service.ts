import * as daycareRepository from '../repositories/daycare.repository';

export interface DaycareSearchResult {
  daycareName: string;
  address: string;
}

/**
 * 이름으로 어린이집을 검색합니다.
 * @param name 검색할 어린이집 이름
 * @returns 검색된 어린이집 목록
 */
export const searchDaycaresByName = async (name: string): Promise<DaycareSearchResult[]> => {
  const daycares = await daycareRepository.findByName(name);
  
  // Mongoose document를 일반 객체로 변환하여 반환
  return daycares.map(daycare => ({
    daycareName: daycare.daycareName,
    address: daycare.address
  }));
}; 