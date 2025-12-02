import React from 'react';
import { Stadium } from '../types';

interface StadiumSelectorProps {
  stadiums: Stadium[];
  selectedStadium: Stadium | null;
  onSelectStadium: (stadium: Stadium) => void;
}

const StadiumSelector: React.FC<StadiumSelectorProps> = ({
  stadiums,
  selectedStadium,
  onSelectStadium,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <label htmlFor="stadium-select" className="block text-sm font-medium text-gray-700 mb-2">
        경기장 선택
      </label>
      <select
        id="stadium-select"
        value={selectedStadium?.stadiumName || ''}
        onChange={(e) => {
          const stadium = stadiums.find((s) => s.stadiumName === e.target.value);
          if (stadium) {
            onSelectStadium(stadium);
          }
        }}
        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition-all hover:border-gray-400"
      >
        <option value="">경기장을 선택하세요</option>
        {stadiums.map((stadium) => (
          <option key={stadium.stadiumName} value={stadium.stadiumName}>
            {stadium.stadiumName}
          </option>
        ))}
      </select>
      {stadiums.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          총 {stadiums.length}개의 경기장이 등록되어 있습니다.
        </p>
      )}
    </div>
  );
};

export default StadiumSelector;
