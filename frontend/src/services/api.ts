import axios from 'axios';
import { Stadium, WeatherResponse, GameDate, GameSchedule } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10초 타임아웃
});

// 요청 인터셉터 (로깅용)
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // 서버가 응답했지만 에러 상태 코드
      console.error('[API Response Error]', error.response.status, error.response.data);
    } else if (error.request) {
      // 요청은 보냈지만 응답이 없음
      console.error('[API Network Error]', error.request);
      error.message = '네트워크 오류가 발생했습니다. 연결을 확인해주세요.';
    } else {
      // 요청 설정 중 에러
      console.error('[API Error]', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * 모든 경기장 목록 조회
 */
export const getStadiums = async (): Promise<Stadium[]> => {
  const response = await api.get<{ stadiums: Stadium[] }>('/stadiums');
  return response.data.stadiums;
};

/**
 * 특정 경기장에 경기가 예정된 날짜 목록 조회
 */
export const getGameDatesByStadium = async (stadiumName: string): Promise<GameDate[]> => {
  const encodedStadiumName = encodeURIComponent(stadiumName);
  const response = await api.get<{ stadiumName: string; gameDates: GameDate[] }>(
    `/stadiums/${encodedStadiumName}/game-dates`
  );
  return response.data.gameDates;
};

/**
 * 특정 경기장의 모든 경기 일정 조회 (DB 테이블 내용 전체)
 */
export const getGameSchedulesByStadium = async (stadiumName: string): Promise<GameSchedule[]> => {
  const encodedStadiumName = encodeURIComponent(stadiumName);
  const response = await api.get<{ stadiumName: string; totalCount: number; games: GameSchedule[] }>(
    `/stadiums/${encodedStadiumName}/games`
  );
  return response.data.games;
};

/**
 * 특정 경기장과 날짜의 기상 정보 조회
 */
export const getWeather = async (stadiumName: string, date: string): Promise<WeatherResponse> => {
  const encodedStadiumName = encodeURIComponent(stadiumName);
  const response = await api.get<WeatherResponse>(`/weather/${encodedStadiumName}/${date}`);
  return response.data;
};
