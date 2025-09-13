export interface Database {
  public: {
    Tables: {
      stories: {
        Row: {
          id: number
          title: string
          summary: string
          content: string
          author: string
          category: string
          tags: string[]
          like_count: number
          scrap_count: number
          view_count: number
          read_time: number
          image_url: string | null
          is_verified: boolean
          is_from_lounge: boolean
          original_author: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          summary: string
          content: string
          author: string
          category: string
          tags?: string[]
          like_count?: number
          scrap_count?: number
          view_count?: number
          read_time: number
          image_url?: string | null
          is_verified?: boolean
          is_from_lounge?: boolean
          original_author?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          summary?: string
          content?: string
          author?: string
          category?: string
          tags?: string[]
          like_count?: number
          scrap_count?: number
          view_count?: number
          read_time?: number
          image_url?: string | null
          is_verified?: boolean
          is_from_lounge?: boolean
          original_author?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lounge_posts: {
        Row: {
          id: number
          title: string
          content: string
          author: string
          type: string
          tags: string[]
          like_count: number
          scrap_count: number
          comment_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          title: string
          content: string
          author: string
          type: string
          tags?: string[]
          like_count?: number
          scrap_count?: number
          comment_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          title?: string
          content?: string
          author?: string
          type?: string
          tags?: string[]
          like_count?: number
          scrap_count?: number
          comment_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: number
          post_id: number
          post_type: 'story' | 'lounge'
          author: string
          content: string
          is_guest: boolean
          guest_password: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          post_id: number
          post_type: 'story' | 'lounge'
          author: string
          content: string
          is_guest?: boolean
          guest_password?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          post_id?: number
          post_type?: 'story' | 'lounge'
          author?: string
          content?: string
          is_guest?: boolean
          guest_password?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          avatar_url: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          avatar_url?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          avatar_url?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}