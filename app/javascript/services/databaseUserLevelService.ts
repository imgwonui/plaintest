// DB 우선 사용자 레벨 시스템 관리 서비스
import { supabase } from '../lib/supabaseClient';
import { LEVEL_CONFIG as levelConfig, LevelUtils } from '../data/levelConfig';
import { userService, interactionService } from './supabaseDataService';
import { optimizedQueries, performanceMonitor } from '../lib/supabaseOptimizer';

const CACHE_KEYS = {
  USER_LEVELS: 'plain_user_levels_cache',
  LEVEL_CONFIG_OVERRIDE: 'plain_level_config_override'
};

export interface DatabaseUserLevelData {
  userId: string; // UUID 문자열 지원
  currentExp: number;
  level: number;
  lastLevelUp?: string;
  achievements: string[];
  stats: {
    totalLikes: number;
    storyPromotions: number;
    totalBookmarks: number;
    totalPosts: number;
    totalComments: number;
    excellentPosts: number;
  };
  lastSyncAt?: string;
}

class DatabaseUserLevelService {
  // 사용자 레벨 데이터 가져오기 (DB 우선, 세션 캐시 사용)
  async getUserLevel(userId: string): Promise<DatabaseUserLevelData> {
    try {
      console.log(`🔍 사용자 레벨 조회 시작: ${userId}`);
      
      // 1. 캐시에서 먼저 확인 (5분 이내 데이터만)
      const cached = this.getCachedUserLevel(userId);
      const now = Date.now();
      const cacheValidDuration = 5 * 60 * 1000; // 5분
      
      if (cached && cached.lastSyncAt) {
        const cacheTime = new Date(cached.lastSyncAt).getTime();
        if (now - cacheTime < cacheValidDuration) {
          console.log(`💨 캐시된 레벨 데이터 사용: ${userId} LV${cached.level}`);
          return cached;
        } else {
          console.log(`⏰ 캐시 만료됨: ${userId}, DB에서 새로 조회`);
        }
      }

      // 2. DB에서 사용자 레벨 데이터 조회 (직접 Supabase 쿼리)
      console.log(`🔍 DB에서 사용자 레벨 조회: ${userId}`);
      const startTime = Date.now();
      
      const { data: userLevels, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      const queryTime = Date.now() - startTime;
      console.log(`⏱️ DB 쿼리 시간: ${queryTime}ms`);
      performanceMonitor.recordQueryTime('getUserLevel', queryTime);
      
      let userData: DatabaseUserLevelData;
      
      if (error) {
        if (error.code === 'PGRST116') {
          // DB에 데이터가 없는 경우 새로 생성
          console.log(`❌ DB에 레벨 데이터 없음: ${userId}, 새로 생성 시도`);
          try {
            userData = await this.createNewUserLevel(userId);
            console.log(`✅ 새 레벨 데이터 생성 성공: ${userId} LV${userData.level}`);
          } catch (createError) {
            console.error(`❌ 새 레벨 데이터 생성 실패: ${userId}`, createError);
            // 생성 실패시 기본값 반환
            userData = this.getDefaultUserLevel(userId);
          }
        } else {
          console.error('getUserLevel DB 에러:', error);
          throw error;
        }
      } else if (userLevels) {
        // DB에 데이터가 있는 경우
        console.log(`📊 DB 조회 결과:`, userLevels);
        userData = {
          userId,
          currentExp: userLevels.current_exp || 0,
          level: userLevels.level || 1,
          lastLevelUp: userLevels.last_level_up,
          achievements: userLevels.achievements || [],
          stats: {
            totalLikes: userLevels.total_likes || 0,
            storyPromotions: userLevels.story_promotions || 0,
            totalBookmarks: userLevels.total_bookmarks || 0,
            totalPosts: userLevels.total_posts || 0,
            totalComments: userLevels.total_comments || 0,
            excellentPosts: userLevels.excellent_posts || 0,
          },
          lastSyncAt: new Date().toISOString()
        };
        
        console.log(`✅ DB에서 레벨 데이터 로드 완료: ${userId} LV${userData.level} (${userData.currentExp} EXP)`);
      } else {
        // 데이터가 없고 에러도 없는 경우 (이론적으로 발생하지 않아야 함)
        console.warn(`⚠️ 예상치 못한 상황: ${userId} - 데이터도 에러도 없음`);
        userData = this.getDefaultUserLevel(userId);
      }

      // 3. 캐시에 저장
      this.cacheUserLevel(userId, userData);
      
      return userData;
    } catch (error) {
      console.error('getUserLevel 실패:', error);
      
      // 에러 시 캐시된 데이터라도 반환
      const cached = this.getCachedUserLevel(userId);
      if (cached) {
        console.warn('⚠️ DB 실패, 캐시된 데이터 사용:', userId);
        return cached;
      }
      
      // 캐시도 없으면 기본값 반환
      return this.getDefaultUserLevel(userId);
    }
  }

  // 새 사용자 레벨 데이터 생성
  private async createNewUserLevel(userId: string): Promise<DatabaseUserLevelData> {
    console.log(`🆕 새 사용자 레벨 데이터 생성 시작: ${userId}`);
    
    const defaultData: DatabaseUserLevelData = {
      userId,
      currentExp: 0,
      level: 1,
      achievements: [],
      stats: {
        totalLikes: 0,
        storyPromotions: 0,
        totalBookmarks: 0,
        totalPosts: 0,
        totalComments: 0,
        excellentPosts: 0
      },
      lastSyncAt: new Date().toISOString()
    };

    try {
      // DB에 저장
      console.log(`💾 DB에 레벨 데이터 저장 시도: ${userId}`);
      await this.saveUserLevelToDB(defaultData);
      console.log(`✅ 새 사용자 레벨 데이터 DB 저장 완료: ${userId} LV${defaultData.level}`);
    } catch (error) {
      console.error('❌ 새 사용자 레벨 DB 저장 실패:', userId, error);
      throw error; // 에러를 다시 던져서 상위에서 처리하도록
    }

    return defaultData;
  }

  // 글로벌 캐시 무효화 (특정 사용자의 모든 레벨 캐시 삭제)
  invalidateAllUserCaches(userId: string): void {
    try {
      // 1. 해당 사용자의 레벨 캐시 무효화
      this.invalidateCache(userId);
      
      // 2. 브라우저 이벤트 발생 - 다른 컴포넌트들이 캐시를 새로 고칠 수 있도록
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('userCacheInvalidated', {
          detail: { userId, timestamp: Date.now() }
        }));
        console.log(`🗑️ 전역 캐시 무효화: ${userId}`);
      }
    } catch (error) {
      console.warn('전역 캐시 무효화 실패:', error);
    }
  }

  // 사용자 활동 업데이트 및 경험치 재계산
  async updateUserActivity(userId: string, forceRefresh: boolean = false): Promise<{ leveledUp: boolean; newLevel?: number; oldLevel?: number }> {
    try {
      console.log(`🔄 사용자 활동 업데이트 시작: ${userId}`);
      
      const userData = await this.getUserLevel(userId);
      const oldLevel = userData.level;
      const oldExp = userData.currentExp;

      // 실제 활동 통계 계산
      const actualStats = await this.calculateActualUserStats(userId);
      userData.stats = actualStats;
      
      // 새로운 경험치 계산
      const newExp = this.calculateTotalExp(actualStats);
      userData.currentExp = newExp;
      userData.level = LevelUtils.calculateLevel(newExp);
      userData.lastSyncAt = new Date().toISOString();

      // 레벨업 체크
      const leveledUp = userData.level > oldLevel;
      if (leveledUp) {
        userData.lastLevelUp = new Date().toISOString();
        console.log(`🎉 레벨업! ${userId}: LV${oldLevel} → LV${userData.level}`);
        this.triggerLevelUpEvent(userId, oldLevel, userData.level);
      }

      console.log(`📊 경험치 업데이트: ${userId}: ${oldExp} → ${newExp} EXP (LV${oldLevel} → LV${userData.level})`);

      // DB에 저장
      await this.saveUserLevelToDB(userData);
      
      // 캐시 업데이트
      this.cacheUserLevel(userId, userData);
      
      // 전역 캐시 무효화 (다른 컴포넌트들이 새로운 레벨을 반영할 수 있도록)
      this.invalidateAllUserCaches(userId);

      return {
        leveledUp,
        oldLevel,
        newLevel: leveledUp ? userData.level : undefined
      };
    } catch (error) {
      console.error('updateUserActivity 실패:', error);
      return { leveledUp: false };
    }
  }

  // 실제 사용자 활동 통계 계산 (DB에서 직접)
  private async calculateActualUserStats(userId: string): Promise<DatabaseUserLevelData['stats']> {
    try {
      console.log(`📊 실제 활동 통계 계산 중: ${userId}`);
      
      // 병렬로 모든 통계 조회 (각각 await로 처리)
      let userStories = [];
      let userLoungePosts = [];
      let userBookmarks = [];
      let userTotalLikes = 0;

      try {
        // 사용자가 작성한 Story 수
        const storiesResponse = await userService.getStoriesByAuthor(userId);
        userStories = storiesResponse?.stories || [];
        console.log(`📖 Story 조회 완료: ${userStories.length}개`);
      } catch (error) {
        console.error('Story 조회 실패:', error);
        userStories = [];
      }

      try {
        // 사용자가 작성한 Lounge 글 수  
        const loungeResponse = await userService.getLoungePostsByAuthor(userId);
        userLoungePosts = loungeResponse?.posts || [];
        console.log(`🏛️ Lounge 조회 완료: ${userLoungePosts.length}개`);
      } catch (error) {
        console.error('Lounge 조회 실패:', error);
        userLoungePosts = [];
      }

      try {
        // 사용자의 북마크 수
        userBookmarks = await interactionService.getUserBookmarks(userId) || [];
        console.log(`🔖 북마크 조회 완료: ${userBookmarks.length}개`);
      } catch (error) {
        console.error('북마크 조회 실패:', error);
        userBookmarks = [];
      }

      try {
        // 사용자가 받은 총 좋아요 수
        userTotalLikes = await this.calculateUserReceivedLikes(userId);
        console.log(`❤️ 받은 좋아요 조회 완료: ${userTotalLikes}개`);
      } catch (error) {
        console.error('좋아요 조회 실패:', error);
        userTotalLikes = 0;
      }

      const stats = {
        totalLikes: userTotalLikes,
        storyPromotions: userStories.length, // Story로 승격된 글 수
        totalBookmarks: userBookmarks.length,
        totalPosts: userStories.length + userLoungePosts.length,
        totalComments: 0, // 댓글 수는 별도 계산 필요시 추가
        excellentPosts: userLoungePosts.filter(post => (post.like_count || 0) >= 50).length
      };

      console.log(`✅ 실제 활동 통계 계산 완료: ${userId}`, stats);
      return stats;
    } catch (error) {
      console.error('calculateActualUserStats 실패:', error);
      return {
        totalLikes: 0,
        storyPromotions: 0,
        totalBookmarks: 0,
        totalPosts: 0,
        totalComments: 0,
        excellentPosts: 0
      };
    }
  }

  // 사용자가 받은 총 좋아요 수 계산
  private async calculateUserReceivedLikes(userId: string): Promise<number> {
    try {
      console.log(`❤️ 사용자가 받은 좋아요 수 계산 시작: ${userId}`);
      
      // 사용자의 모든 글 ID 수집 (개별 처리)
      let stories = [];
      let loungePosts = [];

      try {
        const storiesResponse = await userService.getStoriesByAuthor(userId);
        stories = storiesResponse?.stories || [];
      } catch (error) {
        console.error('좋아요 계산용 Story 조회 실패:', error);
        stories = [];
      }

      try {
        const loungeResponse = await userService.getLoungePostsByAuthor(userId);
        loungePosts = loungeResponse?.posts || [];
      } catch (error) {
        console.error('좋아요 계산용 Lounge 조회 실패:', error);
        loungePosts = [];
      }

      let totalLikes = 0;

      // 각 글의 좋아요 수 합계
      for (const story of stories) {
        const likeCount = await interactionService.getLikeCount(story.id, 'story');
        totalLikes += likeCount;
      }

      for (const post of loungePosts) {
        const likeCount = await interactionService.getLikeCount(post.id, 'lounge');
        totalLikes += likeCount;
      }

      return totalLikes;
    } catch (error) {
      console.error('calculateUserReceivedLikes 실패:', error);
      return 0;
    }
  }

  // 총 경험치 계산
  private calculateTotalExp(stats: DatabaseUserLevelData['stats']): number {
    const weights = levelConfig.scoreWeights;
    return (
      (stats.totalLikes * weights.likeReceived) +
      (stats.storyPromotions * weights.storyPromoted) +
      (stats.totalPosts * weights.postCreated) +
      (stats.totalComments * weights.commentCreated) +
      (stats.excellentPosts * weights.excellentPost) +
      (stats.totalBookmarks * weights.bookmarked)
    );
  }

  // DB에 사용자 레벨 데이터 저장
  private async saveUserLevelToDB(userData: DatabaseUserLevelData): Promise<void> {
    try {
      console.log(`💾 레벨 데이터 DB 저장 시도: ${userData.userId}`, userData);
      
      // Supabase upsert를 사용하여 데이터 저장/업데이트
      const { error } = await supabase
        .from('user_levels')
        .upsert({
          user_id: userData.userId,
          current_exp: userData.currentExp,
          level: userData.level,
          total_likes: userData.stats.totalLikes,
          story_promotions: userData.stats.storyPromotions,
          total_bookmarks: userData.stats.totalBookmarks,
          total_posts: userData.stats.totalPosts,
          total_comments: userData.stats.totalComments,
          excellent_posts: userData.stats.excellentPosts,
          achievements: userData.achievements,
          last_level_up: userData.lastLevelUp,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('💾 레벨 데이터 DB 저장 오류:', error);
        throw error;
      }
      
      console.log(`✅ 레벨 데이터 DB 저장 완료: ${userData.userId} LV${userData.level}`);
    } catch (error) {
      console.error('saveUserLevelToDB 실패:', error);
      throw error;
    }
  }

  // 레벨업 이벤트 발생
  private triggerLevelUpEvent(userId: string, oldLevel: number, newLevel: number): void {
    console.log(`🎊 레벨업 이벤트: ${userId} LV${oldLevel} → LV${newLevel}`);
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userLevelUp', {
        detail: { userId, oldLevel, newLevel, timestamp: Date.now() }
      }));
    }
  }

  // 캐시된 사용자 레벨 조회
  private getCachedUserLevel(userId: string): DatabaseUserLevelData | null {
    try {
      const cached = sessionStorage.getItem(`${CACHE_KEYS.USER_LEVELS}_${userId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('캐시 읽기 실패:', error);
      return null;
    }
  }

  // 사용자 레벨 캐시 저장
  private cacheUserLevel(userId: string, userData: DatabaseUserLevelData): void {
    try {
      sessionStorage.setItem(`${CACHE_KEYS.USER_LEVELS}_${userId}`, JSON.stringify(userData));
    } catch (error) {
      console.warn('캐시 저장 실패:', error);
    }
  }

  // 기본 사용자 레벨 데이터 반환
  private getDefaultUserLevel(userId: string): DatabaseUserLevelData {
    return {
      userId,
      currentExp: 0,
      level: 1,
      achievements: [],
      stats: {
        totalLikes: 0,
        storyPromotions: 0,
        totalBookmarks: 0,
        totalPosts: 0,
        totalComments: 0,
        excellentPosts: 0
      },
      lastSyncAt: new Date().toISOString()
    };
  }

  // 캐시 무효화
  invalidateCache(userId: string): void {
    try {
      sessionStorage.removeItem(`${CACHE_KEYS.USER_LEVELS}_${userId}`);
      console.log(`🗑️ 사용자 레벨 캐시 무효화: ${userId}`);
    } catch (error) {
      console.warn('캐시 무효화 실패:', error);
    }
  }

  // 캐시 무효화 이벤트 리스너
  onCacheInvalidated(callback: (data: { userId: string; timestamp: number }) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('userCacheInvalidated', handler as EventListener);
      
      return () => {
        window.removeEventListener('userCacheInvalidated', handler as EventListener);
      };
    }
    
    return () => {};
  }

  // 레벨업 이벤트 리스너
  onLevelUp(callback: (data: { userId: string; oldLevel: number; newLevel: number; timestamp: number }) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('userLevelUp', handler as EventListener);
      
      return () => {
        window.removeEventListener('userLevelUp', handler as EventListener);
      };
    }
    
    return () => {};
  }
}

// 싱글톤 인스턴스
export const databaseUserLevelService = new DatabaseUserLevelService();

// UUID 호환 헬퍼 함수들
export const getDatabaseUserLevel = async (userId: string) => {
  const userData = await databaseUserLevelService.getUserLevel(userId);
  return {
    level: userData.level,
    totalExp: userData.currentExp,
    tier: LevelUtils.getLevelTier(userData.level),
    displayText: `LV${userData.level}`
  };
};

export const trackDatabaseUserActivity = async (userId: string) => {
  return await databaseUserLevelService.updateUserActivity(userId, true);
};

export default databaseUserLevelService;