// 사용자 레벨 시스템 관리 서비스
import { LEVEL_CONFIG as levelConfig, LevelUtils } from '../data/levelConfig';

const STORAGE_KEYS = {
  USER_LEVELS: 'plain_user_levels',
  LEVEL_CONFIG_OVERRIDE: 'plain_level_config_override'
};

export interface UserLevelData {
  userId: number;
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
}

class UserLevelService {
  // 사용자 레벨 데이터 가져오기
  getUserLevel(userId: number): UserLevelData {
    const allLevels = this.getAllUserLevels();
    
    if (!allLevels[userId]) {
      // 새 사용자 기본 데이터 생성
      const defaultData: UserLevelData = {
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
        }
      };
      
      this.saveUserLevel(userId, defaultData);
      return defaultData;
    }
    
    return allLevels[userId];
  }

  // 사용자 활동 업데이트 및 경험치 계산 (세션 데이터 기반)
  updateUserActivity(userId: number, activityType: string, amount: number = 1): { leveledUp: boolean; newLevel?: number } {
    const userData = this.getUserLevel(userId);
    const oldExp = userData.currentExp;
    const oldLevel = userData.level;

    // 사용자 활동 스탯을 세션 데이터에서 직접 계산
    const actualStats = this.calculateUserStatsFromSession(userId);
    userData.stats = actualStats;
    
    // 새로운 경험치 계산
    userData.currentExp = LevelUtils.calculateUserExp(userData.stats);
    userData.level = LevelUtils.calculateLevel(userData.currentExp);

    // 레벨업 체크
    if (userData.level > oldLevel) {
      userData.lastLevelUp = new Date().toISOString();
      
      // 레벨업 이벤트 발생
      this.triggerLevelUpEvent(userId, oldLevel, userData.level);
    }

    this.saveUserLevel(userId, userData);
    
    return {
      leveledUp: userData.level > oldLevel,
      newLevel: userData.level > oldLevel ? userData.level : undefined
    };
  }

  // 사용자 경험치 직접 설정 (관리자용)
  setUserExp(userId: number, exp: number): void {
    const userData = this.getUserLevel(userId);
    const oldLevel = userData.level;
    
    userData.currentExp = exp;
    userData.level = LevelUtils.calculateLevel(exp);
    
    if (userData.level !== oldLevel) {
      userData.lastLevelUp = new Date().toISOString();
    }
    
    this.saveUserLevel(userId, userData);
  }

  // 레벨별 랭킹 가져오기 (세션 데이터 기반)
  getLevelRankings(limit: number = 10): UserLevelData[] {
    // 모든 사용자 래벨 업데이트 먼저
    this.syncAllUserLevels();
    
    const allLevels = this.getAllUserLevels();
    
    return Object.values(allLevels)
      .sort((a, b) => {
        if (a.level !== b.level) {
          return b.level - a.level; // 레벨 높은 순
        }
        return b.currentExp - a.currentExp; // 같은 레벨이면 경험치 높은 순
      })
      .slice(0, limit);
  }

  // 레벨 티어별 사용자 수 통계 (세션 데이터 기반)
  getLevelDistribution(): Record<string, number> {
    // 모든 사용자 래벨 업데이트 먼저
    this.syncAllUserLevels();
    
    const allLevels = this.getAllUserLevels();
    const currentConfig = this.getCurrentLevelConfig();
    const distribution: Record<string, number> = {};
    
    currentConfig.tiers.forEach(tier => {
      const tierName = tier.name;
      distribution[tierName] = 0;
      
      Object.values(allLevels).forEach(userData => {
        if (userData.level >= tier.minLevel && userData.level <= tier.maxLevel) {
          distribution[tierName]++;
        }
      });
    });
    
    return distribution;
  }

  // 업적 체크 및 부여
  checkAchievements(userId: number): string[] {
    const userData = this.getUserLevel(userId);
    const newAchievements: string[] = [];
    
    levelConfig.achievements.forEach(achievement => {
      if (userData.achievements.includes(achievement.id)) {
        return; // 이미 달성한 업적
      }
      
      let achieved = false;
      const condition = achievement.condition;
      
      switch (condition.type) {
        case 'posts':
          achieved = userData.stats.totalPosts >= condition.count;
          break;
        case 'likes':
          achieved = userData.stats.totalLikes >= condition.count;
          break;
        case 'promoted':
          achieved = userData.stats.storyPromotions >= condition.count;
          break;
        case 'comments':
          achieved = userData.stats.totalComments >= condition.count;
          break;
      }
      
      if (achieved) {
        userData.achievements.push(achievement.id);
        newAchievements.push(achievement.id);
        
        // 업적 보상 경험치 추가
        userData.currentExp += achievement.reward;
        userData.level = LevelUtils.calculateLevel(userData.currentExp);
      }
    });
    
    if (newAchievements.length > 0) {
      this.saveUserLevel(userId, userData);
    }
    
    return newAchievements;
  }

  // 레벨업 이벤트 처리
  private triggerLevelUpEvent(userId: number, oldLevel: number, newLevel: number): void {
    // 레벨업 이벤트 (나중에 알림 시스템과 연동)
    console.log(`🎉 사용자 ${userId}가 LV${oldLevel}에서 LV${newLevel}로 레벨업했습니다!`);
    
    // 커스텀 이벤트 발생
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userLevelUp', {
        detail: { userId, oldLevel, newLevel, timestamp: Date.now() }
      }));
    }
  }

  // 레벨업 이벤트 리스너 등록 (React 컴포넌트에서 사용)
  public onLevelUp(callback: (data: { userId: number; oldLevel: number; newLevel: number; timestamp: number }) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('userLevelUp', handler as EventListener);
      
      // 클린업 함수 반환
      return () => {
        window.removeEventListener('userLevelUp', handler as EventListener);
      };
    }
    
    return () => {}; // 서버 사이드에서는 빈 함수 반환
  }

  // 활동 유형별 경험치 변화량 계산 (레벨업 모달에서 사용)
  public getActivityExpGain(activityType: string, amount: number = 1): number {
    const weights = levelConfig.scoreWeights;
    
    switch (activityType) {
      case 'likeReceived': return weights.likeReceived * amount;
      case 'storyPromoted': return weights.storyPromoted * amount;
      case 'bookmarked': return weights.bookmarked * amount;
      case 'postCreated': return weights.postCreated * amount;
      case 'commentCreated': return weights.commentCreated * amount;
      case 'excellentPost': return weights.excellentPost * amount;
      default: return 0;
    }
  }

  // 모든 사용자 레벨 데이터 가져오기
  private getAllUserLevels(): Record<number, UserLevelData> {
    const stored = sessionStorage.getItem(STORAGE_KEYS.USER_LEVELS);
    return stored ? JSON.parse(stored) : {};
  }

  // 사용자 레벨 데이터 저장
  private saveUserLevel(userId: number, userData: UserLevelData): void {
    const allLevels = this.getAllUserLevels();
    allLevels[userId] = userData;
    sessionStorage.setItem(STORAGE_KEYS.USER_LEVELS, JSON.stringify(allLevels));
  }

  // 관리자용: 레벨 설정 오버라이드
  updateLevelConfig(newConfig: Partial<typeof levelConfig>): void {
    const currentOverride = this.getLevelConfigOverride();
    const updatedOverride = { ...currentOverride, ...newConfig };
    sessionStorage.setItem(STORAGE_KEYS.LEVEL_CONFIG_OVERRIDE, JSON.stringify(updatedOverride));
  }

  // 현재 레벨 설정 가져오기 (오버라이드 적용)
  getCurrentLevelConfig(): typeof levelConfig {
    const override = this.getLevelConfigOverride();
    return { ...levelConfig, ...override };
  }

  // 레벨 설정 오버라이드 가져오기
  private getLevelConfigOverride(): Partial<typeof levelConfig> {
    const stored = sessionStorage.getItem(STORAGE_KEYS.LEVEL_CONFIG_OVERRIDE);
    return stored ? JSON.parse(stored) : {};
  }

  // 모든 사용자 레벨을 1로 초기화
  resetAllLevels(): void {
    sessionStorage.removeItem(STORAGE_KEYS.USER_LEVELS);
  }

  // 사용자 이름으로 ID 매핑 (임시 구현)
  private getUserIdByName(authorName: string): number {
    const userMapping: Record<string, number> = {
      'Plain Team': 1,
      '월급날 에디터': 2,
      '박인사': 3,
      '이중재': 4,
      '신입HR김씨': 5,
      '원격근무성공담': 6,
      '채용달인': 7,
      '휴가관리고민': 8,
      '승진심사경험자': 9,
      '급여협상고민': 10,
      '소통개선러': 11,
      '인사평가고민': 12,
      '버디시스템운영자': 13,
      '재택근무고민': 14
    };
    
    return userMapping[authorName] || Math.floor(Math.random() * 100) + 15;
  }

  // 모든 사용자의 레벨 정보를 세션 데이터 기반으로 동기화
  syncAllUserLevels(): void {
    const getSessionData = <T>(key: string): T[] => {
      try {
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : [];
      } catch (error) {
        return [];
      }
    };
    
    // 모든 활동 사용자 ID 수집
    const activeUserIds = new Set<number>();
    
    const currentUser = JSON.parse(sessionStorage.getItem('plain_current_user') || 'null');
    if (currentUser) {
      activeUserIds.add(currentUser.id);
    }
    
    // Story, Lounge, Comment 작성자들 ID 수집
    const stories = getSessionData('plain_session_stories');
    const loungePosts = getSessionData('plain_session_lounge_posts');
    const comments = getSessionData('plain_session_comments');
    
    [...stories, ...loungePosts].forEach((item: any) => {
      if (item.author) {
        const userId = this.getUserIdByName(item.author);
        activeUserIds.add(userId);
      }
    });
    
    comments.forEach((comment: any) => {
      if (!comment.isGuest && comment.author) {
        const userId = this.getUserIdByName(comment.author);
        activeUserIds.add(userId);
      }
    });
    
    // 모든 활동 사용자들의 레벨 데이터 업데이트
    Array.from(activeUserIds).forEach(userId => {
      this.updateUserActivity(userId, 'refresh', 0);
    });
    
    console.log(`🔄 ${activeUserIds.size}명의 사용자 레벨 데이터가 동기화되었습니다.`);
  }

  // 데이터 초기화 (개발용)
  resetAllData(): void {
    sessionStorage.removeItem(STORAGE_KEYS.USER_LEVELS);
    sessionStorage.removeItem(STORAGE_KEYS.LEVEL_CONFIG_OVERRIDE);
  }

  // 사용자 이름으로 매핑 (임시 구현)
  private getUserNameById(userId: number): string {
    const currentUser = JSON.parse(sessionStorage.getItem('plain_current_user') || 'null');
    if (currentUser && currentUser.id === userId) {
      return currentUser.name;
    }
    
    // 사용자 이름 매핑 (sessionUserService와 일치)
    const userMapping: Record<number, string> = {
      1: 'Plain Team',
      2: '월급날 에디터',
      3: '박인사',
      4: '이중재',
      5: '신입HR김씨',
      6: '원격근무성공담',
      7: '채용달인',
      8: '휴가관리고민',
      9: '승진심사경험자',
      10: '급여협상고민',
      11: '소통개선러',
      12: '인사평가고민',
      13: '버디시스템운영자',
      14: '재택근무고민'
    };
    
    return userMapping[userId] || `사용자${userId}`;
  }

  // 세션 데이터에서 사용자 활동 통계 계산
  private calculateUserStatsFromSession(userId: number): UserLevelData['stats'] {
    // 세션 스토리지에서 데이터 가져오기
    const stories = JSON.parse(sessionStorage.getItem('plain_session_stories') || '[]');
    const loungePosts = JSON.parse(sessionStorage.getItem('plain_session_lounge_posts') || '[]');
    const comments = JSON.parse(sessionStorage.getItem('plain_session_comments') || '[]');
    const likes = JSON.parse(sessionStorage.getItem('plain_session_likes') || '[]');
    const scraps = JSON.parse(sessionStorage.getItem('plain_session_scraps') || '[]');
    
    // 사용자 이름 찾기
    const userName = this.getUserNameById(userId);

    // 해당 사용자의 작성한 글 수
    const userStories = stories.filter((story: any) => story.author === userName);
    const userLoungePosts = loungePosts.filter((post: any) => post.author === userName);
    
    // 사용자의 글에 달린 댓글 수
    const userComments = comments.filter((comment: any) => comment.author === userName && !comment.isGuest);
    
    // 사용자가 받은 좋아요 수 (내 글에 달린)
    const userPostIds = [
      ...userStories.map((s: any) => ({ id: s.id, type: 'story' })),
      ...userLoungePosts.map((p: any) => ({ id: p.id, type: 'lounge' }))
    ];
    
    let totalLikes = 0;
    userPostIds.forEach(post => {
      const postLikes = likes.filter((like: any) => 
        like.postId === post.id && like.postType === post.type
      );
      totalLikes += postLikes.length;
    });
    
    // Story 승격 수 (isVerified가 true인 사용자 작성 글)
    const storyPromotions = userStories.filter((story: any) => story.isVerified).length;
    
    // 북마크 수 (내 글에 달린)
    let totalBookmarks = 0;
    userPostIds.forEach(post => {
      const postScraps = scraps.filter((scrap: any) => 
        scrap.postId === post.id && scrap.postType === post.type
      );
      totalBookmarks += postScraps.length;
    });
    
    // 우수 글 수 (좋아요 50개 이상인 Lounge 글)
    const excellentPosts = userLoungePosts.filter((post: any) => (post.likeCount || 0) >= 50).length;

    return {
      totalLikes,
      storyPromotions,
      totalBookmarks,
      totalPosts: userStories.length + userLoungePosts.length,
      totalComments: userComments.length,
      excellentPosts
    };
  }

  // 사용자별 활동 통계 요약
  getUserActivitySummary(userId: number) {
    // 실제 세션 데이터로 업데이트
    this.updateUserActivity(userId, 'refresh', 0); // 스탯 새로고침
    
    const userData = this.getUserLevel(userId);
    const tier = LevelUtils.getLevelTier(userData.level);
    const progress = LevelUtils.getLevelProgress(userData.currentExp);
    const expToNext = LevelUtils.getExpToNextLevel(userData.currentExp);

    return {
      ...userData,
      tier,
      progressPercentage: progress,
      expToNextLevel: expToNext,
      isMaxLevel: userData.level >= 99
    };
  }
}

// 싱글톤 인스턴스 생성
export const userLevelService = new UserLevelService();

// 헬퍼 함수들
export const getUserDisplayLevel = (userId: number) => {
  const userData = userLevelService.getUserLevel(userId);
  return {
    level: userData.level,
    totalExp: userData.currentExp,
    tier: LevelUtils.getLevelTier(userData.level),
    displayText: `LV${userData.level}`
  };
};

export const trackUserActivity = (userId: number, activityType: string, amount?: number) => {
  return userLevelService.updateUserActivity(userId, activityType, amount);
};

export default userLevelService;