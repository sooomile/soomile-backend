import * as daycareRepository from '../repositories/daycare.repository';
import * as stationRepository from '../repositories/station.repository';
import { calculateDistance, formatDistance } from '../utils/distance.util';

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