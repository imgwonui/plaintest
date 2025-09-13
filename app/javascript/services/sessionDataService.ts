// 세션 스토리지 기반 데이터 관리 서비스
// API 연결 전 완전한 기능 구현

const STORAGE_KEYS = {
  STORIES: 'plain_session_stories',
  LOUNGE_POSTS: 'plain_session_lounge_posts', 
  COMMENTS: 'plain_session_comments',
  SCRAPS: 'plain_session_scraps',
  LIKES: 'plain_session_likes',
  SEARCH_KEYWORDS: 'plain_session_search_keywords',
  PROMOTION_REQUESTS: 'plain_session_promotion_requests',
  INITIALIZED: 'plain_session_initialized',
  CURRENT_USER: 'plain_current_user'
};

// 기본 초기 데이터 (최소한만 유지)
const getInitialData = () => ({
  stories: [
    {
      id: 1,
      title: "Plain에 오신 것을 환영합니다",
      author: "Plain Team",
      summary: "Plain은 인사담당자들을 위한 새로운 정보 공유 플랫폼입니다.",
      content: `# Plain에 오신 것을 환영합니다

Plain은 인사담당자들을 위한 정보 공유와 커뮤니티 플랫폼입니다.

## 주요 기능

### Story
전문가가 검수한 인사 관련 콘텐츠를 제공합니다.

### Lounge  
인사담당자들이 실무 경험과 노하우를 자유롭게 공유하는 공간입니다.

지금 바로 글을 작성해보세요!`,
      imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
      tags: ["Plain", "환영", "시작"],
      createdAt: new Date().toISOString(),
      readTime: 2,
      likeCount: 0,
      scrapCount: 0,
      viewCount: 0,
      isVerified: true
    }
  ],
  loungePosts: [],
  comments: [],
  scraps: [],
  likes: [],
  promotionRequests: [],
  searchKeywords: [
    { keyword: "채용", count: 15, lastSearched: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    { keyword: "연봉", count: 12, lastSearched: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { keyword: "조직문화", count: 8, lastSearched: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
    { keyword: "인사평가", count: 6, lastSearched: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
    { keyword: "복리후생", count: 4, lastSearched: new Date(Date.now() - 1000 * 60 * 10).toISOString() }
  ]
});

// 세션 데이터 초기화 (한 번만 실행)
const initializeSessionData = () => {
  if (!sessionStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
    const initialData = getInitialData();
    sessionStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(initialData.stories));
    sessionStorage.setItem(STORAGE_KEYS.LOUNGE_POSTS, JSON.stringify(initialData.loungePosts));
    sessionStorage.setItem(STORAGE_KEYS.COMMENTS, JSON.stringify(initialData.comments));
    sessionStorage.setItem(STORAGE_KEYS.SCRAPS, JSON.stringify(initialData.scraps));
    sessionStorage.setItem(STORAGE_KEYS.LIKES, JSON.stringify(initialData.likes));
    sessionStorage.setItem(STORAGE_KEYS.PROMOTION_REQUESTS, JSON.stringify(initialData.promotionRequests));
    sessionStorage.setItem(STORAGE_KEYS.SEARCH_KEYWORDS, JSON.stringify(initialData.searchKeywords));
    sessionStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    console.log('🎉 Plain 데이터가 초기화되었습니다. 실제 글쓰기를 시작하세요!');
  }
};

// 세션에서 데이터 가져오기
const getSessionData = <T>(key: string): T[] => {
  try {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`세션 데이터 로드 실패 (${key}):`, error);
    return [];
  }
};

// 세션에 데이터 저장하기
const setSessionData = <T>(key: string, data: T[]): void => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`세션 데이터 저장 실패 (${key}):`, error);
  }
};

// 현재 사용자 정보 관리
export const sessionUserService = {
  getCurrentUser() {
    try {
      const userData = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: any) {
    sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  },

  clearCurrentUser() {
    sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // 사용자 이름으로 사용자 정보 조회 (현재 로그인된 사용자만 반환)
  getUserByName(name: string) {
    const currentUser = this.getCurrentUser();
    return currentUser && currentUser.name === name ? currentUser : null;
  },
  
  // 사용자 이름으로 ID 매핑 (임시 구현)
  getUserIdByName(authorName: string): number {
    // 실제 구현에서는 데이터베이스에서 조회해야 함
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
    
    return userMapping[authorName] || Math.floor(Math.random() * 100) + 15; // 기본값
  },

  // 모든 사용자 조회 (임시 - 실제로는 API에서 가져와야 함)
  getAllUsers() {
    // 현재 사용자만 반환 (다른 사용자 정보는 세션에 저장하지 않음)
    const currentUser = this.getCurrentUser();
    return currentUser ? [currentUser] : [];
  },

  // 실제 활동 기록이 있는 사용자들 조회 (세션 기반)
  getAll() {
    const currentUser = this.getCurrentUser();
    const activeUsers = new Set<number>();
    const userProfiles: Record<number, any> = {};
    
    // 현재 사용자 추가
    if (currentUser) {
      activeUsers.add(currentUser.id);
      userProfiles[currentUser.id] = {
        ...currentUser,
        createdAt: currentUser.createdAt || new Date().toISOString()
      };
    }
    
    // Story 작성자들 수집
    const stories = getSessionData(STORAGE_KEYS.STORIES);
    stories.forEach((story: any) => {
      const authorId = this.getUserIdByName(story.author);
      activeUsers.add(authorId);
      if (!userProfiles[authorId]) {
        userProfiles[authorId] = {
          id: authorId,
          name: story.author,
          email: `user${authorId}@plain.com`,
          createdAt: story.createdAt || new Date().toISOString(),
          isAdmin: false,
          isVerified: story.isVerified || false
        };
      }
    });
    
    // Lounge 포스트 작성자들 수집
    const loungePosts = getSessionData(STORAGE_KEYS.LOUNGE_POSTS);
    loungePosts.forEach((post: any) => {
      const authorId = this.getUserIdByName(post.author);
      activeUsers.add(authorId);
      if (!userProfiles[authorId]) {
        userProfiles[authorId] = {
          id: authorId,
          name: post.author,
          email: `user${authorId}@plain.com`,
          createdAt: post.createdAt || new Date().toISOString(),
          isAdmin: false,
          isVerified: false
        };
      }
    });
    
    // 댓글 작성자들 수집
    const comments = getSessionData(STORAGE_KEYS.COMMENTS);
    comments.forEach((comment: any) => {
      if (!comment.isGuest && comment.author) {
        const authorId = this.getUserIdByName(comment.author);
        activeUsers.add(authorId);
        if (!userProfiles[authorId]) {
          userProfiles[authorId] = {
            id: authorId,
            name: comment.author,
            email: `user${authorId}@plain.com`,
            createdAt: comment.createdAt || new Date().toISOString(),
            isAdmin: false,
            isVerified: false
          };
        }
      }
    });
    
    return Array.from(activeUsers).map(id => userProfiles[id]).filter(Boolean);
  }
};

// Stories 관련 서비스
export const sessionStoryService = {
  // 모든 스토리 조회
  getAll() {
    initializeSessionData();
    return getSessionData(STORAGE_KEYS.STORIES);
  },

  // 특정 스토리 조회
  getById(id: number) {
    const stories = this.getAll();
    return stories.find((story: any) => story.id === id);
  },

  // 스토리 생성
  create(storyData: any) {
    const stories = this.getAll();
    const newStory = {
      id: Math.max(...stories.map((s: any) => s.id), 0) + 1,
      likeCount: 0,
      scrapCount: 0,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      ...storyData, // storyData를 나중에 spread해서 전달받은 isVerified 값을 유지
    };
    
    const updatedStories = [newStory, ...stories];
    setSessionData(STORAGE_KEYS.STORIES, updatedStories);
    
    // 레벨 시스템: Story 작성 활동 추적
    try {
      const { userLevelService } = require('../services/userLevelService');
      const authorId = sessionUserService.getUserIdByName(newStory.author);
      userLevelService.updateUserActivity(authorId, 'post_created', 1);
      
      // Story가 인증되었을 경우 Story 승격 추가 활동
      if (newStory.isVerified) {
        userLevelService.updateUserActivity(authorId, 'story_promoted', 1);
      }
    } catch (error) {
      // 레벨 시스템 에러는 무시
    }
    
    console.log('✨ 새 스토리가 생성되었습니다:', newStory.title);
    return newStory;
  },

  // 좋아요 수 업데이트
  updateLikeCount(id: number, count: number) {
    const stories = this.getAll();
    const updatedStories = stories.map((story: any) => 
      story.id === id ? { ...story, likeCount: Math.max(0, count) } : story
    );
    setSessionData(STORAGE_KEYS.STORIES, updatedStories);
    return updatedStories.find((s: any) => s.id === id);
  },

  // 북마크 수 업데이트
  updateScrapCount(id: number, count: number) {
    const stories = this.getAll();
    const updatedStories = stories.map((story: any) => 
      story.id === id ? { ...story, scrapCount: Math.max(0, count) } : story
    );
    setSessionData(STORAGE_KEYS.STORIES, updatedStories);
    return updatedStories.find((s: any) => s.id === id);
  },

  // 조회수 증가
  incrementViewCount(id: number) {
    const stories = this.getAll();
    const updatedStories = stories.map((story: any) => 
      story.id === id ? { ...story, viewCount: (story.viewCount || 0) + 1 } : story
    );
    setSessionData(STORAGE_KEYS.STORIES, updatedStories);
    return updatedStories.find((s: any) => s.id === id);
  },

  // 북마크 수 증가
  incrementScrapCount(id: number) {
    const stories = this.getAll();
    const updatedStories = stories.map((story: any) => 
      story.id === id ? { ...story, scrapCount: (story.scrapCount || 0) + 1 } : story
    );
    setSessionData(STORAGE_KEYS.STORIES, updatedStories);
    return updatedStories.find((s: any) => s.id === id);
  },

  // 북마크 수 감소
  decrementScrapCount(id: number) {
    const stories = this.getAll();
    const updatedStories = stories.map((story: any) => 
      story.id === id ? { ...story, scrapCount: Math.max(0, (story.scrapCount || 0) - 1) } : story
    );
    setSessionData(STORAGE_KEYS.STORIES, updatedStories);
    return updatedStories.find((s: any) => s.id === id);
  },

  // 스토리 수정
  update(id: number, updateData: any) {
    const stories = this.getAll();
    const updatedStories = stories.map((story: any) => 
      story.id === id ? { 
        ...story, 
        ...updateData, 
        updatedAt: new Date().toISOString() 
      } : story
    );
    setSessionData(STORAGE_KEYS.STORIES, updatedStories);
    const updatedStory = updatedStories.find((s: any) => s.id === id);
    console.log('✨ 스토리가 수정되었습니다:', updatedStory?.title);
    return updatedStory;
  },

  // 스토리 삭제
  delete(id: number) {
    const stories = this.getAll();
    const storyToDelete = stories.find((s: any) => s.id === id);
    if (!storyToDelete) return false;
    
    const updatedStories = stories.filter((story: any) => story.id !== id);
    setSessionData(STORAGE_KEYS.STORIES, updatedStories);
    
    // 관련 댓글도 삭제
    const comments = getSessionData(STORAGE_KEYS.COMMENTS);
    const updatedComments = comments.filter((comment: any) => 
      !(comment.postId === id && comment.postType === 'story')
    );
    setSessionData(STORAGE_KEYS.COMMENTS, updatedComments);
    
    // 관련 북마크도 삭제
    const scraps = getSessionData(STORAGE_KEYS.SCRAPS);
    const updatedScraps = scraps.filter((scrap: any) => 
      !(scrap.postId === id && scrap.postType === 'story')
    );
    setSessionData(STORAGE_KEYS.SCRAPS, updatedScraps);
    
    // 관련 좋아요도 삭제
    const likes = getSessionData(STORAGE_KEYS.LIKES);
    const updatedLikes = likes.filter((like: any) => 
      !(like.postId === id && like.postType === 'story')
    );
    setSessionData(STORAGE_KEYS.LIKES, updatedLikes);
    
    console.log('🗑️ 스토리가 삭제되었습니다:', storyToDelete.title);
    return true;
  }
};

// Lounge Posts 관련 서비스
export const sessionLoungeService = {
  // 모든 라운지 포스트 조회
  getAll() {
    initializeSessionData();
    return getSessionData(STORAGE_KEYS.LOUNGE_POSTS);
  },

  // 인기 포스트 조회 (좋아요 50개 이상)
  getPopular() {
    const posts = this.getAll();
    return posts.filter((post: any) => post.likeCount >= 50);
  },

  // 특정 라운지 포스트 조회
  getById(id: number) {
    const posts = this.getAll();
    return posts.find((post: any) => post.id === id);
  },

  // 라운지 포스트 생성
  create(postData: any) {
    const posts = this.getAll();
    const newPost = {
      ...postData,
      id: Math.max(...posts.map((p: any) => p.id), 0) + 1,
      likeCount: 0,
      scrapCount: 0,
      commentCount: 0,
      isExcellent: false,
      rewardClaimed: false,
      promotionStatus: null, // null, 'eligible', 'pending', 'approved', 'rejected'
      promotionNote: '',
      createdAt: new Date().toISOString()
    };
    
    const updatedPosts = [newPost, ...posts];
    setSessionData(STORAGE_KEYS.LOUNGE_POSTS, updatedPosts);
    
    // 레벨 시스템: Lounge 글 작성 활동 추적
    try {
      const { userLevelService } = require('../services/userLevelService');
      const authorId = sessionUserService.getUserIdByName(newPost.author);
      userLevelService.updateUserActivity(authorId, 'post_created', 1);
    } catch (error) {
      // 레벨 시스템 에러는 무시
    }
    
    console.log('🎯 새 라운지 글이 작성되었습니다:', newPost.title);
    return newPost;
  },

  // 좋아요 수 업데이트
  updateLikeCount(id: number, count: number) {
    const posts = this.getAll();
    const updatedPosts = posts.map((post: any) => {
      if (post.id === id) {
        const oldCount = post.likeCount || 0;
        const newCount = Math.max(0, count);
        const wasExcellent = post.isExcellent || false;
        const wasEligible = post.promotionStatus === 'eligible';
        
        // 50개 이상이면 우수 글로 자동 승격
        const isExcellent = newCount >= 50;
        
        // Story 승격 자격 체크 (정보팁공유 또는 뉴스한마디 + 50개 이상 좋아요)
        let promotionStatus = post.promotionStatus;
        let promotionNote = post.promotionNote || '';
        
        if (isExcellent && !wasEligible && (post.type === '정보팁공유' || post.type === '뉴스한마디')) {
          promotionStatus = 'eligible';
          promotionNote = '좋아요 50개 달성! Story 승격 자격을 갖추었어요.';
          
          // 자동으로 승격 요청 생성
          setTimeout(() => {
            try {
              sessionPromotionService.createRequest(post.id, 'lounge', '좋아요 50개 달성으로 자동 승격 요청');
              
              // 글 상태를 pending으로 업데이트
              const posts = sessionLoungeService.getAll();
              const updatedPosts = posts.map((p: any) => {
                if (p.id === post.id) {
                  return {
                    ...p,
                    promotionStatus: 'pending',
                    promotionNote: 'Story 승격 심사 중'
                  };
                }
                return p;
              });
              setSessionData(STORAGE_KEYS.LOUNGE_POSTS, updatedPosts);
            } catch (error) {
              console.log('승격 요청 생성 에러:', error);
            }
          }, 100);
        }
        
        // 우수 글로 새로 승격된 경우 레벨 시스템 업데이트
        if (!wasExcellent && isExcellent && post.author) {
          try {
            const { userLevelService } = require('../services/userLevelService');
            const authorId = sessionUserService.getUserIdByName(post.author);
            userLevelService.updateUserActivity(authorId, 'excellent_post', 1);
          } catch (error) {
            // 레벨 시스템 에러는 무시
          }
        }
        
        return { ...post, likeCount: newCount, isExcellent, promotionStatus, promotionNote };
      }
      return post;
    });
    setSessionData(STORAGE_KEYS.LOUNGE_POSTS, updatedPosts);
    return updatedPosts.find((p: any) => p.id === id);
  },

  // 북마크 수 업데이트
  updateScrapCount(id: number, count: number) {
    const posts = this.getAll();
    const updatedPosts = posts.map((post: any) => 
      post.id === id ? { ...post, scrapCount: Math.max(0, count) } : post
    );
    setSessionData(STORAGE_KEYS.LOUNGE_POSTS, updatedPosts);
    return updatedPosts.find((p: any) => p.id === id);
  },

  // 댓글 수 업데이트
  updateCommentCount(id: number, count: number) {
    const posts = this.getAll();
    const updatedPosts = posts.map((post: any) => 
      post.id === id ? { ...post, commentCount: Math.max(0, count) } : post
    );
    setSessionData(STORAGE_KEYS.LOUNGE_POSTS, updatedPosts);
    return updatedPosts.find((p: any) => p.id === id);
  },

  // 북마크 수 증가
  incrementScrapCount(id: number) {
    const posts = this.getAll();
    const updatedPosts = posts.map((post: any) => 
      post.id === id ? { ...post, scrapCount: (post.scrapCount || 0) + 1 } : post
    );
    setSessionData(STORAGE_KEYS.LOUNGE_POSTS, updatedPosts);
    return updatedPosts.find((p: any) => p.id === id);
  },

  // 북마크 수 감소
  decrementScrapCount(id: number) {
    const posts = this.getAll();
    const updatedPosts = posts.map((post: any) => 
      post.id === id ? { ...post, scrapCount: Math.max(0, (post.scrapCount || 0) - 1) } : post
    );
    setSessionData(STORAGE_KEYS.LOUNGE_POSTS, updatedPosts);
    return updatedPosts.find((p: any) => p.id === id);
  },

  // 라운지 포스트 수정
  update(id: number, updateData: any) {
    const posts = this.getAll();
    const updatedPosts = posts.map((post: any) => 
      post.id === id ? { 
        ...post, 
        ...updateData, 
        updatedAt: new Date().toISOString() 
      } : post
    );
    setSessionData(STORAGE_KEYS.LOUNGE_POSTS, updatedPosts);
    const updatedPost = updatedPosts.find((p: any) => p.id === id);
    console.log('✨ 라운지 포스트가 수정되었습니다:', updatedPost?.title);
    return updatedPost;
  },

  // 라운지 포스트 삭제
  delete(id: number) {
    const posts = this.getAll();
    const postToDelete = posts.find((p: any) => p.id === id);
    if (!postToDelete) return false;
    
    const updatedPosts = posts.filter((post: any) => post.id !== id);
    setSessionData(STORAGE_KEYS.LOUNGE_POSTS, updatedPosts);
    
    // 관련 댓글도 삭제
    const comments = getSessionData(STORAGE_KEYS.COMMENTS);
    const updatedComments = comments.filter((comment: any) => 
      !(comment.postId === id && comment.postType === 'lounge')
    );
    setSessionData(STORAGE_KEYS.COMMENTS, updatedComments);
    
    // 관련 북마크도 삭제
    const scraps = getSessionData(STORAGE_KEYS.SCRAPS);
    const updatedScraps = scraps.filter((scrap: any) => 
      !(scrap.postId === id && scrap.postType === 'lounge')
    );
    setSessionData(STORAGE_KEYS.SCRAPS, updatedScraps);
    
    // 관련 좋아요도 삭제
    const likes = getSessionData(STORAGE_KEYS.LIKES);
    const updatedLikes = likes.filter((like: any) => 
      !(like.postId === id && like.postType === 'lounge')
    );
    setSessionData(STORAGE_KEYS.LIKES, updatedLikes);
    
    console.log('🗑️ 라운지 포스트가 삭제되었습니다:', postToDelete.title);
    return true;
  }
};

// Comments 관련 서비스
export const sessionCommentService = {
  // 특정 포스트의 댓글 조회
  getByPost(postId: number, postType: 'story' | 'lounge') {
    initializeSessionData();
    const comments = getSessionData(STORAGE_KEYS.COMMENTS);
    return comments.filter((comment: any) => 
      comment.postId === postId && comment.postType === postType
    );
  },
  
  // 특정 포스트의 댓글을 계층구조로 조회 (대댓글 포함)
  getByPostHierarchical(postId: number, postType: 'story' | 'lounge') {
    const allComments = this.getByPost(postId, postType);
    
    // 최상위 댓글 (parentId가 없는 댓글)
    const rootComments = allComments.filter((comment: any) => !comment.parentId);
    
    // 각 최상위 댓글에 대댓글 추가
    return rootComments.map((rootComment: any) => ({
      ...rootComment,
      replies: allComments.filter((comment: any) => comment.parentId === rootComment.id)
        .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    })).sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  // 댓글 생성
  create(commentData: any) {
    const comments = getSessionData(STORAGE_KEYS.COMMENTS);
    const newComment = {
      ...commentData,
      id: Math.max(...comments.map((c: any) => c.id), 0) + 1,
      createdAt: new Date().toISOString()
    };
    
    const updatedComments = [...comments, newComment];
    setSessionData(STORAGE_KEYS.COMMENTS, updatedComments);
    
    // 해당 포스트의 댓글 수 업데이트
    if (commentData.postType === 'lounge') {
      const currentCommentCount = this.getByPost(commentData.postId, 'lounge').length;
      sessionLoungeService.updateCommentCount(commentData.postId, currentCommentCount);
    }
    
    // 레벨 시스템: 댓글 작성 활동 추적 (비회원 제외)
    if (!commentData.isGuest && commentData.author) {
      try {
        const { userLevelService } = require('../services/userLevelService');
        const authorId = sessionUserService.getUserIdByName(commentData.author);
        userLevelService.updateUserActivity(authorId, 'comment_created', 1);
      } catch (error) {
        // 레벨 시스템 에러는 무시
      }
    }
    
    console.log('💬 새 댓글이 작성되었습니다');
    return newComment;
  },

  // 댓글 수정 (비밀번호 확인 포함)
  update(id: number, newContent: string, password?: string) {
    const comments = getSessionData(STORAGE_KEYS.COMMENTS);
    const comment = comments.find((c: any) => c.id === id);
    
    if (!comment) {
      throw new Error('댓글을 찾을 수 없습니다.');
    }
    
    // 게스트 댓글인 경우 비밀번호 확인
    if (comment.isGuest && comment.guestPassword !== password) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }
    
    const updatedComments = comments.map((c: any) => 
      c.id === id ? { ...c, content: newContent } : c
    );
    setSessionData(STORAGE_KEYS.COMMENTS, updatedComments);
    
    console.log('✏️ 댓글이 수정되었습니다');
    return updatedComments.find((c: any) => c.id === id);
  },

  // 댓글 삭제 (비밀번호 확인 포함)
  delete(id: number, password?: string) {
    const comments = getSessionData(STORAGE_KEYS.COMMENTS);
    const comment = comments.find((c: any) => c.id === id);
    
    if (!comment) {
      throw new Error('댓글을 찾을 수 없습니다.');
    }
    
    // 게스트 댓글인 경우 비밀번호 확인
    if (comment.isGuest && comment.guestPassword !== password) {
      throw new Error('비밀번호가 일치하지 않습니다.');
    }
    
    const updatedComments = comments.filter((c: any) => c.id !== id);
    setSessionData(STORAGE_KEYS.COMMENTS, updatedComments);
    
    // 해당 포스트의 댓글 수 업데이트
    if (comment.postType === 'lounge') {
      const currentCommentCount = this.getByPost(comment.postId, 'lounge').length - 1;
      sessionLoungeService.updateCommentCount(comment.postId, Math.max(0, currentCommentCount));
    }
    
    console.log('🗑️ 댓글이 삭제되었습니다');
    return true;
  },

  // 모든 댓글 조회 (관리용)
  getAll() {
    initializeSessionData();
    return getSessionData(STORAGE_KEYS.COMMENTS);
  }
};

// 북마크 관리 서비스
export const sessionScrapService = {
  // 사용자별 북마크 조회
  getByUser(userId: number) {
    initializeSessionData();
    const scraps = getSessionData(STORAGE_KEYS.SCRAPS);
    return scraps.filter((scrap: any) => scrap.userId === userId);
  },

  // 북마크 추가
  add(userId: number, postId: number, postType: 'story' | 'lounge') {
    const scraps = getSessionData(STORAGE_KEYS.SCRAPS);
    
    // 이미 북마크했는지 확인
    const existing = scraps.find((s: any) => 
      s.userId === userId && s.postId === postId && s.postType === postType
    );
    
    if (existing) {
      return false; // 이미 북마크됨
    }
    
    const newScrap = {
      id: Math.max(...scraps.map((s: any) => s.id), 0) + 1,
      userId,
      postId,
      postType,
      createdAt: new Date().toISOString()
    };
    
    const updatedScraps = [...scraps, newScrap];
    setSessionData(STORAGE_KEYS.SCRAPS, updatedScraps);
    
    // 해당 포스트의 북마크 수 업데이트
    let postAuthor = null;
    if (postType === 'story') {
      const story = sessionStoryService.getById(postId);
      if (story) {
        sessionStoryService.incrementScrapCount(postId);
        postAuthor = story.author;
      }
    } else if (postType === 'lounge') {
      const post = sessionLoungeService.getById(postId);
      if (post) {
        sessionLoungeService.incrementScrapCount(postId);
        postAuthor = post.author;
      }
    }
    
    // 레벨 시스템: 북마크 받은 활동 추적
    if (postAuthor) {
      try {
        const { userLevelService } = require('../services/userLevelService');
        const authorId = sessionUserService.getUserIdByName(postAuthor);
        userLevelService.updateUserActivity(authorId, 'bookmarked', 1);
      } catch (error) {
        // 레벨 시스템 에러는 무시
      }
    }
    
    console.log('📌 북마크이 추가되었습니다');
    return true;
  },

  // 북마크 제거
  remove(userId: number, postId: number, postType: 'story' | 'lounge') {
    const scraps = getSessionData(STORAGE_KEYS.SCRAPS);
    const updatedScraps = scraps.filter((s: any) => 
      !(s.userId === userId && s.postId === postId && s.postType === postType)
    );
    
    if (scraps.length === updatedScraps.length) {
      return false; // 북마크이 없었음
    }
    
    setSessionData(STORAGE_KEYS.SCRAPS, updatedScraps);
    
    // 해당 포스트의 북마크 수 업데이트
    if (postType === 'story') {
      sessionStoryService.decrementScrapCount(postId);
    } else if (postType === 'lounge') {
      sessionLoungeService.decrementScrapCount(postId);
    }
    
    console.log('📌 북마크이 제거되었습니다');
    return true;
  },

  // 북마크 여부 확인
  isScraped(userId: number, postId: number, postType: 'story' | 'lounge') {
    const scraps = getSessionData(STORAGE_KEYS.SCRAPS);
    return scraps.some((s: any) => 
      s.userId === userId && s.postId === postId && s.postType === postType
    );
  },

  // 사용자의 북마크한 Story 목록
  getUserStories(userId: number) {
    const userScraps = this.getByUser(userId);
    const storyScraps = userScraps.filter((s: any) => s.postType === 'story');
    const stories = sessionStoryService.getAll();
    
    return storyScraps.map((scrap: any) => {
      const story = stories.find((s: any) => s.id === scrap.postId);
      return story ? { ...story, scrapedAt: scrap.createdAt } : null;
    }).filter(Boolean);
  },

  // 사용자의 북마크한 Lounge 목록
  getUserLoungePosts(userId: number) {
    const userScraps = this.getByUser(userId);
    const loungeScraps = userScraps.filter((s: any) => s.postType === 'lounge');
    const loungePosts = sessionLoungeService.getAll();
    
    return loungeScraps.map((scrap: any) => {
      const post = loungePosts.find((p: any) => p.id === scrap.postId);
      return post ? { ...post, scrapedAt: scrap.createdAt } : null;
    }).filter(Boolean);
  },

  // 모든 북마크 조회 (관리용)
  getAll() {
    initializeSessionData();
    return getSessionData(STORAGE_KEYS.SCRAPS);
  }
};

// 좋아요 관리 서비스
export const sessionLikeService = {
  // 사용자별 좋아요 조회
  getByUser(userId: number) {
    initializeSessionData();
    const likes = getSessionData(STORAGE_KEYS.LIKES);
    return likes.filter((like: any) => like.userId === userId);
  },

  // 좋아요 추가
  add(userId: number, postId: number, postType: 'story' | 'lounge') {
    const likes = getSessionData(STORAGE_KEYS.LIKES);
    
    // 이미 좋아요했는지 확인
    const existing = likes.find((l: any) => 
      l.userId === userId && l.postId === postId && l.postType === postType
    );
    
    if (existing) {
      return false; // 이미 좋아요됨
    }
    
    const newLike = {
      id: Math.max(...likes.map((l: any) => l.id), 0) + 1,
      userId,
      postId,
      postType,
      createdAt: new Date().toISOString()
    };
    
    const updatedLikes = [...likes, newLike];
    setSessionData(STORAGE_KEYS.LIKES, updatedLikes);
    
    // 해당 포스트의 좋아요 수 업데이트
    let postAuthor = null;
    if (postType === 'story') {
      const story = sessionStoryService.getById(postId);
      if (story) {
        sessionStoryService.updateLikeCount(postId, (story.likeCount || 0) + 1);
        postAuthor = story.author;
      }
    } else if (postType === 'lounge') {
      const post = sessionLoungeService.getById(postId);
      if (post) {
        sessionLoungeService.updateLikeCount(postId, (post.likeCount || 0) + 1);
        postAuthor = post.author;
      }
    }
    
    // 레벨 시스템: 좋아요 받은 활동 추적
    if (postAuthor) {
      try {
        const { userLevelService } = require('../services/userLevelService');
        const authorId = sessionUserService.getUserIdByName(postAuthor);
        userLevelService.updateUserActivity(authorId, 'like_received', 1);
      } catch (error) {
        // 레벨 시스템 에러는 무시
      }
    }
    
    console.log('👍 좋아요가 추가되었습니다');
    return true;
  },

  // 좋아요 제거
  remove(userId: number, postId: number, postType: 'story' | 'lounge') {
    const likes = getSessionData(STORAGE_KEYS.LIKES);
    const updatedLikes = likes.filter((l: any) => 
      !(l.userId === userId && l.postId === postId && l.postType === postType)
    );
    
    if (likes.length === updatedLikes.length) {
      return false; // 좋아요가 없었음
    }
    
    setSessionData(STORAGE_KEYS.LIKES, updatedLikes);
    
    // 해당 포스트의 좋아요 수 업데이트
    if (postType === 'story') {
      const story = sessionStoryService.getById(postId);
      if (story) {
        sessionStoryService.updateLikeCount(postId, Math.max(0, (story.likeCount || 0) - 1));
      }
    } else if (postType === 'lounge') {
      const post = sessionLoungeService.getById(postId);
      if (post) {
        sessionLoungeService.updateLikeCount(postId, Math.max(0, (post.likeCount || 0) - 1));
      }
    }
    
    console.log('👍 좋아요가 제거되었습니다');
    return true;
  },

  // 좋아요 여부 확인
  isLiked(userId: number, postId: number, postType: 'story' | 'lounge') {
    const likes = getSessionData(STORAGE_KEYS.LIKES);
    return likes.some((l: any) => 
      l.userId === userId && l.postId === postId && l.postType === postType
    );
  },

  // 모든 좋아요 조회 (관리용)
  getAll() {
    initializeSessionData();
    return getSessionData(STORAGE_KEYS.LIKES);
  }
};

// 검색어 추적 서비스
export const sessionSearchService = {
  // 검색어 추가/업데이트 (검색할 때마다 호출)
  addSearchKeyword(keyword: string) {
    if (!keyword || keyword.trim().length < 2) return; // 너무 짧은 검색어 제외
    
    initializeSessionData();
    const keywords = getSessionData(STORAGE_KEYS.SEARCH_KEYWORDS);
    const trimmedKeyword = keyword.trim();
    
    // 기존 검색어 찾기
    const existingIndex = keywords.findIndex((item: any) => 
      item.keyword.toLowerCase() === trimmedKeyword.toLowerCase()
    );
    
    if (existingIndex >= 0) {
      // 기존 검색어가 있으면 카운트 증가
      keywords[existingIndex].count += 1;
      keywords[existingIndex].lastSearched = new Date().toISOString();
    } else {
      // 새 검색어 추가
      keywords.push({
        keyword: trimmedKeyword,
        count: 1,
        lastSearched: new Date().toISOString()
      });
    }
    
    setSessionData(STORAGE_KEYS.SEARCH_KEYWORDS, keywords);
    console.log(`🔍 검색어 추가됨: "${trimmedKeyword}"`);
  },

  // 인기 검색어 Top N 가져오기
  getTopKeywords(limit = 5) {
    initializeSessionData();
    const keywords = getSessionData(STORAGE_KEYS.SEARCH_KEYWORDS);
    
    return keywords
      .sort((a: any, b: any) => {
        // 카운트 순으로 정렬, 동일하면 최근 검색 순
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return new Date(b.lastSearched).getTime() - new Date(a.lastSearched).getTime();
      })
      .slice(0, limit)
      .map((item: any) => ({
        keyword: item.keyword,
        count: item.count,
        lastSearched: item.lastSearched
      }));
  },

  // 최근 검색어 가져오기 (시간순)
  getRecentKeywords(limit = 10) {
    initializeSessionData();
    const keywords = getSessionData(STORAGE_KEYS.SEARCH_KEYWORDS);
    
    return keywords
      .sort((a: any, b: any) => 
        new Date(b.lastSearched).getTime() - new Date(a.lastSearched).getTime()
      )
      .slice(0, limit)
      .map((item: any) => ({
        keyword: item.keyword,
        count: item.count,
        lastSearched: item.lastSearched
      }));
  },

  // 모든 검색어 조회 (관리용)
  getAll() {
    initializeSessionData();
    return getSessionData(STORAGE_KEYS.SEARCH_KEYWORDS);
  },

  // 검색어 삭제 (관리용)
  removeKeyword(keyword: string) {
    const keywords = getSessionData(STORAGE_KEYS.SEARCH_KEYWORDS);
    const filtered = keywords.filter((item: any) => item.keyword !== keyword);
    setSessionData(STORAGE_KEYS.SEARCH_KEYWORDS, filtered);
    console.log(`🗑️ 검색어 삭제됨: "${keyword}"`);
  }
};

// Story 승격 요청 관리 서비스
export const sessionPromotionService = {
  // 승격 요청 생성
  createRequest(postId: number, postType: 'lounge', reason: string = '') {
    const requests = getSessionData(STORAGE_KEYS.PROMOTION_REQUESTS);
    
    // 이미 요청이 있는지 확인
    const existingRequest = requests.find((req: any) => 
      req.postId === postId && req.postType === postType
    );
    
    if (existingRequest) {
      return existingRequest; // 이미 요청 존재
    }
    
    const newRequest = {
      id: Math.max(...requests.map((r: any) => r.id), 0) + 1,
      postId,
      postType,
      status: 'pending', // pending, approved, rejected
      reason,
      adminNote: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedRequests = [...requests, newRequest];
    setSessionData(STORAGE_KEYS.PROMOTION_REQUESTS, updatedRequests);
    
    console.log(`📄 Story 승격 요청이 생성되었습니다: Post ${postId}`);
    return newRequest;
  },
  
  // 승격 요청 조회
  getRequest(postId: number, postType: string) {
    const requests = getSessionData(STORAGE_KEYS.PROMOTION_REQUESTS);
    return requests.find((req: any) => 
      req.postId === postId && req.postType === postType
    );
  },
  
  // 모든 승격 요청 조회
  getAllRequests() {
    initializeSessionData();
    return getSessionData(STORAGE_KEYS.PROMOTION_REQUESTS);
  },
  
  // 상태별 요청 조회
  getRequestsByStatus(status: 'pending' | 'approved' | 'rejected') {
    const requests = this.getAllRequests();
    return requests.filter((req: any) => req.status === status);
  },
  
  // 관리자: 승격 요청 승인
  approveRequest(requestId: number, adminNote: string = '') {
    const requests = getSessionData(STORAGE_KEYS.PROMOTION_REQUESTS);
    const updatedRequests = requests.map((req: any) => {
      if (req.id === requestId) {
        return {
          ...req,
          status: 'approved',
          adminNote,
          updatedAt: new Date().toISOString()
        };
      }
      return req;
    });
    
    setSessionData(STORAGE_KEYS.PROMOTION_REQUESTS, updatedRequests);
    console.log(`✅ 승격 요청이 승인되었습니다: Request ${requestId}`);
    
    return updatedRequests.find((req: any) => req.id === requestId);
  },
  
  // 관리자: 승격 요청 거절
  rejectRequest(requestId: number, adminNote: string) {
    const requests = getSessionData(STORAGE_KEYS.PROMOTION_REQUESTS);
    const updatedRequests = requests.map((req: any) => {
      if (req.id === requestId) {
        return {
          ...req,
          status: 'rejected',
          adminNote,
          updatedAt: new Date().toISOString()
        };
      }
      return req;
    });
    
    setSessionData(STORAGE_KEYS.PROMOTION_REQUESTS, updatedRequests);
    console.log(`❌ 승격 요청이 거절되었습니다: Request ${requestId}`);
    
    return updatedRequests.find((req: any) => req.id === requestId);
  },
  
  // 관리자: Story로 실제 승격 처리
  promoteToStory(requestId: number, storyData: any) {
    const request = this.approveRequest(requestId, 'Story로 승격 완료');
    if (!request) return null;
    
    // Story에 추가
    const newStory = sessionStoryService.create({
      ...storyData,
      isVerified: true,
      promotedFrom: {
        postId: request.postId,
        postType: request.postType,
        promotedAt: new Date().toISOString()
      }
    });
    
    console.log(`🎆 Story로 승격 완료: ${newStory.title}`);
    return newStory;
  },
  
  // 요청 삭제
  deleteRequest(requestId: number) {
    const requests = getSessionData(STORAGE_KEYS.PROMOTION_REQUESTS);
    const updatedRequests = requests.filter((req: any) => req.id !== requestId);
    setSessionData(STORAGE_KEYS.PROMOTION_REQUESTS, updatedRequests);
    
    console.log(`🗑️ 승격 요청이 삭제되었습니다: Request ${requestId}`);
    return true;
  }
};

// 데이터 초기화 함수
export const initializeData = () => {
  initializeSessionData();
};

// 전체 데이터 리셋 (개발용)
export const resetAllData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    sessionStorage.removeItem(key);
  });
  console.log('🔄 모든 데이터가 리셋되었습니다.');
};

// 현재 데이터 상태 확인 (개발용)
export const getDataStats = () => {
  const stories = sessionStoryService.getAll();
  const loungePosts = sessionLoungeService.getAll();
  const comments = sessionCommentService.getAll();
  const scraps = sessionScrapService.getAll();
  
  return {
    stories: stories.length,
    loungePosts: loungePosts.length,
    comments: comments.length,
    scraps: scraps.length,
    initialized: !!sessionStorage.getItem(STORAGE_KEYS.INITIALIZED)
  };
};