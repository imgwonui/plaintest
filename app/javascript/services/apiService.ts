// API 서비스 레이어
// 실제 API 호출을 위한 서비스

import { supabase } from './supabaseService';
import type {
  Story,
  LoungePost,
  Comment,
  Tag,
  ApiResponse,
  PaginatedResponse,
  CreateStoryRequest,
  CreateLoungePostRequest,
  CreateCommentRequest,
  UpdateLikeRequest,
  UpdateScrapRequest,
  SearchParams,
  AdminDashboardStats,
  PromoteToStoryRequest
} from '../types/api';

// Base API 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

class ApiService {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Stories API
  async getStories(params?: SearchParams): Promise<PaginatedResponse<Story>> {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.append('query', params.query);
    if (params?.tags?.length) queryParams.append('tags', params.tags.join(','));
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return this.fetchWithAuth(`/stories?${queryParams}`);
  }

  async getStoryById(id: number): Promise<ApiResponse<Story>> {
    return this.fetchWithAuth(`/stories/${id}`);
  }

  async createStory(data: CreateStoryRequest): Promise<ApiResponse<Story>> {
    return this.fetchWithAuth('/stories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStory(id: number, data: Partial<CreateStoryRequest>): Promise<ApiResponse<Story>> {
    return this.fetchWithAuth(`/stories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStory(id: number): Promise<ApiResponse<void>> {
    return this.fetchWithAuth(`/stories/${id}`, {
      method: 'DELETE',
    });
  }

  async incrementStoryView(id: number): Promise<ApiResponse<void>> {
    return this.fetchWithAuth(`/stories/${id}/view`, {
      method: 'POST',
    });
  }

  // Lounge Posts API
  async getLoungePosts(params?: SearchParams): Promise<PaginatedResponse<LoungePost>> {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.append('query', params.query);
    if (params?.tags?.length) queryParams.append('tags', params.tags.join(','));
    if (params?.type && params.type !== 'all') queryParams.append('type', params.type);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    return this.fetchWithAuth(`/lounge?${queryParams}`);
  }

  async getLoungePostById(id: number): Promise<ApiResponse<LoungePost>> {
    return this.fetchWithAuth(`/lounge/${id}`);
  }

  async createLoungePost(data: CreateLoungePostRequest): Promise<ApiResponse<LoungePost>> {
    return this.fetchWithAuth('/lounge', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateLoungePost(id: number, data: Partial<CreateLoungePostRequest>): Promise<ApiResponse<LoungePost>> {
    return this.fetchWithAuth(`/lounge/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteLoungePost(id: number): Promise<ApiResponse<void>> {
    return this.fetchWithAuth(`/lounge/${id}`, {
      method: 'DELETE',
    });
  }

  async getPopularLoungePosts(): Promise<ApiResponse<LoungePost[]>> {
    return this.fetchWithAuth('/lounge/popular');
  }

  // Comments API
  async getComments(postId: number, postType: 'story' | 'lounge'): Promise<ApiResponse<Comment[]>> {
    return this.fetchWithAuth(`/comments?postId=${postId}&postType=${postType}`);
  }

  async createComment(data: CreateCommentRequest): Promise<ApiResponse<Comment>> {
    return this.fetchWithAuth('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteComment(id: number, password?: string): Promise<ApiResponse<void>> {
    return this.fetchWithAuth(`/comments/${id}`, {
      method: 'DELETE',
      body: password ? JSON.stringify({ password }) : undefined,
    });
  }

  // Likes & Scraps API
  async updateLike(data: UpdateLikeRequest): Promise<ApiResponse<{ count: number }>> {
    return this.fetchWithAuth('/interactions/like', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateScrap(data: UpdateScrapRequest): Promise<ApiResponse<{ count: number }>> {
    return this.fetchWithAuth('/interactions/scrap', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserScraps(): Promise<ApiResponse<{ stories: Story[]; loungePosts: LoungePost[] }>> {
    return this.fetchWithAuth('/user/scraps');
  }

  // Search API
  async search(params: SearchParams): Promise<ApiResponse<{ stories: Story[]; loungePosts: LoungePost[] }>> {
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('query', params.query);
    if (params.tags?.length) queryParams.append('tags', params.tags.join(','));
    if (params.type && params.type !== 'all') queryParams.append('type', params.type);

    return this.fetchWithAuth(`/search?${queryParams}`);
  }

  // Tags API
  async getTags(): Promise<ApiResponse<Tag[]>> {
    return this.fetchWithAuth('/tags');
  }

  async getPopularTags(limit = 20): Promise<ApiResponse<Tag[]>> {
    return this.fetchWithAuth(`/tags/popular?limit=${limit}`);
  }

  // Admin API
  async getAdminStats(): Promise<ApiResponse<AdminDashboardStats>> {
    return this.fetchWithAuth('/admin/stats');
  }

  async promoteToStory(data: PromoteToStoryRequest): Promise<ApiResponse<Story>> {
    return this.fetchWithAuth('/admin/promote-to-story', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyStory(id: number): Promise<ApiResponse<Story>> {
    return this.fetchWithAuth(`/admin/stories/${id}/verify`, {
      method: 'POST',
    });
  }

  async markAsExcellent(postId: number): Promise<ApiResponse<LoungePost>> {
    return this.fetchWithAuth(`/admin/lounge/${postId}/excellent`, {
      method: 'POST',
    });
  }

  // File Upload API
  async uploadImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('image', file);

    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

// 싱글톤 인스턴스 내보내기
export const apiService = new ApiService();

// 개별 함수들도 내보내기 (편의용)
export const {
  getStories,
  getStoryById,
  createStory,
  updateStory,
  deleteStory,
  incrementStoryView,
  getLoungePosts,
  getLoungePostById,
  createLoungePost,
  updateLoungePost,
  deleteLoungePost,
  getPopularLoungePosts,
  getComments,
  createComment,
  deleteComment,
  updateLike,
  updateScrap,
  getUserScraps,
  search,
  getTags,
  getPopularTags,
  getAdminStats,
  promoteToStory,
  verifyStory,
  markAsExcellent,
  uploadImage,
} = apiService;

export default apiService;