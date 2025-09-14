export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          provider: 'kakao' | 'google' | 'admin'
          is_admin: boolean
          is_verified: boolean
          bio: string | null
          email_notifications: boolean
          push_notifications: boolean
          weekly_digest: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          provider?: 'kakao' | 'google' | 'admin'
          is_admin?: boolean
          is_verified?: boolean
          bio?: string | null
          email_notifications?: boolean
          push_notifications?: boolean
          weekly_digest?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          provider?: 'kakao' | 'google' | 'admin'
          is_admin?: boolean
          is_verified?: boolean
          bio?: string | null
          email_notifications?: boolean
          push_notifications?: boolean
          weekly_digest?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      stories: {
        Row: {
          id: number
          title: string
          summary: string
          content: string
          author_id: string | null
          author_name: string
          category: string | null
          tags: string[]
          image_url: string | null
          read_time: number
          like_count: number
          scrap_count: number
          view_count: number
          comment_count: number
          is_verified: boolean
          verification_badge: string | null
          is_from_lounge: boolean
          original_lounge_post_id: number | null
          original_author_name: string | null
          promoted_at: string | null
          created_at: string
          updated_at: string
          published_at: string
        }
        Insert: {
          id?: number
          title: string
          summary: string
          content: string
          author_id?: string | null
          author_name: string
          category?: string | null
          tags?: string[]
          image_url?: string | null
          read_time?: number
          like_count?: number
          scrap_count?: number
          view_count?: number
          comment_count?: number
          is_verified?: boolean
          verification_badge?: string | null
          is_from_lounge?: boolean
          original_lounge_post_id?: number | null
          original_author_name?: string | null
          promoted_at?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string
        }
        Update: {
          id?: number
          title?: string
          summary?: string
          content?: string
          author_id?: string | null
          author_name?: string
          category?: string | null
          tags?: string[]
          image_url?: string | null
          read_time?: number
          like_count?: number
          scrap_count?: number
          view_count?: number
          comment_count?: number
          is_verified?: boolean
          verification_badge?: string | null
          is_from_lounge?: boolean
          original_lounge_post_id?: number | null
          original_author_name?: string | null
          promoted_at?: string | null
          created_at?: string
          updated_at?: string
          published_at?: string
        }
      }
      lounge_posts: {
        Row: {
          id: number
          title: string
          content: string
          author_id: string | null
          author_name: string
          type: 'question' | 'experience' | 'info' | 'free' | 'news' | 'advice' | 'recommend' | 'anonymous'
          tags: string[]
          like_count: number
          scrap_count: number
          comment_count: number
          view_count: number
          is_excellent: boolean
          promotion_status: 'eligible' | 'pending' | 'approved' | 'rejected' | null
          promotion_note: string | null
          reward_claimed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          content: string
          author_id?: string | null
          author_name: string
          type?: 'question' | 'experience' | 'info' | 'free' | 'news' | 'advice' | 'recommend' | 'anonymous'
          tags?: string[]
          like_count?: number
          scrap_count?: number
          comment_count?: number
          view_count?: number
          is_excellent?: boolean
          promotion_status?: 'eligible' | 'pending' | 'approved' | 'rejected' | null
          promotion_note?: string | null
          reward_claimed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          content?: string
          author_id?: string | null
          author_name?: string
          type?: 'question' | 'experience' | 'info' | 'free' | 'news' | 'advice' | 'recommend' | 'anonymous'
          tags?: string[]
          like_count?: number
          scrap_count?: number
          comment_count?: number
          view_count?: number
          is_excellent?: boolean
          promotion_status?: 'eligible' | 'pending' | 'approved' | 'rejected' | null
          promotion_note?: string | null
          reward_claimed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: number
          post_id: number
          post_type: 'story' | 'lounge'
          content: string
          author_id: string | null
          author_name: string
          is_guest: boolean
          guest_password: string | null
          parent_id: number | null
          author_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          post_id: number
          post_type: 'story' | 'lounge'
          content: string
          author_id?: string | null
          author_name: string
          is_guest?: boolean
          guest_password?: string | null
          parent_id?: number | null
          author_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          post_type?: 'story' | 'lounge'
          content?: string
          author_id?: string | null
          author_name?: string
          is_guest?: boolean
          guest_password?: string | null
          parent_id?: number | null
          author_verified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      likes: {
        Row: {
          id: number
          user_id: string
          post_id: number
          post_type: 'story' | 'lounge'
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          post_id: number
          post_type: 'story' | 'lounge'
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          post_id?: number
          post_type?: 'story' | 'lounge'
          created_at?: string
        }
      }
      scraps: {
        Row: {
          id: number
          user_id: string
          post_id: number
          post_type: 'story' | 'lounge'
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          post_id: number
          post_type: 'story' | 'lounge'
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          post_id?: number
          post_type?: 'story' | 'lounge'
          created_at?: string
        }
      }
      user_levels: {
        Row: {
          id: number
          user_id: string
          current_exp: number
          level: number
          total_likes: number
          story_promotions: number
          total_bookmarks: number
          total_posts: number
          total_comments: number
          excellent_posts: number
          achievements: string[]
          last_level_up: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          current_exp?: number
          level?: number
          total_likes?: number
          story_promotions?: number
          total_bookmarks?: number
          total_posts?: number
          total_comments?: number
          excellent_posts?: number
          achievements?: string[]
          last_level_up?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          current_exp?: number
          level?: number
          total_likes?: number
          story_promotions?: number
          total_bookmarks?: number
          total_posts?: number
          total_comments?: number
          excellent_posts?: number
          achievements?: string[]
          last_level_up?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_activities: {
        Row: {
          id: number
          user_id: string
          activity_type: 'post_created' | 'comment_created' | 'like_received' | 'bookmarked' | 'excellent_post' | 'story_promoted'
          amount: number
          exp_gained: number
          related_post_id: number | null
          related_post_type: 'story' | 'lounge' | null
          created_at: string
        }
        Insert: {
          id?: number
          user_id: string
          activity_type: 'post_created' | 'comment_created' | 'like_received' | 'bookmarked' | 'excellent_post' | 'story_promoted'
          amount?: number
          exp_gained?: number
          related_post_id?: number | null
          related_post_type?: 'story' | 'lounge' | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          activity_type?: 'post_created' | 'comment_created' | 'like_received' | 'bookmarked' | 'excellent_post' | 'story_promoted'
          amount?: number
          exp_gained?: number
          related_post_id?: number | null
          related_post_type?: 'story' | 'lounge' | null
          created_at?: string
        }
      }
      promotion_requests: {
        Row: {
          id: number
          post_id: number
          post_type: 'story' | 'lounge'
          status: 'pending' | 'approved' | 'rejected'
          reason: string | null
          admin_note: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          post_id: number
          post_type?: 'story' | 'lounge'
          status?: 'pending' | 'approved' | 'rejected'
          reason?: string | null
          admin_note?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          post_type?: 'story' | 'lounge'
          status?: 'pending' | 'approved' | 'rejected'
          reason?: string | null
          admin_note?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      search_keywords: {
        Row: {
          id: number
          keyword: string
          search_count: number
          last_searched: string
          created_at: string
        }
        Insert: {
          id?: number
          keyword: string
          search_count?: number
          last_searched?: string
          created_at?: string
        }
        Update: {
          id?: number
          keyword?: string
          search_count?: number
          last_searched?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: number
          user_id: string
          type: 'level_up' | 'promotion_approved' | 'promotion_rejected' | 'like_received' | 'comment_received'
          title: string
          message: string
          data: any
          is_read: boolean
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: number
          user_id: string
          type: 'level_up' | 'promotion_approved' | 'promotion_rejected' | 'like_received' | 'comment_received'
          title: string
          message: string
          data?: any
          is_read?: boolean
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: number
          user_id?: string
          type?: 'level_up' | 'promotion_approved' | 'promotion_rejected' | 'like_received' | 'comment_received'
          title?: string
          message?: string
          data?: any
          is_read?: boolean
          created_at?: string
          read_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_view_count: {
        Args: {
          post_id: number
          post_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      auth_provider: 'kakao' | 'google' | 'admin'
      post_type: 'story' | 'lounge'
      lounge_type: 'question' | 'experience' | 'info' | 'free' | 'news' | 'advice' | 'recommend' | 'anonymous'
      promotion_status: 'eligible' | 'pending' | 'approved' | 'rejected'
      request_status: 'pending' | 'approved' | 'rejected'
      notification_type: 'level_up' | 'promotion_approved' | 'promotion_rejected' | 'like_received' | 'comment_received'
      activity_type: 'post_created' | 'comment_created' | 'like_received' | 'bookmarked' | 'excellent_post' | 'story_promoted'
    }
  }
}