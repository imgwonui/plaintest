// 사용자 레벨 시스템 설정
export const LEVEL_CONFIG = {
  // 레벨 구간별 설정 (관리자가 수정 가능)
  levelTierSettings: [
    {
      name: '초급 인사담당자',
      levels: [1, 10],
      baseExp: 0,
      expIncrement: 8,  // 레벨당 증가량
      expMultiplier: 1.1, // 지수적 증가
      description: '쉬운 레벨업으로 빠른 성장'
    },
    {
      name: '숙련 인사담당자',
      levels: [11, 20], 
      baseExp: 80,
      expIncrement: 25,
      expMultiplier: 1.15,
      description: '조금 더 많은 경험치 필요'
    },
    {
      name: '전문 인사담당자',
      levels: [21, 30],
      baseExp: 350,
      expIncrement: 50,
      expMultiplier: 1.2,
      description: '전문성 향상을 위한 노력'
    },
    {
      name: '시니어 인사담당자',
      levels: [31, 50],
      baseExp: 950,
      expIncrement: 100,
      expMultiplier: 1.25,
      description: '리더십 발휘를 위한 도전'
    },
    {
      name: '인사 전문가',
      levels: [51, 70],
      baseExp: 3200,
      expIncrement: 200,
      expMultiplier: 1.3,
      description: '전문가로서의 깊이 있는 활동'
    },
    {
      name: '인사 마스터',
      levels: [71, 89],
      baseExp: 8500,
      expIncrement: 400,
      expMultiplier: 1.35,
      description: '마스터 레벨을 향한 험난한 여정'
    },
    {
      name: '인사 레전드',
      levels: [90, 99],
      baseExp: 25000,
      expIncrement: 1000,
      expMultiplier: 1.5,
      description: '전설이 되기 위한 극한의 도전'
    }
  ],

  // 활동 점수 계산 기준
  scoreWeights: {
    likeReceived: 2,      // 받은 좋아요 × 2점
    storyPromoted: 50,    // Story로 승격 × 50점
    bookmarked: 5,        // 북마크 × 5점
    postCreated: 3,       // 글 작성 × 3점
    commentCreated: 1,    // 댓글 작성 × 1점
    excellentPost: 20     // 우수 글 선정 × 20점
  },

  // 레벨 티어별 정보
  levelTiers: [
    {
      range: [1, 10],
      name: '초급 인사담당자',
      description: '인사업무를 배워가는 단계',
      color: '#68D391',    // green.300
      iconType: 'seedling'
    },
    {
      range: [11, 20], 
      name: '숙련 인사담당자',
      description: '기본적인 인사업무를 수행하는 단계',
      color: '#4FD1C7',    // teal.300
      iconType: 'leaf'
    },
    {
      range: [21, 30],
      name: '전문 인사담당자',
      description: '다양한 인사업무를 전문적으로 수행',
      color: '#63B3ED',    // blue.300
      iconType: 'tree'
    },
    {
      range: [31, 50],
      name: '시니어 인사담당자',
      description: '팀을 이끌며 전략적 인사업무 수행',
      color: '#9F7AEA',    // purple.300
      iconType: 'mountain'
    },
    {
      range: [51, 70],
      name: '인사 전문가',
      description: '조직 전체의 인사전략을 기획하고 실행',
      color: '#F6AD55',    // orange.300
      iconType: 'star'
    },
    {
      range: [71, 89],
      name: '인사 마스터',
      description: '인사 분야의 최고 전문가로 업계를 선도',
      color: '#EC407A',    // pink.400
      iconType: 'diamond'
    },
    {
      range: [90, 99],
      name: '인사 레전드',
      description: '전설적인 인사전문가, 커뮤니티의 리더',
      color: '#FFD700',    // gold
      iconType: 'crown',
      special: true        // 특별한 효과
    }
  ],

  // 티어 정보 (AdminLevels 페이지용)
  tiers: [
    {
      minLevel: 1,
      maxLevel: 10,
      name: '초급 인사담당자',
      description: '인사업무를 배워가는 단계',
      color: '#68D391',
      iconType: 'seedling'
    },
    {
      minLevel: 11,
      maxLevel: 20,
      name: '숙련 인사담당자', 
      description: '기본적인 인사업무를 수행하는 단계',
      color: '#4FD1C7',
      iconType: 'leaf'
    },
    {
      minLevel: 21,
      maxLevel: 30,
      name: '전문 인사담당자',
      description: '다양한 인사업무를 능숙하게 처리',
      color: '#63B3ED',
      iconType: 'tree'
    },
    {
      minLevel: 31,
      maxLevel: 50,
      name: '시니어 인사담당자',
      description: '깊이 있는 인사전문지식을 보유',
      color: '#9F7AEA',
      iconType: 'mountain'
    },
    {
      minLevel: 51,
      maxLevel: 70,
      name: '인사 전문가',
      description: '인사 분야의 전문가로 인정받는 단계',
      color: '#F6AD55',
      iconType: 'star'
    },
    {
      minLevel: 71,
      maxLevel: 89,
      name: '인사 마스터',
      description: '인사 분야의 최고 전문가로 업계를 선도',
      color: '#EC407A',
      iconType: 'diamond'
    },
    {
      minLevel: 90,
      maxLevel: 99,
      name: '인사 레전드',
      description: '전설적인 인사전문가, 커뮤니티의 리더',
      color: '#FFD700',
      iconType: 'crown',
      special: true
    }
  ],

  // 업적 시스템 (향후 확장 가능)
  achievements: [
    {
      id: 'first_post',
      name: '첫 걸음',
      description: '첫 번째 글을 작성했어요',
      condition: { type: 'posts', count: 1 },
      reward: 10
    },
    {
      id: 'popular_writer',
      name: '인기 작성자',
      description: '좋아요를 100개 받았어요',
      condition: { type: 'likes', count: 100 },
      reward: 50
    },
    {
      id: 'story_master',
      name: 'Story 마스터',
      description: '글이 Story로 5번 승격되었어요',
      condition: { type: 'promoted', count: 5 },
      reward: 100
    },
    {
      id: 'community_helper',
      name: '커뮤니티 도우미',
      description: '댓글을 100개 작성했어요',
      condition: { type: 'comments', count: 100 },
      reward: 30
    }
  ]
};

// 편의를 위한 레벨 설정 단축 참조
export const levelConfig = LEVEL_CONFIG;

// 레벨 계산 및 유틸리티 함수들
export class LevelUtils {
  // 구간별 설정으로 동적으로 레벨별 경험치 테이블 생성
  static generateLevelRequirements(): Record<number, number> {
    const requirements: Record<number, number> = {};
    
    LEVEL_CONFIG.levelTierSettings.forEach(tierSetting => {
      const [startLevel, endLevel] = tierSetting.levels;
      let currentExp = tierSetting.baseExp;
      
      for (let level = startLevel; level <= endLevel; level++) {
        requirements[level] = Math.floor(currentExp);
        
        // 다음 레벨까지의 경험치 계산 (지수적 증가)
        const levelInTier = level - startLevel + 1;
        const nextLevelExp = tierSetting.expIncrement * Math.pow(tierSetting.expMultiplier, levelInTier - 1);
        currentExp += nextLevelExp;
      }
    });
    
    return requirements;
  }

  // 경험치로 레벨 계산
  static calculateLevel(totalExp: number): number {
    const requirements = this.generateLevelRequirements();
    let level = 1;
    
    for (let lv = 1; lv <= 99; lv++) {
      if (totalExp >= requirements[lv]) {
        level = lv;
      } else {
        break;
      }
    }
    return level;
  }

  // 특정 레벨에 필요한 경험치
  static getRequiredExpForLevel(level: number): number {
    if (level < 1) return 0;
    const requirements = this.generateLevelRequirements();
    if (level > 99) return requirements[99] || 0;
    return requirements[level] || 0;
  }

  // 구간별 설정 가져오기
  static getLevelTierSetting(level: number) {
    return LEVEL_CONFIG.levelTierSettings.find(tierSetting => 
      level >= tierSetting.levels[0] && level <= tierSetting.levels[1]
    );
  }

  // 사용자 활동 통계로 총 경험치 계산
  static calculateUserExp(stats: {
    totalPosts: number;
    totalComments: number;
    totalLikes: number;
    storyPromotions: number;
    totalBookmarks: number;
    excellentPosts: number;
  }): number {
    const weights = LEVEL_CONFIG.scoreWeights;
    
    return (
      stats.totalPosts * weights.postCreated +
      stats.totalComments * weights.commentCreated +
      stats.totalLikes * weights.likeReceived +
      stats.storyPromotions * weights.storyPromoted +
      stats.totalBookmarks * weights.bookmarked +
      stats.excellentPosts * weights.excellentPost
    );
  }

  // 레벨 티어 정보 가져오기
  static getLevelTier(level: number) {
    return LEVEL_CONFIG.levelTiers.find(tier => 
      level >= tier.range[0] && level <= tier.range[1]
    );
  }

  // 레벨업 체크 (이전 경험치와 현재 경험치 비교)
  static checkLevelUp(oldExp: number, newExp: number): {
    leveledUp: boolean;
    oldLevel: number;
    newLevel: number;
  } {
    const oldLevel = this.calculateLevel(oldExp);
    const newLevel = this.calculateLevel(newExp);
    
    return {
      leveledUp: newLevel > oldLevel,
      oldLevel,
      newLevel
    };
  }

  // 다음 레벨까지 필요한 경험치
  static getExpToNextLevel(currentExp: number): number {
    const currentLevel = this.calculateLevel(currentExp);
    if (currentLevel >= 99) return 0;
    
    const nextLevelExp = this.getRequiredExpForLevel(currentLevel + 1);
    return nextLevelExp - currentExp;
  }

  // 현재 레벨에서의 진행률 (0-100%)
  static getLevelProgress(currentExp: number): number {
    const currentLevel = this.calculateLevel(currentExp);
    if (currentLevel >= 99) return 100;
    
    const currentLevelExp = this.getRequiredExpForLevel(currentLevel);
    const nextLevelExp = this.getRequiredExpForLevel(currentLevel + 1);
    
    if (nextLevelExp <= currentLevelExp) return 100;
    
    const progress = ((currentExp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
    return Math.max(0, Math.min(100, progress));
  }
}