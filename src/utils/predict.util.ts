// LCC DFS 좌표변환을 위한 기초 자료
interface LamcParameter {
  Re: number;    // 사용할 지구반경 [ km ]
  grid: number;  // 격자간격 [ km ]
  slat1: number; // 표준위도 [degree]
  slat2: number; // 표준위도 [degree]
  olon: number;  // 기준점의 경도 [degree]
  olat: number;  // 기준점의 위도 [degree]
  xo: number;    // 기준점의 X좌표 [격자거리]
  yo: number;    // 기준점의 Y좌표 [격자거리]
}

const DEGRAD = Math.PI / 180.0;
const RADDEG = 180.0 / Math.PI;

/**
 * 위도(lat), 경도(lon)를 기상청 격자 X(nx), Y(ny)로 변환합니다. (단기예보 1km 격자)
 * @param lat 위도
 * @param lon 경도
 * @returns { x: number, y: number }
 */
export const dfs_xy_conv = (lat: number, lon: number): { x: number, y: number } => {
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0;      // 격자 간격(km)
  const SLAT1 = 30.0;    // 투영 위도1(degree)
  const SLAT2 = 60.0;    // 투영 위도2(degree)
  const OLON = 126.0;    // 기준점 경도(degree)
  const OLAT = 38.0;     // 기준점 위도(degree)
  const XO = 210 / GRID; // 기준점 X좌표
  const YO = 675 / GRID; // 기준점 Y좌표

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = re * sf / Math.pow(ra, sn);
  
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const x = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const y = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { x, y };
} 