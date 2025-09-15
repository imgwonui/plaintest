// 캐싱 서비스 - 메모리 기반 캐시로 API 호출 최적화
// 사용자의 브라우저 세션 동안 데이터를 캐시하여 반복적인 API 호출을 줄입니다.

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time To Live (밀리초)
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  
  // 기본 TTL 값들 (밀리초)
  private readonly DEFAULT_TTL = {
    SHORT: 30 * 1000,      // 30초 - 실시간성이 중요한 데이터
    MEDIUM: 5 * 60 * 1000, // 5분 - 일반적인 목록 데이터
    LONG: 30 * 60 * 1000,  // 30분 - 거의 변하지 않는 데이터
    VERY_LONG: 60 * 60 * 1000 // 1시간 - 설정, 태그 등
  };

  // 캐시 키 생성
  private generateKey(prefix: string, params?: Record<string, any>): string {
    if (!params) return prefix;
    
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }

  // 캐시 설정
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL.MEDIUM): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // 메모리 정리를 위한 자동 삭제 스케줄링
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  // 캐시 조회
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // TTL 체크
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  // 캐시 삭제
  delete(key: string): void {
    this.cache.delete(key);
  }

  // 패턴으로 캐시 삭제 (예: "stories:*")
  deleteByPattern(pattern: string): void {
    const regexPattern = pattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // 모든 캐시 삭제
  clear(): void {
    this.cache.clear();
  }

  // 캐시 통계
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // === 도메인별 캐시 메서드들 ===

  // 스토리 목록 캐시
  setStories(params: { page?: number; limit?: number }, data: any): void {
    const key = this.generateKey('stories', params);
    this.set(key, data, this.DEFAULT_TTL.MEDIUM);
  }

  getStories(params: { page?: number; limit?: number }): any | null {
    const key = this.generateKey('stories', params);
    return this.get(key);
  }

  // 라운지 목록 캐시
  setLoungePosts(params: { page?: number; limit?: number; type?: string }, data: any): void {
    const key = this.generateKey('lounge', params);
    this.set(key, data, this.DEFAULT_TTL.MEDIUM);
  }

  getLoungePosts(params: { page?: number; limit?: number; type?: string }): any | null {
    const key = this.generateKey('lounge', params);
    return this.get(key);
  }

  // 개별 게시물 캐시
  setPost(type: 'story' | 'lounge', id: number, data: any): void {
    const key = `${type}:${id}`;
    this.set(key, data, this.DEFAULT_TTL.SHORT); // 실시간성 중요
  }

  getPost(type: 'story' | 'lounge', id: number): any | null {
    const key = `${type}:${id}`;
    return this.get(key);
  }

  // 댓글 캐시
  setComments(postId: number, postType: 'story' | 'lounge', data: any): void {
    const key = `comments:${postType}:${postId}`;
    this.set(key, data, this.DEFAULT_TTL.SHORT);
  }

  getComments(postId: number, postType: 'story' | 'lounge'): any | null {
    const key = `comments:${postType}:${postId}`;
    return this.get(key);
  }

  // 태그 캐시
  setTags(data: any): void {
    this.set('tags', data, this.DEFAULT_TTL.VERY_LONG);
  }

  getTags(): any | null {
    return this.get('tags');
  }

  // 사용자 프로필 캐시
  setUserProfile(userId: string, data: any): void {
    const key = `user:${userId}`;
    this.set(key, data, this.DEFAULT_TTL.MEDIUM);
  }

  getUserProfile(userId: string): any | null {
    const key = `user:${userId}`;
    return this.get(key);
  }

  // 검색 결과 캐시
  setSearchResults(query: string, data: any): void {
    const key = `search:${query}`;
    this.set(key, data, this.DEFAULT_TTL.SHORT);
  }

  getSearchResults(query: string): any | null {
    const key = `search:${query}`;
    return this.get(key);
  }

  // === 캐시 무효화 메서드들 ===

  // 게시물 작성/수정/삭제시 관련 캐시 삭제
  invalidatePost(type: 'story' | 'lounge', id?: number): void {
    if (id) {
      this.delete(`${type}:${id}`);
    }
    this.deleteByPattern(`${type}:*`);
    this.deleteByPattern(`comments:${type}:*`);
  }

  // 좋아요/북마크 변경시 관련 캐시 삭제
  invalidateInteractions(type: 'story' | 'lounge', id: number): void {
    this.delete(`${type}:${id}`);
    // 목록 캐시도 삭제 (좋아요 수가 변경될 수 있음)
    this.deleteByPattern(`${type}:*`);
  }

  // 댓글 작성/수정/삭제시 댓글 캐시 삭제
  invalidateComments(postType: 'story' | 'lounge', postId: number): void {
    this.delete(`comments:${postType}:${postId}`);
    // 게시물 캐시도 삭제 (댓글 수가 변경될 수 있음)
    this.delete(`${postType}:${postId}`);
  }

  // 사용자 정보 변경시 프로필 캐시 삭제
  invalidateUser(userId: string): void {
    this.delete(`user:${userId}`);
  }

  // 삭제된 데이터로 인한 캐시 정리 (데이터 무결성 보장)
  cleanupDeletedData(): void {
    console.log('🧹 삭제된 데이터 캐시 정리 시작...');
    
    // 모든 스토리와 라운지 관련 캐시 강제 삭제
    this.deleteByPattern('story:*');
    this.deleteByPattern('lounge:*');
    this.deleteByPattern('comments:*');
    
    // 검색 결과도 정리 (삭제된 게시물이 포함될 수 있음)
    this.deleteByPattern('search:*');
    
    console.log('✅ 캐시 정리 완료');
  }

  // 강제 전체 새로고침 (삭제된 데이터 문제 해결용)
  forceRefreshAll(): void {
    console.log('🔄 전체 캐시 강제 새로고침...');
    this.clear();
    console.log('✅ 전체 캐시 삭제 완료 - 다음 요청시 최신 데이터 로드');
  }
}

// 싱글톤 인스턴스 생성
export const cacheService = new CacheService();

// 타입 정의 내보내기
export type { CacheItem };

// 개발용 디버그 함수
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).PlainCache = {
    service: cacheService,
    stats: () => cacheService.getStats(),
    clear: () => cacheService.clear(),
    cleanup: () => cacheService.cleanupDeletedData(),
    forceRefresh: () => cacheService.forceRefreshAll(),
    info: () => console.log(`
🧠 Plain 캐시 서비스 디버그

사용 가능한 명령어:
- PlainCache.stats()        : 캐시 통계 확인
- PlainCache.clear()        : 모든 캐시 삭제
- PlainCache.cleanup()      : 삭제된 데이터 캐시 정리
- PlainCache.forceRefresh() : 전체 캐시 강제 새로고침
- PlainCache.service        : 캐시 서비스 인스턴스 접근

캐시 전략:
- SHORT (30초): 실시간 데이터 (게시물 상세, 댓글)
- MEDIUM (5분): 목록 데이터 (스토리/라운지 목록)
- LONG (30분): 안정적인 데이터
- VERY_LONG (1시간): 설정, 태그 등

💡 문제 해결:
삭제된 게시물이 여전히 보인다면: PlainCache.cleanup()
캐시 문제가 계속 발생한다면: PlainCache.forceRefresh()

캐시는 브라우저 메모리에 저장되며 페이지 새로고침 시 초기화됩니다.
    `)
  };
}

export default cacheService;