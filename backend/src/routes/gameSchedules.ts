import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { GameSchedule } from '../types';
import { formatDateFromDB } from '../utils/dateUtils';

const router = Router();

router.get('/:date', async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const query = `
      SELECT 
        id,
        game_date as "date",
        day_of_week as "dayOfWeek",
        stadium_name as "stadiumName",
        home_team as "homeTeam",
        home_team_name as "homeTeamName",
        away_team as "awayTeam",
        away_team_name as "awayTeamName",
        game_time as "gameTime",
        home_team_rank as "homeTeamRank",
        away_team_rank as "awayTeamRank"
      FROM game_schedules
      WHERE game_date = $1
      ORDER BY game_time, stadium_name
    `;
    
    const result = await pool.query(query, [date]);
    
    if (result.rows.length === 0) {
      return res.json({
        date,
        games: []
      });
    }
    
    const games = result.rows.map(row => {
      // 날짜 형식 변환 (PostgreSQL DATE를 안전하게 변환, 시간대 문제 방지)
      const dateStr = formatDateFromDB(row.date);
      
      // 시간 형식 변환
      let gameTimeStr: string;
      if (typeof row.gameTime === 'string') {
        gameTimeStr = row.gameTime.substring(0, 5);
      } else if (row.gameTime instanceof Date) {
        gameTimeStr = row.gameTime.toTimeString().substring(0, 5);
      } else {
        gameTimeStr = String(row.gameTime).substring(0, 5);
      }
      
      return {
        id: row.id,
        date: dateStr,
        dayOfWeek: row.dayOfWeek,
        stadiumName: row.stadiumName,
        homeTeam: row.homeTeam,
        homeTeamName: row.homeTeamName,
        awayTeam: row.awayTeam,
        awayTeamName: row.awayTeamName,
        gameTime: gameTimeStr,
        homeTeamRank: row.homeTeamRank,
        awayTeamRank: row.awayTeamRank
      };
    });
    
    res.json({
      date,
      dayOfWeek: result.rows[0].dayOfWeek,
      games
    });
  } catch (error: any) {
    console.error('Error fetching game schedules:', error);
    res.status(500).json({ error: '경기 일정 조회 실패' });
  }
});

export default router;
