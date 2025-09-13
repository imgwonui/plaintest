import { supabase } from '../lib/supabaseClient'
import type { Database } from '../types/database'

// Stories 관련 서비스
export const storyService = {
  // 모든 스토리 조회
  async getAll() {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 특정 스토리 조회
  async getById(id: number) {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // 스토리 생성
  async create(story: Database['public']['Tables']['stories']['Insert']) {
    const { data, error } = await supabase
      .from('stories')
      .insert(story)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 좋아요 수 업데이트
  async updateLikeCount(id: number, count: number) {
    const { data, error } = await supabase
      .from('stories')
      .update({ like_count: count })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 조회수 증가
  async incrementViewCount(id: number) {
    const { data, error } = await supabase
      .rpc('increment_view_count', { story_id: id })
    
    if (error) throw error
    return data
  }
}

// Lounge Posts 관련 서비스
export const loungeService = {
  // 모든 라운지 포스트 조회
  async getAll() {
    const { data, error } = await supabase
      .from('lounge_posts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 인기 포스트 조회 (좋아요 50개 이상)
  async getPopular() {
    const { data, error } = await supabase
      .from('lounge_posts')
      .select('*')
      .gte('like_count', 50)
      .order('like_count', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 특정 라운지 포스트 조회
  async getById(id: number) {
    const { data, error } = await supabase
      .from('lounge_posts')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // 라운지 포스트 생성
  async create(post: Database['public']['Tables']['lounge_posts']['Insert']) {
    const { data, error } = await supabase
      .from('lounge_posts')
      .insert(post)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Comments 관련 서비스
export const commentService = {
  // 특정 포스트의 댓글 조회
  async getByPost(postId: number, postType: 'story' | 'lounge') {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .eq('post_type', postType)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    return data
  },

  // 댓글 생성
  async create(comment: Database['public']['Tables']['comments']['Insert']) {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 댓글 삭제 (비밀번호 확인 후)
  async delete(id: number, password?: string) {
    // 게스트 댓글인 경우 비밀번호 확인
    if (password) {
      const { data: comment, error: fetchError } = await supabase
        .from('comments')
        .select('guest_password')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError
      
      // 실제로는 해시된 비밀번호와 비교해야 함
      if (comment.guest_password !== password) {
        throw new Error('비밀번호가 일치하지 않습니다.')
      }
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// 연결 테스트 함수
export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('stories')
      .select('count', { count: 'exact' })
    
    if (error) throw error
    
    console.log('✅ Supabase 연결 성공!')
    console.log(`📊 스토리 테이블에 ${data?.length || 0}개의 레코드가 있습니다.`)
    return true
  } catch (error) {
    console.error('❌ Supabase 연결 실패:', error)
    return false
  }
}