import axios from 'axios';
import { DailyWeather } from '../types';

// 기상청 API 설정
const MID_FCST_API_BASE_URL = process.env.WEATHER_API_BASE_URL || 'http://apis.data.go.kr/1360000/MidFcstInfoService';
const SHORT_FCST_API_BASE_URL = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
// Encoding Service Key (URL 인코딩된 형태) - 브라우저 테스트에서 검증됨
const API_KEY_ENCODED = process.env.WEATHER_API_KEY_ENCODED || 'k5PwIPCPkHi%2Bgoiv%2F4ekXUkou0QBTI54cIQwvH83VVmUqNK46rKKr7Vj4IGVnYmtwfHTz3Jk1y6l0gsei0woFw%3D%3D';
// 기존 API Key (디코딩된 형태) - 하위 호환성 유지
const API_KEY = process.env.WEATHER_API_KEY || 'k5PwIPCPkHi+goiv/4ekXUkou0QBTI54cIQwvH83VVmUqNK46rKKr7Vj4IGVnYmtwfHTz3Jk1y6l0gsei0woFw==';
// stnId가 있으면 getMidFcst API 사용, 없으면 getMidLandFcst API 사용
const USE_STN_ID = true; // stnId 우선 사용
const USE_ENCODED_KEY = true; // Encoding Key 사용 (검증됨)

// [추가됨] 딜레이 함수 (API 과부하 방지용)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

if (!API_KEY && !API_KEY_ENCODED) {
  console.error('기상청 API 키가 설정되지 않았습니다.');
}

/**
 * 경기장 위치 정보 매핑 상수
 */
export const STADIUM_LOCATIONS: Record<string, { regId: string; nx: number; ny: number; stnId: string; landRegId: string; taRegId: string }> = {
  '잠실야구장': { regId: '11B10101', nx: 60, ny: 127, stnId: '108', landRegId: '11B00000', taRegId: '11B10101' },
  '잠실': { regId: '11B10101', nx: 60, ny: 127, stnId: '108', landRegId: '11B00000', taRegId: '11B10101' },
  '고척스카이돔': { regId: '11B10101', nx: 60, ny: 127, stnId: '108', landRegId: '11B00000', taRegId: '11B10101' },
  '고척': { regId: '11B10101', nx: 60, ny: 127, stnId: '108', landRegId: '11B00000', taRegId: '11B10101' },
  '인천SSG랜더스필드': { regId: '11B20201', nx: 55, ny: 124, stnId: '112', landRegId: '11B00000', taRegId: '11B20201' },
  '문학': { regId: '11B20201', nx: 55, ny: 124, stnId: '112', landRegId: '11B00000', taRegId: '11B20201' },
  '수원KT위즈파크': { regId: '11B20601', nx: 60, ny: 121, stnId: '119', landRegId: '11B00000', taRegId: '11B20601' },
  '수원': { regId: '11B20601', nx: 60, ny: 121, stnId: '119', landRegId: '11B00000', taRegId: '11B20601' },
  '대전한화생명이글스파크': { regId: '11C20401', nx: 67, ny: 100, stnId: '133', landRegId: '11C20000', taRegId: '11C20401' },
  '대전': { regId: '11C20401', nx: 67, ny: 100, stnId: '133', landRegId: '11C20000', taRegId: '11C20401' },
  '대구삼성라이온즈파크': { regId: '11H10701', nx: 89, ny: 90, stnId: '143', landRegId: '11H10000', taRegId: '11H10701' },
  '대구': { regId: '11H10701', nx: 89, ny: 90, stnId: '143', landRegId: '11H10000', taRegId: '11H10701' },
  '광주챔피언스필드': { regId: '11F20501', nx: 58, ny: 74, stnId: '156', landRegId: '11F20000', taRegId: '11F20501' },
  '광주': { regId: '11F20501', nx: 58, ny: 74, stnId: '156', landRegId: '11F20000', taRegId: '11F20501' },
  '사직야구장': { regId: '11H20201', nx: 98, ny: 76, stnId: '159', landRegId: '11H20000', taRegId: '11H20201' },
  '사직': { regId: '11H20201', nx: 98, ny: 76, stnId: '159', landRegId: '11H20000', taRegId: '11H20201' },
  '창원NC파크': { regId: '11H20301', nx: 91, ny: 77, stnId: '155', landRegId: '11H20000', taRegId: '11H20301' },
  '창원': { regId: '11H20301', nx: 91, ny: 77, stnId: '155', landRegId: '11H20000', taRegId: '11H20301' }
};

/**
 * 날짜 차이 계산 (D-Day)
 */
export function calculateDateDiff(currentDate: Date | string, gameDate: Date | string): number {
  const current = typeof currentDate === 'string' ? new Date(currentDate + 'T00:00:00') : new Date(currentDate);
  const game = typeof gameDate === 'string' ? new Date(gameDate + 'T00:00:00') : new Date(gameDate);

  current.setHours(0, 0, 0, 0);
  game.setHours(0, 0, 0, 0);

  const diffMs = game.getTime() - current.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 날씨 상태 코드를 한글로 변환 (API 코드 -> 텍스트)
 */
function parseWeatherCondition(code: string): string {
  if (!code) return '맑음';
  const codeStr = String(code).trim().toUpperCase();
  const weatherMap: { [key: string]: string } = {
    '1': '맑음', '2': '구름조금', '3': '구름많음', '4': '흐림',
    '5': '비', '6': '소나기', '7': '눈', '8': '눈비', '9': '천둥번개', '10': '안개'
  };
  if (weatherMap[codeStr]) return weatherMap[codeStr];
  
  if (codeStr.includes('맑음') || codeStr === 'SUNNY' || codeStr === 'CLEAR') return '맑음';
  if (codeStr.includes('구름') || codeStr === 'CLOUDY') return '구름많음';
  if (codeStr.includes('흐림') || codeStr === 'OVERCAST') return '흐림';
  if (codeStr.includes('비') || codeStr === 'RAIN') return '비';
  if (codeStr.includes('소나기') || codeStr === 'SHOWER') return '소나기';
  if (codeStr.includes('눈') || codeStr === 'SNOW') return '눈';
  
  return codeStr;
}

/**
 * 텍스트에서 날씨 상태 추출 (우선순위 수정 및 null 반환 적용)
 * 반환값: 매칭된 날씨 문자열 또는 null (매칭 실패 시)
 */
function parseWeatherFromText(text: string): string | null {
  if (!text) return null;
  
  // 1. 강수 형태 우선 체크
  if (text.includes('눈') || text.includes('눈비') || text.includes('진눈깨비')) return '눈';
  if (text.includes('소나기')) return '소나기';
  if (text.includes('비')) return '비';
  
  // 2. 하늘 상태 체크
  if (text.includes('흐림') || text.includes('흐리고') || text.includes('흐려')) return '흐림';
  if (text.includes('구름많음') || text.includes('구름 많음') || text.includes('구름많고')) return '구름많음';
  if (text.includes('구름조금') || text.includes('구름 조금')) return '구름조금';
  if (text.includes('맑음') || text.includes('맑은')) return '맑음';
  
  // 3. 매칭 실패
  return null; 
}

/**
 * 중기육상예보조회 API 호출 (getMidLandFcst)
 */
async function getMidTermLandForecast(landRegId: string, targetDate: string, tmFc: string, daysFromForecast: number): Promise<{
  weatherAm: string | null;
  weatherPm: string | null;
  precipitationProb: number | null;
  forecastText: string | null;
}> {
  const serviceKey = USE_ENCODED_KEY && API_KEY_ENCODED ? API_KEY_ENCODED : (API_KEY ? encodeURIComponent(API_KEY) : '');
  if (!serviceKey) throw new Error('기상청 API 키가 설정되지 않았습니다.');
  
  const url = `${MID_FCST_API_BASE_URL}/getMidLandFcst?serviceKey=${serviceKey}`;
  const params = { dataType: 'JSON', numOfRows: 10, pageNo: 1, regId: landRegId, tmFc: tmFc };
  
  console.log(`   🌤️  중기육상예보조회 API 호출: ${url.split('?')[0]}`);
  
  try {
    const response = await axios.get(url, { params, timeout: 10000 });
    
    if (!response.data || !response.data.response || response.data.response.header.resultCode !== '00') {
      console.warn(`   ⚠️  중기육상예보조회 API 오류 또는 데이터 없음`);
      return { weatherAm: null, weatherPm: null, precipitationProb: null, forecastText: null };
    }
    
    let items = response.data.response.body?.items?.item;
    if (!Array.isArray(items)) items = items ? [items] : [];
    if (items.length === 0) return { weatherAm: null, weatherPm: null, precipitationProb: null, forecastText: null };
    
    const landItem: any = items[0];
    
    // 6시 발표: 4~10일, 18시 발표: 5~10일
    const minDays = tmFc.substring(8, 10) === '06' ? 4 : 5;
    const apiDayNumber = Math.max(minDays, Math.min(10, daysFromForecast));
    
    let weatherAm: string | null = null;
    let weatherPm: string | null = null;
    let precipitationProb: number | null = null;
    let forecastText: string | null = null;
    
    if (apiDayNumber >= minDays && apiDayNumber <= 7) {
      if (landItem[`wf${apiDayNumber}Am`]) weatherAm = parseWeatherCondition(String(landItem[`wf${apiDayNumber}Am`]).trim());
      if (landItem[`wf${apiDayNumber}Pm`]) weatherPm = parseWeatherCondition(String(landItem[`wf${apiDayNumber}Pm`]).trim());
      
      const rnStAm = parseInt(String(landItem[`rnSt${apiDayNumber}Am`] || '0'), 10);
      const rnStPm = parseInt(String(landItem[`rnSt${apiDayNumber}Pm`] || '0'), 10);
      precipitationProb = Math.max(rnStAm, rnStPm);
    } else if (apiDayNumber >= 8 && apiDayNumber <= 10) {
      if (landItem[`wf${apiDayNumber}`]) {
        const wf = parseWeatherCondition(String(landItem[`wf${apiDayNumber}`]).trim());
        weatherAm = wf;
        weatherPm = wf;
      }
      if (landItem[`rnSt${apiDayNumber}`]) precipitationProb = parseInt(String(landItem[`rnSt${apiDayNumber}`]), 10);
    }
    
    if (landItem.wfSv) forecastText = landItem.wfSv;
    
    return { weatherAm, weatherPm, precipitationProb, forecastText };
  } catch (error: any) {
    console.warn(`   ⚠️  중기육상예보조회 API 호출 실패: ${error.message}`);
    return { weatherAm: null, weatherPm: null, precipitationProb: null, forecastText: null };
  }
}

/**
 * 중기기온조회 API 호출 (getMidTa)
 * 수정사항: API Endpoint 명칭 수정 (getMidTaFcst -> getMidTa)
 */
async function getMidTermTemperature(regId: string, targetDate: string, tmFc: string, diffDays: number): Promise<{ minTemp: number | null; maxTemp: number | null }> {
  const serviceKey = USE_ENCODED_KEY && API_KEY_ENCODED ? API_KEY_ENCODED : (API_KEY ? encodeURIComponent(API_KEY) : '');
  if (!serviceKey) throw new Error('기상청 API 키가 설정되지 않았습니다.');
  
  // [중요 수정] 오퍼레이션 명칭: getMidTa (O)
  const url = `${MID_FCST_API_BASE_URL}/getMidTa?serviceKey=${serviceKey}&numOfRows=10&pageNo=1&dataType=JSON&regId=${regId}&tmFc=${tmFc}`;
  
  console.log(`   🌡️  중기기온조회 API 요청 URL: ${url}`);

  try {
    const response = await axios.get(url, { timeout: 10000 });
    
    if (!response.data || !response.data.response || response.data.response.header.resultCode !== '00') {
      const msg = response.data?.response?.header?.resultMsg || '응답 없음';
      console.warn(`   ⚠️  중기기온조회 API 응답 실패: ${msg}`);
      return { minTemp: null, maxTemp: null };
    }

    const body = response.data.response.body;
    let items = body?.items?.item;
    let tempItem: any = null;
    if (Array.isArray(items)) tempItem = items[0];
    else if (items && typeof items === 'object') tempItem = items;

    if (!tempItem) {
      console.warn(`   ⚠️  중기기온조회 데이터(item)가 비어있습니다.`);
      return { minTemp: null, maxTemp: null };
    }

    // API는 3일후~10일후 데이터를 제공 (taMin3 ~ taMin10)
    const safeDayIndex = Math.max(3, Math.min(10, diffDays));
    const minKey = `taMin${safeDayIndex}`;
    const maxKey = `taMax${safeDayIndex}`;
    
    const parseTemp = (val: any) => {
      if (val === undefined || val === null || String(val).trim() === '') return null;
      const parsed = parseInt(String(val), 10);
      return isNaN(parsed) ? null : parsed;
    };

    let minTemp = parseTemp(tempItem[minKey]);
    let maxTemp = parseTemp(tempItem[maxKey]);

    if (minTemp === null) minTemp = parseTemp(tempItem[`${minKey}Low`]);
    if (maxTemp === null) maxTemp = parseTemp(tempItem[`${maxKey}High`]);

    // Fallback: 인접 날짜 데이터 검색
    if (minTemp === null || maxTemp === null) {
      console.log(`   ℹ️  D+${safeDayIndex}일 기온 데이터 없음. 인접 데이터 검색 중...`);
      for (let offset = 1; offset <= 3; offset++) {
        const checkDays = [safeDayIndex + offset, safeDayIndex - offset];
        for (const d of checkDays) {
          if (d >= 3 && d <= 10) {
            if (minTemp === null) minTemp = parseTemp(tempItem[`taMin${d}`]);
            if (maxTemp === null) maxTemp = parseTemp(tempItem[`taMax${d}`]);
          }
        }
        if (minTemp !== null && maxTemp !== null) break;
      }
    }

    console.log(`   ✅ 기온 파싱 결과 (D+${safeDayIndex}): ${minTemp}°C ~ ${maxTemp}°C`);
    return { minTemp, maxTemp };

  } catch (error: any) {
    console.error(`   ❌ 중기기온조회 API 호출 중 에러 발생: ${error.message}`);
    return { minTemp: null, maxTemp: null };
  }
}

/**
 * 중기예보 구간에서 두 개의 API를 병렬로 호출하여 날씨와 기온 정보를 조회
 */
async function getMidTermWeatherParallel(landRegId: string, taRegId: string, targetDate: string): Promise<DailyWeather | null> {
  if (!API_KEY) throw new Error('기상청 API 키가 설정되지 않았습니다.');

  try {
    console.log(`🌤️  [getMidTermWeatherParallel] 병렬 API 호출 시작`);
    
    const target = new Date(targetDate + 'T00:00:00');
    let now: Date;
    if (process.env.TEST_TODAY_DATE) {
      now = new Date(process.env.TEST_TODAY_DATE + 'T12:00:00');
    } else {
      now = new Date();
    }

    // 06:00 이전 -> 어제 18:00 발표 사용, 이후 -> 오늘 06:00 발표 사용
    const currentHour = now.getHours();
    let forecastDate = new Date(now);
    forecastDate.setHours(0, 0, 0, 0); 
    let forecastHour = '06';

    if (currentHour < 6) {
      forecastDate.setDate(forecastDate.getDate() - 1);
      forecastHour = '18';
    } else {
      forecastHour = '06';
    }

    const year = forecastDate.getFullYear();
    const month = String(forecastDate.getMonth() + 1).padStart(2, '0');
    const day = String(forecastDate.getDate()).padStart(2, '0');
    const tmFc = `${year}${month}${day}${forecastHour}00`;

    const forecastStartDate = new Date(forecastDate);
    forecastStartDate.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - forecastStartDate.getTime();
    const daysFromForecast = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    console.log(`   발표 시각: ${tmFc}, D+${daysFromForecast}일 예보`);
    
    const [landResult, tempResult] = await Promise.all([
      getMidTermLandForecast(landRegId, targetDate, tmFc, daysFromForecast),
      getMidTermTemperature(taRegId, targetDate, tmFc, daysFromForecast)
    ]);
    
    let weatherAm = landResult.weatherAm;
    let weatherPm = landResult.weatherPm;
    let forecastText = landResult.forecastText;
    
    // 텍스트 파싱 시도 (상세 필드 없을 경우)
    if ((!weatherAm || !weatherPm) && forecastText) {
      if (!weatherAm) {
        const parsed = parseWeatherFromText(forecastText);
        if (parsed) {
            weatherAm = parsed;
            console.log(`   ✅ 오전 날씨 (텍스트 추출): ${weatherAm}`);
        } else {
            console.warn(`   ⚠️  오전 날씨 텍스트 분석 실패 (기본값 '맑음'): "${forecastText}"`);
            weatherAm = '맑음';
        }
      }
      if (!weatherPm) {
        const parsed = parseWeatherFromText(forecastText);
        if (parsed) {
            weatherPm = parsed;
            console.log(`   ✅ 오후 날씨 (텍스트 추출): ${weatherPm}`);
        } else {
            console.warn(`   ⚠️  오후 날씨 텍스트 분석 실패 (기본값 '맑음'): "${forecastText}"`);
            weatherPm = '맑음';
        }
      }
    }
    
    if (!weatherAm) weatherAm = '맑음';
    if (!weatherPm) weatherPm = '맑음';
    if (!forecastText) forecastText = `${weatherAm} / ${weatherPm}`;

    const minTemp = tempResult.minTemp;
    const maxTemp = tempResult.maxTemp;
    const precipitationProb = landResult.precipitationProb || 0;
    
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][target.getDay()];

    console.log(`   🏁 최종: ${weatherPm}, ${minTemp}~${maxTemp}°C, 강수 ${precipitationProb}%`);
    
    return {
      date: targetDate,
      dayOfWeek: dayOfWeek,
      weatherAm: weatherAm,
      weatherPm: weatherPm,
      minTemp: minTemp !== null ? minTemp : 0,
      maxTemp: maxTemp !== null ? maxTemp : 0,
      precipitationProb: precipitationProb,
      windSpeed: undefined,
      humidity: undefined,
      forecastText: forecastText,
      cancelPrediction: { probability: 'NONE', reason: '', details: '' }
    };
  } catch (error: any) {
    console.error(`❌ [getMidTermWeatherParallel] 에러: ${error.message}`);
    throw error;
  }
}

/**
 * 단기예보 API 호출 (0-2일)
 * 수정사항: 429 에러 방지를 위한 재시도 로직 및 sleep 추가
 */
async function getShortTermWeather(nx: number, ny: number, targetDate: string): Promise<DailyWeather | null> {
  if (!API_KEY) throw new Error('기상청 API 키가 설정되지 않았습니다.');

  try {
    console.log(`🌤️  [getShortTermWeather] 단기예보 요청: nx=${nx}, ny=${ny}, targetDate=${targetDate}`);

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const forecastTimes = [2, 5, 8, 11, 14, 17, 20, 23];
    let baseTime = '0200';
    
    for (let i = forecastTimes.length - 1; i >= 0; i--) {
      const forecastHour = forecastTimes[i];
      if (currentHour > forecastHour || (currentHour === forecastHour && currentMinute >= 10)) {
        baseTime = String(forecastHour).padStart(2, '0') + '00';
        break;
      }
    }
    
    let baseDate = new Date(now);
    if (currentHour < 2 || (currentHour === 2 && currentMinute < 10)) {
      baseDate.setDate(baseDate.getDate() - 1);
      baseTime = '2300';
    }
    
    const baseDateStr = baseDate.toISOString().split('T')[0].replace(/-/g, '');
    const targetDateStr = targetDate.replace(/-/g, '');

    const serviceKey = USE_ENCODED_KEY && API_KEY_ENCODED ? API_KEY_ENCODED : (API_KEY ? encodeURIComponent(API_KEY) : '');
    const url = `${SHORT_FCST_API_BASE_URL}/getVilageFcst?serviceKey=${serviceKey}`;
    const params = {
      pageNo: 1, numOfRows: 1000, dataType: 'JSON',
      base_date: baseDateStr, base_time: baseTime, nx: nx, ny: ny
    };

    console.log(`   API 호출 URL: ${url.split('?')[0]}`);

    // [중요] 재시도(Retry) 로직 추가
    let response;
    let retries = 3;

    while (retries > 0) {
      try {
        // 호출 전 미세 딜레이 (429 방지)
        await sleep(500); 

        response = await axios.get(url, { params, timeout: 10000 });
        break; // 성공 시 탈출
      } catch (error: any) {
        if (error.response && (error.response.status === 429 || error.response.status >= 500)) {
          retries--;
          console.warn(`   ⚠️  API 호출 제한(429) 또는 서버 오류. 1초 후 재시도합니다... (남은 시도: ${retries}회)`);
          await sleep(1000); // 1초 대기 후 재시도
        } else {
          throw error; // 다른 에러는 즉시 던짐
        }
      }
    }

    if (!response) {
      throw new Error('재시도 횟수 초과로 API 호출에 실패했습니다.');
    }

    if (!response.data || !response.data.response) throw new Error('단기예보 API 응답 구조가 올바르지 않습니다.');

    const resultCode = response.data.response?.header?.resultCode;
    if (resultCode !== '00') {
      const errorMsg = response.data.response?.header?.resultMsg || '단기예보 조회 실패';
      throw new Error(`단기예보 API 오류: ${errorMsg}`);
    }

    const items = response.data.response?.body?.items?.item || [];
    if (!Array.isArray(items) || items.length === 0) {
      console.warn('⚠️  단기예보 데이터가 없습니다.');
      return null;
    }

    const dayItems = items.filter((item: any) => item.fcstDate === targetDateStr);
    if (dayItems.length === 0) return null;

    let minTemp: number | null = null;
    let maxTemp: number | null = null;
    let precipitationProb: number | null = null;
    let skyCodeAm: number | null = null;
    let skyCodePm: number | null = null;
    let ptyCodeAm: number | null = null;
    let ptyCodePm: number | null = null;
    let humidity: number | null = null;
    let windSpeed: number | null = null;

    const amItems: any[] = [];
    const pmItems: any[] = [];
    dayItems.forEach((item: any) => {
      if (parseInt(item.fcstTime, 10) < 1200) amItems.push(item);
      else pmItems.push(item);
    });

    const getWeatherFromCodes = (sky: number | null, pty: number | null): string => {
      if (pty !== null && pty !== 0) {
        if (pty === 1) return '비';
        if (pty === 2) return '비/눈';
        if (pty === 3) return '눈';
        if (pty === 4) return '소나기';
      }
      if (sky !== null) {
        if (sky === 1) return '맑음';
        if (sky === 3) return '구름많음';
        if (sky === 4) return '흐림';
      }
      return '맑음';
    };

    [...amItems, ...pmItems].forEach((item: any) => {
        const val = item.fcstValue;
        const cat = item.category;
        
        if (cat === 'TMP') {
            const t = parseInt(val, 10);
            if (!isNaN(t)) {
                if (minTemp === null || t < minTemp) minTemp = t;
                if (maxTemp === null || t > maxTemp) maxTemp = t;
            }
        }
        if (cat === 'POP') {
            const p = parseInt(val, 10);
            if (!isNaN(p)) {
                if (precipitationProb === null || p > precipitationProb) precipitationProb = p;
            }
        }
        if (cat === 'REH') humidity = parseInt(val, 10);
        if (cat === 'WSD') windSpeed = parseFloat(val);
    });

    amItems.forEach((item: any) => {
        if (item.category === 'SKY') skyCodeAm = parseInt(item.fcstValue, 10);
        if (item.category === 'PTY') ptyCodeAm = parseInt(item.fcstValue, 10);
    });
    pmItems.forEach((item: any) => {
        if (item.category === 'SKY') skyCodePm = parseInt(item.fcstValue, 10);
        if (item.category === 'PTY') ptyCodePm = parseInt(item.fcstValue, 10);
    });

    const skyConditionAm = getWeatherFromCodes(skyCodeAm, ptyCodeAm);
    const skyConditionPm = getWeatherFromCodes(skyCodePm, ptyCodePm);

    const gameDate = new Date(targetDate + 'T00:00:00');
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][gameDate.getDay()];

    const finalMinTemp = minTemp !== null ? minTemp : 0;
    const finalMaxTemp = maxTemp !== null ? maxTemp : 0;
    const finalPrecipitationProb = precipitationProb !== null ? precipitationProb : 0;
    const finalHumidity = humidity !== null ? humidity : 0;

    console.log(`   ✅ 단기예보: ${skyConditionPm}, ${finalMinTemp}~${finalMaxTemp}°C`);

    return {
      date: targetDate,
      dayOfWeek: dayOfWeek,
      weatherAm: skyConditionAm,
      weatherPm: skyConditionPm,
      minTemp: finalMinTemp,
      maxTemp: finalMaxTemp,
      precipitationProb: finalPrecipitationProb,
      windSpeed: windSpeed !== null ? windSpeed : undefined,
      humidity: finalHumidity,
      forecastText: `오전 ${skyConditionAm}, 오후 ${skyConditionPm}, 기온 ${finalMinTemp}~${finalMaxTemp}°C, 강수확률 ${finalPrecipitationProb}%`,
      cancelPrediction: { probability: 'NONE', reason: '', details: '' }
    };
  } catch (error: any) {
    console.error(`❌ [getShortTermWeather] 에러 발생:`);
    console.error(`nx: ${nx}, ny: ${ny}, targetDate: ${targetDate}`);
    console.error(`Error: ${error.message}`);
    throw error;
  }
}

/**
 * 경기장 이름으로 기상 정보 조회
 */
export async function getStadiumWeather(gameDate: string, stadiumName: string): Promise<DailyWeather | null> {
  try {
    console.log(`═══════════════════════════════════════════════════`);
    console.log(`🌤️  [getStadiumWeather] ${stadiumName} (${gameDate})`);
    
    const stadiumInfo = STADIUM_LOCATIONS[stadiumName];
    if (!stadiumInfo) throw new Error(`경기장 정보를 찾을 수 없습니다: ${stadiumName}`);

    let currentDate: Date;
    if (process.env.TEST_TODAY_DATE) {
      currentDate = new Date(process.env.TEST_TODAY_DATE + 'T12:00:00');
    } else {
      currentDate = new Date();
    }

    const diffDays = calculateDateDiff(currentDate, gameDate);
    
    if (diffDays < 0) {
      console.warn(`⚠️  과거 날짜는 예보 정보를 제공할 수 없습니다.`);
      return null;
    } else if (diffDays <= 2) {
      return await getShortTermWeather(stadiumInfo.nx, stadiumInfo.ny, gameDate);
    } else if (diffDays <= 10) {
      return await getMidTermWeatherParallel(stadiumInfo.landRegId, stadiumInfo.taRegId, gameDate);
    } else {
      console.warn(`⚠️  10일을 초과한 날짜는 예보 정보를 제공할 수 없습니다.`);
      return null;
    }
  } catch (error: any) {
    console.error(`❌ [getStadiumWeather] 에러 발생: ${error.message}`);
    throw error;
  }
}
