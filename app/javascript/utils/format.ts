import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('ko');

// 날짜 포맷팅
export const formatDate = (date: string | Date, format: string = 'YYYY.MM.DD'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('YYYY.MM.DD HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

// 숫자 포맷팅
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ko-KR').format(num);
};

export const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${Math.floor(num / 100000) / 10}M`;
  }
  if (num >= 1000) {
    return `${Math.floor(num / 100) / 10}K`;
  }
  return num.toString();
};

// 텍스트 자르기 (한글 지원)
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const truncateByLines = (text: string, maxLines: number, charsPerLine: number = 50): string => {
  const maxChars = maxLines * charsPerLine;
  return truncateText(text, maxChars);
};

// 읽기 시간 계산 (한국어 기준: 분당 약 200-250자)
export const calculateReadTime = (content: string): number => {
  const charsPerMinute = 225; // 한국어 평균 읽기 속도
  const minutes = Math.ceil(content.length / charsPerMinute);
  return Math.max(1, minutes); // 최소 1분
};

// URL slug 생성
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 특수문자 제거
    .replace(/[\s_-]+/g, '-') // 공백을 하이픈으로
    .replace(/^-+|-+$/g, ''); // 앞뒤 하이픈 제거
};

// 이메일 마스킹
export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return email;
  
  const maskedLocal = localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1];
  return `${maskedLocal}@${domain}`;
};

// 파일 크기 포맷팅
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// HTML 태그 제거
export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

// 검색어 하이라이트
export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm.trim()) return text;
  
  const regex = new RegExp(searchTerm, 'gi');
  return text.replace(regex, `<mark>$&</mark>`);
};