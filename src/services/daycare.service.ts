import * as daycareRepository from '../repositories/daycare.repository';
import { calculateDistance, formatDistance } from '../utils/distance.util';

export interface DaycareSearchResult {
  id: string;
  daycareName: string;
  address: string;
  distance: string;
}

/**
 * 이름으로 어린이집을 검색하고, 사용자의 현재 위치에서 가까운 순으로 5개를 반환합니다.
 * @param name 검색할 어린이집 이름
 * @param userLat 사용자의 위도
 * @param userLng 사용자의 경도
 * @returns 검색 및 정렬된 어린이집 목록
 */
export const searchDaycaresByName = async (
  name: string,
  userLat: number,
  userLng: number
): Promise<DaycareSearchResult[]> => {
  // 1. 이름이 일치하는 모든 어린이집을 가져옵니다.
  const daycares = await daycareRepository.findByName(name);

  // 2. 각 어린이집까지의 거리를 계산합니다.
  const daycaresWithDistance = daycares.map((daycare) => {
    const distance = calculateDistance(
      userLat,
      userLng,
      daycare.latitude,
      daycare.longitude
    );
    return {
      id: (daycare as any)._id.toString(),
      daycareName: daycare.daycareName,
      address: daycare.address,
      distance: distance, // 정렬을 위해 km 단위 원본 거리 유지
    };
  });
  
  // 3. 거리가 가까운 순으로 정렬하고 상위 5개를 선택합니다.
  const sortedDaycares = daycaresWithDistance.sort((a, b) => a.distance - b.distance);
  const top5Daycares = sortedDaycares.slice(0, 5);
  
  // 4. 최종 응답을 위해 거리를 포매팅합니다.
  return top5Daycares.map(daycare => ({
    ...daycare,
    distance: formatDistance(daycare.distance)
  }));
}; 