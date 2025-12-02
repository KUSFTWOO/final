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
  homeTeams: string[];
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
  dayOfWeek?: string;
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

export interface WeatherResponse {
  stadiumName: string;
  location: string;
  regId: string;
  stadiumType: string;
  isDome: boolean;
  homeTeams: string[];
  date: string;
  dayOfWeek: string;
  forecastTime: string;
  weather: {
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
  };
  gameSchedule?: GameSchedule | null;
  cancelPrediction: CancelPrediction;
}
