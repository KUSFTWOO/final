import { DailyWeather, CancelPrediction, PredictionFactor } from '../types';

/**
 * 우천 취소 확률 계산
 */
export function calculateCancelProbability(
  weather: DailyWeather,
  stadiumType: string,
  isDome: boolean,
  gameTime: string = '18:30'
): CancelPrediction {
  // 돔 구장은 우천 취소 확률 0%
  if (isDome) {
    return {
      probability: 'NONE',
      reason: '돔 구장은 우천 취소가 발생하지 않습니다.',
      details: '돔 구장은 지붕이 있어 비의 영향이 없습니다.',
      gameTime: gameTime,
      factors: []
    };
  }

  const factors: PredictionFactor[] = [];
  let riskScore = 0;

  // 강수 확률 평가
  if (weather.precipitationProb >= 70) {
    riskScore += 40;
    factors.push({
      type: 'precipitation',
      value: weather.precipitationProb,
      threshold: 70,
      status: 'danger'
    });
  } else if (weather.precipitationProb >= 50) {
    riskScore += 25;
    factors.push({
      type: 'precipitation',
      value: weather.precipitationProb,
      threshold: 50,
      status: 'warning'
    });
  } else if (weather.precipitationProb >= 30) {
    riskScore += 10;
    factors.push({
      type: 'precipitation',
      value: weather.precipitationProb,
      threshold: 30,
      status: 'warning'
    });
  } else {
    factors.push({
      type: 'precipitation',
      value: weather.precipitationProb,
      threshold: 30,
      status: 'safe'
    });
  }

  // 날씨 상태 평가
  const isRainy = weather.weatherAm.includes('비') || weather.weatherPm.includes('비') ||
                  weather.weatherAm.includes('소나기') || weather.weatherPm.includes('소나기');
  
  if (isRainy) {
    riskScore += 30;
    factors.push({
      type: 'weather_condition',
      value: weather.weatherPm,
      status: 'danger'
    });
  } else if (weather.weatherAm.includes('흐림') || weather.weatherPm.includes('흐림')) {
    riskScore += 5;
    factors.push({
      type: 'weather_condition',
      value: weather.weatherPm,
      status: 'warning'
    });
  } else {
    factors.push({
      type: 'weather_condition',
      value: weather.weatherPm,
      status: 'safe'
    });
  }

  // 풍속 평가
  if (weather.windSpeed && weather.windSpeed > 10) {
    riskScore += 10;
    factors.push({
      type: 'wind',
      value: weather.windSpeed,
      threshold: 10,
      status: 'warning'
    });
  } else if (weather.windSpeed) {
    factors.push({
      type: 'wind',
      value: weather.windSpeed,
      threshold: 10,
      status: 'safe'
    });
  }

  // 경기장 유형 평가
  if (stadiumType === '천연') {
    // 천연 잔디는 더 위험
    riskScore += 5;
  }

  // 확률 결정
  let probability: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  let reason: string;
  let details: string;

  if (riskScore >= 60) {
    probability = 'HIGH';
    reason = '강수 확률이 높고 비가 예상되어 우천 취소 가능성이 높습니다.';
    details = `강수 확률 ${weather.precipitationProb}%, 날씨 상태: ${weather.weatherPm}. 경기 시작 전 현장 날씨를 확인하시기 바랍니다.`;
  } else if (riskScore >= 35) {
    probability = 'MEDIUM';
    reason = '강수 확률이 보통이며 우천 취소 가능성이 있습니다.';
    details = `강수 확률 ${weather.precipitationProb}%, 날씨 상태: ${weather.weatherPm}. 경기 시간대 날씨 변화에 주의하시기 바랍니다.`;
  } else if (riskScore >= 15) {
    probability = 'LOW';
    reason = '강수 확률이 낮아 우천 취소 가능성이 낮습니다.';
    details = `강수 확률 ${weather.precipitationProb}%, 날씨 상태: ${weather.weatherPm}. 경기는 정상 진행될 가능성이 높습니다.`;
  } else {
    probability = 'NONE';
    reason = '날씨가 양호하여 우천 취소 가능성이 거의 없습니다.';
    details = `강수 확률 ${weather.precipitationProb}%, 날씨 상태: ${weather.weatherPm}. 경기는 정상 진행될 것으로 예상됩니다.`;
  }

  // 결정 시점 정보
  const decisionTimeStart = calculateDecisionTimeStart(gameTime);

  return {
    probability,
    reason,
    details,
    gameTime: gameTime,
    decisionTimeStart: decisionTimeStart,
    factors: factors
  };
}

/**
 * 경기 시작 시간 기준 결정 시작 시각 계산 (경기 시작 3시간 전)
 */
function calculateDecisionTimeStart(gameTime: string): string {
  const [hours, minutes] = gameTime.split(':').map(Number);
  const decisionHour = hours - 3;
  const decisionTime = `${String(decisionHour < 0 ? decisionHour + 24 : decisionHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return decisionTime;
}
