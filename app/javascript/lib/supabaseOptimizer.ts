// Supabase 성능 최적화 유틸리티
import { supabase } from './supabaseClient';

// 🚀 쿼리 캐시 시스템
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class SupabaseQueryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5분

  // 캐시 키 생성
  private generateCacheKey(table: string, query: any): string {
    return `${table}:${JSON.stringify(query)}`;
  }

  // 캐시에서 데이터 가져오기
  get<T>(table: string, query: any, customCacheTime?: number): T | null {
    const key = this.generateCacheKey(table, query);
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now > entry.timestamp + (customCacheTime || this.DEFAULT_CACHE_TIME)) {
      this.cache.delete(key); // 만료된 캐시 삭제
      return null;
    }
    
    console.log(`💨 캐시에서 데이터 반환: ${key}`);
    return entry.data;
  }

  // 캐시에 데이터 저장
  set<T>(table: string, query: any, data: T, customCacheTime?: number): void {
    const key = this.generateCacheKey(table, query);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: customCacheTime || this.DEFAULT_CACHE_TIME
    };
    
    this.cache.set(key, entry);
    console.log(`💾 캐시에 데이터 저장: ${key}`);
    
    // 캐시 크기 제한 (500개 초과시 오래된 것부터 삭제)
    if (this.cache.size > 500) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  // 특정 테이블 캐시 무효화
  invalidate(table: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${table}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`🗑️ ${table} 테이블 캐시 ${keysToDelete.length}개 무효화`);
  }

  // 전체 캐시 클리어
  clear(): void {
    this.cache.clear();
    console.log('🧹 전체 캐시 클리어');
  }

  // 캐시 통계
  getStats(): { size: number; tables: string[] } {
    const tables = Array.from(this.cache.keys()).map(key => key.split(':')[0]);
    const uniqueTables = Array.from(new Set(tables));
    return {
      size: this.cache.size,
      tables: uniqueTables
    };
  }
}

// 전역 캐시 인스턴스
export const queryCache = new SupabaseQueryCache();

// 🔥 배치 쿼리 처리기
interface BatchQuery {
  id: string;
  table: string;
  query: any;
  resolve: (data: any) => void;
  reject: (error: any) => void;
}

class BatchQueryProcessor {
  private queryQueue: BatchQuery[] = [];
  private processing = false;
  private readonly BATCH_SIZE = 5;
  private readonly BATCH_DELAY = 100; // 100ms 대기 후 배치 처리

  // 배치에 쿼리 추가
  async addQuery<T>(table: string, query: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const batchQuery: BatchQuery = {
        id: `${table}-${Date.now()}-${Math.random()}`,
        table,
        query,
        resolve,
        reject
      };

      this.queryQueue.push(batchQuery);
      this.scheduleBatchProcessing();
    });
  }

  // 배치 처리 스케줄링
  private scheduleBatchProcessing(): void {
    if (this.processing) return;

    this.processing = true;
    setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  }

  // 배치 처리 실행
  private async processBatch(): Promise<void> {
    if (this.queryQueue.length === 0) {
      this.processing = false;
      return;
    }

    const batch = this.queryQueue.splice(0, this.BATCH_SIZE);
    console.log(`🚀 배치 쿼리 처리 시작: ${batch.length}개`);

    // 테이블별로 그룹화
    const groupedQueries = new Map<string, BatchQuery[]>();
    batch.forEach(query => {
      if (!groupedQueries.has(query.table)) {
        groupedQueries.set(query.table, []);
      }
      groupedQueries.get(query.table)!.push(query);
    });

    // 테이블별로 병렬 처리
    const promises = Array.from(groupedQueries.entries()).map(async ([table, queries]) => {
      return this.processTableQueries(table, queries);
    });

    await Promise.allSettled(promises);
    
    // 남은 쿼리가 있으면 계속 처리
    if (this.queryQueue.length > 0) {
      setTimeout(() => this.processBatch(), this.BATCH_DELAY);
    } else {
      this.processing = false;
    }
  }

  // 특정 테이블 쿼리들 처리
  private async processTableQueries(table: string, queries: BatchQuery[]): Promise<void> {
    for (const query of queries) {
      try {
        // 캐시 확인
        const cacheKey = query.query;
        const cachedData = queryCache.get(table, cacheKey);
        
        if (cachedData) {
          query.resolve(cachedData);
          continue;
        }

        // 실제 쿼리 실행
        const { data, error } = await this.executeQuery(table, query.query);
        
        if (error) {
          console.error(`❌ ${table} 쿼리 실행 실패:`, error);
          query.reject(error);
        } else {
          // 캐시에 저장
          queryCache.set(table, query.query, data);
          query.resolve(data);
        }
      } catch (err) {
        console.error(`❌ 배치 쿼리 처리 오류 (${table}):`, err);
        query.reject(err);
      }
    }
  }

  // 실제 Supabase 쿼리 실행
  private async executeQuery(table: string, query: any): Promise<{ data: any; error: any }> {
    let supabaseQuery = supabase.from(table).select(query.select || '*');
    
    // 조건 적용
    if (query.eq) {
      Object.entries(query.eq).forEach(([column, value]) => {
        supabaseQuery = supabaseQuery.eq(column, value);
      });
    }
    
    if (query.order) {
      supabaseQuery = supabaseQuery.order(query.order.column, { ascending: query.order.ascending });
    }
    
    if (query.limit) {
      supabaseQuery = supabaseQuery.limit(query.limit);
    }

    if (query.range) {
      supabaseQuery = supabaseQuery.range(query.range.from, query.range.to);
    }

    return await supabaseQuery;
  }
}

// 전역 배치 프로세서 인스턴스  
export const batchProcessor = new BatchQueryProcessor();

// 🎯 최적화된 쿼리 함수들
export const optimizedQueries = {
  // 사용자 정보 조회 (캐시됨)
  async getUser(userId: string, useCache = true): Promise<any> {
    if (useCache) {
      return batchProcessor.addQuery('users', {
        select: '*',
        eq: { id: userId },
        limit: 1
      });
    } else {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    }
  },

  // 게시글 목록 조회 (페이징 + 캐시)
  async getStories(page = 1, limit = 20, useCache = true): Promise<any> {
    const offset = (page - 1) * limit;
    
    if (useCache) {
      return batchProcessor.addQuery('stories', {
        select: 'id, title, content, author_name, like_count, created_at',
        order: { column: 'created_at', ascending: false },
        range: { from: offset, to: offset + limit - 1 }
      });
    } else {
      const { data, error } = await supabase
        .from('stories')
        .select('id, title, content, author_name, like_count, created_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data;
    }
  },

  // 라운지 글 목록 조회
  async getLoungePosts(page = 1, limit = 20, useCache = true): Promise<any> {
    const offset = (page - 1) * limit;
    
    if (useCache) {
      return batchProcessor.addQuery('lounge_posts', {
        select: 'id, title, content, author_name, like_count, type, created_at',
        order: { column: 'created_at', ascending: false },
        range: { from: offset, to: offset + limit - 1 }
      });
    } else {
      const { data, error } = await supabase
        .from('lounge_posts')
        .select('id, title, content, author_name, like_count, type, created_at')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) throw error;
      return data;
    }
  },

  // 캐시 무효화 (데이터 업데이트 시 호출)
  invalidateCache(table: string): void {
    queryCache.invalidate(table);
  },

  // 전체 캐시 클리어
  clearCache(): void {
    queryCache.clear();
  },

  // 캐시 통계
  getCacheStats() {
    return queryCache.getStats();
  }
};

// 🔧 성능 모니터링
export const performanceMonitor = {
  queryTimes: new Map<string, number[]>(),
  
  // 쿼리 시간 기록
  recordQueryTime(queryName: string, duration: number): void {
    if (!this.queryTimes.has(queryName)) {
      this.queryTimes.set(queryName, []);
    }
    
    const times = this.queryTimes.get(queryName)!;
    times.push(duration);
    
    // 최근 100개 기록만 유지
    if (times.length > 100) {
      times.shift();
    }
  },
  
  // 평균 쿼리 시간 계산
  getAverageQueryTime(queryName: string): number {
    const times = this.queryTimes.get(queryName);
    if (!times || times.length === 0) return 0;
    
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  },
  
  // 성능 통계 리포트
  getPerformanceReport(): { [key: string]: { avg: number; count: number; max: number; min: number } } {
    const report: { [key: string]: { avg: number; count: number; max: number; min: number } } = {};
    
    for (const [queryName, times] of this.queryTimes) {
      report[queryName] = {
        avg: Math.round(times.reduce((sum, time) => sum + time, 0) / times.length),
        count: times.length,
        max: Math.max(...times),
        min: Math.min(...times)
      };
    }
    
    return report;
  }
};