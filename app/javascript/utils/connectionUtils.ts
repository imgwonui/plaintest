// 데이터베이스 연결 안정성을 위한 유틸리티 함수들
// Supabase 500 에러 및 연결 실패 문제 해결을 위한 재시도 메커니즘

export class ConnectionError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'ConnectionError';
  }
}

// 재시도 옵션 타입 정의
export interface RetryOptions {
  maxRetries?: number;           // 최대 재시도 횟수 (기본값: 3)
  baseDelay?: number;           // 기본 지연 시간 ms (기본값: 1000)
  maxDelay?: number;            // 최대 지연 시간 ms (기본값: 8000)
  exponentialBase?: number;     // 지수 백오프 배수 (기본값: 2)
  jitter?: boolean;             // 지연 시간에 랜덤성 추가 (기본값: true)
  onError?: (error: Error, attempt: number) => void;  // 에러 발생 시 콜백
  onRetry?: (attempt: number, delay: number) => void; // 재시도 시 콜백
}

// 지연 시간 함수
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 네트워크/연결 에러 판별 함수
export const isConnectionError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code || error.status || 0;
  
  // HTTP 상태 코드 기반 판별
  if (errorCode >= 500 && errorCode < 600) {
    console.log('🔄 서버 에러 감지 (5xx):', errorCode);
    return true;
  }
  
  // 네트워크 관련 에러 메시지 패턴
  const connectionPatterns = [
    'network error',
    'fetch failed',
    'failed to fetch',
    'connection refused',
    'connection timeout',
    'request timeout',
    'server error',
    'internal server error',
    'bad gateway',
    'service unavailable',
    'gateway timeout',
    'connection reset',
    'connection aborted',
    'connection lost'
  ];
  
  const isNetworkError = connectionPatterns.some(pattern => 
    errorMessage.includes(pattern)
  );
  
  if (isNetworkError) {
    console.log('🔄 네트워크 에러 감지:', errorMessage);
    return true;
  }
  
  // Supabase 특정 에러 패턴
  if (errorMessage.includes('supabase') || errorMessage.includes('postgrest')) {
    console.log('🔄 Supabase 연결 에러 감지:', errorMessage);
    return true;
  }
  
  return false;
};

// 재시도 불가능한 에러 판별
export const isNonRetryableError = (error: any): boolean => {
  const errorCode = error.code || error.status || 0;
  
  // 클라이언트 에러 (4xx)는 재시도하지 않음
  if (errorCode >= 400 && errorCode < 500) {
    console.log('❌ 재시도 불가능한 클라이언트 에러:', errorCode);
    return true;
  }
  
  // 인증 관련 에러
  const authErrors = ['unauthorized', 'forbidden', 'authentication failed'];
  const errorMessage = error.message?.toLowerCase() || '';
  
  if (authErrors.some(pattern => errorMessage.includes(pattern))) {
    console.log('❌ 재시도 불가능한 인증 에러:', errorMessage);
    return true;
  }
  
  return false;
};

// Exponential backoff를 사용한 재시도 함수
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 8000,
    exponentialBase = 2,
    jitter = true,
    onError,
    onRetry
  } = options;
  
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      console.log(`🔄 API 호출 시도 ${attempt}/${maxRetries + 1}`);
      const result = await fn();
      
      // 성공 시 로그
      if (attempt > 1) {
        console.log(`✅ ${attempt}번째 시도에서 성공!`);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // 에러 콜백 호출
      onError?.(lastError, attempt);
      
      // 마지막 시도였다면 에러를 던짐
      if (attempt > maxRetries) {
        console.error(`❌ ${maxRetries + 1}번 모두 실패:`, lastError.message);
        throw lastError;
      }
      
      // 재시도 불가능한 에러는 즉시 실패
      if (!isConnectionError(lastError) || isNonRetryableError(lastError)) {
        console.error('❌ 재시도 불가능한 에러:', lastError.message);
        throw lastError;
      }
      
      // 지연 시간 계산 (exponential backoff + jitter)
      const exponentialDelay = Math.min(
        baseDelay * Math.pow(exponentialBase, attempt - 1),
        maxDelay
      );
      
      const finalDelay = jitter 
        ? exponentialDelay + Math.random() * 1000  // 최대 1초 랜덤 추가
        : exponentialDelay;
      
      console.warn(`⏳ ${Math.round(finalDelay)}ms 후 재시도... (${attempt}/${maxRetries})`);
      
      // 재시도 콜백 호출
      onRetry?.(attempt, finalDelay);
      
      // 지연 후 재시도
      await sleep(finalDelay);
    }
  }
  
  // 여기까지 도달하면 안 되지만, 타입 안전성을 위해
  throw lastError;
};

// 연결 상태 확인 함수 (간단한 health check)
export const checkConnectionHealth = async (
  testFn: () => Promise<any>,
  timeoutMs: number = 5000
): Promise<boolean> => {
  try {
    console.log('🔍 연결 상태 확인 중...');
    
    // 타임아웃과 함께 테스트 함수 실행
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('연결 확인 타임아웃')), timeoutMs)
    );
    
    await Promise.race([testFn(), timeoutPromise]);
    
    console.log('✅ 연결 상태 양호');
    return true;
  } catch (error) {
    console.warn('⚠️ 연결 상태 불량:', error);
    return false;
  }
};

// 마지막으로 알려진 좋은 데이터 관리
export class LastKnownGoodDataManager {
  private static storageKey = 'plain_last_known_good_data';
  
  // 성공적인 데이터 저장
  static save(key: string, data: any): void {
    try {
      const stored = this.getAll();
      stored[key] = {
        data,
        timestamp: Date.now(),
        version: '1.0'
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(stored));
      console.log(`💾 마지막 성공 데이터 저장: ${key}`);
    } catch (error) {
      console.warn('마지막 성공 데이터 저장 실패:', error);
    }
  }
  
  // 마지막 성공 데이터 조회
  static get(key: string, maxAgeMs: number = 24 * 60 * 60 * 1000): any | null {
    try {
      const stored = this.getAll();
      const item = stored[key];
      
      if (!item) return null;
      
      // 만료 시간 확인
      const age = Date.now() - item.timestamp;
      if (age > maxAgeMs) {
        console.log(`⏰ 마지막 성공 데이터 만료: ${key} (${Math.round(age / 1000 / 60)}분 전)`);
        return null;
      }
      
      console.log(`🔄 마지막 성공 데이터 사용: ${key} (${Math.round(age / 1000 / 60)}분 전)`);
      return item.data;
    } catch (error) {
      console.warn('마지막 성공 데이터 조회 실패:', error);
      return null;
    }
  }
  
  // 모든 저장된 데이터 조회
  private static getAll(): Record<string, any> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.warn('저장된 데이터 파싱 실패:', error);
      return {};
    }
  }
  
  // 특정 키의 데이터 삭제
  static remove(key: string): void {
    try {
      const stored = this.getAll();
      delete stored[key];
      localStorage.setItem(this.storageKey, JSON.stringify(stored));
      console.log(`🗑️ 마지막 성공 데이터 삭제: ${key}`);
    } catch (error) {
      console.warn('데이터 삭제 실패:', error);
    }
  }
  
  // 모든 데이터 삭제
  static clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('🗑️ 모든 마지막 성공 데이터 삭제');
    } catch (error) {
      console.warn('데이터 전체 삭제 실패:', error);
    }
  }
  
  // 저장된 데이터 통계
  static getStats(): { keys: string[], totalSize: number, oldestAge: number } {
    try {
      const stored = this.getAll();
      const keys = Object.keys(stored);
      const now = Date.now();
      
      let oldestAge = 0;
      let totalSize = 0;
      
      for (const key of keys) {
        const age = now - stored[key].timestamp;
        oldestAge = Math.max(oldestAge, age);
        totalSize += JSON.stringify(stored[key]).length;
      }
      
      return { keys, totalSize, oldestAge };
    } catch (error) {
      return { keys: [], totalSize: 0, oldestAge: 0 };
    }
  }
}

// 개발용 디버깅 도구
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).PlainConnection = {
    retryWithBackoff,
    checkConnectionHealth,
    isConnectionError,
    isNonRetryableError,
    lastKnownData: LastKnownGoodDataManager,
    
    // 연결 테스트 도구
    testConnection: async () => {
      console.log('🧪 연결 안정성 테스트 시작...');
      
      // 간단한 테스트 함수
      const testFn = async () => {
        const response = await fetch('https://httpbin.org/status/200');
        if (!response.ok) throw new Error('테스트 실패');
        return 'OK';
      };
      
      try {
        await retryWithBackoff(testFn, {
          maxRetries: 3,
          onError: (error, attempt) => console.log(`❌ 시도 ${attempt} 실패:`, error.message),
          onRetry: (attempt, delay) => console.log(`⏳ ${delay}ms 후 ${attempt + 1}번째 재시도`)
        });
        
        console.log('✅ 연결 테스트 성공!');
      } catch (error) {
        console.error('❌ 연결 테스트 실패:', error);
      }
    },
    
    info: () => console.log(`
🔗 Plain 연결 안정성 도구

사용 가능한 명령어:
- PlainConnection.testConnection()           : 연결 테스트 실행
- PlainConnection.lastKnownData.getStats()   : 저장된 데이터 통계
- PlainConnection.lastKnownData.clear()      : 저장된 데이터 삭제

주요 기능:
✅ Exponential backoff 재시도 (최대 3회)
✅ 네트워크/서버 에러 자동 감지
✅ 마지막 성공 데이터 로컬 저장
✅ 재시도 불가능한 에러 구분
✅ 연결 상태 모니터링

에러 처리 전략:
- 500번대 서버 에러: 자동 재시도
- 네트워크 에러: 자동 재시도  
- 4xx 클라이언트 에러: 재시도 하지 않음
- 인증 에러: 재시도 하지 않음

재시도 지연 시간:
- 1회: 1초 + 랜덤
- 2회: 2초 + 랜덤  
- 3회: 4초 + 랜덤
- 최대: 8초
    `)
  };
  
  console.log('🔗 Plain 연결 안정성 도구 활성화! PlainConnection.info() 입력으로 도움말 확인');
}

export default {
  retryWithBackoff,
  checkConnectionHealth,
  isConnectionError,
  isNonRetryableError,
  LastKnownGoodDataManager,
  ConnectionError,
  sleep
};