import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase 연결 설정
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://tbmlxkbdugppyxpzpatx.supabase.co'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRibWx4a2JkdWdwcHl4cHpwYXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczODgyNjcsImV4cCI6MjA3Mjk2NDI2N30.cpO3YykJ0RV4bbsAy_zvBn9zaM54R-qtTfaoR1Nymtg'

// 🚀 성능 최적화된 Supabase 클라이언트 설정
let supabaseInstance: SupabaseClient | null = null;

const createOptimizedSupabaseClient = (): SupabaseClient => {
  if (supabaseInstance) {
    console.log('💨 기존 Supabase 클라이언트 재사용');
    return supabaseInstance;
  }

  console.log('🔧 새로운 최적화된 Supabase 클라이언트 생성');
  
  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    // 🔥 연결 풀 최적화 설정
    db: {
      schema: 'public',
    },
    auth: {
      // 인증 토큰 자동 갱신 및 지속성 설정
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce' // 보안 강화
    },
    realtime: {
      // Realtime 연결 최적화 (필요시에만 활성화)
      params: {
        eventsPerSecond: 10 // 초당 이벤트 제한
      },
    },
    global: {
      // HTTP 요청 최적화
      headers: {
        'x-client-info': 'plain-app@1.0.0',
        'Cache-Control': 'max-age=300', // 5분 캐시
        'Accept': 'application/json',  // ✅ 406 에러 방지용 Accept 헤더 추가
        'Content-Type': 'application/json'
      },
      fetch: (url, options = {}) => {
        // 요청 시간 초과 설정 (10초)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        return fetch(url, {
          ...options,
          signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
      }
    }
  });

  return supabaseInstance;
};

// 싱글톤 패턴으로 클라이언트 생성
export const supabase = createOptimizedSupabaseClient();

// 🔄 연결 상태 모니터링
let connectionMonitor: NodeJS.Timeout | null = null;

export const startConnectionMonitoring = () => {
  if (connectionMonitor) return; // 이미 모니터링 중
  
  console.log('📊 Supabase 연결 모니터링 시작');
  connectionMonitor = setInterval(async () => {
    try {
      const { error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        console.warn('⚠️ Supabase 연결 상태 확인 실패:', error.message);
      } else {
        console.log('✅ Supabase 연결 정상');
      }
    } catch (err) {
      console.error('❌ Supabase 연결 모니터링 오류:', err);
    }
  }, 60000); // 1분마다 연결 상태 확인
};

export const stopConnectionMonitoring = () => {
  if (connectionMonitor) {
    clearInterval(connectionMonitor);
    connectionMonitor = null;
    console.log('🛑 Supabase 연결 모니터링 중지');
  }
};

// 🧹 정리 함수 (앱 종료 시 호출)
export const cleanupSupabaseConnection = () => {
  stopConnectionMonitoring();
  if (supabaseInstance) {
    // Realtime 연결 정리
    supabaseInstance.removeAllChannels();
    supabaseInstance = null;
    console.log('🧹 Supabase 연결 정리 완료');
  }
};