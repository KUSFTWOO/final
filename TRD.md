# KBO 야구장 기상 정보 및 우천 취소 예측 서비스 TRD

## 문서 정보
- **문서명**: Technical Requirements Document (TRD)
- **버전**: 2.0
- **작성일**: 2025-12-02
- **최종 수정일**: 2025-12-02

## 1. 시스템 아키텍처

### 1.1 전체 구조
- **아키텍처 패턴**: 클라이언트-서버 (Client-Server)
- **프론트엔드**: SPA (Single Page Application)
- **백엔드**: RESTful API 서버
- **데이터베이스**: PostgreSQL (Supabase)

### 1.2 계층 구조 (백엔드)
1. **라우터 계층** (Routes): HTTP 요청 처리
2. **서비스 계층** (Services): 비즈니스 로직
3. **데이터 접근 계층** (Database/API): DB 및 외부 API 호출

## 2. 기술 스택 상세

### 2.1 프론트엔드
```json
{
  "framework": "React 18.x",
  "language": "TypeScript",
  "buildTool": "Vite",
  "styling": "Tailwind CSS 3.x",
  "httpClient": "Axios",
  "packageManager": "npm/yarn"
}
```

### 2.2 백엔드
```json
{
  "runtime": "Node.js 18.x LTS+",
  "framework": "Express",
  "language": "TypeScript",
  "httpClient": "Axios",
  "database": "PostgreSQL (pg library)",
  "envManagement": "dotenv"
}
```

### 2.3 데이터베이스
- **서비스**: Supabase (PostgreSQL)
- **주요 테이블**: `game_schedules`

## 3. API 명세

### 3.1 백엔드 엔드포인트

#### 3.1.1 경기장 관련

**GET /api/stadiums**
- **설명**: 모든 경기장 목록 조회
- **응답**:
```json
{
  "stadiums": [
    {
      "stadiumName": "잠실야구장",
      "location": "서울 송파구",
      "regId": "11B10101",
      "stadiumType": "천연",
      "isDome": false,
      "homeTeams": ["LG", "두산"]
    }
  ]
}
```

**GET /api/stadiums/:stadiumName/game-dates**
- **설명**: 특정 경기장에 예정된 날짜 목록 조회 (DB의 game_date 컬럼 기준, 모든 날짜)
- **응답**:
```json
{
  "stadiumName": "잠실야구장",
  "gameDates": [
    {
      "date": "2025-12-09",
      "dayOfWeek": "화",
      "gameCount": 1
    }
  ],
  "debug": {
    "today": "2025-12-02",
    "searchRange": {
      "min": "2025-12-05",
      "max": "2025-12-12",
      "description": "오늘 기준 3일 후 ~ 10일 후"
    },
    "resultCount": 1
  }
}
```

**GET /api/stadiums/:stadiumName/games**
- **설명**: 특정 경기장의 모든 경기 일정 조회 (DB 테이블 내용 전체)
- **응답**:
```json
{
  "stadiumName": "잠실야구장",
  "totalCount": 10,
  "games": [
    {
      "id": 1,
      "date": "2025-12-09",
      "dayOfWeek": "화",
      "stadiumName": "잠실야구장",
      "homeTeam": "LG",
      "homeTeamName": "LG 트윈스",
      "awayTeam": "KT",
      "awayTeamName": "KT 위즈",
      "gameTime": "18:30",
      "homeTeamRank": 1,
      "awayTeamRank": 6
    }
  ]
}
```

#### 3.1.2 기상 정보 관련

**GET /api/weather/:stadiumName/:date**
- **설명**: 특정 경기장과 날짜의 기상 정보 및 우천 취소 예측 조회
- **응답**:
```json
{
  "stadiumName": "잠실야구장",
  "location": "서울 송파구",
  "regId": "11B10101",
  "stadiumType": "천연",
  "isDome": false,
  "homeTeams": ["LG", "두산"],
  "date": "2025-12-09",
  "dayOfWeek": "화",
  "forecastTime": "202512020600",
  "weather": {
    "date": "2025-12-09",
    "dayOfWeek": "화",
    "weatherAm": "맑음",
    "weatherPm": "맑음",
    "minTemp": 5,
    "maxTemp": 15,
    "precipitationProb": 10,
    "windSpeed": 3,
    "humidity": 45,
    "forecastText": "구름이 조금 많겠습니다."
  },
  "gameSchedule": {
    "id": 1,
    "date": "2025-12-09",
    "stadiumName": "잠실야구장",
    "homeTeam": "LG",
    "homeTeamName": "LG 트윈스",
    "awayTeam": "KT",
    "awayTeamName": "KT 위즈",
    "gameTime": "18:30",
    "homeTeamRank": 1,
    "awayTeamRank": 6
  },
  "cancelPrediction": {
    "probability": "LOW",
    "reason": "강수 확률이 낮아 우천 취소 가능성이 낮습니다.",
    "details": "강수 확률 10%, 날씨 상태: 맑음. 경기는 정상 진행될 가능성이 높습니다.",
    "gameTime": "18:30",
    "decisionTimeStart": "15:30",
    "factors": [
      {
        "type": "precipitation",
        "value": 10,
        "threshold": 30,
        "status": "safe"
      }
    ]
  }
}
```

### 3.2 외부 API

#### 기상청 중기예보 조회서비스
- **URL**: `http://apis.data.go.kr/1360000/MidFcstInfoService/getMidLandFcst`
- **Method**: GET
- **파라미터**:
  - `serviceKey`: 서비스 인증키
  - `dataType`: JSON
  - `numOfRows`: 10
  - `pageNo`: 1
  - `regId`: 중기예보 지역 코드
  - `tmFc`: 발표시각 (YYYYMMDDHHmm 형식)

## 4. 데이터 모델

### 4.1 TypeScript 인터페이스

```typescript
// 경기장
interface Stadium {
  stadiumName: string;
  location: string;
  regId: string;
  stadiumType: string;
  isDome: boolean;
  homeTeams: string[];
  coordinates?: { x: number; y: number };
}

// 경기 일정
interface GameSchedule {
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

// 경기 날짜
interface GameDate {
  date: string;
  dayOfWeek: string;
  gameCount: number;
}

// 기상 정보
interface DailyWeather {
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

// 우천 취소 예측
interface CancelPrediction {
  probability: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  reason: string;
  details: string;
  gameTime?: string;
  decisionTimeStart?: string;
  factors?: PredictionFactor[];
}

// 예측 요인
interface PredictionFactor {
  type: "precipitation" | "weather_condition" | "temperature" | "wind";
  value: number | string;
  threshold?: number;
  status: "safe" | "warning" | "danger";
}
```

### 4.2 데이터베이스 스키마

#### game_schedules 테이블
```sql
CREATE TABLE game_schedules (
  id SERIAL PRIMARY KEY,
  game_date DATE NOT NULL,
  day_of_week VARCHAR(10) NOT NULL,
  stadium_name VARCHAR(100) NOT NULL,
  home_team VARCHAR(20) NOT NULL,
  home_team_name VARCHAR(50) NOT NULL,
  away_team VARCHAR(20) NOT NULL,
  away_team_name VARCHAR(50) NOT NULL,
  game_time TIME NOT NULL DEFAULT '18:30:00',
  home_team_rank INTEGER,
  away_team_rank INTEGER,
  season VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

## 5. 서비스 로직

### 5.1 경기장 서비스 (stadiumService)

#### getAllStadiums()
- DB의 `game_schedules` 테이블에서 실제 사용되는 경기장 목록 조회
- `teams.json` 파일과 매칭하여 경기장 상세 정보 보완

#### getGameDatesByStadium(stadiumName)
- 특정 경기장에 예정된 날짜 목록 조회
- DB의 `game_date` 컬럼을 기준으로 모든 날짜 반환 (중기예보 범위 제한 없음)
- 날짜별 경기 수 집계

#### getGameSchedulesByStadium(stadiumName)
- 특정 경기장의 모든 경기 일정 조회
- 날짜 및 시간 순 정렬
- DB 테이블 내용 그대로 반환

#### getGameScheduleByStadiumAndDate(stadiumName, date)
- 특정 경기장과 날짜의 경기 일정 조회
- 단일 경기 일정 반환

### 5.2 기상 서비스 (weatherService)

#### getWeatherForDate(regId, targetDate)
- 기상청 중기예보 API 호출
- 최신 발표 시각(06:00 또는 18:00) 자동 선택
- 날짜 범위 검증 (발표일 기준 3~10일 후)
- 기상 정보 파싱 및 반환

### 5.3 예측 서비스 (predictionService)

#### calculateCancelProbability(weather, stadiumType, isDome, gameTime)
- 우천 취소 확률 계산
- 요인별 점수 부여:
  - 강수 확률 (30%, 50%, 70% 기준)
  - 날씨 상태 (비/소나기, 흐림, 맑음)
  - 풍속 (10m/s 기준)
  - 경기장 유형 (천연 잔디 가중치)
- 돔 구장은 확률 0% (NONE)
- 확률 등급 결정: HIGH (≥60점), MEDIUM (≥35점), LOW (≥15점), NONE (<15점)

## 6. 프론트엔드 컴포넌트 구조

### 6.1 주요 컴포넌트

#### App.tsx
- 메인 애플리케이션 컴포넌트
- 상태 관리 (경기장, 날짜, 기상 정보, 경기 일정)
- API 호출 및 데이터 처리

#### StadiumSelector
- 경기장 선택 드롭다운

#### StadiumInfo
- 선택한 경기장 정보 표시

#### GameScheduleTable
- 경기장별 전체 경기 일정 테이블 표시
- 정렬 및 필터링 기능 (향후 추가 가능)

#### GameDateSelector
- 경기 날짜 선택 드롭다운
- 중기예보 범위 내 날짜만 표시

#### WeatherCard
- 기상 정보 및 우천 취소 예측 카드
- 상세 정보 토글 기능

## 7. 에러 처리

### 7.1 백엔드 에러 처리
- API 오류: 적절한 HTTP 상태 코드 및 에러 메시지 반환
- DB 오류: 로깅 후 에러 메시지 반환
- 외부 API 오류: 재시도 로직 (향후 추가)

### 7.2 프론트엔드 에러 처리
- API 호출 실패 시 사용자 친화적 에러 메시지 표시
- 네트워크 오류 시 재시도 옵션 제공 (향후 추가)

## 8. 환경 설정

### 8.1 백엔드 환경 변수 (.env)
```env
# 기상청 API
WEATHER_API_KEY=your_api_key_here
WEATHER_API_BASE_URL=http://apis.data.go.kr/1360000/MidFcstInfoService

# Database
DB_HOST=your_host
DB_PORT=6543
DB_NAME=postgres
DB_USER=your_user
DB_PASSWORD=your_password

# Server
PORT=3001
```

### 8.2 프론트엔드 환경 변수 (.env)
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 9. 보안

### 9.1 API 키 관리
- 환경 변수를 통한 API 키 관리
- 소스 코드에 하드코딩 금지

### 9.2 CORS 설정
- 백엔드에서 CORS 허용 설정
- 개발 환경: 모든 origin 허용
- 프로덕션: 특정 origin만 허용

## 10. 배포

### 10.1 빌드
- **프론트엔드**: `npm run build` (Vite)
- **백엔드**: `npm run build` (TypeScript 컴파일)

### 10.2 실행
- **프론트엔드**: `npm run dev` (개발), `npm run preview` (프로덕션 미리보기)
- **백엔드**: `npm run dev` (개발), `npm start` (프로덕션)

## 11. 테스트

### 11.1 테스트 전략
- 단위 테스트: 서비스 로직
- 통합 테스트: API 엔드포인트
- E2E 테스트: 주요 사용자 플로우 (향후 추가)

### 11.2 테스트 도구
- Jest (백엔드)
- React Testing Library (프론트엔드, 향후 추가)

## 12. 문서 변경 이력

### 버전 2.0 (2025-12-02)
- API 엔드포인트 변경: 구단 기반에서 경기장/날짜 기반으로 변경
- 경기장별 전체 경기 일정 조회 API 추가 (`GET /api/stadiums/:stadiumName/games`)
- 데이터 모델 업데이트
- 서비스 로직 업데이트

### 버전 1.0 (초기 버전)
- 구단 기반 7일 일괄 조회 API
- 기본 우천 취소 예측 로직
