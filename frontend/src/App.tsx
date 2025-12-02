import React, { useState, useEffect } from 'react';
import { Stadium, WeatherResponse, GameDate, GameSchedule } from './types';
import { getStadiums, getGameDatesByStadium, getWeather, getGameSchedulesByStadium } from './services/api';
import StadiumSelector from './components/StadiumSelector';
import StadiumInfo from './components/StadiumInfo';
import GameDateSelector from './components/GameDateSelector';
import WeatherCard from './components/WeatherCard';
import GameScheduleTable from './components/GameScheduleTable';

function App() {
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [selectedStadium, setSelectedStadium] = useState<Stadium | null>(null);
  const [gameDates, setGameDates] = useState<GameDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [gameSchedules, setGameSchedules] = useState<GameSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 경기장 목록 조회
  useEffect(() => {
    const fetchStadiums = async () => {
      try {
        const stadiumsData = await getStadiums();
        setStadiums(stadiumsData);
      } catch (err: any) {
        setError('경기장 정보를 불러올 수 없습니다.');
        console.error('Error fetching stadiums:', err);
      }
    };
    fetchStadiums();
  }, []);

  // 경기장 선택 시 경기 날짜 목록 및 모든 경기 일정 조회
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedStadium) {
        setGameDates([]);
        setSelectedDate(null);
        setWeatherData(null);
        setGameSchedules([]);
        return;
      }

      setLoadingDates(true);
      setLoadingSchedules(true);
      setError(null);
      setSelectedDate(null);
      setWeatherData(null);

      try {
        // 경기 날짜 목록 조회 (중기예보 범위 내)
        const dates = await getGameDatesByStadium(selectedStadium.stadiumName);
        setGameDates(dates);
        if (dates.length === 0) {
          setError('해당 경기장에 등록된 경기 일정이 없습니다.');
        }

        // 해당 경기장의 모든 경기 일정 조회 (DB 테이블 내용 전체)
        const schedules = await getGameSchedulesByStadium(selectedStadium.stadiumName);
        setGameSchedules(schedules);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || '정보를 불러올 수 없습니다.';
        setError(errorMessage);
        console.error('Error fetching data:', err);
      } finally {
        setLoadingDates(false);
        setLoadingSchedules(false);
      }
    };

    fetchData();
  }, [selectedStadium]);

  // 날짜 선택 시 기상 정보 조회
  useEffect(() => {
    const fetchWeather = async () => {
      if (!selectedStadium || !selectedDate) {
        setWeatherData(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getWeather(selectedStadium.stadiumName, selectedDate);
        setWeatherData(data);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || '기상 정보를 불러올 수 없습니다.';
        setError(errorMessage);
        console.error('Error fetching weather:', err);
        setWeatherData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [selectedStadium, selectedDate]);

  const handleStadiumSelect = (stadium: Stadium) => {
    setSelectedStadium(stadium);
  };

  const handleDateSelect = (date: string | null) => {
    setSelectedDate(date);
  };

  const handleRefresh = async () => {
    if (!selectedStadium || !selectedDate) return;
    
    setLoading(true);
    setError(null);

    try {
      const data = await getWeather(selectedStadium.stadiumName, selectedDate);
      setWeatherData(data);
    } catch (err: any) {
      setError(err.response?.data?.error || '기상 정보를 불러올 수 없습니다.');
      console.error('Error fetching weather:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center tracking-tight">
            ⚾ KBO 야구장 기상 정보 및 우천 취소 예측
          </h1>
          <p className="text-center text-blue-100 mt-2 text-sm md:text-base">
            경기장과 경기 날짜를 선택하여 우천 취소 확률을 확인하세요
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* 경기장 선택 */}
        <div className="mb-6">
          <StadiumSelector
            stadiums={stadiums}
            selectedStadium={selectedStadium}
            onSelectStadium={handleStadiumSelect}
          />
        </div>

        {/* 경기장 정보 표시 */}
        {selectedStadium && (
          <div className="mb-6">
            <StadiumInfo stadium={selectedStadium} />
          </div>
        )}

        {/* 경기장 선택 시 DB 테이블 내용 출력 */}
        {selectedStadium && (
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 md:mb-0">
                {selectedStadium.stadiumName} 경기 일정 (DB 테이블 전체)
              </h2>
              {gameSchedules.length > 0 && (
                <p className="text-sm text-gray-600">
                  총 {gameSchedules.length}개의 경기 일정이 등록되어 있습니다.
                </p>
              )}
            </div>
            <GameScheduleTable games={gameSchedules} loading={loadingSchedules} />
          </div>
        )}

        {/* 경기 날짜 선택 */}
        <div className="mb-6">
          <GameDateSelector
            gameDates={gameDates}
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
            disabled={!selectedStadium || loadingDates}
          />
        </div>

        {/* 로딩 상태 */}
        {loadingDates && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">경기 날짜를 불러오는 중...</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">기상 정보를 불러오는 중...</p>
          </div>
        )}

        {/* 에러 표시 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{error}</p>
                {selectedStadium && (
                  <button
                    onClick={() => {
                      setError(null);
                      if (selectedStadium) {
                        handleStadiumSelect(selectedStadium);
                      }
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                  >
                    재시도
                  </button>
                )}
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-600 transition-colors"
                  aria-label="에러 메시지 닫기"
                >
                  <span className="sr-only">닫기</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 기상 정보 표시 */}
        {weatherData && !loading && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {weatherData.date} ({weatherData.dayOfWeek}) 기상 정보
              </h2>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '새로고침 중...' : '🔄 새로고침'}
              </button>
            </div>

            <WeatherCard 
              weather={{
                date: weatherData.date,
                dayOfWeek: weatherData.dayOfWeek,
                weatherAm: weatherData.weather.weatherAm,
                weatherPm: weatherData.weather.weatherPm,
                minTemp: weatherData.weather.minTemp,
                maxTemp: weatherData.weather.maxTemp,
                precipitationProb: weatherData.weather.precipitationProb,
                windSpeed: weatherData.weather.windSpeed,
                humidity: weatherData.weather.humidity,
                forecastText: weatherData.weather.forecastText,
                gameSchedule: weatherData.gameSchedule || undefined,
                cancelPrediction: weatherData.cancelPrediction
              }} 
            />
          </div>
        )}

        {/* 초기 안내 메시지 */}
        {!selectedStadium && !loading && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">경기장을 선택하여 기상 정보를 확인하세요.</p>
          </div>
        )}

        {selectedStadium && !selectedDate && !loadingDates && gameDates.length > 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg">경기 날짜를 선택하여 기상 정보를 확인하세요.</p>
          </div>
        )}

        {selectedStadium && gameDates.length === 0 && !loadingDates && (
          <div className="text-center py-8 text-yellow-600">
            <p className="text-lg">해당 경기장에 예정된 경기가 없습니다.</p>
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-4 mt-12">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>데이터 출처: 기상청 중기예보 조회서비스</p>
          {weatherData && (
            <p className="mt-1">최종 업데이트: {weatherData.forecastTime}</p>
          )}
        </div>
      </footer>
    </div>
  );
}

export default App;
