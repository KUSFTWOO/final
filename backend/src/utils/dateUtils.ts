/**
 * 날짜 변환 유틸리티 함수
 * PostgreSQL DATE 타입을 안전하게 문자열로 변환
 */

/**
 * PostgreSQL DATE 타입을 YYYY-MM-DD 형식 문자열로 변환
 * 시간대 문제를 방지하기 위해 로컬 시간대 기준으로 처리
 * 
 * @param dateValue PostgreSQL에서 반환된 날짜 값 (Date 객체 또는 문자열)
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
export function formatDateFromDB(dateValue: Date | string | null | undefined): string {
  if (!dateValue) {
    return '';
  }
  
  // 문자열인 경우 (PostgreSQL DATE가 문자열로 반환되는 경우)
  if (typeof dateValue === 'string') {
    // 이미 YYYY-MM-DD 형식이거나 ISO 형식일 경우
    const dateStr = dateValue.split('T')[0].split(' ')[0];
    
    // 유효성 검사
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    // 다른 형식인 경우 Date 객체로 변환 시도
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return formatDateLocal(parsed);
    }
    
    return dateStr;
  }
  
  // Date 객체인 경우 (PostgreSQL DATE가 Date 객체로 변환되는 경우)
  if (dateValue instanceof Date) {
    // 로컬 시간대 기준으로 날짜 추출 (시간대 변환 방지)
    return formatDateLocal(dateValue);
  }
  
  // 기타 타입인 경우 문자열로 변환 후 처리
  return String(dateValue).split('T')[0].split(' ')[0];
}

/**
 * Date 객체를 로컬 시간대 기준 YYYY-MM-DD 형식으로 변환
 * toISOString()을 사용하지 않아 시간대 변환 문제를 방지
 * 
 * @param date Date 객체
 * @returns YYYY-MM-DD 형식의 날짜 문자열
 */
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
