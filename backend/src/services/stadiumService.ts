import * as fs from 'fs';
import { Stadium, Team } from '../types';
import { getDataFilePath } from '../utils/filePath';
import { pool } from '../config/database';
import { formatDateFromDB } from '../utils/dateUtils';

// 요일 계산 함수
function getDayOfWeek(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
}

const teamsPath = getDataFilePath('data/teams.json');

/**
 * teams.json에서 경기장 정보를 로드하여 매핑 테이블 생성
 */
function loadTeamsMapping(): Map<string, Team[]> {
  const teamsByStadium = new Map<string, Team[]>();
  
  try {
    const data = fs.readFileSync(teamsPath, 'utf-8');
    const jsonData = JSON.parse(data);
    const teams: Team[] = jsonData.teams;
    
    teams.forEach(team => {
      const stadiumName = team.stadiumName;
      if (!teamsByStadium.has(stadiumName)) {
        teamsByStadium.set(stadiumName, []);
      }
      teamsByStadium.get(stadiumName)!.push(team);
    });
  } catch (error) {
    console.error('Error loading teams mapping:', error);
  }
  
  return teamsByStadium;
}

/**
 * 경기장 이름 매칭 함수 (DB 이름과 teams.json 이름 매칭)
 */
function matchStadiumName(dbName: string, teamsByStadium: Map<string, Team[]>): string | null {
  // 정확히 일치하는 경우
  if (teamsByStadium.has(dbName)) {
    return dbName;
  }
  
  // 부분 일치 검색 (더 구체적인 매칭 우선)
  let bestMatch: string | null = null;
  let bestMatchLength = 0;
  
  for (const [stadiumName] of teamsByStadium.entries()) {
    // DB 이름과 teams.json 이름의 교집합 길이 계산
    if (dbName === stadiumName) {
      return stadiumName;
    }
    
    // 한쪽이 다른 쪽을 포함하는 경우
    if (dbName.includes(stadiumName) || stadiumName.includes(dbName)) {
      const matchLength = Math.min(dbName.length, stadiumName.length);
      if (matchLength > bestMatchLength) {
        bestMatch = stadiumName;
        bestMatchLength = matchLength;
      }
    }
  }
  
  return bestMatch;
}

/**
 * 모든 경기장 목록을 반환 (DB의 game_schedules에서 실제 사용되는 경기장만)
 */
export async function getAllStadiums(): Promise<Stadium[]> {
  try {
    // DB에서 실제 사용되는 경기장 목록 조회
    const stadiumQuery = `
      SELECT DISTINCT 
        stadium_name
      FROM game_schedules
      ORDER BY stadium_name
    `;
    
    const stadiumResult = await pool.query(stadiumQuery);
    
    // teams.json에서 경기장 정보 매핑
    const teamsByStadium = loadTeamsMapping();
    
    // DB에서 가져온 경기장 목록을 기반으로 Stadium 객체 생성
    const stadiums: Stadium[] = [];
    
    for (const row of stadiumResult.rows) {
      const dbStadiumName = row.stadium_name;
      
      // teams.json에서 매칭되는 경기장 이름 찾기
      const matchedName = matchStadiumName(dbStadiumName, teamsByStadium);
      const matchedTeams = matchedName ? teamsByStadium.get(matchedName) : null;
      
      if (matchedTeams && matchedTeams.length > 0) {
        const firstTeam = matchedTeams[0];
        stadiums.push({
          stadiumName: dbStadiumName, // DB의 실제 경기장 이름 사용
          location: firstTeam.location,
          regId: firstTeam.regId,
          stadiumType: firstTeam.stadiumType,
          isDome: firstTeam.isDome,
          homeTeams: matchedTeams.map(t => t.id),
          coordinates: firstTeam.coordinates
        });
      } else {
        // teams.json에 없는 경우 DB에서 정보 가져오기
        // DB에서 해당 경기장의 홈팀 정보 가져오기
        const teamQuery = `
          SELECT DISTINCT home_team, home_team_name
          FROM game_schedules
          WHERE stadium_name = $1
          LIMIT 1
        `;
        
        const teamResult = await pool.query(teamQuery, [dbStadiumName]);
        
        // 홈팀 ID로 teams.json에서 팀 정보 찾기
        let regId = '11B10101'; // 기본값: 서울
        let location = '위치 정보 없음';
        let stadiumType = '천연';
        let isDome = false;
        const homeTeams: string[] = [];
        
        if (teamResult.rows.length > 0) {
          const homeTeamId = teamResult.rows[0].home_team;
          homeTeams.push(homeTeamId);
          
          // teams.json에서 해당 팀 찾기
          try {
            const data = fs.readFileSync(teamsPath, 'utf-8');
            const jsonData = JSON.parse(data);
            const teams: Team[] = jsonData.teams;
            const team = teams.find(t => t.id === homeTeamId);
            
            if (team) {
              regId = team.regId;
              location = team.location;
              stadiumType = team.stadiumType;
              isDome = team.isDome;
            }
          } catch (e) {
            console.warn('Could not load team info for regId:', e);
          }
        }
        
        stadiums.push({
          stadiumName: dbStadiumName,
          location: location,
          regId: regId,
          stadiumType: stadiumType,
          isDome: isDome,
          homeTeams: homeTeams
        });
      }
    }
    
    return stadiums;
  } catch (error: any) {
    console.error('Error fetching stadiums from DB:', error);
    // 에러 시 기존 방식으로 fallback
    return getAllStadiumsSync();
  }
}

/**
 * 모든 경기장 목록을 반환 (동기 버전, fallback용)
 */
function getAllStadiumsSync(): Stadium[] {
  try {
    // 경로 확인 및 로깅
    if (!fs.existsSync(teamsPath)) {
      console.error(`[getAllStadiumsSync] teams.json not found at: ${teamsPath}`);
      console.error(`  __dirname: ${__dirname}`);
      console.error(`  process.cwd(): ${process.cwd()}`);
      return [];
    }
    
    const data = fs.readFileSync(teamsPath, 'utf-8');
    const jsonData = JSON.parse(data);
    const teams: Team[] = jsonData.teams;
    
    // 경기장별로 그룹화 (같은 경기장을 사용하는 팀들)
    const stadiumMap = new Map<string, Stadium>();
    
    teams.forEach(team => {
      const stadiumName = team.stadiumName;
      
      if (!stadiumMap.has(stadiumName)) {
        stadiumMap.set(stadiumName, {
          stadiumName: stadiumName,
          location: team.location,
          regId: team.regId,
          stadiumType: team.stadiumType,
          isDome: team.isDome,
          homeTeams: [team.id],
          coordinates: team.coordinates
        });
      } else {
        const stadium = stadiumMap.get(stadiumName)!;
        if (!stadium.homeTeams.includes(team.id)) {
          stadium.homeTeams.push(team.id);
        }
      }
    });
    
    return Array.from(stadiumMap.values());
  } catch (error: any) {
    console.error('Error reading teams data:', error);
    if (error.code === 'ENOENT') {
      console.error(`  File path: ${teamsPath}`);
      console.error(`  __dirname: ${__dirname}`);
      console.error(`  process.cwd(): ${process.cwd()}`);
    }
    return [];
  }
}

/**
 * 경기장 이름으로 경기장 정보 조회 (DB 기반)
 */
export async function getStadiumByName(stadiumName: string): Promise<Stadium | null> {
  const stadiums = await getAllStadiums();
  return stadiums.find(stadium => stadium.stadiumName === stadiumName) || null;
}

/**
 * 특정 경기장에 경기가 예정된 날짜 목록 조회
 * DB의 game_date 컬럼을 기준으로 모든 날짜 반환 (중기예보 범위 제한 없음)
 */
export async function getGameDatesByStadium(stadiumName: string): Promise<Array<{ date: string; dayOfWeek: string; gameCount: number }>> {
  try {
    // DB의 game_date 컬럼을 기준으로 모든 경기 날짜 조회 (중기예보 범위 제한 없음)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 디버깅 정보 콘솔 출력
    const todayStr = formatDateFromDB(today);
    console.log('═══════════════════════════════════════════════════');
    console.log('[경기 날짜 조회] DB game_date 컬럼 기준');
    console.log('───────────────────────────────────────────────────');
    console.log(`경기장: ${stadiumName}`);
    console.log(`오늘 날짜: ${todayStr} (로컬 시간 기준)`);
    console.log(`조회 방식: DB의 game_date 컬럼 기준 (모든 날짜)`);
    console.log(`DB 쿼리 파라미터:`);
    console.log(`  - stadium_name: ${stadiumName}`);
    console.log('───────────────────────────────────────────────────');
    
    const query = `
      SELECT 
        game_date as date,
        day_of_week as "dayOfWeek",
        COUNT(*) as "gameCount"
      FROM game_schedules
      WHERE stadium_name = $1
      GROUP BY game_date, day_of_week
      ORDER BY game_date ASC
    `;
    
    const result = await pool.query(query, [stadiumName]);
    
    console.log(`DB 조회 결과: ${result.rows.length}개의 날짜 발견`);
    if (result.rows.length > 0) {
      console.log('발견된 경기 날짜 (game_date 기준):');
      result.rows.forEach((row, index) => {
        const dateStr = formatDateFromDB(row.date);
        console.log(`  ${index + 1}. ${dateStr} (${row.dayOfWeek || '요일 계산 중'}) - ${row.gameCount}경기`);
      });
    } else {
      console.log('  (해당 경기장에 등록된 경기 일정이 없습니다)');
    }
    console.log('═══════════════════════════════════════════════════');
    
    return result.rows.map(row => {
      // PostgreSQL DATE 타입을 안전하게 변환 (시간대 문제 방지)
      const dateStr = formatDateFromDB(row.date);
      
      return {
        date: dateStr,
        dayOfWeek: row.dayOfWeek || getDayOfWeek(new Date(dateStr)),
        gameCount: parseInt(String(row.gameCount))
      };
    });
  } catch (error: any) {
    console.error('Error fetching game dates by stadium:', error);
    throw error; // 에러를 상위로 전달하여 프론트엔드에서 처리할 수 있도록
  }
}

/**
 * 특정 경기장과 날짜의 경기 일정 조회
 */
export async function getGameScheduleByStadiumAndDate(
  stadiumName: string,
  date: string
): Promise<import('../types').GameSchedule | null> {
  const query = `
    SELECT 
      id,
      game_date as "date",
      stadium_name as "stadiumName",
      home_team as "homeTeam",
      home_team_name as "homeTeamName",
      away_team as "awayTeam",
      away_team_name as "awayTeamName",
      game_time as "gameTime",
      home_team_rank as "homeTeamRank",
      away_team_rank as "awayTeamRank"
    FROM game_schedules
    WHERE stadium_name = $1
      AND game_date = $2
    LIMIT 1
  `;
  
  try {
    const result = await pool.query(query, [stadiumName, date]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    // 날짜 형식 변환 (PostgreSQL DATE를 안전하게 변환, 시간대 문제 방지)
    const dateStr = formatDateFromDB(row.date);
    
    // 시간 형식 변환 (PostgreSQL TIME은 문자열로 반환됨: "18:30:00")
    let gameTimeStr: string;
    if (typeof row.gameTime === 'string') {
      // "18:30:00" 형식이면 "18:30"으로 변환
      gameTimeStr = row.gameTime.substring(0, 5);
    } else if (row.gameTime instanceof Date) {
      gameTimeStr = row.gameTime.toTimeString().substring(0, 5);
    } else {
      gameTimeStr = String(row.gameTime).substring(0, 5);
    }
    
    return {
      id: row.id,
      date: dateStr,
      stadiumName: row.stadiumName,
      homeTeam: row.homeTeam,
      homeTeamName: row.homeTeamName,
      awayTeam: row.awayTeam,
      awayTeamName: row.awayTeamName,
      gameTime: gameTimeStr,
      homeTeamRank: row.homeTeamRank,
      awayTeamRank: row.awayTeamRank
    };
  } catch (error: any) {
    console.error('Error fetching game schedule by stadium and date:', error);
    return null;
  }
}

/**
 * 특정 경기장의 모든 경기 일정 조회 (DB 테이블 내용 전체)
 */
export async function getGameSchedulesByStadium(
  stadiumName: string
): Promise<import('../types').GameSchedule[]> {
  const query = `
    SELECT 
      id,
      game_date as "date",
      day_of_week as "dayOfWeek",
      stadium_name as "stadiumName",
      home_team as "homeTeam",
      home_team_name as "homeTeamName",
      away_team as "awayTeam",
      away_team_name as "awayTeamName",
      game_time as "gameTime",
      home_team_rank as "homeTeamRank",
      away_team_rank as "awayTeamRank"
    FROM game_schedules
    WHERE stadium_name = $1
    ORDER BY game_date ASC, game_time ASC
  `;
  
  try {
    const result = await pool.query(query, [stadiumName]);
    
    return result.rows.map(row => {
      // 날짜 형식 변환 (PostgreSQL DATE를 안전하게 변환, 시간대 문제 방지)
      const dateStr = formatDateFromDB(row.date);
      
      // 시간 형식 변환
      let gameTimeStr: string;
      if (typeof row.gameTime === 'string') {
        gameTimeStr = row.gameTime.substring(0, 5);
      } else if (row.gameTime instanceof Date) {
        gameTimeStr = row.gameTime.toTimeString().substring(0, 5);
      } else {
        gameTimeStr = String(row.gameTime).substring(0, 5);
      }
      
      return {
        id: row.id,
        date: dateStr,
        dayOfWeek: row.dayOfWeek,
        stadiumName: row.stadiumName,
        homeTeam: row.homeTeam,
        homeTeamName: row.homeTeamName,
        awayTeam: row.awayTeam,
        awayTeamName: row.awayTeamName,
        gameTime: gameTimeStr,
        homeTeamRank: row.homeTeamRank,
        awayTeamRank: row.awayTeamRank
      };
    });
  } catch (error: any) {
    console.error('Error fetching game schedules by stadium:', error);
    throw error;
  }
}
