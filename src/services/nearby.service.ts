import * as daycareRepository from '../repositories/daycare.repository';
import * as stationRepository from '../repositories/station.repository';

// 두 좌표 간의 거리를 계산하는 Haversine 공식 구현
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 지구의 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km 단위 거리
}

// 거리를 m 또는 km 단위의 문자열로 포매팅
function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  }
  return `${distanceKm.toFixed(1)}km`;
}

export interface NearbyStationResult {
  stationName: string;
  address: string;
  distance: string;
}

export const findNearbyStations = async (daycareId: string): Promise<NearbyStationResult[]> => {
  // 1. Get the target daycare
  const daycare = await daycareRepository.findById(daycareId);
  if (!daycare) {
    throw new Error('Daycare not found');
  }

  // 2. Get all stations
  const allStations = await stationRepository.findAll();

  // 3. Calculate distance for each station and create a new list
  const stationsWithDistance = allStations.map(station => {
    const distance = calculateDistance(
      daycare.latitude,
      daycare.longitude,
      station.latitude,
      station.longitude
    );
    return {
      stationName: station.stationName,
      address: station.address,
      distance: distance, // Keep raw distance for sorting
    };
  });

  // 4. Sort by distance and take the top 5
  const sortedStations = stationsWithDistance.sort((a, b) => a.distance - b.distance);
  const top5Stations = sortedStations.slice(0, 5);

  // 5. Format the distance for the final response
  return top5Stations.map(station => ({
    ...station,
    distance: formatDistance(station.distance),
  }));
}; 