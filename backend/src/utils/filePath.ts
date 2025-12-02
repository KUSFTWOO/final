import path from 'path';
import * as fs from 'fs';

/**
 * 개발 환경과 빌드 환경에서 올바른 파일 경로를 반환하는 유틸리티 함수
 * 프로젝트 루트 기준으로 파일을 찾음
 */
export function getDataFilePath(relativePath: string): string {
  // __dirname은 실행 중인 파일의 디렉토리
  // ts-node 실행 시: backend/src/utils
  // 컴파일된 파일 실행 시: backend/dist/utils
  
  // 프로젝트 루트 찾기 (backend의 부모 디렉토리)
  // backend/src/utils -> backend/src -> backend -> 프로젝트 루트
  let currentDir = __dirname;
  
  // backend 경로 찾기
  const backendPattern = /backend[\/\\](src|dist)/;
  if (backendPattern.test(currentDir)) {
    // backend/src 또는 backend/dist에서 backend까지 이동
    const match = currentDir.match(/^(.*[\/\\]backend)[\/\\]/);
    if (match) {
      const backendDir = match[1];
      const projectRoot = path.resolve(backendDir, '..');
      const fullPath = path.join(projectRoot, relativePath);
      
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }
  
  // 대안 1: __dirname에서 직접 계산
  // backend/src/utils 또는 backend/dist/utils에서 시작
  const backendDir = path.resolve(__dirname, '..', '..');
  const projectRoot = path.resolve(backendDir, '..');
  const fullPath = path.join(projectRoot, relativePath);
  
  if (fs.existsSync(fullPath)) {
    return fullPath;
  }
  
  // 대안 2: backend 디렉토리 내에서 찾기
  const altPath = path.join(backendDir, relativePath);
  if (fs.existsSync(altPath)) {
    console.warn(`Using alternative path: ${altPath}`);
    return altPath;
  }
  
  // 대안 3: 현재 작업 디렉토리 기준
  const cwdPath = path.resolve(process.cwd(), relativePath);
  if (fs.existsSync(cwdPath)) {
    console.warn(`Using CWD path: ${cwdPath}`);
    return cwdPath;
  }
  
  // 디버깅 정보 출력
  console.error(`[getDataFilePath] File not found: ${relativePath}`);
  console.error(`  Searched paths:
  - ${fullPath}
  - ${altPath}
  - ${cwdPath}
  - __dirname: ${__dirname}
  - cwd: ${process.cwd()}`);
  
  // 최종적으로 프로젝트 루트 경로 반환 (에러는 호출하는 쪽에서 처리)
  return fullPath;
}
