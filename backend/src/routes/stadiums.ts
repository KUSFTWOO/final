import { Router, Request, Response } from 'express';
import { getAllStadiums, getGameDatesByStadium, getGameSchedulesByStadium } from '../services/stadiumService';

const router = Router();

/**
 * GET /api/stadiums
 * 모든 경기장 목록 조회 (DB의 game_schedules 테이블에서 실제 사용되는 경기장만)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const stadiums = await getAllStadiums();
    res.json({ stadiums });
  } catch (error: any) {
    console.error('Error fetching stadiums:', error);
    res.status(500).json({ error: '경기장 목록 조회 실패' });
  }
});

/**
 * GET /api/stadiums/:stadiumName/game-dates
 * 특정 경기장에 경기가 예정된 날짜 목록 조회
 */
router.get('/:stadiumName/game-dates', async (req: Request, res: Response) => {
  try {
    const { stadiumName } = req.params;
    const decodedStadiumName = decodeURIComponent(stadiumName);
    
    const gameDates = await getGameDatesByStadium(decodedStadiumName);
    
    res.json({
      stadiumName: decodedStadiumName,
      gameDates,
      // 디버깅 정보 포함
      debug: {
        description: 'DB의 game_date 컬럼 기준으로 모든 경기 날짜 조회',
        resultCount: gameDates.length,
        note: '중기예보 범위 제한 없이 game_schedules 테이블의 모든 날짜를 반환합니다.'
      }
    });
  } catch (error: any) {
    console.error('Error fetching game dates:', error);
    res.status(500).json({ 
      error: error.message || '경기 날짜 조회 실패',
      details: error.message 
    });
  }
});

/**
 * GET /api/stadiums/:stadiumName/games
 * 특정 경기장의 모든 경기 일정 조회 (DB 테이블 내용 전체)
 */
router.get('/:stadiumName/games', async (req: Request, res: Response) => {
  try {
    const { stadiumName } = req.params;
    const decodedStadiumName = decodeURIComponent(stadiumName);
    
    const games = await getGameSchedulesByStadium(decodedStadiumName);
    
    res.json({
      stadiumName: decodedStadiumName,
      totalCount: games.length,
      games
    });
  } catch (error: any) {
    console.error('Error fetching games by stadium:', error);
    res.status(500).json({ 
      error: error.message || '경기 일정 조회 실패',
      details: error.message 
    });
  }
});

export default router;
