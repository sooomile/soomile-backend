import dotenv from 'dotenv';
import connectDB from '../src/config/db';
import { Station } from '../src/models/station.model';

dotenv.config({ path: '.env' });

const stationData = [
  { stationName: '강남구', address: '서울 강남구 학동로 426 강남구청 별관 1동', stationCode: 111261, latitude: 37.517566, longitude: 127.047968 },
  { stationName: '강동구', address: '서울 강동구 구천면로 42길 59 천호1동 주민센터', stationCode: 111274, latitude: 37.544989, longitude: 127.136799 },
  { stationName: '강북구', address: '서울 강북구 삼양로 139길 49 우이동 주민센터', stationCode: 111291, latitude: 37.647883, longitude: 127.011869 },
  { stationName: '강서구', address: '서울 강서구 강서로 45 다길 71 화곡3동 푸른들청소년도서관', stationCode: 111212, latitude: 37.544672, longitude: 126.835212 },
  { stationName: '관악구', address: '서울특별시 관악구 행운1길 43 (봉천동) 행운동 주민센터 옥상', stationCode: 111251, latitude: 37.480602, longitude: 126.957071 },
  { stationName: '광진구', address: '서울특별시 광진구 광나루로 571 구의 아리수정수센터', stationCode: 111141, latitude: 37.544207, longitude: 127.093013 },
  { stationName: '구로구', address: '서울 구로구 가마산로 27길 45 구로고등학교', stationCode: 111221, latitude: 37.498256, longitude: 126.890116 },
  { stationName: '금천구', address: '서울 금천구 금하로21길 20 시흥5동 주민센터', stationCode: 111281, latitude: 37.450987, longitude: 126.90836 },
  { stationName: '노원구', address: '서울 노원구 상계로 118 상계2동 주민센터 (23길 17 노원구 원터행복발전소)', stationCode: 111311, latitude: 37.658773, longitude: 127.068511 },
  { stationName: '도봉구', address: '서울 도봉구 시루봉로2길 34 쌍문동청소년문화의집', stationCode: 111171, latitude: 37.654139, longitude: 127.029001 },
  { stationName: '동대문구', address: '서울 동대문구 천호대로13길 43 용두초등학교', stationCode: 111152, latitude: 37.575914, longitude: 127.028947 },
  { stationName: '동작구', address: '서울 동작구 사당로16아길 6 사당4동 주민센터', stationCode: 111241, latitude: 37.480926, longitude: 126.971612 },
  { stationName: '마포구', address: '서울 마포구 포은로 6길 10 망원1동주민센터 옥상', stationCode: 111201, latitude: 37.555592, longitude: 126.905572 },
  { stationName: '서대문구', address: '서울 서대문구 세검정로4길 32(홍제3동 주민센터)', stationCode: 111191, latitude: 37.593721, longitude: 126.949754 },
  { stationName: '서초구', address: '서울특별시 서초구 신반포로15길 16 (반포동) 서초교육복지센터', stationCode: 111262, latitude: 37.504568, longitude: 126.994507 },
  { stationName: '성동구', address: '서울 성동구 뚝섬로3길 18 성수1가1동주민센터', stationCode: 111142, latitude: 37.542041, longitude: 127.049701 },
  { stationName: '성북구', address: '서울 성북구 삼양로2길 70 길음2동 주민센터', stationCode: 111161, latitude: 37.606769, longitude: 127.027364 },
  { stationName: '송파구', address: '서울 송파구 백제고분로 236 삼전동 주민센터 (삼전동)', stationCode: 111273, latitude: 37.502686, longitude: 127.092528 },
  { stationName: '양천구', address: '서울 양천구 중앙로52길 56 신정4동 문화센터', stationCode: 111301, latitude: 37.525975, longitude: 126.856647 },
  { stationName: '영등포구', address: '서울특별시 영등포구 당산로 123 영등포구청 (당산동3가)', stationCode: 111231, latitude: 37.526262, longitude: 126.895968 },
  { stationName: '용산구', address: '서울특별시 용산구 이태원로 224-19 (한남동) 한남로 복합문화센터', stationCode: 111131, latitude: 37.534926, longitude: 127.000205 },
  { stationName: '은평구', address: '서울 은평구 진흥로 215 (한국환경산업기술원 온실동2층 )', stationCode: 111181, latitude: 37.610514, longitude: 126.933528 },
  { stationName: '종로구', address: '서울 종로구 종로35가길 19 종로5,6가 동 주민센터', stationCode: 111123, latitude: 37.572013, longitude: 127.005014 },
  { stationName: '중구', address: '서울 중구 덕수궁길 15 시청서소문별관 3동', stationCode: 111121, latitude: 37.564117, longitude: 126.974782 },
  { stationName: '중랑구', address: '서울 중랑구 용마산로 369 건강가정지원센터', stationCode: 111151, latitude: 37.584906, longitude: 127.093985 },
];

const seedDB = async () => {
  await connectDB();
  try {
    console.log('Deleting existing station data...');
    await Station.deleteMany({});
    console.log('Station data deleted.');

    console.log('Inserting new station data...');
    await Station.insertMany(stationData);
    console.log('Station data inserted successfully.');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    console.log('Closing MongoDB connection.');
    await require('mongoose').connection.close();
  }
};

seedDB(); 