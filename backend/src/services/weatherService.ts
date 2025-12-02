import axios from 'axios';
import { DailyWeather } from '../types';

const API_BASE_URL = process.env.WEATHER_API_BASE_URL || 'http://apis.data.go.kr/1360000/MidFcstInfoService';
const API_KEY = process.env.WEATHER_API_KEY;

if (!API_KEY) {
  console.error('기상청 API 키가 설정되지 않았습니다.');
}

/**
 * 특정 날짜의 기상 정보 조회
 * @param regId 중기예보 지역 코드
 * @param targetDate 조회할 날짜 (YYYY-MM-DD 형식)
 * @returns 기상 정보
 */
export async function getWeatherForDate(regId: string, targetDate: string): Promise<DailyWeather | null> {
  if (!API_KEY) {
    throw new Error('기상청 API 키가 설정되지 않았습니다.');
  }

  try {
    // 최신 발표 시각 조회 (06:00 또는 18:00)
    const now = new Date();
    const currentHour = now.getHours();
    
    // 오전 6시 이전이면 전날 18시 발표, 6시 이후면 오늘 6시 발표
    let forecastDate = new Date(now);
    let forecastHour = '06';
    
    if (currentHour < 6) {
      forecastDate.setDate(forecastDate.getDate() - 1);
      forecastHour = '18';
    }
    
    const tmFc = `${forecastDate.getFullYear()}${String(forecastDate.getMonth() + 1).padStart(2, '0')}${String(forecastDate.getDate()).padStart(2, '0')}${forecastHour}00`;
    
    // API 호출
    const url = `${API_BASE_URL}/getMidLandFcst`;
    const params = {
      serviceKey: decodeURIComponent(API_KEY),
      dataType: 'JSON',
      numOfRows: 10,
      pageNo: 1,
      regId: regId,
      tmFc: tmFc
    };

    const response = await axios.get(url, { params });
    
    if (response.data.response?.header?.resultCode !== '00') {
      throw new Error(response.data.response?.header?.resultMsg || '기상 정보 조회 실패');
    }

    const items = response.data.response?.body?.items?.item;
    if (!items || items.length === 0) {
      throw new Error('기상 정보 데이터가 없습니다.');
    }

    // targetDate를 Date 객체로 변환
    const target = new Date(targetDate + 'T00:00:00');
    const forecastStart = new Date(tmFc.substring(0, 8));
    const daysDiff = Math.floor((target.getTime() - forecastStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // API는 발표일 기준 3일 후부터 10일 후까지 제공
    if (daysDiff < 3 || daysDiff > 10) {
      throw new Error(`해당 날짜(${targetDate})는 중기예보 범위(발표일 기준 3~10일 후)를 벗어났습니다.`);
    }

    // 일자 인덱스 계산 (3일 후가 인덱스 0)
    const dayIndex = daysDiff - 3;
    
    // 날씨 정보 추출
    const weatherItem = items[0];
    const wfSv = weatherItem.wfSv || '';
    const lines = wfSv.split('\n');
    
    // 해당 일자의 날씨 정보 추출
    const dayLines = lines.filter((line: string) => {
      const match = line.match(/(\d+)일/);
      return match && parseInt(match[1]) === daysDiff + 1;
    });

    // 기상 정보 파싱
    let weatherAm = '맑음';
    let weatherPm = '맑음';
    let minTemp = 15;
    let maxTemp = 25;
    let precipitationProb = 0;
    let windSpeed = 0;
    let humidity = 50;
    let forecastText = '';

    if (dayLines.length > 0) {
      const weatherLine = dayLines[0];
      forecastText = weatherLine;
      
      // 날씨 상태 파싱
      if (weatherLine.includes('비') || weatherLine.includes('소나기')) {
        weatherAm = '비';
        weatherPm = '비';
      } else if (weatherLine.includes('흐림')) {
        weatherAm = '흐림';
        weatherPm = '흐림';
      }
      
      // 강수 확률 추출 (임시값, 실제로는 API에서 제공하는 값 사용)
      if (weatherLine.includes('비')) {
        precipitationProb = 60;
      } else if (weatherLine.includes('소나기')) {
        precipitationProb = 40;
      }
    }

    // 기온 정보 추출 (API에서 제공하는 경우)
    if (weatherItem.taMin && weatherItem.taMin.length > dayIndex) {
      minTemp = parseInt(weatherItem.taMin[dayIndex]) || 15;
    }
    if (weatherItem.taMax && weatherItem.taMax.length > dayIndex) {
      maxTemp = parseInt(weatherItem.taMax[dayIndex]) || 25;
    }

    // 요일 계산
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = days[target.getDay()];

    return {
      date: targetDate,
      dayOfWeek: dayOfWeek,
      weatherAm: weatherAm,
      weatherPm: weatherPm,
      minTemp: minTemp,
      maxTemp: maxTemp,
      precipitationProb: precipitationProb,
      windSpeed: windSpeed,
      humidity: humidity,
      forecastText: forecastText,
      cancelPrediction: {
        probability: 'NONE',
        reason: '',
        details: ''
      }
    };
  } catch (error: any) {
    console.error('Error fetching weather data:', error);
    throw new Error(`기상 정보 조회 실패: ${error.message}`);
  }
}
