// Supabase 기반 데이터 관리 서비스
// 세션스토리지를 완전히 대체하는 실제 데이터베이스 서비스

import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/database';
import { retryWithBackoff, LastKnownGoodDataManager } from '../utils/connectionUtils';

// 타입 정의
type Tables = Database['public']['Tables'];
type User = Tables['users']['Row'];
type Story = Tables['stories']['Row'];
type LoungePost = Tables['lounge_posts']['Row'];
type Comment = Tables['comments']['Row'];
type Like = Tables['likes']['Row'];
type Scrap = Tables['scraps']['Row'];

// ===========================================================================
// 사용자 관리 서비스
// ===========================================================================

export const userService = {
  // DB 사용자 데이터를 AuthContext User 인터페이스로 변환하는 헬퍼 함수
  transformUserFromDB(data: any) {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      provider: data.provider,
      avatar: data.avatar_url,
      bio: data.bio,
      isAdmin: data.is_admin,
      isVerified: data.is_verified,
      emailNotifications: data.email_notifications,
      pushNotifications: data.push_notifications,
      weeklyDigest: data.weekly_digest,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  // 현재 사용자 정보 조회
  async getCurrentUser() {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) return null;

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.warn('사용자 정보 조회 실패:', error);
        return null;
      }

      return this.transformUserFromDB(userData);
    } catch (error) {
      console.warn('getCurrentUser 에러:', error);
      return null;
    }
  },

  // 사용자별 통계 정보 조회
  async getUserStats(userId: string) {
    try {
      // 총 좋아요 수, 스크랩 수, 작성한 글 수, 댓글 수 통합 조회
      const [storiesData, loungeData, commentsData, likesData, scrapsData] = await Promise.all([
        // 사용자가 작성한 스토리
        supabase
          .from('stories')
          .select('like_count, scrap_count')
          .eq('author_id', userId),
        
        // 사용자가 작성한 라운지 글
        supabase
          .from('lounge_posts')
          .select('like_count, scrap_count')
          .eq('author_id', userId),
        
        // 사용자가 작성한 댓글
        supabase
          .from('comments')
          .select('id')
          .eq('author_id', userId),
        
        // 사용자가 받은 좋아요 수 (스토리 + 라운지)
        supabase
          .rpc('get_user_total_likes', { user_id: userId }),
        
        // 사용자가 받은 스크랩 수
        supabase
          .rpc('get_user_total_scraps', { user_id: userId })
      ]);

      const stories = storiesData.data || [];
      const loungePosts = loungeData.data || [];
      const comments = commentsData.data || [];
      
      const totalPosts = stories.length + loungePosts.length;
      const totalComments = comments.length;
      
      // 좋아요와 스크랩은 RPC 함수 결과 또는 직접 계산
      let totalLikes = 0;
      let totalScraps = 0;

      if (likesData.data !== null) {
        totalLikes = likesData.data;
      } else {
        // RPC 함수가 없다면 직접 계산
        totalLikes = stories.reduce((sum, post) => sum + (post.like_count || 0), 0) +
                    loungePosts.reduce((sum, post) => sum + (post.like_count || 0), 0);
      }

      if (scrapsData.data !== null) {
        totalScraps = scrapsData.data;
      } else {
        // RPC 함수가 없다면 직접 계산
        totalScraps = stories.reduce((sum, post) => sum + (post.scrap_count || 0), 0) +
                     loungePosts.reduce((sum, post) => sum + (post.scrap_count || 0), 0);
      }

      return {
        totalPosts,
        totalComments,
        totalLikes,
        totalScraps
      };
    } catch (error) {
      console.warn('getUserStats 에러:', error);
      return {
        totalPosts: 0,
        totalComments: 0,
        totalLikes: 0,
        totalScraps: 0
      };
    }
  },

  // 사용자 정보 업데이트
  async updateProfile(userId: string, updates: Partial<{
    name: string;
    email: string;
    avatar: string;
    bio: string;
    isAdmin: boolean;
    isVerified: boolean;
  }>) {
    try {
      console.log('프로필 업데이트 시도:', userId, updates);
      
      // DB 컬럼명에 맞춰 변환
      const dbUpdates: any = {};
      
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.avatar) dbUpdates.avatar_url = updates.avatar;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.isAdmin !== undefined) dbUpdates.is_admin = updates.isAdmin;
      if (updates.isVerified !== undefined) dbUpdates.is_verified = updates.isVerified;
      
      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('프로필 업데이트 DB 에러:', error);
        throw error;
      }
      
      console.log('프로필 업데이트 성공:', data);
      return this.transformUserFromDB(data);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      throw error;
    }
  },

  // 사용자 생성 (가입 시)
  async createUser(userData: {
    id: string;
    email: string;
    name: string;
    provider: 'kakao' | 'google' | 'admin';
    avatar?: string;
    is_admin?: boolean;
    is_verified?: boolean;
    avatar_url?: string;
    bio?: string;
  }) {
    try {
      console.log('사용자 생성 시도:', userData);
      
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          provider: userData.provider,
          avatar_url: userData.avatar_url || userData.avatar || null,
          is_admin: userData.is_admin ?? false,
          is_verified: userData.is_verified ?? false,
          bio: userData.bio || null,
          email_notifications: true,
          push_notifications: true,
          weekly_digest: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('사용자 생성 DB 에러:', error);
        throw error;
      }
      
      console.log('사용자 생성 성공:', data);
      return this.transformUserFromDB(data);
    } catch (error) {
      console.error('사용자 생성 실패:', error);
      throw error;
    }
  },

  // 로그인 시간 업데이트
  async updateLastLogin(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.warn('로그인 시간 업데이트 실패:', error);
      }
    } catch (error) {
      console.warn('updateLastLogin 에러:', error);
    }
  },

  // 사용자 ID로 사용자 정보 조회
  async getById(userId: string) {
    try {
      console.log(`🔍 userService.getById 호출됨. 검색할 ID: ${userId}`);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      console.log('🔍 Supabase 응답:', { data, error });

      if (error) {
        console.error('❌ 사용자 정보 조회 실패:', error);
        console.error('❌ 에러 코드:', error.code);
        console.error('❌ 에러 메시지:', error.message);
        return null;
      }

      if (data) {
        console.log('✅ DB에서 사용자 발견:', data.name, data.id);
        return this.transformUserFromDB(data);
      } else {
        console.warn('⚠️ 사용자 데이터 없음');
        return null;
      }
    } catch (error) {
      console.error('❌ getById 에러:', error);
      return null;
    }
  },

  // 모든 사용자 조회 (관리자용)
  async getAll(page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('getAllUsers 에러:', error);
        throw error;
      }

      return {
        users: data.map(user => this.transformUserFromDB(user)),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page
      };
    } catch (error) {
      console.error('getAllUsers 에러:', error);
      return {
        users: [],
        total: 0,
        totalPages: 0,
        currentPage: page
      };
    }
  },

  // 사용자가 작성한 Story 조회
  async getStoriesByAuthor(userId: string) {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('getStoriesByAuthor 에러:', error);
        throw error;
      }

      return { stories: data || [] };
    } catch (error) {
      console.error('getStoriesByAuthor 에러:', error);
      return { stories: [] };
    }
  },

  // 사용자가 작성한 Lounge 글 조회
  async getLoungePostsByAuthor(userId: string) {
    try {
      const { data, error } = await supabase
        .from('lounge_posts')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('getLoungePostsByAuthor 에러:', error);
        throw error;
      }

      return { posts: data || [] };
    } catch (error) {
      console.error('getLoungePostsByAuthor 에러:', error);
      return { posts: [] };
    }
  },

  // 사용자 삭제 (관리자용)
  async deleteUser(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('사용자 삭제 에러:', error);
        throw error;
      }

      console.log('사용자 삭제 성공:', userId);
      return true;
    } catch (error) {
      console.error('deleteUser 에러:', error);
      throw error;
    }
  },

  // 사용자 검색 (관리자용)
  async searchUsers(query: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('searchUsers 에러:', error);
        throw error;
      }

      return {
        users: data.map(user => this.transformUserFromDB(user)),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page
      };
    } catch (error) {
      console.error('searchUsers 에러:', error);
      return {
        users: [],
        total: 0,
        totalPages: 0,
        currentPage: page
      };
    }
  },

  // 관리자 권한 부여/해제
  async toggleAdminStatus(userId: string, isAdmin: boolean) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          is_admin: isAdmin,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('관리자 권한 변경 에러:', error);
        throw error;
      }

      console.log(`관리자 권한 ${isAdmin ? '부여' : '해제'} 성공:`, userId);
      return this.transformUserFromDB(data);
    } catch (error) {
      console.error('toggleAdminStatus 에러:', error);
      throw error;
    }
  },

  // 인사담당자 권한 부여/해제
  async toggleVerifiedStatus(userId: string, isVerified: boolean) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ 
          is_verified: isVerified,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('인사담당자 권한 변경 에러:', error);
        throw error;
      }

      console.log(`인사담당자 권한 ${isVerified ? '부여' : '해제'} 성공:`, userId);
      return this.transformUserFromDB(data);
    } catch (error) {
      console.error('toggleVerifiedStatus 에러:', error);
      throw error;
    }
  },

  // 사용자 레벨 정보 조회 (캐시 포함)
  async getUserLevel(userId: string) {
    try {
      console.log('📊 getUserLevel 호출:', userId);
      
      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // 레코드가 없는 경우 기본값으로 새로 생성
          console.log('레벨 데이터가 없음, 기본값으로 생성:', userId);
          return await this.createUserLevel(userId);
        }
        console.error('getUserLevel DB 에러:', error);
        throw error;
      }

      console.log('✅ getUserLevel 성공:', data);
      return data;
    } catch (error) {
      console.error('getUserLevel 에러:', error);
      // 에러 시 기본값 반환
      return {
        user_id: userId,
        level: 1,
        current_exp: 0,
        total_likes: 0,
        story_promotions: 0,
        total_bookmarks: 0,
        total_posts: 0,
        total_comments: 0,
        excellent_posts: 0,
        achievements: [],
        last_level_up: null
      };
    }
  },

  // 사용자 레벨 정보 생성 (기본값)
  async createUserLevel(userId: string) {
    try {
      console.log('📊 createUserLevel 호출:', userId);
      
      const defaultLevel = {
        user_id: userId,
        level: 1,
        current_exp: 0,
        total_likes: 0,
        story_promotions: 0,
        total_bookmarks: 0,
        total_posts: 0,
        total_comments: 0,
        excellent_posts: 0,
        achievements: [],
        last_level_up: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('user_levels')
        .insert([defaultLevel])
        .select()
        .single();

      if (error) {
        console.error('createUserLevel DB 에러:', error);
        throw error;
      }

      console.log('✅ createUserLevel 성공:', data);
      return data;
    } catch (error) {
      console.error('createUserLevel 에러:', error);
      // 에러 시 기본값 반환
      return {
        user_id: userId,
        level: 1,
        current_exp: 0,
        total_likes: 0,
        story_promotions: 0,
        total_bookmarks: 0,
        total_posts: 0,
        total_comments: 0,
        excellent_posts: 0,
        achievements: [],
        last_level_up: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }
};
// ===========================================================================
// 라운지 관리 서비스
// ===========================================================================

export const loungeService = {
  // 모든 라운지 글 조회 (재시도 메커니즘 포함)
  async getAll(page = 1, limit = 20, type?: string, sortBy: 'latest' | 'popular' | 'comments' = 'latest') {
    const cacheKey = `lounge_${page}_${limit}_${type || 'all'}_${sortBy}`;
    
    try {
      console.log('🗣️ 라운지 글 조회 시작:', { page, limit, type, sortBy });
      
      const result = await retryWithBackoff(async () => {
        const offset = (page - 1) * limit;
        
        let query = supabase
          .from('lounge_posts')
          .select('*')
          .range(offset, offset + limit - 1);
        
        // 타입 필터링
        if (type && type !== 'all') {
          query = query.eq('type', type);
        }
        
        // 정렬 적용
        switch (sortBy) {
          case 'popular':
            query = query.order('like_count', { ascending: false });
            break;
          case 'comments':
            query = query.order('comment_count', { ascending: false });
            break;
          case 'latest':
          default:
            query = query.order('created_at', { ascending: false });
            break;
        }

        const { data, error } = await query;

        if (error) throw error;
        
        return {
          posts: data || [],
          hasMore: data && data.length === limit,
          total: data?.length || 0
        };
      });

      console.log(`✅ 라운지 글 ${result.posts.length}개 조회 완료`);
      return result;
      
    } catch (error) {
      console.error('라운지 글 조회 실패:', error);
      
      // Last Known Good Data 반환
      const fallbackData = LastKnownGoodDataManager.get(cacheKey);
      if (fallbackData) {
        console.log('💾 라운지 글 캐시 데이터 사용');
        return fallbackData;
      }
      
      return { posts: [], hasMore: false, total: 0 };
    }
  },

  // 인기 라운지 글 조회 (좋아요 순)
  async getPopular(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('lounge_posts')
        .select('*')
        .gte('like_count', 1) // 최소 1개 이상의 좋아요
        .order('like_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      console.log(`✅ 인기 라운지 글 ${data.length}개 조회 완료`);
      return { posts: data || [] };
    } catch (error) {
      console.error('인기 라운지 글 조회 실패:', error);
      return { posts: [] };
    }
  },

  // 라운지 글 상세 조회
  async getById(id: number) {
    try {
      console.log('🗣️ 라운지 글 상세 조회:', id);
      
      const { data, error } = await supabase
        .from('lounge_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('라운지 글이 존재하지 않음:', id);
          return null;
        }
        throw error;
      }
      
      // 조회수 증가
      await this.incrementViewCount(id);
      
      console.log('✅ 라운지 글 상세 조회 완료:', data.title);
      return data;
    } catch (error) {
      console.error('라운지 글 상세 조회 실패:', error);
      return null;
    }
  },

  // 조회수 증가
  async incrementViewCount(postId: number) {
    try {
      // 현재 조회수를 조회하고 1 증가
      const { data: currentPost } = await supabase
        .from('lounge_posts')
        .select('view_count')
        .eq('id', postId)
        .single();

      const newViewCount = (currentPost?.view_count || 0) + 1;

      const { error } = await supabase
        .from('lounge_posts')
        .update({ view_count: newViewCount })
        .eq('id', postId);

      if (error) {
        console.warn('조회수 증가 실패:', error);
      }
    } catch (error) {
      console.warn('incrementViewCount 에러:', error);
    }
  },

  // 라운지 글 생성
  async create(postData: {
    title: string;
    content: string;
    author_id: string;
    author_name: string;
    type: string;
    tags?: string[];
  }) {
    try {
      console.log('라운지 글 생성 시도:', postData);
      
      const { data, error } = await supabase
        .from('lounge_posts')
        .insert({
          title: postData.title,
          content: postData.content,
          author_id: postData.author_id,
          author_name: postData.author_name,
          type: postData.type as any,
          tags: postData.tags || [],
          like_count: 0,
          scrap_count: 0,
          comment_count: 0,
          view_count: 0,
          is_excellent: false,
          promotion_status: null,
          promotion_note: null,
          reward_claimed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('라운지 글 생성 DB 에러:', error);
        throw error;
      }
      
      console.log('라운지 글 생성 성공:', data);
      
      // 사용자 활동 추가
      await storyService.addUserActivity(postData.author_id, 'post_created');
      
      // 라운지 글 작성 시 사용자 레벨 갱신
      try {
        const { trackDatabaseUserActivity } = await import('../services/databaseUserLevelService');
        await trackDatabaseUserActivity(postData.author_id);
        console.log('✅ 라운지 글 작성 후 사용자 레벨 갱신 완료');
      } catch (levelError) {
        console.warn('⚠️ 라운지 글 작성 후 레벨 갱신 실패:', levelError);
      }
      
      return data;
    } catch (error) {
      console.error('라운지 글 생성 실패:', error);
      throw error;
    }
  },

  // 라운지 글 수정
  async update(id: number, updates: Partial<{
    title: string;
    content: string;
    type: string;
    tags: string[];
  }>) {
    try {
      console.log('라운지 글 수정 시도:', id, updates);
      
      const { data, error } = await supabase
        .from('lounge_posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('라운지 글 수정 DB 에러:', error);
        throw error;
      }
      
      console.log('라운지 글 수정 성공:', data);
      return data;
    } catch (error) {
      console.error('라운지 글 수정 실패:', error);
      throw error;
    }
  },

  // 라운지 글 삭제
  async delete(id: number) {
    try {
      console.log('라운지 글 삭제 시도:', id);
      
      // 연관된 댓글, 좋아요, 스크랩도 함께 삭제 (CASCADE 설정 확인)
      const { error } = await supabase
        .from('lounge_posts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('라운지 글 삭제 DB 에러:', error);
        throw error;
      }
      
      console.log('라운지 글 삭제 성공:', id);
      return true;
    } catch (error) {
      console.error('라운지 글 삭제 실패:', error);
      throw error;
    }
  },

  // 라운지 글 검색
  async search(query: string, page = 1, limit = 20, type?: string) {
    try {
      const offset = (page - 1) * limit;
      
      let queryBuilder = supabase
        .from('lounge_posts')
        .select('*')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,author_name.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (type && type !== 'all') {
        queryBuilder = queryBuilder.eq('type', type);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      
      console.log(`✅ 라운지 글 검색 결과: ${data.length}개`);
      return {
        posts: data || [],
        hasMore: data && data.length === limit,
        total: data?.length || 0
      };
    } catch (error) {
      console.error('라운지 글 검색 실패:', error);
      return { posts: [], hasMore: false, total: 0 };
    }
  },

  // 사용자가 작성한 라운지 글 조회
  async getByAuthor(authorId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error } = await supabase
        .from('lounge_posts')
        .select('*')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      console.log(`✅ 사용자 라운지 글 ${data.length}개 조회 완료`);
      return {
        posts: data || [],
        hasMore: data && data.length === limit,
        total: data?.length || 0
      };
    } catch (error) {
      console.error('사용자 라운지 글 조회 실패:', error);
      return { posts: [], hasMore: false, total: 0 };
    }
  },

  // 사용자가 작성한 Story 글 목록 조회
  async getStoriesByAuthor(userId: string) {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('id, title, content, like_count, created_at')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('getStoriesByAuthor 에러:', error);
        throw error;
      }

      return { stories: data || [] };
    } catch (error) {
      console.error('getStoriesByAuthor 에러:', error);
      return { stories: [] };
    }
  },

  // 사용자가 작성한 Lounge 글 목록 조회
  async getLoungePostsByAuthor(userId: string) {
    try {
      const { data, error } = await supabase
        .from('lounge_posts')
        .select('id, title, content, like_count, created_at')
        .eq('author_id', userId)  // ✅ user_id → author_id 수정
        .order('created_at', { ascending: false });

      if (error) {
        console.error('getLoungePostsByAuthor 에러:', error);
        throw error;
      }

      return { posts: data || [] };
    } catch (error) {
      console.error('getLoungePostsByAuthor 에러:', error);
      return { posts: [] };
    }
  }
};

// ===========================================================================
// 스토리 관리 서비스
// ===========================================================================

export const storyService = {
  // 모든 스토리 조회 (재시도 메커니즘 포함)
  async getAll(page = 1, limit = 20) {
    const cacheKey = `stories_${page}_${limit}`;
    
    try {
      console.log('📚 스토리 조회 시작:', { page, limit });
      
      const result = await retryWithBackoff(async () => {
        const offset = (page - 1) * limit;
        
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) throw error;
        
        return {
          stories: data || [],
          hasMore: data && data.length === limit,
          total: data?.length || 0
        };
      });

      console.log(`✅ 스토리 ${result.stories.length}개 조회 완료`);
      
      // Last Known Good Data 저장
      LastKnownGoodDataManager.save(cacheKey, result);
      
      return result;
      
    } catch (error) {
      console.error('스토리 조회 실패:', error);
      
      // Last Known Good Data 반환
      const fallbackData = LastKnownGoodDataManager.get(cacheKey);
      if (fallbackData) {
        console.log('💾 스토리 캐시 데이터 사용');
        return fallbackData;
      }
      
      return { stories: [], hasMore: false, total: 0 };
    }
  },

  // 인기 스토리 조회 (좋아요 순)
  async getPopular(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .gte('like_count', 5) // 최소 5개 이상의 좋아요
        .order('like_count', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      console.log(`✅ 인기 스토리 ${data.length}개 조회 완료`);
      return { stories: data || [] };
    } catch (error) {
      console.error('인기 스토리 조회 실패:', error);
      return { stories: [] };
    }
  },

  // 스토리 상세 조회
  async getById(id: number) {
    try {
      console.log('📚 스토리 상세 조회:', id);
      
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.warn('스토리가 존재하지 않음:', id);
          return null;
        }
        throw error;
      }
      
      // 조회수 증가
      await this.incrementViewCount(id);
      
      console.log('✅ 스토리 상세 조회 완료:', data.title);
      return data;
    } catch (error) {
      console.error('스토리 상세 조회 실패:', error);
      return null;
    }
  },

  // 조회수 증가
  async incrementViewCount(storyId: number) {
    try {
      // 현재 조회수를 조회하고 1 증가
      const { data: currentStory } = await supabase
        .from('stories')
        .select('view_count')
        .eq('id', storyId)
        .single();

      const newViewCount = (currentStory?.view_count || 0) + 1;

      const { error } = await supabase
        .from('stories')
        .update({ view_count: newViewCount })
        .eq('id', storyId);

      if (error) {
        console.warn('스토리 조회수 증가 실패:', error);
      }
    } catch (error) {
      console.warn('incrementViewCount 에러:', error);
    }
  },

  // 스토리 생성
  async create(storyData: {
    title: string;
    summary: string;
    content: string;
    author_id: string;
    author_name: string;
    category?: string;
    tags?: string[];
    image_url?: string;
    read_time?: number;
  }) {
    try {
      console.log('스토리 생성 시도:', storyData);
      
      const { data, error } = await supabase
        .from('stories')
        .insert({
          title: storyData.title,
          summary: storyData.summary,
          content: storyData.content,
          author_id: storyData.author_id,
          author_name: storyData.author_name,
          category: storyData.category,
          tags: storyData.tags || [],
          image_url: storyData.image_url,
          read_time: storyData.read_time || 1,
          like_count: 0,
          scrap_count: 0,
          view_count: 0,
          comment_count: 0,
          is_verified: false,
          verification_badge: null,
          is_from_lounge: false,
          original_lounge_post_id: null,
          original_author_name: null,
          promoted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          published_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('스토리 생성 DB 에러:', error);
        throw error;
      }
      
      console.log('스토리 생성 성공:', data);

      // 사용자 활동 추가
      await this.addUserActivity(storyData.author_id, 'post_created');

      // Story 작성 시 사용자 레벨 갱신
      try {
        const { trackDatabaseUserActivity } = await import('../services/databaseUserLevelService');
        await trackDatabaseUserActivity(storyData.author_id);
        console.log('✅ Story 작성 후 사용자 레벨 갱신 완료');
      } catch (levelError) {
        console.warn('⚠️ Story 작성 후 레벨 갱신 실패:', levelError);
      }

      return data;
    } catch (error) {
      console.error('스토리 생성 실패:', error);
      throw error;
    }
  },

  // 스토리 수정
  async update(id: number, updates: Partial<{
    title: string;
    summary: string;
    content: string;
    category: string;
    tags: string[];
    image_url: string;
  }>) {
    try {
      console.log('스토리 수정 시도:', id, updates);
      
      const { data, error } = await supabase
        .from('stories')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('스토리 수정 DB 에러:', error);
        throw error;
      }
      
      console.log('스토리 수정 성공:', data);
      return data;
    } catch (error) {
      console.error('스토리 수정 실패:', error);
      throw error;
    }
  },

  // 스토리 삭제
  async delete(id: number) {
    try {
      console.log('스토리 삭제 시도:', id);
      
      // 연관된 댓글, 좋아요, 스크랩도 함께 삭제 (CASCADE 설정 확인)
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('스토리 삭제 DB 에러:', error);
        throw error;
      }
      
      console.log('스토리 삭제 성공:', id);
      return true;
    } catch (error) {
      console.error('스토리 삭제 실패:', error);
      throw error;
    }
  },

  // 스토리 검색
  async search(query: string, page = 1, limit = 20, category?: string) {
    try {
      const offset = (page - 1) * limit;
      
      let queryBuilder = supabase
        .from('stories')
        .select('*')
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%,author_name.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (category && category !== 'all') {
        queryBuilder = queryBuilder.eq('category', category);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      
      console.log(`✅ 스토리 검색 결과: ${data.length}개`);
      return {
        stories: data || [],
        hasMore: data && data.length === limit,
        total: data?.length || 0
      };
    } catch (error) {
      console.error('스토리 검색 실패:', error);
      return { stories: [], hasMore: false, total: 0 };
    }
  },

  // 사용자가 작성한 스토리 조회
  async getByAuthor(authorId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      console.log(`✅ 사용자 스토리 ${data.length}개 조회 완료`);
      return {
        stories: data || [],
        hasMore: data && data.length === limit,
        total: data?.length || 0
      };
    } catch (error) {
      console.error('사용자 스토리 조회 실패:', error);
      return { stories: [], hasMore: false, total: 0 };
    }
  },

  // 카테고리별 스토리 조회
  async getByCategory(category: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      console.log(`✅ 카테고리별 스토리 ${data.length}개 조회 완료`);
      return {
        stories: data || [],
        hasMore: data && data.length === limit,
        total: data?.length || 0
      };
    } catch (error) {
      console.error('카테고리별 스토리 조회 실패:', error);
      return { stories: [], hasMore: false, total: 0 };
    }
  },

  // 사용자 활동 기록 추가
  async addUserActivity(userId: string, activityType: 'post_created' | 'comment_created' | 'like_received' | 'bookmarked' | 'excellent_post' | 'story_promoted') {
    try {
      const expGained = this.getExpForActivity(activityType);
      
      const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: activityType,
          amount: 1,
          exp_gained: expGained,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.warn('사용자 활동 기록 실패:', error);
      } else {
        console.log(`✅ 사용자 활동 기록: ${userId} - ${activityType} (+${expGained} EXP)`);
      }
    } catch (error) {
      console.warn('addUserActivity 에러:', error);
    }
  },

  // 활동별 경험치 계산
  getExpForActivity(activityType: string): number {
    const EXP_MAP: Record<string, number> = {
      post_created: 50,
      comment_created: 10,
      like_received: 5,
      bookmarked: 3,
      excellent_post: 100,
      story_promoted: 200
    };
    
    return EXP_MAP[activityType] || 0;
  },

  // 스토리 인증 처리
  async verifyStory(storyId: number, isVerified: boolean, badge?: string) {
    try {
      const { data, error } = await supabase
        .from('stories')
        .update({
          is_verified: isVerified,
          verification_badge: badge || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)
        .select()
        .single();

      if (error) throw error;
      
      console.log(`✅ 스토리 인증 ${isVerified ? '승인' : '해제'}:`, storyId);
      return data;
    } catch (error) {
      console.error('스토리 인증 처리 실패:', error);
      throw error;
    }
  },

  // 우수글 마크 처리
  async markAsExcellent(storyId: number, isExcellent: boolean) {
    try {
      // 우수글 마크는 verification_badge로 처리
      const badge = isExcellent ? 'excellent' : null;
      
      const { data, error } = await supabase
        .from('stories')
        .update({
          is_verified: isExcellent,
          verification_badge: badge,
          updated_at: new Date().toISOString()
        })
        .eq('id', storyId)
        .select()
        .single();

      if (error) throw error;
      
      console.log(`✅ 우수글 마크 ${isExcellent ? '설정' : '해제'}:`, storyId);
      
      // 우수글 설정 시 작성자에게 경험치 추가
      if (isExcellent && data.author_id) {
        await this.addUserActivity(data.author_id, 'excellent_post');
      }
      
      return data;
    } catch (error) {
      console.error('우수글 마크 처리 실패:', error);
      throw error;
    }
  }
};

// ===========================================================================
// 댓글 관리 서비스
// ===========================================================================

export const commentService = {
  // 포스트별 댓글 조회 (작성자 프로필 및 레벨 포함)
  async getByPost(postId: number, postType: 'story' | 'lounge') {
    try {
      console.log(`📝 댓글 조회 시작: ${postType} ${postId}`);

      // 댓글과 함께 작성자 프로필 정보(avatar_url 포함) 및 레벨 조회
      const { data: allComments, error } = await supabase
        .from('comments')
        .select(`
          *,
          author_profile:users!comments_author_id_fkey(
            id,
            name,
            avatar_url,
            provider,
            is_verified
          ),
          author_level:user_levels!comments_author_id_fkey(
            level,
            current_exp
          )
        `)
        .eq('post_id', postId)
        .eq('post_type', postType)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('댓글 조회 오류:', error);
        // 외래키 오류 시 단순 조회로 폴백
        const { data: fallbackComments, error: fallbackError } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', postId)
          .eq('post_type', postType)
          .order('created_at', { ascending: true });

        if (fallbackError) throw fallbackError;

        // 작성자 정보 및 레벨을 별도로 조회
        const enrichedComments = await Promise.all((fallbackComments || []).map(async (comment) => {
          if (comment.author_id && !comment.is_guest) {
            // 사용자 프로필 조회
            const { data: authorProfile } = await supabase
              .from('users')
              .select('id, name, avatar_url, provider, is_verified')
              .eq('id', comment.author_id)
              .single();

            // 사용자 레벨 조회
            const { data: authorLevel } = await supabase
              .from('user_levels')
              .select('level, current_exp')
              .eq('user_id', comment.author_id)
              .single();

            return {
              ...comment,
              author_profile: authorProfile,
              author_level: authorLevel,
              author_avatar_url: authorProfile?.avatar_url || null,
              authorLevel: authorLevel?.level || 1
            };
          }
          return {
            ...comment,
            author_avatar_url: null,
            authorLevel: 1
          };
        }));

        const parentComments = enrichedComments.filter(comment => !comment.parent_id);
        const replyComments = enrichedComments.filter(comment => comment.parent_id);

        const commentsWithReplies = parentComments.map(parent => ({
          ...parent,
          replies: replyComments.filter(reply => reply.parent_id === parent.id)
        }));

        return commentsWithReplies;
      }

      console.log(`✅ ${allComments?.length || 0}개 댓글 조회 완료`);

      // 작성자 avatar_url과 level을 댓글 객체에 추가
      const processedComments = (allComments || []).map(comment => ({
        ...comment,
        author_avatar_url: comment.author_profile?.avatar_url || null,
        authorLevel: comment.author_level?.level || 1
      }));

      // 부모 댓글과 답글로 분류
      const parentComments = processedComments.filter(comment => !comment.parent_id);
      const replyComments = processedComments.filter(comment => comment.parent_id);

      // 각 부모 댓글에 답글 추가
      const commentsWithReplies = parentComments.map(parent => ({
        ...parent,
        replies: replyComments.filter(reply => reply.parent_id === parent.id)
      }));

      return commentsWithReplies;
    } catch (error) {
      console.error('getByPost comments 에러:', error);
      throw error;
    }
  },

  // 댓글 생성
  async create(commentData: Tables['comments']['Insert']) {
    try {
      console.log('댓글 생성 시도:', commentData);
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          ...commentData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('댓글 생성 DB 에러:', error);
        throw error;
      }
      
      console.log('댓글 생성 성공:', data);
      
      // 사용자 활동 추가 (게스트가 아닌 경우)
      if (commentData.author_id && !commentData.is_guest) {
        await storyService.addUserActivity(commentData.author_id, 'comment_created');

        // 댓글 작성 시 사용자 레벨 갱신
        try {
          const { trackDatabaseUserActivity } = await import('../services/databaseUserLevelService');
          await trackDatabaseUserActivity(commentData.author_id);
          console.log('✅ 댓글 작성 후 사용자 레벨 갱신 완료');
        } catch (levelError) {
          console.warn('⚠️ 댓글 작성 후 레벨 갱신 실패:', levelError);
        }
      }
      
      return data;
    } catch (error) {
      console.error('댓글 생성 실패:', error);
      throw error;
    }
  },

  // 댓글 수정
  async update(id: number, content: string, password?: string) {
    try {
      console.log('댓글 수정 시도:', id);
      
      // 게스트 댓글인 경우 비밀번호 확인
      if (password) {
        const { data: comment, error: fetchError } = await supabase
          .from('comments')
          .select('guest_password, is_guest')
          .eq('id', id)
          .single();

        if (fetchError || !comment) {
          throw new Error('댓글을 찾을 수 없습니다.');
        }

        if (!comment.is_guest || comment.guest_password !== password) {
          throw new Error('비밀번호가 올바르지 않습니다.');
        }
      }
      
      const { data, error } = await supabase
        .from('comments')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('댓글 수정 DB 에러:', error);
        throw error;
      }
      
      console.log('댓글 수정 성공:', data);
      return data;
    } catch (error) {
      console.error('댓글 수정 실패:', error);
      throw error;
    }
  },

  // 댓글 삭제
  async delete(id: number, password?: string) {
    try {
      console.log('댓글 삭제 시도:', id);
      
      // 게스트 댓글인 경우 비밀번호 확인
      if (password) {
        const { data: comment, error: fetchError } = await supabase
          .from('comments')
          .select('guest_password, is_guest')
          .eq('id', id)
          .single();

        if (fetchError || !comment) {
          throw new Error('댓글을 찾을 수 없습니다.');
        }

        if (!comment.is_guest || comment.guest_password !== password) {
          throw new Error('비밀번호가 올바르지 않습니다.');
        }
      }
      
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('댓글 삭제 DB 에러:', error);
        throw error;
      }
      
      console.log('댓글 삭제 성공:', id);
      return true;
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      throw error;
    }
  },

  // 모든 댓글 조회 (관리자용)
  async getAll(page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('comments')
        .select(`
          *,
          author_profile:users(
            id,
            name,
            avatar_url
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      return {
        comments: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page
      };
    } catch (error) {
      console.error('모든 댓글 조회 실패:', error);
      return {
        comments: [],
        total: 0,
        totalPages: 0,
        currentPage: page
      };
    }
  },

  // 사용자가 작성한 댓글 조회
  async getByAuthor(authorId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      console.log(`✅ 사용자 댓글 ${data.length}개 조회 완료`);
      return {
        comments: data || [],
        hasMore: data && data.length === limit,
        total: data?.length || 0
      };
    } catch (error) {
      console.error('사용자 댓글 조회 실패:', error);
      return { comments: [], hasMore: false, total: 0 };
    }
  }
};

// ===========================================================================
// 상호작용 관리 서비스 (좋아요, 스크랩)
// ===========================================================================

export const interactionService = {
  // 좋아요 토글
  async toggleLike(userId: string, postId: number, postType: 'story' | 'lounge') {
    try {
      console.log('좋아요 토글 시도:', { userId, postId, postType });
      
      // 기존 좋아요 확인
      const { data: existingLike, error: fetchError } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .eq('post_type', postType)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const table = postType === 'story' ? 'stories' : 'lounge_posts';
      
      if (existingLike) {
        // 좋아요 해제
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        if (deleteError) throw deleteError;
        
        // 현재 좋아요 수를 조회하고 1 감소
        const { data: currentPost } = await supabase
          .from(table)
          .select('like_count')
          .eq('id', postId)
          .single();

        const newLikeCount = Math.max(0, (currentPost?.like_count || 0) - 1);

        const { error: updateError } = await supabase
          .from(table)
          .update({ like_count: newLikeCount })
          .eq('id', postId);

        if (updateError) throw updateError;
        
        console.log('✅ 좋아요 해제 완료');
        return { action: 'removed' };
      } else {
        // 좋아요 추가
        const { error: insertError } = await supabase
          .from('likes')
          .insert({
            user_id: userId,
            post_id: postId,
            post_type: postType,
            created_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
        
        // 현재 좋아요 수를 조회하고 1 증가
        const { data: currentPost } = await supabase
          .from(table)
          .select('like_count')
          .eq('id', postId)
          .single();

        const newLikeCount = (currentPost?.like_count || 0) + 1;

        const { error: updateError } = await supabase
          .from(table)
          .update({ like_count: newLikeCount })
          .eq('id', postId);

        if (updateError) throw updateError;
        
        console.log('✅ 좋아요 추가 완료');
        
        // 작성자에게 경험치 추가 (본인이 아닌 경우)
        const { data: post } = await supabase
          .from(table)
          .select('author_id')
          .eq('id', postId)
          .single();
          
        if (post?.author_id && post.author_id !== userId) {
          await storyService.addUserActivity(post.author_id, 'like_received');
          
          // 좋아요 받을 때 사용자 레벨 갱신
          try {
            const { trackDatabaseUserActivity } = await import('../services/databaseUserLevelService');
            await trackDatabaseUserActivity(post.author_id);
            console.log('✅ 좋아요 받은 후 사용자 레벨 갱신 완료');
          } catch (levelError) {
            console.warn('⚠️ 좋아요 받은 후 레벨 갱신 실패:', levelError);
          }
        }
        
        return { action: 'added' };
      }
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      throw error;
    }
  },

  // 스크랩 토글
  async toggleScrap(userId: string, postId: number, postType: 'story' | 'lounge') {
    try {
      console.log('스크랩 토글 시도:', { userId, postId, postType });
      
      // 기존 스크랩 확인
      const { data: existingScrap, error: fetchError } = await supabase
        .from('scraps')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .eq('post_type', postType)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const table = postType === 'story' ? 'stories' : 'lounge_posts';
      
      if (existingScrap) {
        // 스크랩 해제
        const { error: deleteError } = await supabase
          .from('scraps')
          .delete()
          .eq('id', existingScrap.id);

        if (deleteError) throw deleteError;
        
        // 현재 스크랩 수를 조회하고 1 감소
        const { data: currentPost } = await supabase
          .from(table)
          .select('scrap_count')
          .eq('id', postId)
          .single();

        const newScrapCount = Math.max(0, (currentPost?.scrap_count || 0) - 1);

        const { error: updateError } = await supabase
          .from(table)
          .update({ scrap_count: newScrapCount })
          .eq('id', postId);

        if (updateError) throw updateError;
        
        console.log('✅ 스크랩 해제 완료');
        return { action: 'removed' };
      } else {
        // 스크랩 추가
        const { error: insertError } = await supabase
          .from('scraps')
          .insert({
            user_id: userId,
            post_id: postId,
            post_type: postType,
            created_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
        
        // 현재 스크랩 수를 조회하고 1 증가
        const { data: currentPost } = await supabase
          .from(table)
          .select('scrap_count')
          .eq('id', postId)
          .single();

        const newScrapCount = (currentPost?.scrap_count || 0) + 1;

        const { error: updateError } = await supabase
          .from(table)
          .update({ scrap_count: newScrapCount })
          .eq('id', postId);

        if (updateError) throw updateError;
        
        console.log('✅ 스크랩 추가 완료');
        
        // 작성자에게 경험치 추가 (본인이 아닌 경우)
        const { data: post } = await supabase
          .from(table)
          .select('author_id')
          .eq('id', postId)
          .single();
          
        if (post?.author_id && post.author_id !== userId) {
          await storyService.addUserActivity(post.author_id, 'bookmarked');

          // 북마크 받을 때 작성자 레벨 갱신
          try {
            const { trackDatabaseUserActivity } = await import('../services/databaseUserLevelService');
            await trackDatabaseUserActivity(post.author_id);
            console.log('✅ 북마크 받은 후 작성자 레벨 갱신 완료');
          } catch (levelError) {
            console.warn('⚠️ 북마크 받은 후 레벨 갱신 실패:', levelError);
          }
        }
        
        return { action: 'added' };
      }
    } catch (error) {
      console.error('스크랩 토글 실패:', error);
      throw error;
    }
  },

  // 사용자의 좋아요 상태 조회
  async getUserLikeStatus(userId: string, postId: number, postType: 'story' | 'lounge') {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .eq('post_type', postType)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { liked: !!data };
    } catch (error) {
      console.error('좋아요 상태 조회 실패:', error);
      return { liked: false };
    }
  },

  // 사용자의 스크랩 상태 조회
  async getUserScrapStatus(userId: string, postId: number, postType: 'story' | 'lounge') {
    try {
      const { data, error } = await supabase
        .from('scraps')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .eq('post_type', postType)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return { scrapped: !!data };
    } catch (error) {
      console.error('스크랩 상태 조회 실패:', error);
      return { scrapped: false };
    }
  },

  // 사용자가 스크랩한 글 목록 조회
  async getUserScraps(userId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error } = await supabase
        .from('scraps')
        .select(`
          *,
          story:stories(*),
          lounge_post:lounge_posts(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      // 데이터 정규화
      const scraps = data.map(scrap => ({
        ...scrap,
        post: scrap.post_type === 'story' ? scrap.story : scrap.lounge_post
      }));
      
      console.log(`✅ 사용자 스크랩 ${scraps.length}개 조회 완료`);
      return {
        scraps,
        hasMore: scraps.length === limit,
        total: scraps.length
      };
    } catch (error) {
      console.error('사용자 스크랩 조회 실패:', error);
      return { scraps: [], hasMore: false, total: 0 };
    }
  },

  // 사용자 북마크 조회 (getUserBookmarks 별칭)
  async getUserBookmarks(userId: string) {
    try {
      console.log(`🔍 사용자 북마크 조회: ${userId}`);
      
      const { data, error } = await supabase
        .from('scraps')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      
      console.log(`✅ 사용자 북마크 ${data.length}개 조회 완료`);
      return data || [];
    } catch (error) {
      console.error('사용자 북마크 조회 실패:', error);
      return [];
    }
  },

  // 사용자가 받은 좋아요 수 조회 (getUserLikes 별칭)
  async getUserLikes(userId: string) {
    try {
      console.log(`🔍 사용자가 받은 좋아요 조회: ${userId}`);
      
      // 사용자가 작성한 스토리의 좋아요 수
      const { data: storyLikes, error: storyError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_type', 'story')
        .in('post_id', 
          supabase.from('stories').select('id').eq('author_id', userId)
        );

      if (storyError) throw storyError;

      // 사용자가 작성한 라운지 글의 좋아요 수
      const { data: loungeLikes, error: loungeError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_type', 'lounge')
        .in('post_id', 
          supabase.from('lounge_posts').select('id').eq('author_id', userId)
        );

      if (loungeError) throw loungeError;

      const totalLikes = (storyLikes?.length || 0) + (loungeLikes?.length || 0);
      
      console.log(`✅ 사용자가 받은 총 좋아요: ${totalLikes}개`);
      return totalLikes;
    } catch (error) {
      console.error('사용자 좋아요 조회 실패:', error);
      return 0;
    }
  },

  // 사용자의 상호작용 상태 확인 (좋아요, 북마크)
  async checkInteractionStatus(userId: string, postId: number, postType: 'story' | 'lounge') {
    try {
      console.log('🔍 상호작용 상태 확인:', { userId, postId, postType });
      
      // 좋아요 상태 확인
      const { data: likeData, error: likeError } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .eq('post_type', postType)
        .single();
      
      if (likeError && likeError.code !== 'PGRST116') {
        console.error('좋아요 상태 확인 실패:', likeError);
      }
      
      // 북마크 상태 확인
      const { data: scrapData, error: scrapError } = await supabase
        .from('scraps')
        .select('id')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .eq('post_type', postType)
        .single();
      
      if (scrapError && scrapError.code !== 'PGRST116') {
        console.error('북마크 상태 확인 실패:', scrapError);
      }
      
      const status = {
        liked: !!likeData,
        bookmarked: !!scrapData
      };
      
      console.log('✅ 상호작용 상태:', status);
      return status;
    } catch (error) {
      console.error('상호작용 상태 확인 실패:', error);
      return { liked: false, bookmarked: false };
    }
  },

  // 좋아요 수 조회
  async getLikeCount(postId: number, postType: 'story' | 'lounge') {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id', { count: 'exact' })
        .eq('post_id', postId)
        .eq('post_type', postType);

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('좋아요 수 조회 실패:', error);
      return 0;
    }
  },

  // 북마크 수 조회
  async getBookmarkCount(postId: number, postType: 'story' | 'lounge') {
    try {
      const { data, error } = await supabase
        .from('scraps')
        .select('id', { count: 'exact' })
        .eq('post_id', postId)
        .eq('post_type', postType);

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('북마크 수 조회 실패:', error);
      return 0;
    }
  },

  // 댓글 수 조회
  async getCommentCount(postId: number, postType: 'story' | 'lounge') {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('post_id', postId)
        .eq('post_type', postType);

      if (error) throw error;
      
      return data?.length || 0;
    } catch (error) {
      console.error('댓글 수 조회 실패:', error);
      return 0;
    }
  },

  // 좋아요 상태 확인 (isLiked 별칭)
  async isLiked(userId: string, postId: number, postType: 'story' | 'lounge') {
    try {
      const result = await this.getUserLikeStatus(userId, postId, postType);
      return result.liked;
    } catch (error) {
      console.error('좋아요 상태 확인 실패:', error);
      return false;
    }
  },

  // 북마크/스크랩 상태 확인 (isScraped 별칭)
  async isScraped(userId: string, postId: number, postType: 'story' | 'lounge') {
    try {
      const result = await this.getUserScrapStatus(userId, postId, postType);
      return result.scrapped;
    } catch (error) {
      console.error('북마크 상태 확인 실패:', error);
      return false;
    }
  },

  // 북마크 상태 확인 (isBookmarked 별칭)
  async isBookmarked(userId: string, postId: number, postType: 'story' | 'lounge') {
    try {
      const result = await this.getUserScrapStatus(userId, postId, postType);
      return result.scrapped;
    } catch (error) {
      console.error('북마크 상태 확인 실패:', error);
      return false;
    }
  },

  // 좋아요 수 동기화
  async syncLikeCount(postId: number, postType: 'story' | 'lounge') {
    try {
      console.log('🔄 좋아요 수 동기화 시작:', { postId, postType });
      
      // 실제 좋아요 수 조회
      const actualCount = await this.getLikeCount(postId, postType);
      
      // 테이블 업데이트
      const table = postType === 'story' ? 'stories' : 'lounge_posts';
      const { error } = await supabase
        .from(table)
        .update({ like_count: actualCount })
        .eq('id', postId);

      if (error) {
        console.error('좋아요 수 동기화 실패:', error);
        throw error;
      }
      
      console.log('✅ 좋아요 수 동기화 완료:', { postId, postType, count: actualCount });
      return actualCount;
    } catch (error) {
      console.error('좋아요 수 동기화 실패:', error);
      throw error;
    }
  },

  // 스크랩(북마크) 수 조회
  async getScrapCount(postId: number, postType: 'story' | 'lounge') {
    try {
      const { data, error } = await supabase
        .from('scraps')
        .select('id', { count: 'exact' })
        .eq('post_id', postId)
        .eq('post_type', postType);

      if (error) throw error;
      
      return data?.length || 0;
    } catch (error) {
      console.error('스크랩 수 조회 실패:', error);
      return 0;
    }
  }
};

// ===========================================================================
// 검색 관리 서비스
// ===========================================================================

export const searchService = {
  // 통합 검색
  async search(query: string, page = 1, limit = 20, type?: 'all' | 'story' | 'lounge') {
    try {
      const offset = (page - 1) * limit;
      let results: any = { stories: [], lounge_posts: [], total: 0 };
      
      if (type === 'all' || type === 'story' || !type) {
        // 스토리 검색
        const { data: stories } = await supabase
          .from('stories')
          .select('*')
          .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%,author_name.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          .limit(type === 'story' ? limit : Math.floor(limit / 2));
          
        results.stories = stories || [];
      }
      
      if (type === 'all' || type === 'lounge' || !type) {
        // 라운지 검색  
        const { data: loungePosts } = await supabase
          .from('lounge_posts')
          .select('*')
          .or(`title.ilike.%${query}%,content.ilike.%${query}%,author_name.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          .limit(type === 'lounge' ? limit : Math.floor(limit / 2));
          
        results.lounge_posts = loungePosts || [];
      }
      
      // 검색 키워드 기록
      await this.recordSearchKeyword(query);
      
      results.total = results.stories.length + results.lounge_posts.length;
      
      console.log(`✅ 통합 검색 완료: ${results.total}개 결과`);
      return results;
    } catch (error) {
      console.error('통합 검색 실패:', error);
      return { stories: [], lounge_posts: [], total: 0 };
    }
  },

  // 검색 키워드 기록
  async recordSearchKeyword(keyword: string) {
    try {
      // 기존 키워드 확인
      const { data: existing, error: fetchError } = await supabase
        .from('search_keywords')
        .select('id, search_count')
        .eq('keyword', keyword.toLowerCase())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        // 기존 키워드 업데이트
        const { error: updateError } = await supabase
          .from('search_keywords')
          .update({
            search_count: existing.search_count + 1,
            last_searched: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (updateError) throw updateError;
      } else {
        // 새 키워드 추가
        const { error: insertError } = await supabase
          .from('search_keywords')
          .insert({
            keyword: keyword.toLowerCase(),
            search_count: 1,
            last_searched: new Date().toISOString(),
            created_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.warn('검색 키워드 기록 실패:', error);
    }
  },

  // 인기 검색 키워드 조회
  async getPopularKeywords(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('search_keywords')
        .select('keyword, search_count')
        .order('search_count', { ascending: false })
        .order('last_searched', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('인기 검색 키워드 조회 실패:', error);
      return [];
    }
  },

  // 최근 검색 키워드 조회
  async getRecentKeywords(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('search_keywords')
        .select('keyword')
        .order('last_searched', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('최근 검색 키워드 조회 실패:', error);
      return [];
    }
  }
};

// ===========================================================================
// 태그 관리 서비스
// ===========================================================================

export const tagService = {
  // 모든 태그 조회 (사용 빈도순)
  async getAll() {
    try {
      console.log('🏷️ 모든 태그 조회 시작');
      
      // 스토리와 라운지 글에서 사용된 모든 태그 수집
      const [storyTags, loungeTags] = await Promise.all([
        supabase.from('stories').select('tags'),
        supabase.from('lounge_posts').select('tags')
      ]);

      // 태그 빈도 계산
      const tagCount: Record<string, number> = {};
      
      [...(storyTags.data || []), ...(loungeTags.data || [])].forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach((tag: string) => {
            if (tag && typeof tag === 'string') {
              tagCount[tag] = (tagCount[tag] || 0) + 1;
            }
          });
        }
      });

      // 빈도순 정렬
      const sortedTags = Object.entries(tagCount)
        .map(([tag, count]) => ({ name: tag, count }))
        .sort((a, b) => b.count - a.count);
      
      console.log(`✅ 태그 ${sortedTags.length}개 조회 완료`);
      return sortedTags;
    } catch (error) {
      console.error('태그 조회 실패:', error);
      return [];
    }
  },

  // 인기 태그 조회 (상위 N개)
  async getPopular(limit = 20) {
    try {
      const allTags = await this.getAll();
      return allTags.slice(0, limit);
    } catch (error) {
      console.error('인기 태그 조회 실패:', error);
      return [];
    }
  },

  // 태그로 글 검색
  async getPostsByTag(tag: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      // 스토리와 라운지 글에서 해당 태그 검색
      const [stories, loungePosts] = await Promise.all([
        supabase
          .from('stories')
          .select('*')
          .contains('tags', [tag])
          .order('created_at', { ascending: false })
          .limit(Math.floor(limit / 2)),
        supabase
          .from('lounge_posts')
          .select('*')
          .contains('tags', [tag])
          .order('created_at', { ascending: false })
          .limit(Math.floor(limit / 2))
      ]);

      const results = {
        stories: stories.data || [],
        lounge_posts: loungePosts.data || [],
        total: (stories.data?.length || 0) + (loungePosts.data?.length || 0)
      };
      
      console.log(`✅ 태그 "${tag}" 검색 결과: ${results.total}개`);
      return results;
    } catch (error) {
      console.error('태그 검색 실패:', error);
      return { stories: [], lounge_posts: [], total: 0 };
    }
  }
};

// ===========================================================================
// 관리자 서비스
// ===========================================================================

export const adminService = {
  // 전체 통계 조회
  async getStats() {
    try {
      const [
        storiesCount,
        loungeCount,
        commentsCount,
        usersCount,
        totalLikes,
        totalScraps
      ] = await Promise.all([
        supabase.from('stories').select('id', { count: 'exact' }),
        supabase.from('lounge_posts').select('id', { count: 'exact' }),
        supabase.from('comments').select('id', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('likes').select('id', { count: 'exact' }),
        supabase.from('scraps').select('id', { count: 'exact' })
      ]);

      return {
        stories: storiesCount.count || 0,
        loungePosts: loungeCount.count || 0,
        comments: commentsCount.count || 0,
        users: usersCount.count || 0,
        totalLikes: totalLikes.count || 0,
        totalScraps: totalScraps.count || 0
      };
    } catch (error) {
      console.error('관리자 통계 조회 실패:', error);
      return {
        stories: 0,
        loungePosts: 0,
        comments: 0,
        users: 0,
        totalLikes: 0,
        totalScraps: 0
      };
    }
  },

  // 라운지 글을 스토리로 승격
  async promoteToStory(loungePostId: number, storyData: {
    summary: string;
    category?: string;
    image_url?: string;
    read_time?: number;
  }) {
    try {
      console.log('라운지 글 스토리 승격 시작:', loungePostId);
      
      // 라운지 글 조회
      const { data: loungePost, error: fetchError } = await supabase
        .from('lounge_posts')
        .select('*')
        .eq('id', loungePostId)
        .single();

      if (fetchError || !loungePost) {
        throw new Error('라운지 글을 찾을 수 없습니다.');
      }

      // 스토리 생성
      const { data: story, error: createError } = await supabase
        .from('stories')
        .insert({
          title: loungePost.title,
          summary: storyData.summary,
          content: loungePost.content,
          author_id: loungePost.author_id,
          author_name: loungePost.author_name,
          category: storyData.category || 'general',
          tags: loungePost.tags || [],
          image_url: storyData.image_url,
          read_time: storyData.read_time || 1,
          like_count: loungePost.like_count || 0,
          scrap_count: loungePost.scrap_count || 0,
          view_count: loungePost.view_count || 0,
          comment_count: loungePost.comment_count || 0,
          is_verified: false,
          verification_badge: null,
          is_from_lounge: true,
          original_lounge_post_id: loungePost.id,
          original_author_name: loungePost.author_name,
          promoted_at: new Date().toISOString(),
          created_at: loungePost.created_at,
          updated_at: new Date().toISOString(),
          published_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('스토리 생성 실패:', createError);
        throw createError;
      }

      // 라운지 글에 승격 상태 업데이트
      const { error: updateError } = await supabase
        .from('lounge_posts')
        .update({
          promotion_status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', loungePostId);

      if (updateError) {
        console.warn('라운지 글 상태 업데이트 실패:', updateError);
      }

      console.log('✅ 라운지 글 스토리 승격 완료:', story.id);
      
      // 작성자에게 경험치 추가
      if (story.author_id) {
        await storyService.addUserActivity(story.author_id, 'story_promoted');
      }
      
      return story;
    } catch (error) {
      console.error('라운지 글 스토리 승격 실패:', error);
      throw error;
    }
  }
};

// ===========================================================================

// 기존 세션스토리지 서비스와 호환성을 위한 별칭
export const supabaseStoryService = storyService;
export const supabaseLoungeService = loungeService;
export const supabaseCommentService = commentService;
export const supabaseUserService = userService;
export const supabaseScrapService = interactionService;
export const supabaseLikeService = interactionService;
export const supabaseSearchService = searchService;
export const supabaseTagService = tagService;

// 데이터 초기화 함수 (호환성)
export const initializeData = async () => {
  // Supabase에서는 초기화가 필요 없음
  console.log('✅ Supabase 데이터 서비스가 초기화되었습니다.');
  return true;
};

// 연결 테스트 함수
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    console.log('✅ Supabase 연결 성공!');
    console.log(`📊 데이터베이스 연결이 정상적으로 작동합니다.`);
    return true;
  } catch (error) {
    console.error('❌ Supabase 연결 실패:', error);
    return false;
  }
};