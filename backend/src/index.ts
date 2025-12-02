import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import teamsRouter from './routes/teams';
import weatherRouter from './routes/weather';
import gameSchedulesRouter from './routes/gameSchedules';
import stadiumsRouter from './routes/stadiums';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/teams', teamsRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/game-schedules', gameSchedulesRouter);
app.use('/api/stadiums', stadiumsRouter);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'KBO Weather API is running' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
