// 이미지 프리로딩 유틸리티
export class ImagePreloader {
  private static instance: ImagePreloader;
  private loadedImages = new Set<string>();
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>();

  static getInstance(): ImagePreloader {
    if (!ImagePreloader.instance) {
      ImagePreloader.instance = new ImagePreloader();
    }
    return ImagePreloader.instance;
  }

  // 이미지 하나 프리로드
  async preloadImage(src: string, priority = false): Promise<HTMLImageElement> {
    if (!src) return Promise.reject(new Error('No image source provided'));

    // 이미 로드된 이미지면 즉시 반환
    if (this.loadedImages.has(src)) {
      const img = new Image();
      img.src = src;
      return Promise.resolve(img);
    }

    // 이미 로딩 중이면 기존 Promise 반환
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    // 새로운 이미지 로딩
    const loadPromise = this.createImageLoadPromise(src, priority);
    this.loadingPromises.set(src, loadPromise);

    return loadPromise;
  }

  // 여러 이미지 배치 프리로드
  async preloadImages(
    sources: string[], 
    options: {
      priority?: boolean;
      maxConcurrent?: number;
      onProgress?: (loaded: number, total: number) => void;
      onError?: (src: string, error: any) => void;
    } = {}
  ): Promise<HTMLImageElement[]> {
    const { 
      priority = false, 
      maxConcurrent = 3,
      onProgress,
      onError
    } = options;

    const validSources = sources.filter(src => src && !this.loadedImages.has(src));
    if (validSources.length === 0) return [];

    let loaded = 0;
    const results: HTMLImageElement[] = [];
    const total = validSources.length;

    // 배치별로 처리 (동시 로딩 개수 제한)
    for (let i = 0; i < validSources.length; i += maxConcurrent) {
      const batch = validSources.slice(i, i + maxConcurrent);
      
      const batchPromises = batch.map(async (src) => {
        try {
          const img = await this.preloadImage(src, priority);
          loaded++;
          onProgress?.(loaded, total);
          return img;
        } catch (error) {
          onError?.(src, error);
          loaded++;
          onProgress?.(loaded, total);
          return null;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => (result as PromiseFulfilledResult<HTMLImageElement>).value)
      );
    }

    return results;
  }

  // 우선순위 이미지 즉시 프리로드 (위에서 보이는 이미지들)
  async preloadCriticalImages(sources: string[]): Promise<void> {
    const criticalSources = sources.slice(0, 3); // 처음 3개만 즉시 로드
    
    console.log('🚀 Critical images preloading:', criticalSources.length);
    
    await this.preloadImages(criticalSources, {
      priority: true,
      maxConcurrent: 3,
      onProgress: (loaded, total) => {
        console.log(`📸 Critical images: ${loaded}/${total} loaded`);
      }
    });
  }

  // 지연 프리로드 (아래쪽 이미지들)
  async preloadLazyImages(sources: string[], delay = 1000): Promise<void> {
    const lazySources = sources.slice(3); // 4번째부터는 지연 로드
    
    if (lazySources.length === 0) return;

    setTimeout(async () => {
      console.log('⏰ Lazy images preloading:', lazySources.length);
      
      await this.preloadImages(lazySources, {
        priority: false,
        maxConcurrent: 2, // 백그라운드에서는 더 적게
        onProgress: (loaded, total) => {
          console.log(`🖼️ Lazy images: ${loaded}/${total} loaded`);
        }
      });
    }, delay);
  }

  // 이미지 로드 Promise 생성
  private createImageLoadPromise(src: string, priority: boolean): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // 우선순위 이미지는 즉시 로드
      if (priority) {
        img.loading = 'eager';
      }

      img.onload = () => {
        this.loadedImages.add(src);
        this.loadingPromises.delete(src);
        console.log(`✅ Image preloaded: ${src.substring(src.lastIndexOf('/') + 1)}`);
        resolve(img);
      };

      img.onerror = (error) => {
        this.loadingPromises.delete(src);
        console.warn(`❌ Image preload failed: ${src}`, error);
        reject(error);
      };

      img.src = src;
    });
  }

  // 캐시된 이미지 정리
  clearCache(): void {
    this.loadedImages.clear();
    this.loadingPromises.clear();
    console.log('🗑️ Image preloader cache cleared');
  }

  // 통계 확인
  getStats(): { loaded: number; loading: number } {
    return {
      loaded: this.loadedImages.size,
      loading: this.loadingPromises.size
    };
  }
}

// 전역 인스턴스
export const imagePreloader = ImagePreloader.getInstance();

// 홈 페이지용 이미지 프리로딩 헬퍼
export const preloadHomeImages = {
  async preloadStoriesAndLounge(stories: any[], loungePosts: any[]) {
    const imageSources = [
      // Weekly Topic 이미지 (최우선)
      ...(stories.length > 0 && stories[0].image_url ? [stories[0].image_url] : []),
      
      // Story 카드 이미지들
      ...stories.slice(0, 6).map(story => story.image_url).filter(Boolean),
      
      // Lounge에 포함된 이미지들 (컨텐츠 내부)
      ...loungePosts.slice(0, 10).map(post => {
        if (!post.content) return null;
        const imgMatch = post.content.match(/<img[^>]+src="([^"]+)"/i);
        return imgMatch ? imgMatch[1] : null;
      }).filter(Boolean)
    ];

    if (imageSources.length === 0) return;

    try {
      // 첫 번째 이미지 (Weekly Topic)는 즉시 로드
      if (imageSources.length > 0) {
        await imagePreloader.preloadCriticalImages([imageSources[0]]);
      }

      // 나머지 이미지들은 지연 로드
      if (imageSources.length > 1) {
        imagePreloader.preloadLazyImages(imageSources.slice(1), 500);
      }

    } catch (error) {
      console.warn('Home page image preloading failed:', error);
    }
  }
};

export default imagePreloader;