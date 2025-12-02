import { Router, Request, Response } from 'express';
import { getStadiumByName } from '../services/stadiumService';
import { getGameScheduleByStadiumAndDate } from '../services/stadiumService';
import { getWeatherForDate } from '../services/weatherService';
import { calculateCancelProbability } from '../services/predictionService';

const router = Router();

/**
 * GET /api/weather/:stadiumName/:date
 * 특정 경기장과 날짜의 기상 정보 및 우천 취소 예측 조회
 */
router.get('/:stadiumName/:date', async (req: Request, res: Response) => {
  try {
    const { stadiumName, date } = req.params;
    const decodedStadiumName = decodeURIComponent(stadiumName);
    
    // 경기장 정보 조회
    const stadium = await getStadiumByName(decodedStadiumName);
    if (!stadium) {
      return res.status(404).json({ error: '경기장을 찾을 수 없습니다.' });
    }

    // 날짜 유효성 검사
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: '잘못된 날짜 형식입니다. YYYY-MM-DD 형식을 사용하세요.' });
    }

    // 기상 정보 조회
    const weather = await getWeatherForDate(stadium.regId, date);
    if (!weather) {
      return res.status(404).json({ error: '해당 날짜의 기상 정보를 찾을 수 없습니다.' });
    }

    // 경기 일정 조회
    const gameSchedule = await getGameScheduleByStadiumAndDate(decodedStadiumName, date);

    // 우천 취소 확률 계산
    const cancelPrediction = calculateCancelProbability(
      weather,
      stadium.stadiumType,
      stadium.isDome,
      gameSchedule?.gameTime || '18:30'
    );

    res.json({
      stadiumName: stadium.stadiumName,
      location: stadium.location,
      regId: stadium.regId,
      stadiumType: stadium.stadiumType,
      isDome: stadium.isDome,
      homeTeams: stadium.homeTeams,
      date: weather.date,
      dayOfWeek: weather.dayOfWeek,
      forecastTime: weather.forecastText || '',
      weather: {
        date: weather.date,
        dayOfWeek: weather.dayOfWeek,
        weatherAm: weather.weatherAm,
        weatherPm: weather.weatherPm,
        minTemp: weather.minTemp,
        maxTemp: weather.maxTemp,
        precipitationProb: weather.precipitationProb,
        windSpeed: weather.windSpeed,
        humidity: weather.humidity,
        forecastText: weather.forecastText
      },
      gameSchedule: gameSchedule,
      cancelPrediction: cancelPrediction
    });
  } catch (error: any) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ 
      error: error.message || '기상 정보 조회 실패',
      details: error.message 
    });
  }
});

export default router;
