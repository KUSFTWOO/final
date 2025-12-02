import * as fs from 'fs';
import { Team } from '../types';
import { getDataFilePath } from '../utils/filePath';

const teamsPath = getDataFilePath('data/teams.json');

export function getAllTeams(): Team[] {
  try {
    const data = fs.readFileSync(teamsPath, 'utf-8');
    const jsonData = JSON.parse(data);
    return jsonData.teams;
  } catch (error) {
    console.error('Error reading teams data:', error);
    return [];
  }
}
