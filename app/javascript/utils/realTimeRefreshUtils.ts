// 실시간 반영 최적화를 위한 유틸리티 함수들

export interface RefreshConfig {
  delay: number; // ms
  maxAttempts: number;
  retryInterval: number; // ms
}

export const DEFAULT_REFRESH_CONFIG: RefreshConfig = {
  delay: 1000, // 1초 후 새로고침
  maxAttempts: 3,
  retryInterval: 500 // 0.5초 간격으로 재시도
};

// 딜레이 후 페이지 새로고침 (최후의 수단)
export const delayedRefresh = (config: Partial<RefreshConfig> = {}): void => {
  const finalConfig = { ...DEFAULT_REFRESH_CONFIG, ...config };
  
  console.log(`⏰ ${finalConfig.delay}ms 후 페이지 새로고침 예정`);
  
  setTimeout(() => {
    console.log('🔄 페이지 새로고침 실행');
    window.location.reload();
  }, finalConfig.delay);
};

// 조건부 새로고침 (특정 조건이 만족되지 않을 때만)
export const conditionalRefresh = (
  checkCondition: () => boolean,
  config: Partial<RefreshConfig> = {}
): void => {
  const finalConfig = { ...DEFAULT_REFRESH_CONFIG, ...config };
  let attempts = 0;
  
  const checkAndRefresh = () => {
    attempts++;
    
    if (checkCondition()) {
      console.log('✅ 조건 만족됨, 새로고침 취소');
      return;
    }
    
    if (attempts >= finalConfig.maxAttempts) {
      console.log(`⚠️ ${finalConfig.maxAttempts}번 시도 후에도 조건 불만족, 강제 새로고침`);
      delayedRefresh({ delay: 0 });
      return;
    }
    
    console.log(`🔍 조건 확인 ${attempts}/${finalConfig.maxAttempts}, ${finalConfig.retryInterval}ms 후 재시도`);
    setTimeout(checkAndRefresh, finalConfig.retryInterval);
  };
  
  setTimeout(checkAndRefresh, finalConfig.delay);
};

// 사용자 활동 후 레벨 반영 확인 (특정 레벨 이상인지 체크)
export const ensureLevelReflected = (
  userId: string,
  expectedMinLevel: number = 1,
  config: Partial<RefreshConfig> = {}
): void => {
  const checkLevelReflection = (): boolean => {
    try {
      // DOM에서 레벨 뱃지 확인
      const levelBadges = document.querySelectorAll('[data-level-badge]');
      for (const badge of levelBadges) {
        const badgeUserId = badge.getAttribute('data-user-id');
        const badgeLevel = parseInt(badge.getAttribute('data-level') || '1');
        
        if (badgeUserId === userId && badgeLevel >= expectedMinLevel) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.warn('레벨 반영 확인 중 오류:', error);
      return false; // 확인 실패시 새로고침
    }
  };
  
  conditionalRefresh(checkLevelReflection, config);
};

// 댓글/글이 목록에 나타났는지 확인
export const ensureContentVisible = (
  contentId: string,
  selector: string = '[data-post-id], [data-comment-id]',
  config: Partial<RefreshConfig> = {}
): void => {
  const checkContentVisibility = (): boolean => {
    try {
      const elements = document.querySelectorAll(selector);
      for (const element of elements) {
        const elementId = element.getAttribute('data-post-id') || element.getAttribute('data-comment-id');
        if (elementId === contentId) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.warn('콘텐츠 가시성 확인 중 오류:', error);
      return false;
    }
  };
  
  conditionalRefresh(checkContentVisibility, config);
};

// 스마트 새로고침: 여러 조건을 함께 확인
export const smartRefresh = (
  conditions: Array<() => boolean>,
  config: Partial<RefreshConfig> = {}
): void => {
  const checkAllConditions = (): boolean => {
    return conditions.every(condition => {
      try {
        return condition();
      } catch (error) {
        console.warn('조건 확인 중 오류:', error);
        return false;
      }
    });
  };
  
  conditionalRefresh(checkAllConditions, config);
};

// 디버깅용: 현재 페이지의 레벨 뱃지 상태 로그
export const debugLevelBadges = (): void => {
  const badges = document.querySelectorAll('[data-level-badge]');
  console.log(`🔍 현재 페이지의 레벨 뱃지 ${badges.length}개:`);
  
  badges.forEach((badge, index) => {
    const userId = badge.getAttribute('data-user-id');
    const level = badge.getAttribute('data-level');
    const userName = badge.textContent || badge.getAttribute('data-user-name');
    
    console.log(`  ${index + 1}. ${userName} (${userId}): LV${level}`);
  });
};

export default {
  delayedRefresh,
  conditionalRefresh,
  ensureLevelReflected,
  ensureContentVisible,
  smartRefresh,
  debugLevelBadges,
  DEFAULT_REFRESH_CONFIG
};