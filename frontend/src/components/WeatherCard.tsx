import React, { useState } from 'react';
import { DailyWeather } from '../types';

interface WeatherCardProps {
  weather: DailyWeather;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getProbabilityColor = (probability: string) => {
    switch (probability) {
      case 'HIGH':
        return 'text-red-600 bg-red-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'LOW':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 기상 정보 */}
        <div>
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">기상 정보</h3>
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="text-sm text-gray-600 min-w-[100px]">오전 날씨: </span>
              <span className="font-medium">{weather.weatherAm}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="text-sm text-gray-600 min-w-[100px]">오후 날씨: </span>
              <span className="font-medium">{weather.weatherPm}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="text-sm text-gray-600 min-w-[100px]">최저/최고 온도: </span>
              <span className="font-medium">
                {weather.minTemp}°C / {weather.maxTemp}°C
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="text-sm text-gray-600 min-w-[100px]">강수 확률: </span>
              <span className="font-medium">{weather.precipitationProb}%</span>
            </div>
            {weather.windSpeed && (
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-sm text-gray-600 min-w-[100px]">풍속: </span>
                <span className="font-medium">{weather.windSpeed}m/s</span>
              </div>
            )}
            {weather.humidity && (
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-sm text-gray-600 min-w-[100px]">습도: </span>
                <span className="font-medium">{weather.humidity}%</span>
              </div>
            )}
          </div>
        </div>

        {/* 우천 취소 예측 */}
        <div>
          <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-4">우천 취소 예측</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-600 block mb-2">취소 확률: </span>
              <span
                className={`inline-block px-4 py-2 rounded-full font-bold text-sm md:text-base ${getProbabilityColor(
                  weather.cancelPrediction.probability
                )}`}
              >
                {weather.cancelPrediction.probability}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600 block mb-1">사유: </span>
              <span className="font-medium text-sm md:text-base">{weather.cancelPrediction.reason}</span>
            </div>
            {weather.cancelPrediction.decisionTimeStart && (
              <div>
                <span className="text-sm text-gray-600">결정 시점: </span>
                <span className="text-sm font-medium text-gray-900">
                  경기 시작 3시간 전 ({weather.cancelPrediction.decisionTimeStart})부터
                </span>
              </div>
            )}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              {showDetails ? '▼ 상세 정보 숨기기' : '▶ 상세 정보 보기'}
            </button>
            {showDetails && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700 whitespace-pre-line">{weather.cancelPrediction.details}</p>
                {weather.cancelPrediction.factors && weather.cancelPrediction.factors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-600 mb-2">예측 요인:</p>
                    <ul className="space-y-1">
                      {weather.cancelPrediction.factors.map((factor, index) => (
                        <li key={index} className="text-xs text-gray-600">
                          • {factor.type === 'precipitation' && `강수 확률: ${factor.value}%`}
                          {factor.type === 'weather_condition' && `날씨 상태: ${factor.value}`}
                          {factor.type === 'wind' && `풍속: ${factor.value}m/s`}
                          {factor.type === 'temperature' && `온도: ${factor.value}°C`}
                          {' '}({factor.status === 'danger' && '위험'}
                          {factor.status === 'warning' && '주의'}
                          {factor.status === 'safe' && '안전'})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 경기 일정 정보 */}
      {weather.gameSchedule && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-base md:text-lg font-bold text-gray-800 mb-3">경기 일정</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm md:text-base">
              <span className="font-medium">{weather.gameSchedule.homeTeamName}</span> vs{' '}
              <span className="font-medium">{weather.gameSchedule.awayTeamName}</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {weather.gameSchedule.gameTime} 시작
            </p>
            {(weather.gameSchedule.homeTeamRank || weather.gameSchedule.awayTeamRank) && (
              <p className="text-xs text-gray-500 mt-1">
                순위: 홈 {weather.gameSchedule.homeTeamRank || '-'}위 vs 원정 {weather.gameSchedule.awayTeamRank || '-'}위
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherCard;
