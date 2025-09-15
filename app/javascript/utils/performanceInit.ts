// 성능 최적화 시스템 초기화
// 앱 시작 시 캐시 시스템과 디버그 도구를 활성화합니다.

export const initializePerformanceSystem = () => {
  // 개발 환경에서만 실행
  if (process.env.NODE_ENV !== 'development') return;

  console.log('🚀 Plain 성능 최적화 시스템 초기화 중...');

  // 캐시 시스템 전역 접근 활성화
  import('../services/cacheService').then(({ cacheService }) => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.PlainCache = {
        // 캐시 통계
        stats: () => cacheService.getStats(),
        
        // 캐시 클리어
        clear: () => {
          cacheService.clear();
          console.log('🧹 캐시가 모두 삭제되었습니다.');
        },
        
        // 개별 캐시 무효화
        invalidateStories: () => {
          cacheService.invalidatePattern('stories:');
          console.log('📚 스토리 캐시가 무효화되었습니다.');
        },
        
        invalidateLounge: () => {
          cacheService.invalidatePattern('lounge:');
          console.log('🏛️ 라운지 캐시가 무효화되었습니다.');
        },
        
        // 디버그 정보
        info: () => console.log(`
⚡ Plain 캐시 디버그 도구

사용 가능한 명령어:
- PlainCache.stats()           : 캐시 통계 확인
- PlainCache.clear()           : 전체 캐시 삭제
- PlainCache.invalidateStories() : 스토리 캐시 무효화
- PlainCache.invalidateLounge()  : 라운지 캐시 무효화

성능 개선 현황:
✅ 메모리 캐싱 시스템 활성화
✅ 스켈레톤 UI 적용
✅ 최적화된 데이터 서비스 사용
✅ 배치 처리 활성화

로딩 속도가 여전히 느린 경우:
1. PlainCache.clear() - 캐시 초기화
2. 브라우저 새로고침
3. 네트워크 상태 확인
        `)
      };
      
      console.log('🎮 PlainCache 디버그 도구가 활성화되었습니다!');
      console.log('💡 PlainCache.info() 명령어로 도움말을 확인하세요.');
    }
  });

  // 최적화된 데이터 서비스 전역 접근
  import('../services/optimizedDataService').then((optimizedService) => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.PlainOptimized = {
        ...optimizedService.default,
        
        // 성능 테스트 도구
        testPerformance: async () => {
          console.log('🧪 성능 테스트 시작...');
          
          const startTime = performance.now();
          
          try {
            // 스토리 목록 로드 테스트
            const storyStart = performance.now();
            await optimizedService.optimizedStoryService.getAll(1, 10);
            const storyEnd = performance.now();
            
            // 라운지 목록 로드 테스트
            const loungeStart = performance.now();
            await optimizedService.optimizedLoungeService.getAll(1, 10);
            const loungeEnd = performance.now();
            
            const totalTime = performance.now() - startTime;
            
            console.log(`
📊 성능 테스트 결과:
- 스토리 목록: ${(storyEnd - storyStart).toFixed(2)}ms
- 라운지 목록: ${(loungeEnd - loungeStart).toFixed(2)}ms
- 총 소요 시간: ${totalTime.toFixed(2)}ms

🎯 목표: 각 API 호출당 200ms 미만
${storyEnd - storyStart < 200 ? '✅' : '❌'} 스토리 로딩 속도
${loungeEnd - loungeStart < 200 ? '✅' : '❌'} 라운지 로딩 속도
            `);
            
          } catch (error) {
            console.error('❌ 성능 테스트 실패:', error);
          }
        },
        
        info: () => console.log(`
⚡ Plain 최적화 서비스 디버그 도구

사용 가능한 명령어:
- PlainOptimized.testPerformance() : 성능 테스트 실행
- PlainOptimized.story.getAll()    : 최적화된 스토리 조회
- PlainOptimized.lounge.getAll()   : 최적화된 라운지 조회

성능 최적화 기능:
✅ 메모리 캐싱 (30초~1시간 TTL)
✅ 배치 요청 처리 (50ms 지연 후 묶어서 처리)
✅ 프리로딩 (관련 데이터 미리 로드)
✅ 스켈레톤 UI (체감 성능 향상)
        `)
      };
      
      console.log('⚡ PlainOptimized 디버그 도구가 활성화되었습니다!');
    }
  });

  console.log('✅ Plain 성능 최적화 시스템이 준비되었습니다!');
};

// 성능 모니터링
export const trackPerformance = (operation: string, startTime: number) => {
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // 느린 작업 감지
  if (duration > 1000) {
    console.warn(`🐌 느린 작업 감지: ${operation} - ${duration.toFixed(2)}ms`);
  } else if (duration > 500) {
    console.log(`⏱️ 보통 작업: ${operation} - ${duration.toFixed(2)}ms`);
  } else {
    console.log(`⚡ 빠른 작업: ${operation} - ${duration.toFixed(2)}ms`);
  }
  
  return duration;
};