import React from 'react';
import { Stadium } from '../types';

interface StadiumInfoProps {
  stadium: Stadium;
}

const StadiumInfo: React.FC<StadiumInfoProps> = ({ stadium }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">{stadium.stadiumName}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <p className="text-xs md:text-sm text-gray-600 mb-1">위치</p>
          <p className="text-base md:text-lg font-medium">{stadium.location}</p>
        </div>
        <div>
          <p className="text-xs md:text-sm text-gray-600 mb-1">경기장 유형</p>
          <p className="text-base md:text-lg font-medium">
            {stadium.stadiumType} {stadium.isDome ? '(돔구장)' : '(야외)'}
          </p>
        </div>
        <div className="md:col-span-2 lg:col-span-1">
          <p className="text-xs md:text-sm text-gray-600 mb-1">홈팀</p>
          <p className="text-base md:text-lg font-medium">{stadium.homeTeams.join(', ')}</p>
        </div>
      </div>
    </div>
  );
};

export default StadiumInfo;
