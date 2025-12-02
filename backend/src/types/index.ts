export interface Team {
  id: string;
  name: string;
  stadiumName: string;
  location: string;
  regId: string;
  stadiumType: string;
  isDome: boolean;
  coordinates?: {
    x: number;
    y: number;
  };
}

export interface Stadium {
  stadiumName: string;
  location: string;
  regId: string;
  stadiumType: string;
  isDome: boolean;
  homeTeams: string[]; // 해당 경기장을 사용하는 팀 ID 목록
  coordinates?: {
    x: number;
    y: number;
  };
}

export interface DailyWeather {
  date: string;
  dayOfWeek: string;
  weatherAm: string;
  weatherPm: string;
  minTemp: number;
  maxTemp: number;
  precipitationProb: number;
  windSpeed?: number;
  humidity?: number;
  forecastText?: string;
  gameSchedule?: GameSchedule;
  cancelPrediction: CancelPrediction;
}

export interface GameSchedule {
  id?: number;
  date: string;
  dayOfWeek?: string; // DB의 day_of_week (선택적, 일부 API에서만 포함)
  stadiumName: string;
  homeTeam: string;
  homeTeamName: string;
  awayTeam: string;
  awayTeamName: string;
  gameTime: string;
  homeTeamRank?: number;
  awayTeamRank?: number;
}

export interface GameDate {
  date: string;
  dayOfWeek: string;
  gameCount: number;
}

export type CancelProbability = "HIGH" | "MEDIUM" | "LOW" | "NONE";

export interface CancelPrediction {
  probability: CancelProbability;
  reason: string;
  details: string;
  gameTime?: string;
  decisionTimeStart?: string;
  factors?: PredictionFactor[];
}

export interface PredictionFactor {
  type: "precipitation" | "weather_condition" | "temperature" | "wind";
  value: number | string;
  threshold?: number;
  status: "safe" | "warning" | "danger";
}
