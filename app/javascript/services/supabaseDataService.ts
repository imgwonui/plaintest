// Supabase 기반 데이터 관리 서비스
// 세션스토리지를 완전히 대체하는 실제 데이터베이스 서비스

import { supabase } from '../lib/supabaseClient';
import type { Database } from '../types/database';

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

      if (error) throw error;
      
      // 데이터베이스 필드명을 AuthContext User 인터페이스에 맞게 변환
      if (userData) {
        return {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          provider: userData.provider,
          avatar: userData.avatar_url,
          bio: userData.bio,
          isAdmin: userData.is_admin,
          isVerified: userData.is_verified,
          emailNotifications: userData.email_notifications,
          pushNotifications: userData.push_notifications,
          weeklyDigest: userData.weekly_digest,
          created_at: userData.created_at,
          updated_at: userData.updated_at,
        };
      }
      
      return null;
    } catch (error) {
      console.error('getCurrentUser 에러:', error);
      return null;
    }
  },

  // ID로 사용자 정보 조회
  async getCurrentUserById(userId: string) {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // 데이터베이스 필드명을 AuthContext User 인터페이스에 맞게 변환
      if (userData) {
        return {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          provider: userData.provider,
          avatar: userData.avatar_url,
          bio: userData.bio,
          isAdmin: userData.is_admin,
          isVerified: userData.is_verified,
          emailNotifications: userData.email_notifications,
          pushNotifications: userData.push_notifications,
          weeklyDigest: userData.weekly_digest,
          created_at: userData.created_at,
          updated_at: userData.updated_at,
        };
      }
      
      return null;
    } catch (error) {
      console.error('getCurrentUserById 에러:', error);
      return null;
    }
  },

  // 사용자 생성 (회원가입)
  async createUser(userData: Tables['users']['Insert']) {
    try {
      console.log('사용자 생성 시도:', userData);
      
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          email_notifications: userData.email_notifications ?? true,
          push_notifications: userData.push_notifications ?? false,
          weekly_digest: userData.weekly_digest ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('사용자 생성 DB 에러:', error);
        throw error;
      }
      
      console.log('사용자 생성 성공:', data);
      
      // 사용자 레벨 초기화
      await this.initializeUserLevel(data.id);
      
      // 데이터베이스 필드명을 AuthContext User 인터페이스에 맞게 변환
      return this.transformUserFromDB(data);
    } catch (error) {
      console.error('createUser 에러:', error);
      throw error;
    }
  },

  // 사용자 정보 업데이트
  async updateUser(userId: string, updates: Tables['users']['Update']) {
    try {
      // 먼저 사용자가 존재하는지 확인
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (checkError) {
        console.log('사용자 ID가 존재하지 않습니다:', userId);
        
        // 이메일로 기존 사용자 찾기 (이메일이 있는 경우)
        if (updates.email) {
          try {
            const { data: existingByEmail, error: emailError } = await supabase
              .from('users')
              .select('*')
              .eq('email', updates.email)
              .single();
              
            if (!emailError && existingByEmail) {
              console.log('같은 이메일의 기존 사용자를 찾았습니다. 기존 사용자 데이터를 업데이트합니다:', existingByEmail.id);
              
              // 기존 사용자 데이터를 업데이트 (ID는 변경하지 않음)
              const updateData = { ...updates };
              delete updateData.id; // ID 제외
              
              const { data: updatedUser, error: updateError } = await supabase
                .from('users')
                .update({ 
                  ...updateData,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingByEmail.id)
                .select()
                .single();
                
              if (!updateError && updatedUser) {
                // localStorage의 사용자 ID를 기존 사용자 ID로 변경
                const provider = updatedUser.provider || 'admin';
                const storageKey = `plain_user_id_${provider}`;
                try {
                  localStorage.setItem(storageKey, existingByEmail.id);
                  console.log(`✅ localStorage 사용자 ID 동기화: ${userId} → ${existingByEmail.id}`);
                } catch (storageError) {
                  console.warn('localStorage 동기화 실패:', storageError);
                }
                
                return this.transformUserFromDB(updatedUser);
              }
            }
          } catch (emailSearchError) {
            console.log('이메일 검색 중 에러 (계속 진행):', emailSearchError);
          }
        }
        
        // 이메일로도 찾지 못했으면 새로 생성
        console.log('새로운 사용자를 생성합니다:', userId);
        return await this.createUser({
          id: userId,
          name: updates.name || '사용자',
          email: updates.email || '',
          provider: 'admin' as any, // 임시값
          ...updates
        });
      }

      // 사용자가 존재하면 업데이트
      // 이메일이 변경되는 경우 중복 체크
      if (updates.email) {
        const { data: emailCheck, error: emailCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('email', updates.email)
          .neq('id', userId)
          .single();
          
        if (!emailCheckError && emailCheck) {
          throw new Error(`이메일 ${updates.email}이 이미 다른 사용자가 사용중입니다.`);
        }
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      
      // 데이터베이스 필드명을 AuthContext User 인터페이스에 맞게 변환
      return this.transformUserFromDB(data);
    } catch (error) {
      console.error('updateUser 에러:', error);
      throw error;
    }
  },

  // 프로필 업데이트 (호환성)
  async updateProfile(userId: string, updates: Partial<{
    name: string;
    email: string;
    avatar: string;
    bio: string;
    isAdmin: boolean;
    isVerified: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyDigest: boolean;
  }>) {
    try {
      const dbUpdates: Tables['users']['Update'] = {};
      
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.email) dbUpdates.email = updates.email;
      if (updates.avatar) dbUpdates.avatar_url = updates.avatar;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.isAdmin !== undefined) dbUpdates.is_admin = updates.isAdmin;
      if (updates.isVerified !== undefined) dbUpdates.is_verified = updates.isVerified;
      if (updates.emailNotifications !== undefined) dbUpdates.email_notifications = updates.emailNotifications;
      if (updates.pushNotifications !== undefined) dbUpdates.push_notifications = updates.pushNotifications;
      if (updates.weeklyDigest !== undefined) dbUpdates.weekly_digest = updates.weeklyDigest;

      console.log('🔄 Profile 업데이트 시도:', { userId, dbUpdates });
      return await this.updateUser(userId, dbUpdates);
    } catch (error) {
      console.error('updateProfile 에러:', error);
      throw error;
    }
  },

  // 사용자 이름으로 검색
  async getUserByName(name: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('name', name)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('getUserByName 에러:', error);
      return null;
    }
  },

  // 모든 사용자 조회 (관리자용)
  async getAllUsers(page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      return {
        users: data,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('getAllUsers 에러:', error);
      throw error;
    }
  },

  // 사용자 레벨 초기화
  async initializeUserLevel(userId: string) {
    try {
      const { error } = await supabase
        .from('user_levels')
        .insert({
          user_id: userId,
          current_exp: 0,
          level: 1,
          total_likes: 0,
          story_promotions: 0,
          total_bookmarks: 0,
          total_posts: 0,
          total_comments: 0,
          excellent_posts: 0,
          achievements: []
        });

      if (error) throw error;
    } catch (error) {
      console.error('initializeUserLevel 에러:', error);
      throw error;
    }
  },

  // 사용자가 DB에 존재하는지 확인하고 없으면 생성
  async ensureUserExists(userId: string) {
    try {
      console.log('🔍 사용자 존재 확인:', userId);
      
      // 먼저 사용자 존재 확인
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (existingUser) {
        console.log('✅ 사용자가 이미 존재함:', userId);
        return existingUser;
      }
      
      // 사용자가 없으면 생성 (AuthContext에서 생성된 정보를 기반으로)
      console.log('👤 사용자가 존재하지 않아 생성 시도:', userId);
      
      // 기본 사용자 데이터로 생성
      const userData = {
        id: userId,
        name: '사용자',
        email: `${userId}@temp.com`,
        provider: 'admin' as const,
        is_admin: false,
        is_verified: false
      };
      
      const createdUser = await this.createUser(userData);
      console.log('✅ 사용자 생성 완료:', createdUser.id);
      return createdUser;
    } catch (error) {
      console.error('❌ ensureUserExists 에러:', error);
      throw error;
    }
  },

  // 세션 기반 레벨 데이터를 데이터베이스에 동기화 (upsert 방식)
  async syncSessionLevelToDatabase(userId: string, level: number, currentExp: number, stats?: {
    totalLikes: number;
    totalPosts: number;
    totalComments: number;
  }) {
    try {
      console.log(`🔄 사용자 ${userId} 세션 레벨 데이터를 DB에 동기화: LV${level} (${currentExp} EXP)`);
      
      // 현재 시간
      const now = new Date().toISOString();

      // upsert 방식으로 데이터 삽입/업데이트
      const upsertData: any = {
        user_id: userId,
        level,
        current_exp: currentExp,
        total_likes: stats?.totalLikes || 0,
        total_posts: stats?.totalPosts || 0,
        total_comments: stats?.totalComments || 0,
        story_promotions: 0, // 기본값
        total_bookmarks: 0, // 기본값  
        excellent_posts: 0, // 기본값
        achievements: [], // 기본값
        last_level_up: null, // 기본값
        updated_at: now,
      };

      const { error: upsertError } = await supabase
        .from('user_levels')
        .upsert(upsertData, {
          onConflict: 'user_id', // user_id가 충돌할 경우 업데이트
        });

      if (upsertError) {
        console.error('레벨 데이터 upsert 실패:', upsertError);
        console.error('Upsert data:', upsertData);
        return false;
      }

      console.log(`✅ 사용자 ${userId} 레벨 데이터 동기화 완료: LV${level} (${currentExp} EXP)`);
      return true;
    } catch (error) {
      console.error('세션 레벨 동기화 중 오류:', error);
      return false;
    }
  },

  // 모든 사용자 레벨 정보 조회 (관리자용)
  async getAllUserLevels(page = 1, limit = 100) {
    try {
      console.log('📊 getAllUserLevels 호출:', { page, limit });
      const offset = (page - 1) * limit;
      
      // count 옵션을 사용하여 전체 개수도 함께 조회
      const { data: userLevels, error, count } = await supabase
        .from('user_levels')
        .select(`
          *,
          user:users(
            id,
            name,
            email,
            is_admin,
            is_verified,
            created_at
          )
        `, { count: 'exact' }) // count 옵션 추가
        .range(offset, offset + limit - 1)
        .order('current_exp', { ascending: false });

      if (error) {
        console.error('❌ 사용자 레벨 조회 실패:', error);
        throw error;
      }

      console.log('📊 Supabase 쿼리 결과:', {
        userLevels: userLevels?.length || 0,
        totalCount: count,
        첫번째데이터: userLevels?.[0]
      });

      return {
        userLevels: userLevels || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('getAllUserLevels 에러:', error);
      throw error;
    }
  },

  // 실제 사용자 활동 기반 레벨 계산 및 업데이트
  async recalculateUserLevel(userId: string) {
    try {
      console.log(`🔄 ${userId} 사용자 실제 레벨 계산 중...`);
      
      // 1. 사용자의 실제 활동 데이터 수집
      const [
        { data: stories },
        { data: loungePosts }, 
        { data: storyLikes },
        { data: loungeLikes },
        { data: comments },
        { data: storyBookmarks },
        { data: loungeBookmarks },
        { data: promotedStories }
      ] = await Promise.all([
        supabase.from('stories').select('id').eq('author_id', userId),
        supabase.from('lounge_posts').select('id').eq('author_id', userId),
        supabase.from('likes').select('id').eq('post_type', 'story').in('post_id', 
          (await supabase.from('stories').select('id').eq('author_id', userId)).data?.map(s => s.id) || []
        ),
        supabase.from('likes').select('id').eq('post_type', 'lounge').in('post_id',
          (await supabase.from('lounge_posts').select('id').eq('author_id', userId)).data?.map(p => p.id) || []
        ),
        supabase.from('comments').select('id').eq('author_id', userId),
        supabase.from('scraps').select('id').eq('post_type', 'story').in('post_id',
          (await supabase.from('stories').select('id').eq('author_id', userId)).data?.map(s => s.id) || []
        ),
        supabase.from('scraps').select('id').eq('post_type', 'lounge').in('post_id', 
          (await supabase.from('lounge_posts').select('id').eq('author_id', userId)).data?.map(p => p.id) || []
        ),
        supabase.from('stories').select('id').eq('author_id', userId).eq('is_from_lounge', true)
      ]);
      
      // 2. 통계 계산
      const totalStories = stories?.length || 0;
      const totalLoungePosts = loungePosts?.length || 0;
      const totalLikes = (storyLikes?.length || 0) + (loungeLikes?.length || 0);
      const totalComments = comments?.length || 0;
      const totalBookmarks = (storyBookmarks?.length || 0) + (loungeBookmarks?.length || 0);
      const storyPromotions = promotedStories?.length || 0;
      
      // 3. 경험치 계산 (실제 활동 기반)
      const expFromPosts = (totalStories + totalLoungePosts) * 5;
      const expFromLikes = totalLikes * 2;
      const expFromComments = totalComments * 1;
      const expFromBookmarks = totalBookmarks * 3;
      const expFromPromotions = storyPromotions * 20;
      
      const totalExp = expFromPosts + expFromLikes + expFromComments + expFromBookmarks + expFromPromotions;
      
      // 4. 레벨 계산 (1~99레벨) - 더 현실적인 기준으로 조정
      let level = 1;
      
      // 초기 레벨 (1-10): 빠른 성장, 더 낮은 기준
      if (totalExp >= 15) level = 2;   // 글 3개 또는 좋아요 8개
      if (totalExp >= 35) level = 3;   // 김ㄱㄱㄱㄱ 현재 수준  
      if (totalExp >= 70) level = 4;   // 적당한 활동
      if (totalExp >= 1000) level = 5;
      if (totalExp >= 1500) level = 6;
      if (totalExp >= 2100) level = 7;
      if (totalExp >= 2800) level = 8;
      if (totalExp >= 3600) level = 9;
      if (totalExp >= 4500) level = 10;
      
      // 중급 레벨 (11-30): 점진적 증가
      for (let lv = 11; lv <= 30; lv++) {
        const requiredExp = 4500 + (lv - 10) * 500; // 500씩 증가
        if (totalExp >= requiredExp) level = lv;
      }
      
      // 고급 레벨 (31-50): 더 많은 경험치 필요
      for (let lv = 31; lv <= 50; lv++) {
        const requiredExp = 14500 + (lv - 30) * 1000; // 1000씩 증가
        if (totalExp >= requiredExp) level = lv;
      }
      
      // 전문가 레벨 (51-70): 상당한 경험치 필요
      for (let lv = 51; lv <= 70; lv++) {
        const requiredExp = 34500 + (lv - 50) * 2000; // 2000씩 증가
        if (totalExp >= requiredExp) level = lv;
      }
      
      // 마스터 레벨 (71-90): 매우 많은 경험치 필요
      for (let lv = 71; lv <= 90; lv++) {
        const requiredExp = 74500 + (lv - 70) * 5000; // 5000씩 증가
        if (totalExp >= requiredExp) level = lv;
      }
      
      // 레전드 레벨 (91-99): 극도로 많은 경험치 필요
      for (let lv = 91; lv <= 99; lv++) {
        const requiredExp = 174500 + (lv - 90) * 10000; // 10000씩 증가
        if (totalExp >= requiredExp) level = lv;
      }
      
      // 5. user_levels 테이블 업데이트
      const now = new Date().toISOString();
      const levelData = {
        user_id: userId,
        current_exp: totalExp,
        level: level,
        total_likes: totalLikes,
        story_promotions: storyPromotions,
        total_bookmarks: totalBookmarks,
        total_posts: totalStories + totalLoungePosts,
        total_comments: totalComments,
        excellent_posts: 0, // 추후 50+ 좋아요 글 계산
        achievements: level >= 10 ? ['첫걸음'] : [],
        last_level_up: null,
        created_at: now,
        updated_at: now
      };
      
      const { data, error } = await supabase
        .from('user_levels')
        .upsert(levelData, {
          onConflict: 'user_id'
        })
        .select()
        .single();
        
      if (error) throw error;
      
      console.log(`✅ ${userId} 레벨 재계산 완료: LV${level} (${totalExp} EXP)`);
      return data;
    } catch (error) {
      console.error(`❌ ${userId} 레벨 계산 실패:`, error);
      throw error;
    }
  },

  // 사용자 레벨 업데이트 (기존 함수 유지)
  async updateUserLevel(userId: string, levelData: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('user_levels')
        .update({
          ...levelData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('updateUserLevel 에러:', error);
      throw error;
    }
  }
};

// ===========================================================================
// 스토리 관리 서비스
// ===========================================================================

export const storyService = {
  // 모든 스토리 조회
  async getAll(page = 1, limit = 20) {
    try {
      console.log('📚 스토리 조회 시작:', { page, limit });
      const offset = (page - 1) * limit;
      
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      console.log('✅ 스토리 조회 성공:', data?.length || 0, '개');
      return {
        stories: data || [],
        total: data?.length || 0,
        page,
        totalPages: Math.ceil((data?.length || 0) / limit)
      };
    } catch (error) {
      console.error('getAll stories 에러:', error);
      throw error;
    }
  },

  // 특정 스토리 조회
  async getById(id: number) {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // 조회수 증가
      await this.incrementViewCount(id);
      
      return data;
    } catch (error) {
      console.error('getById story 에러:', error);
      throw error;
    }
  },

  // 스토리 생성
  async create(storyData: Tables['stories']['Insert']) {
    try {
      console.log('📝 스토리 생성 시작:', storyData);
      
      // 사용자가 DB에 존재하는지 확인하고 없으면 생성
      if (storyData.author_id) {
        await userService.ensureUserExists(storyData.author_id);
      }
      
      const insertData = {
        ...storyData,
        created_at: new Date().toISOString(),
        published_at: new Date().toISOString()
      };
      
      console.log('📝 삽입할 데이터:', insertData);
      
      // RLS 우회를 위해 service_role 키 사용 시도
      const { data, error } = await supabase
        .from('stories')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase 에러:', error);
        console.error('❌ RLS 정책 위반 - stories 테이블에 RLS가 활성화되어 있습니다');
        console.error('❌ 해결 방법: Supabase 대시보드에서 stories 테이블의 RLS를 비활성화하거나 적절한 정책을 설정하세요');
        console.error('❌ 에러 상세:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('✅ 스토리 생성 성공:', data);
      console.log('✅ 생성된 스토리 ID:', data.id);
      console.log('✅ 발행 시간:', data.published_at);
      
      // 사용자 활동 추가
      if (storyData.author_id) {
        await this.addUserActivity(storyData.author_id, 'post_created');
      }
      
      return data;
    } catch (error) {
      console.error('❌ create story 에러:', error);
      console.error('❌ 전송된 데이터:', storyData);
      throw error;
    }
  },

  // 스토리 수정
  async update(id: number, updates: Tables['stories']['Update']) {
    try {
      console.log('📝 스토리 업데이트 시작:', { id, updates });
      
      // 안전한 업데이트 데이터 (존재하는 컬럼만)
      const safeUpdates: any = {
        updated_at: new Date().toISOString()
      };
      
      // 전달된 필드만 업데이트에 포함
      if (updates.title !== undefined) safeUpdates.title = updates.title;
      if (updates.content !== undefined) safeUpdates.content = updates.content;
      if (updates.summary !== undefined) safeUpdates.summary = updates.summary;
      if (updates.image_url !== undefined) safeUpdates.image_url = updates.image_url;
      if (updates.read_time !== undefined) safeUpdates.read_time = updates.read_time;
      if (updates.tags !== undefined) safeUpdates.tags = updates.tags;
      if (updates.is_verified !== undefined) safeUpdates.is_verified = updates.is_verified;
      
      // verification_badge 필드 처리 (데이터베이스 컬럼 추가 완료)
      if (updates.verification_badge !== undefined) safeUpdates.verification_badge = updates.verification_badge;
      
      console.log('📝 안전한 업데이트 데이터:', safeUpdates);
      
      const { data, error } = await supabase
        .from('stories')
        .update(safeUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase 업데이트 에러:', error);
        console.error('❌ 에러 상세:', JSON.stringify(error, null, 2));
        console.error('❌ 전송된 업데이트 데이터:', JSON.stringify(safeUpdates, null, 2));
        console.error('❌ 스토리 ID:', id);
        throw error;
      }
      
      console.log('✅ 스토리 업데이트 성공:', data);
      return data;
    } catch (error) {
      console.error('update story 에러:', error);
      throw error;
    }
  },

  // 스토리 삭제
  async delete(id: number) {
    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('delete story 에러:', error);
      throw error;
    }
  },

  // 조회수 증가
  async incrementViewCount(id: number, userId?: string) {
    try {
      // 조회 기록 추가
      if (userId) {
        await supabase
          .from('post_views')
          .insert({
            post_id: id,
            post_type: 'story',
            user_id: userId
          });
      }

      // RPC 함수 호출로 조회수 증가
      await supabase.rpc('increment_view_count', {
        post_id: id,
        post_type: 'story'
      });

    } catch (error) {
      console.error('incrementViewCount 에러:', error);
      // 조회수 증가 실패는 무시
    }
  },

  // 검색
  async search(query: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('stories')
        .select(`
          *,
          author_verified:users!stories_author_id_fkey(is_verified)
        `, { count: 'exact' })
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%,tags.cs.{${query}}`)
        .eq('is_verified', true)
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      // author_verified 필드를 평면화
      const stories = (data || []).map(story => ({
        ...story,
        author_verified: story.author_verified?.is_verified || false
      }));
      
      return {
        stories,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('search stories 에러:', error);
      throw error;
    }
  },

  // 사용자 활동 기록 추가 (헬퍼 함수)
  async addUserActivity(userId: string, activityType: string, amount = 1) {
    try {
      await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: activityType as any,
          amount,
          exp_gained: this.getExpForActivity(activityType) * amount
        });
    } catch (error) {
      console.error('addUserActivity 에러:', error);
      // 활동 기록 실패는 무시
    }
  },

  // 활동별 경험치 계산 (헬퍼 함수)
  getExpForActivity(activityType: string): number {
    const expMap: Record<string, number> = {
      'post_created': 10,
      'comment_created': 2,
      'like_received': 1,
      'bookmarked': 3,
      'excellent_post': 25,
      'story_promoted': 50
    };
    return expMap[activityType] || 0;
  },

  // 사용자 레벨 정보 조회
  async getUserLevel(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // 사용자 레벨이 없으면 기본값 반환
      if (!data) {
        return {
          user_id: userId,
          current_exp: 0,
          level: 1,
          total_likes: 0,
          story_promotions: 0,
          total_bookmarks: 0,
          total_posts: 0,
          total_comments: 0,
          excellent_posts: 0,
          achievements: []
        };
      }
      
      return data;
    } catch (error) {
      console.error('getUserLevel 에러:', error);
      return {
        user_id: userId,
        current_exp: 0,
        level: 1,
        total_likes: 0,
        story_promotions: 0,
        total_bookmarks: 0,
        total_posts: 0,
        total_comments: 0,
        excellent_posts: 0,
        achievements: []
      };
    }
  },

  // 모든 사용자 레벨 정보 조회 (관리자용)


  // 특정 작성자의 스토리 조회
  async getByAuthor(authorId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('stories')
        .select(`
          *,
          author_verified:users!stories_author_id_fkey(is_verified)
        `, { count: 'exact' })
        .eq('author_id', authorId)
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      // author_verified 필드를 평면화
      const stories = (data || []).map(story => ({
        ...story,
        author_verified: story.author_verified?.is_verified || false
      }));
      
      return {
        stories,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('getByAuthor stories 에러:', error);
      throw error;
    }
  }
};

// ===========================================================================
// 라운지 포스트 관리 서비스
// ===========================================================================

export const loungeService = {
  // 모든 라운지 포스트 조회
  async getAll(page = 1, limit = 20, type?: string) {
    try {
      console.log('🏛️ 라운지 조회 시작:', { page, limit, type });
      const offset = (page - 1) * limit;
      
      let query = supabase
        .from('lounge_posts')
        .select('*');

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      console.log('✅ 라운지 조회 성공:', data?.length || 0, '개');
      const postsWithCounts = (data || []).map(post => ({
        ...post,
        like_count: post.like_count || 0,
        comment_count: post.comment_count || 0,
        scrap_count: post.scrap_count || 0
      }));
      
      return {
        posts: postsWithCounts,
        total: postsWithCounts.length,
        page,
        totalPages: Math.ceil(postsWithCounts.length / limit)
      };
    } catch (error) {
      console.error('getAll lounge posts 에러:', error);
      throw error;
    }
  },

  // 인기 포스트 조회 (50개 이상 좋아요)
  async getPopular(page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('lounge_posts')
        .select('*', { count: 'exact' })
        .eq('is_excellent', true)
        .order('like_count', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      // 각 포스트의 실제 좋아요/댓글 수 계산
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          try {
            // 실제 좋아요 수 계산
            const { count: actualLikes } = await supabase
              .from('likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id)
              .eq('post_type', 'lounge');

            // 실제 댓글 수 계산
            const { count: actualComments } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id)
              .eq('post_type', 'lounge');

            // 실제 북마크 수 계산  
            const { count: actualScraps } = await supabase
              .from('scraps')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id)
              .eq('post_type', 'lounge');

            return {
              ...post,
              like_count: actualLikes || 0,
              comment_count: actualComments || 0,
              scrap_count: actualScraps || 0
            };
          } catch (err) {
            console.error('포스트 카운트 계산 에러:', err);
            return post; // 에러 시 원본 데이터 반환
          }
        })
      );
      
      // 실제 좋아요 수로 필터링 (50개 이상)
      const filteredPosts = postsWithCounts.filter(post => post.like_count >= 50);
      
      return {
        posts: filteredPosts,
        total: filteredPosts.length,
        page,
        totalPages: Math.ceil(filteredPosts.length / limit)
      };
    } catch (error) {
      console.error('getPopular lounge posts 에러:', error);
      throw error;
    }
  },

  // 특정 포스트 조회
  async getById(id: number) {
    try {
      const { data, error } = await supabase
        .from('lounge_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // 조회수 증가
      await this.incrementViewCount(id);
      
      return {
        ...data,
        like_count: data.like_count || 0,
        comment_count: data.comment_count || 0,
        scrap_count: data.scrap_count || 0
      };
    } catch (error) {
      console.error('getById lounge post 에러:', error);
      throw error;
    }
  },

  // 스키마 정보 확인 (디버그용)
  async checkSchema() {
    try {
      const { data, error } = await supabase
        .from('lounge_posts')
        .select('*')
        .limit(0);
      
      console.log('lounge_posts 테이블 스키마 확인 결과:', { data, error });
      return { data, error };
    } catch (error) {
      console.error('스키마 확인 에러:', error);
      return { error };
    }
  },

  // 라운지 포스트 생성
  async create(postData: Tables['lounge_posts']['Insert']) {
    try {
      // 사용자가 DB에 존재하는지 확인하고 없으면 생성
      if (postData.author_id) {
        await userService.ensureUserExists(postData.author_id);
      }
      
      // 디버그: 스키마 확인
      console.log('스키마 확인 중...');
      await this.checkSchema();
      
      console.log('전송할 데이터:', JSON.stringify(postData, null, 2));
      
      // RLS 우회를 위해 service_role 키 사용 (개발용)
      const { data, error } = await supabase
        .from('lounge_posts')
        .insert({
          ...postData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('RLS 에러 발생, RLS 정책을 확인하세요:', error);
        throw error;
      }
      
      // 사용자 활동 추가
      if (postData.author_id) {
        await storyService.addUserActivity(postData.author_id, 'post_created');
      }
      
      return data;
    } catch (error) {
      console.error('create lounge post 에러:', error);
      console.error('에러 메시지:', error?.message);
      console.error('에러 상세:', JSON.stringify(error, null, 2));
      console.error('전송된 데이터:', JSON.stringify(postData, null, 2));
      throw error;
    }
  },

  // 라운지 포스트 수정
  async update(id: number, updates: Tables['lounge_posts']['Update']) {
    try {
      const { data, error } = await supabase
        .from('lounge_posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('update lounge post 에러:', error);
      throw error;
    }
  },

  // 라운지 포스트 삭제
  async delete(id: number) {
    try {
      const { error } = await supabase
        .from('lounge_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('delete lounge post 에러:', error);
      throw error;
    }
  },

  // 조회수 증가
  async incrementViewCount(id: number, userId?: string) {
    try {
      // 조회 기록 추가
      if (userId) {
        await supabase
          .from('post_views')
          .insert({
            post_id: id,
            post_type: 'lounge',
            user_id: userId
          });
      }

      // RPC 함수 호출로 조회수 증가
      await supabase.rpc('increment_view_count', {
        post_id: id,
        post_type: 'lounge'
      });

    } catch (error) {
      console.error('incrementViewCount 에러:', error);
      // 조회수 증가 실패는 무시
    }
  },

  // 검색
  async search(query: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('lounge_posts')
        .select('*', { count: 'exact' })
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      return {
        posts: data,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('search lounge posts 에러:', error);
      throw error;
    }
  },

  // 특정 작성자의 라운지 포스트 조회
  async getByAuthor(authorId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('lounge_posts')
        .select('*', { count: 'exact' })
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      return {
        posts: data,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('getByAuthor lounge posts 에러:', error);
      throw error;
    }
  }
};

// ===========================================================================
// 댓글 관리 서비스
// ===========================================================================

export const commentService = {
  // 포스트별 댓글 조회
  async getByPost(postId: number, postType: 'story' | 'lounge') {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          replies:comments!parent_id (
            *
          )
        `)
        .eq('post_id', postId)
        .eq('post_type', postType)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
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
      }
      
      return data;
    } catch (error) {
      console.error('create comment 에러:', error);
      throw error;
    }
  },

  // 댓글 수정
  async update(id: number, content: string, password?: string) {
    try {
      // 게스트 댓글인 경우 비밀번호 확인
      if (password) {
        const { data: comment } = await supabase
          .from('comments')
          .select('guest_password, is_guest')
          .eq('id', id)
          .single();

        if (!comment?.is_guest || comment.guest_password !== password) {
          throw new Error('비밀번호가 일치하지 않습니다.');
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

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('update comment 에러:', error);
      throw error;
    }
  },

  // 댓글 삭제
  async delete(id: number, password?: string) {
    try {
      // 게스트 댓글인 경우 비밀번호 확인
      if (password) {
        const { data: comment } = await supabase
          .from('comments')
          .select('guest_password, is_guest')
          .eq('id', id)
          .single();

        if (!comment?.is_guest || comment.guest_password !== password) {
          throw new Error('비밀번호가 일치하지 않습니다.');
        }
      }

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('delete comment 에러:', error);
      throw error;
    }
  },

  // 모든 댓글 조회 (관리자용)
  async getAll(page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('comments')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      return {
        comments: data,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('getAll comments 에러:', error);
      throw error;
    }
  }
};

// ===========================================================================
// 좋아요/북마크 관리 서비스
// ===========================================================================

export const interactionService = {
  // 좋아요 추가/제거
  async toggleLike(userId: string, postId: number, postType: 'story' | 'lounge') {
    try {
      console.log('🔄 좋아요 토글 시작:', { userId, postId, postType });
      
      // 기존 좋아요 확인
      const { data: existing, error: checkError } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .eq('post_type', postType)
        .maybeSingle();

      if (checkError) {
        console.error('좋아요 확인 에러:', checkError);
        throw checkError;
      }

      console.log('🔍 기존 좋아요 확인 결과:', { existing });

      if (existing) {
        // 좋아요 제거
        console.log('❌ 좋아요 제거 중...');
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        console.log('✅ 좋아요 제거 완료');
        
        // like_count 동기화
        await this.syncLikeCount(postId, postType);
        
        return { action: 'removed', liked: false };
      } else {
        // 좋아요 추가
        console.log('➕ 좋아요 추가 중...');
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: userId,
            post_id: postId,
            post_type: postType
          });

        if (error) throw error;
        
        // 포스트 작성자에게 활동 추가
        const authorId = await this.getPostAuthorId(postId, postType);
        if (authorId && authorId !== userId) {
          await storyService.addUserActivity(authorId, 'like_received');
        }
        
        // like_count 동기화
        await this.syncLikeCount(postId, postType);
        
        console.log('✅ 좋아요 추가 완료');
        return { action: 'added', liked: true };
      }
    } catch (error) {
      console.error('toggleLike 에러:', error);
      throw error;
    }
  },

  // 북마크 추가/제거
  async toggleScrap(userId: string, postId: number, postType: 'story' | 'lounge') {
    try {
      // 기존 북마크 확인
      const { data: existing, error: checkError } = await supabase
        .from('scraps')
        .select('*')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .eq('post_type', postType)
        .maybeSingle();

      if (checkError) {
        console.error('북마크 확인 에러:', checkError);
        throw checkError;
      }

      if (existing) {
        // 북마크 제거
        const { error } = await supabase
          .from('scraps')
          .delete()
          .eq('id', existing.id);

        if (error) throw error;
        
        // scrap_count 동기화
        await this.syncScrapCount(postId, postType);
        
        return { action: 'removed', scraped: false };
      } else {
        // 북마크 추가
        const { error } = await supabase
          .from('scraps')
          .insert({
            user_id: userId,
            post_id: postId,
            post_type: postType
          });

        if (error) throw error;
        
        // 포스트 작성자에게 활동 추가
        const authorId = await this.getPostAuthorId(postId, postType);
        if (authorId && authorId !== userId) {
          await storyService.addUserActivity(authorId, 'bookmarked');
        }
        
        // scrap_count 동기화
        await this.syncScrapCount(postId, postType);
        
        return { action: 'added', scraped: true };
      }
    } catch (error) {
      console.error('toggleScrap 에러:', error);
      throw error;
    }
  },

  // 사용자별 좋아요한 글 조회
  async getUserLikes(userId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      // 먼저 likes 테이블에서 사용자의 좋아요 목록을 가져온다
      const { data: likesData, error: likesError, count } = await supabase
        .from('likes')
        .select('id, user_id, post_id, post_type, created_at', { count: 'exact' })
        .eq('user_id', userId)
        .eq('post_type', 'story')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (likesError) throw likesError;

      if (!likesData || likesData.length === 0) {
        return {
          likes: [],
          total: count || 0,
          page,
          totalPages: Math.ceil((count || 0) / limit)
        };
      }

      // 좋아요한 스토리 ID들을 추출
      const storyIds = likesData.map(like => like.post_id);

      // 스토리 정보를 별도로 조회
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('id, title, summary, author_name, created_at, like_count')
        .in('id', storyIds);

      if (storiesError) throw storiesError;

      // likes와 stories 데이터를 조합
      const combinedData = likesData.map(like => ({
        ...like,
        stories: (storiesData || []).find(story => story.id === like.post_id) || null
      }));
      
      return {
        likes: combinedData,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('getUserLikes 에러:', error);
      console.error('에러 상세:', JSON.stringify(error, null, 2));
      throw error;
    }
  },

  // 사용자별 북마크한 글 조회
  async getUserScraps(userId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const { data, error, count } = await supabase
        .from('scraps')
        .select(`
          *,
          stories!post_id (
            id, title, summary, author_name, created_at, like_count
          ),
          lounge_posts!post_id (
            id, title, author_name, created_at, like_count, type
          )
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      
      return {
        scraps: data,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('getUserScraps 에러:', error);
      throw error;
    }
  },

  // 좋아요/북마크 상태 확인
  async checkInteractionStatus(userId: string, postId: number, postType: 'story' | 'lounge') {
    try {
      const [likeData, scrapData] = await Promise.all([
        supabase
          .from('likes')
          .select('id')
          .eq('user_id', userId)
          .eq('post_id', postId)
          .eq('post_type', postType)
          .single(),
        supabase
          .from('scraps')
          .select('id')
          .eq('user_id', userId)
          .eq('post_id', postId)
          .eq('post_type', postType)
          .single()
      ]);

      return {
        liked: !!likeData.data,
        scraped: !!scrapData.data
      };
    } catch (error) {
      console.error('checkInteractionStatus 에러:', error);
      return { liked: false, scraped: false };
    }
  },

  // 포스트 작성자 ID 조회 (헬퍼 함수)
  async getPostAuthorId(postId: number, postType: 'story' | 'lounge'): Promise<string | null> {
    try {
      if (postType === 'story') {
        const { data } = await supabase
          .from('stories')
          .select('author_id')
          .eq('id', postId)
          .single();
        return data?.author_id || null;
      } else {
        const { data } = await supabase
          .from('lounge_posts')
          .select('author_id')
          .eq('id', postId)
          .single();
        return data?.author_id || null;
      }
    } catch (error) {
      console.error('getPostAuthorId 에러:', error);
      return null;
    }
  },

  // 좋아요 상태 확인
  async isLiked(userId: string, postId: number, postType: 'story' | 'lounge'): Promise<boolean> {
    try {
      console.log('🔍 좋아요 상태 확인:', { userId, postId, postType });
      
      const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .eq('post_type', postType)
        .maybeSingle();

      if (error) {
        console.error('isLiked 에러:', error);
        return false;
      }

      const isLiked = !!data;
      console.log('✅ 좋아요 상태 결과:', { data, isLiked });
      return isLiked;
    } catch (error) {
      console.error('isLiked 에러:', error);
      return false;
    }
  },

  // 북마크 상태 확인
  async isScraped(userId: string, postId: number, postType: 'story' | 'lounge'): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('scraps')
        .select('*')
        .eq('user_id', userId)
        .eq('post_id', postId)
        .eq('post_type', postType)
        .maybeSingle();

      if (error) {
        console.error('isScraped 에러:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('isScraped 에러:', error);
      return false;
    }
  },

  // 북마크 상태 확인 (호환성)
  async isBookmarked(userId: string, postId: number, postType: 'story' | 'lounge'): Promise<boolean> {
    return this.isScraped(userId, postId, postType);
  },

  // 좋아요 추가 (호환성)
  async addLike(userId: string, postId: number, postType: 'story' | 'lounge'): Promise<boolean> {
    try {
      const result = await this.toggleLike(userId, postId, postType);
      return result.action === 'added';
    } catch (error) {
      console.error('addLike 에러:', error);
      return false;
    }
  },

  // 좋아요 제거 (호환성)
  async removeLike(userId: string, postId: number, postType: 'story' | 'lounge'): Promise<boolean> {
    try {
      const result = await this.toggleLike(userId, postId, postType);
      return result.action === 'removed';
    } catch (error) {
      console.error('removeLike 에러:', error);
      return false;
    }
  },

  // 북마크 추가 (호환성)
  async addBookmark(userId: string, postId: number, postType: 'story' | 'lounge'): Promise<boolean> {
    try {
      const result = await this.toggleScrap(userId, postId, postType);
      return result.action === 'added';
    } catch (error) {
      console.error('addBookmark 에러:', error);
      return false;
    }
  },

  // 북마크 제거 (호환성)
  async removeBookmark(userId: string, postId: number, postType: 'story' | 'lounge'): Promise<boolean> {
    try {
      const result = await this.toggleScrap(userId, postId, postType);
      return result.action === 'removed';
    } catch (error) {
      console.error('removeBookmark 에러:', error);
      return false;
    }
  },

  // 좋아요 개수 조회 (현재 사용자만)
  async getLikeCount(postId: number, postType: 'story' | 'lounge', userId?: string): Promise<number> {
    try {
      console.log('🔢 좋아요 개수 조회 중:', { postId, postType, userId });
      
      if (userId) {
        // 현재 사용자의 좋아요만 조회
        const { count, error } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId)
          .eq('post_type', postType)
          .eq('user_id', userId);
        
        if (error) {
          console.error('getLikeCount 에러:', error);
          return 0;
        }
        
        const actualCount = count || 0;
        console.log('✅ 현재 사용자 좋아요 개수:', actualCount);
        return actualCount;
      } else {
        // 전체 좋아요 개수 조회
        const { count, error } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId)
          .eq('post_type', postType);
        
        if (error) {
          console.error('getLikeCount 에러:', error);
          return 0;
        }
        
        const actualCount = count || 0;
        console.log('✅ 전체 좋아요 개수:', actualCount);
        return actualCount;
      }
    } catch (error) {
      console.error('getLikeCount 에러:', error);
      return 0;
    }
  },

  // 댓글 개수 조회
  async getCommentCount(postId: number, postType: 'story' | 'lounge'): Promise<number> {
    try {
      console.log('💬 댓글 개수 조회 중:', { postId, postType });
      
      const { data, error, count } = await supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('post_id', postId)
        .eq('post_type', postType);

      if (error) {
        console.error('getCommentCount 에러:', error);
        return 0;
      }

      console.log('✅ 댓글 개수:', count || 0);
      return count || 0;
    } catch (error) {
      console.error('getCommentCount 에러:', error);
      return 0;
    }
  },

  // 좋아요 개수 동기화 (데이터베이스의 like_count 필드 업데이트)
  async syncLikeCount(postId: number, postType: 'story' | 'lounge'): Promise<void> {
    try {
      console.log('🔄 좋아요 개수 동기화 시작:', { postId, postType });
      
      // 실제 좋아요 개수 조회
      const actualCount = await this.getLikeCount(postId, postType);
      
      // 테이블명 결정
      const tableName = postType === 'story' ? 'stories' : 'lounge_posts';
      
      // like_count 필드 업데이트
      const { error } = await supabase
        .from(tableName)
        .update({ like_count: actualCount })
        .eq('id', postId);
      
      if (error) {
        console.error('syncLikeCount 에러:', error);
        throw error;
      }
      
      console.log('✅ 좋아요 개수 동기화 완료:', { postId, postType, actualCount });
    } catch (error) {
      console.error('syncLikeCount 에러:', error);
      throw error;
    }
  },

  // 전체 글들의 좋아요 개수 동기화 (관리용)
  async syncAllLikeCounts(): Promise<void> {
    try {
      console.log('🔄 전체 글 좋아요 개수 동기화 시작...');
      
      // 모든 스토리 동기화
      const { data: stories, error: storiesError } = await supabase
        .from('stories')
        .select('id');
        
      if (!storiesError && stories) {
        for (const story of stories) {
          await this.syncLikeCount(story.id, 'story');
        }
        console.log(`✅ Stories 좋아요 동기화 완료: ${stories.length}개`);
      }
      
      // 모든 라운지 글 동기화
      const { data: loungePosts, error: loungeError } = await supabase
        .from('lounge_posts')
        .select('id');
        
      if (!loungeError && loungePosts) {
        for (const post of loungePosts) {
          await this.syncLikeCount(post.id, 'lounge');
        }
        console.log(`✅ Lounge Posts 좋아요 동기화 완료: ${loungePosts.length}개`);
      }
      
      console.log('🎉 전체 좋아요 개수 동기화 완료!');
    } catch (error) {
      console.error('전체 좋아요 동기화 에러:', error);
      throw error;
    }
  },

  // 북마크 개수 조회
  async getScrapCount(postId: number, postType: 'story' | 'lounge'): Promise<number> {
    try {
      console.log('🔢 북마크 개수 조회 중:', { postId, postType });
      const { count, error } = await supabase
        .from('scraps')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
        .eq('post_type', postType);
      
      if (error) {
        console.error('getScrapCount 에러:', error);
        return 0;
      }
      
      const actualCount = count || 0;
      console.log('✅ 실제 북마크 개수:', actualCount);
      return actualCount;
    } catch (error) {
      console.error('getScrapCount 에러:', error);
      return 0;
    }
  },

  // 북마크 개수 동기화 (데이터베이스의 scrap_count 필드 업데이트)
  async syncScrapCount(postId: number, postType: 'story' | 'lounge'): Promise<void> {
    try {
      console.log('🔄 북마크 개수 동기화 시작:', { postId, postType });
      
      // 실제 북마크 개수 조회
      const actualCount = await this.getScrapCount(postId, postType);
      
      // 테이블명 결정
      const tableName = postType === 'story' ? 'stories' : 'lounge_posts';
      
      // scrap_count 필드 업데이트
      const { error } = await supabase
        .from(tableName)
        .update({ scrap_count: actualCount })
        .eq('id', postId);
      
      if (error) {
        console.error('syncScrapCount 에러:', error);
        throw error;
      }
      
      console.log('✅ 북마크 개수 동기화 완료:', { postId, postType, actualCount });
    } catch (error) {
      console.error('syncScrapCount 에러:', error);
      throw error;
    }
  },

  // 사용자의 북마크 목록 조회
  async getUserBookmarks(userId: string) {
    try {
      console.log('🔖 사용자 북마크 목록 조회 중:', { userId });
      
      const { data, error } = await supabase
        .from('scraps')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('getUserBookmarks 에러:', error);
        throw error;
      }

      console.log('✅ 사용자 북마크 목록 조회 완료:', data?.length || 0, '개');
      return data || [];
    } catch (error) {
      console.error('getUserBookmarks 에러:', error);
      throw error;
    }
  }
};

// ===========================================================================
// 검색 관리 서비스
// ===========================================================================

export const searchService = {
  // 검색어 추가/업데이트
  async addSearchKeyword(keyword: string) {
    try {
      if (!keyword || keyword.trim().length < 2) {
        console.log('🔍 검색어가 너무 짧음:', keyword);
        return;
      }

      const trimmedKeyword = keyword.trim();
      console.log('🔍 검색어 추가 시도:', trimmedKeyword);

      // 기존 검색어 확인
      const { data: existing, error: selectError } = await supabase
        .from('search_keywords')
        .select('id, search_count')
        .eq('keyword', trimmedKeyword)
        .single();

      console.log('🔍 기존 검색어 확인 결과:', { existing, selectError });

      if (existing) {
        // 기존 검색어 업데이트
        console.log('🔄 기존 검색어 업데이트:', existing.search_count, '→', existing.search_count + 1);
        const { error } = await supabase
          .from('search_keywords')
          .update({
            search_count: existing.search_count + 1,
            last_searched: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) {
          console.error('❌ 검색어 업데이트 실패:', error);
          throw error;
        } else {
          console.log('✅ 검색어 업데이트 성공');
        }
      } else {
        // 새 검색어 추가
        console.log('➕ 새 검색어 추가');
        const { error } = await supabase
          .from('search_keywords')
          .insert({
            keyword: trimmedKeyword,
            search_count: 1,
            last_searched: new Date().toISOString()
          });

        if (error) {
          console.error('❌ 검색어 추가 실패:', error);
          throw error;
        } else {
          console.log('✅ 검색어 추가 성공');
        }
      }
    } catch (error) {
      console.error('❌ addSearchKeyword 에러:', error);
      // 검색어 추가 실패는 무시하지만 로그는 남김
    }
  },

  // 인기 검색어 조회
  async getTopKeywords(limit = 5) {
    try {
      console.log('🔥 인기 검색어 조회 시도, limit:', limit);
      const { data, error } = await supabase
        .from('search_keywords')
        .select('*')
        .order('search_count', { ascending: false })
        .order('last_searched', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ 인기 검색어 조회 실패:', error);
        throw error;
      }
      
      console.log('🔥 인기 검색어 조회 결과:', data);
      return data || [];
    } catch (error) {
      console.error('❌ getTopKeywords 에러:', error);
      return [];
    }
  },

  // 최근 검색어 조회
  async getRecentKeywords(limit = 10) {
    try {
      console.log('📝 최근 검색어 조회 시도, limit:', limit);
      const { data, error } = await supabase
        .from('search_keywords')
        .select('*')
        .order('last_searched', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ 최근 검색어 조회 실패:', error);
        throw error;
      }
      
      console.log('📝 최근 검색어 조회 결과:', data);
      return data || [];
    } catch (error) {
      console.error('❌ getRecentKeywords 에러:', error);
      return [];
    }
  },

  // 통합 검색
  async search(query: string, page = 1, limit = 20) {
    try {
      // 검색어 추가
      await this.addSearchKeyword(query);

      // 스토리와 라운지 포스트를 병렬로 검색
      const [storyResults, loungeResults] = await Promise.all([
        storyService.search(query, page, limit),
        loungeService.search(query, page, limit)
      ]);

      return {
        stories: storyResults.stories || [],
        loungePosts: loungeResults.posts || [],
        totalResults: (storyResults.total || 0) + (loungeResults.total || 0)
      };
    } catch (error) {
      console.error('search 에러:', error);
      throw error;
    }
  }
};

// ===========================================================================
// 태그 관리 서비스
// ===========================================================================

export const tagService = {
  // 모든 태그 카테고리 조회
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('tag_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('getCategories 에러:', error);
      return [];
    }
  },

  // 모든 태그 조회 (카테고리 정보 포함)
  async getAllTags() {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select(`
          id,
          name,
          category_id,
          description,
          usage_count,
          is_active,
          created_at,
          updated_at,
          tag_categories:category_id (
            id,
            name,
            description
          )
        `)
        .eq('is_active', true)
        .order('usage_count', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('getAllTags 에러:', error);
      return [];
    }
  },

  // ID로 태그 조회
  async getTagById(tagId: string) {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select(`
          id,
          name,
          category_id,
          description,
          usage_count,
          is_active,
          created_at,
          updated_at,
          tag_categories:category_id (
            id,
            name,
            description
          )
        `)
        .eq('id', tagId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('getTagById 에러:', error);
      return null;
    }
  },

  // 태그 추가
  async addTag(tag: { id: string; name: string; category_id: string; description?: string }) {
    try {
      console.log('🏷️ 새 태그 추가 시도:', tag);
      
      // 먼저 중복 태그가 있는지 확인
      const { data: existingTags, error: checkError } = await supabase
        .from('tags')
        .select('id, name')
        .or(`id.eq.${tag.id},name.eq.${tag.name}`);
        
      if (checkError) {
        console.error('❌ 중복 확인 실패:', checkError);
        throw checkError;
      }
      
      if (existingTags && existingTags.length > 0) {
        const duplicateTag = existingTags[0];
        console.warn('⚠️ 이미 존재하는 태그:', duplicateTag);
        const errorMsg = `이미 존재하는 태그입니다. ID: "${duplicateTag.id}", 이름: "${duplicateTag.name}"`;
        throw new Error(errorMsg);
      }

      const { data, error } = await supabase
        .from('tags')
        .insert({
          id: tag.id,
          name: tag.name,
          category_id: tag.category_id,
          description: tag.description || null,
          usage_count: 0,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ 태그 추가 실패:', error);
        console.error('❌ 에러 상세:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ 태그 추가 성공:', data);
      return data;
    } catch (error) {
      console.error('❌ addTag 에러:', error);
      throw error;
    }
  },

  // 태그 수정
  async updateTag(tagId: string, updates: { name?: string; description?: string; category_id?: string }) {
    try {
      console.log('🏷️ 태그 수정 시도:', tagId, updates);

      const { data, error } = await supabase
        .from('tags')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', tagId)
        .select()
        .single();

      if (error) {
        console.error('❌ 태그 수정 실패:', error);
        throw error;
      }

      console.log('✅ 태그 수정 성공:', data);
      return data;
    } catch (error) {
      console.error('❌ updateTag 에러:', error);
      throw error;
    }
  },

  // 태그 삭제 (소프트 삭제)
  async deleteTag(tagId: string) {
    try {
      console.log('🏷️ 태그 삭제 시도:', tagId);

      const { error } = await supabase
        .from('tags')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', tagId);

      if (error) {
        console.error('❌ 태그 삭제 실패:', error);
        throw error;
      }

      console.log('✅ 태그 삭제 성공:', tagId);
      return true;
    } catch (error) {
      console.error('❌ deleteTag 에러:', error);
      throw error;
    }
  },

  // 태그 사용량 증가
  async incrementTagUsage(tagId: string) {
    try {
      const { error } = await supabase
        .from('tags')
        .update({
          usage_count: supabase.sql`usage_count + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('id', tagId);

      if (error) throw error;
    } catch (error) {
      console.error('incrementTagUsage 에러:', error);
      // 사용량 증가 실패는 무시 (중요하지 않음)
    }
  },

  // 카테고리별 태그 통계
  async getTagStatsByCategory() {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select(`
          category_id,
          tag_categories:category_id (name),
          count()
        `)
        .eq('is_active', true)
        .group('category_id');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('getTagStatsByCategory 에러:', error);
      return [];
    }
  }
};

// ===========================================================================
// 내보내기
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