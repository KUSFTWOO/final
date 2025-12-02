import { Router, Request, Response } from 'express';
import { getAllTeams } from '../services/teamService';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const teams = await getAllTeams();
    res.json({ teams });
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: '팀 목록 조회 실패' });
  }
});

export default router;
