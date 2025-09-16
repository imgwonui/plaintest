// Enhanced Data Service - Performance optimized service for card loading
// Focuses on batch operations and smart caching to reduce API calls

import {
  storyService,
  loungeService
} from './supabaseDataService';
import { getDatabaseUserLevel } from './databaseUserLevelService';
import { optimizedStoryService, optimizedLoungeService } from './optimizedDataService';
import { cacheService } from './cacheService';

// Batch request manager for author levels
class AuthorLevelBatchManager {
  private pending = new Map<string, Promise<number>>();
  private cache = new Map<string, { level: number; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시
  private batchQueue = new Set<string>();
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 100; // 100ms 배치 딜레이

  async getAuthorLevel(authorId: string): Promise<number> {
    if (!authorId) return 1;

    // 캐시에서 확인
    const cached = this.cache.get(authorId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.level;
    }

    // 이미 진행중인 요청 확인
    if (this.pending.has(authorId)) {
      return this.pending.get(authorId)!;
    }

    // 배치 큐에 추가
    this.batchQueue.add(authorId);

    // 배치 처리 스케줄링
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    const promise = new Promise<number>((resolve, reject) => {
      this.batchTimer = setTimeout(async () => {
        try {
          await this.processBatch();
          const result = this.cache.get(authorId);
          resolve(result ? result.level : 1);
        } catch (error) {
          console.warn('Author level batch processing failed:', error);
          // 개별 처리로 fallback
          try {
            const levelData = await getDatabaseUserLevel(authorId);
            const level = levelData.level || 1;
            this.cache.set(authorId, { level, timestamp: Date.now() });
            resolve(level);
          } catch (fallbackError) {
            console.warn('Individual author level fetch failed:', fallbackError);
            resolve(1);
          }
        }
        this.pending.delete(authorId);
      }, this.BATCH_DELAY);
    });

    this.pending.set(authorId, promise);
    return promise;
  }

  private async processBatch(): Promise<void> {
    if (this.batchQueue.size === 0) return;

    const authorIds = Array.from(this.batchQueue);
    this.batchQueue.clear();

    try {
      // 배치로 모든 author level 가져오기
      const levels = await Promise.allSettled(
        authorIds.map(id => getDatabaseUserLevel(id))
      );

      // 결과 캐시에 저장
      levels.forEach((result, index) => {
        const authorId = authorIds[index];
        if (result.status === 'fulfilled') {
          const level = result.value.level || 1;
          this.cache.set(authorId, { level, timestamp: Date.now() });
        } else {
          // 실패시 기본값 설정
          this.cache.set(authorId, { level: 1, timestamp: Date.now() });
        }
      });

      console.log(`✅ 배치 처리 완료: ${authorIds.length}개 author levels 로드됨`);
    } catch (error) {
      console.error('배치 author level 처리 실패:', error);

      // 실패시 모든 author에 기본값 설정
      authorIds.forEach(authorId => {
        this.cache.set(authorId, { level: 1, timestamp: Date.now() });
      });
    }
  }

  // 캐시 무효화
  invalidateAuthor(authorId: string): void {
    this.cache.delete(authorId);
    this.pending.delete(authorId);
  }

  // 전체 캐시 클리어
  clearCache(): void {
    this.cache.clear();
    this.pending.clear();
    this.batchQueue.clear();
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }
}

// 전역 배치 매니저 인스턴스
export const authorLevelBatchManager = new AuthorLevelBatchManager();

// 향상된 데이터 서비스 클래스
class EnhancedDataService {

  // 스토리 목록을 성능 최적화하여 로드
  async getStoriesOptimized(page = 1, limit = 50, skipImages = false): Promise<{
    stories: any[];
    hasMore: boolean;
    totalCount: number;
  }> {
    try {
      console.log('📖 향상된 스토리 로드 시작...');

      // 기본 스토리 데이터 로드
      const response = await optimizedStoryService.getAll(page, limit, true, true);
      const stories = response.stories || [];

      // Author level 일괄 로드 (백그라운드에서)
      const authorIds = [...new Set(stories.map((story: any) => story.author_id).filter(Boolean))];
      if (authorIds.length > 0) {
        // 비동기로 author level 배치 로드 시작 (결과를 기다리지 않음)
        Promise.all(authorIds.map((id: string) => authorLevelBatchManager.getAuthorLevel(id)))
          .then(() => console.log('✅ 스토리 author levels 백그라운드 로드 완료'))
          .catch(error => console.warn('⚠️ 스토리 author levels 백그라운드 로드 실패:', error));
      }

      // 이미지 스킵 옵션 (초기 로딩 성능 향상)
      if (skipImages) {
        stories.forEach(story => {
          if (story.image_url) {
            story._original_image_url = story.image_url;
            story.image_url = null; // 임시로 이미지 URL 제거
          }
        });
      }

      console.log(`✅ 향상된 스토리 로드 완료: ${stories.length}개`);

      return {
        stories,
        hasMore: stories.length === limit,
        totalCount: response.totalCount || stories.length
      };
    } catch (error) {
      console.error('❌ 향상된 스토리 로드 실패:', error);
      throw error;
    }
  }

  // 라운지 글 목록을 성능 최적화하여 로드
  async getLoungePostsOptimized(page = 1, limit = 50, type?: string, skipImages = false): Promise<{
    posts: any[];
    hasMore: boolean;
    totalCount: number;
  }> {
    try {
      console.log('🏛️ 향상된 라운지 로드 시작...');

      // 기본 라운지 데이터 로드
      const response = await optimizedLoungeService.getAll(page, limit, type, true, true);
      const posts = response.posts || [];

      // Author level 일괄 로드 (백그라운드에서)
      const authorIds = [...new Set(posts.map((post: any) => post.author_id).filter(Boolean))];
      if (authorIds.length > 0) {
        // 비동기로 author level 배치 로드 시작 (결과를 기다리지 않음)
        Promise.all(authorIds.map((id: string) => authorLevelBatchManager.getAuthorLevel(id)))
          .then(() => console.log('✅ 라운지 author levels 백그라운드 로드 완료'))
          .catch(error => console.warn('⚠️ 라운지 author levels 백그라운드 로드 실패:', error));
      }

      // 이미지 스킵 옵션 (초기 로딩 성능 향상)
      if (skipImages) {
        posts.forEach(post => {
          if (post.image_url) {
            post._original_image_url = post.image_url;
            post.image_url = null; // 임시로 이미지 URL 제거
          }
        });
      }

      console.log(`✅ 향상된 라운지 로드 완료: ${posts.length}개`);

      return {
        posts,
        hasMore: posts.length === limit,
        totalCount: response.totalCount || posts.length
      };
    } catch (error) {
      console.error('❌ 향상된 라운지 로드 실패:', error);
      throw error;
    }
  }

  // 홈페이지 데이터를 우선순위 기반으로 로드
  async getHomeDataOptimized(): Promise<{
    stories: any[];
    loungePosts: any[];
  }> {
    try {
      console.log('🏠 향상된 홈 데이터 로드 시작...');

      // Phase 1: 텍스트 콘텐츠 먼저 로드 (이미지 없이)
      const [storiesResponse, loungeResponse] = await Promise.all([
        this.getStoriesOptimized(1, 10, true), // 이미지 스킵
        this.getLoungePostsOptimized(1, 20, undefined, true) // 이미지 스킵
      ]);

      console.log('✅ Phase 1: 텍스트 콘텐츠 로드 완료');

      // Phase 2: 백그라운드에서 이미지 URL 복원
      setTimeout(() => {
        this.restoreImageUrls(storiesResponse.stories);
        this.restoreImageUrls(loungeResponse.posts);
        console.log('✅ Phase 2: 이미지 URL 복원 완료');
      }, 100);

      return {
        stories: storiesResponse.stories,
        loungePosts: loungeResponse.posts
      };
    } catch (error) {
      console.error('❌ 향상된 홈 데이터 로드 실패:', error);
      throw error;
    }
  }

  // 이미지 URL 복원 (백그라운드 처리)
  private restoreImageUrls(items: any[]): void {
    items.forEach(item => {
      if (item._original_image_url && !item.image_url) {
        item.image_url = item._original_image_url;
        delete item._original_image_url;
      }
    });
  }

  // 실시간 이벤트 처리 (레벨업 등)
  handleLevelUpEvent(userId: string): void {
    authorLevelBatchManager.invalidateAuthor(userId);

    // 전역 이벤트 발생
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('userCacheInvalidated', {
        detail: { userId }
      }));
    }
  }
}

// 전역 향상된 데이터 서비스 인스턴스
export const enhancedDataService = new EnhancedDataService();

// 편의 함수들
export const getAuthorLevelFast = (authorId: string) =>
  authorLevelBatchManager.getAuthorLevel(authorId);

export const invalidateAuthorLevel = (authorId: string) =>
  authorLevelBatchManager.invalidateAuthor(authorId);

export const clearAuthorLevelCache = () =>
  authorLevelBatchManager.clearCache();