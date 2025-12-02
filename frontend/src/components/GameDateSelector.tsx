import React from 'react';
import { GameDate } from '../types';

interface GameDateSelectorProps {
  gameDates: GameDate[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  disabled?: boolean;
}

const GameDateSelector: React.FC<GameDateSelectorProps> = ({
  gameDates,
  selectedDate,
  onSelectDate,
  disabled,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-2">
        경기 날짜 선택 (DB의 game_date 컬럼 기준)
      </label>
      <select
        id="date-select"
        value={selectedDate || ''}
        onChange={(e) => onSelectDate(e.target.value || null)}
        disabled={disabled}
        className={`block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all ${
          disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400'
        }`}
      >
        <option value="">경기 날짜를 선택하세요</option>
        {gameDates.map((gameDate) => (
          <option key={gameDate.date} value={gameDate.date}>
            {gameDate.date} ({gameDate.dayOfWeek}) - {gameDate.gameCount}경기
          </option>
        ))}
      </select>
      {!disabled && gameDates.length === 0 && (
        <p className="mt-2 text-xs text-yellow-600">
          해당 경기장에 등록된 경기 일정이 없습니다.
        </p>
      )}
    </div>
  );
};

export default GameDateSelector;
