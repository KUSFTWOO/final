import React from 'react';
import { GameSchedule } from '../types';

interface GameScheduleTableProps {
  games: GameSchedule[];
  loading?: boolean;
}

const GameScheduleTable: React.FC<GameScheduleTableProps> = ({ games, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">경기 일정을 불러오는 중...</p>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
        해당 경기장에 등록된 경기 일정이 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-4 md:px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <h3 className="text-lg md:text-xl font-bold">경기 일정 (총 {games.length}경기)</h3>
      </div>
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                날짜
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                요일
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                시간
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                홈팀
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                원정팀
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                홈 순위
              </th>
              <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                원정 순위
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {games.map((game) => (
              <tr key={game.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {game.id}
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="flex flex-col">
                    <span>{game.date}</span>
                    <span className="text-xs text-gray-500 md:hidden">{game.dayOfWeek || '-'}</span>
                  </div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                  {game.dayOfWeek || '-'}
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {game.gameTime}
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{game.homeTeamName}</div>
                  <div className="text-xs md:text-sm text-gray-500">({game.homeTeam})</div>
                  <div className="text-xs text-gray-400 lg:hidden">
                    순위: {game.homeTeamRank !== null && game.homeTeamRank !== undefined ? game.homeTeamRank : '-'}
                  </div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{game.awayTeamName}</div>
                  <div className="text-xs md:text-sm text-gray-500">({game.awayTeam})</div>
                  <div className="text-xs text-gray-400 lg:hidden">
                    순위: {game.awayTeamRank !== null && game.awayTeamRank !== undefined ? game.awayTeamRank : '-'}
                  </div>
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                  {game.homeTeamRank !== null && game.homeTeamRank !== undefined ? game.homeTeamRank : '-'}
                </td>
                <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                  {game.awayTeamRank !== null && game.awayTeamRank !== undefined ? game.awayTeamRank : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GameScheduleTable;
