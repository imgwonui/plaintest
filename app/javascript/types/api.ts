// API 연결을 위한 타입 정의
// 데이터베이스 스키마와 호환되는 구조

export interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt?: string;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: 'user' | 'admin';
  profileImageUrl?: string;
  isActive: boolean;
}

export interface Story extends BaseEntity {
  title: string;
  author: string;
  summary: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  readTime: number;
  likeCount: number;
  scrapCount: number;
  viewCount: number;
  isVerified: boolean;
  isFromLounge?: boolean;
  originalAuthor?: string;
  authorId?: number;
}

export interface LoungePost extends BaseEntity {
  title: string;
  author: string;
  summary?: string;
  content: string;
  type: 'question' | 'experience' | 'info' | 'free' | 'news' | 'advice' | 'recommend' | 'anonymous';
  tags: string[];
  likeCount: number;
  scrapCount: number;
  commentCount: number;
  isExcellent: boolean;
  rewardClaimed: boolean;
  authorId?: number;
}

export interface Comment extends BaseEntity {
  postId: number;
  postType: 'story' | 'lounge';
  author: string;
  content: string;
  isGuest: boolean;
  guestPassword?: string;
  parentId?: number; // 대댓글용
  authorId?: number;
}

export interface Tag extends BaseEntity {
  name: string;
  category?: string;
  usageCount: number;
  isPopular: boolean;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
}

// API 요청 파라미터 타입
export interface CreateStoryRequest {
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  readTime: number;
  isVerified?: boolean;
}

export interface CreateLoungePostRequest {
  title: string;
  content: string;
  type: LoungePost['type'];
  tags: string[];
  summary?: string;
}

export interface CreateCommentRequest {
  postId: number;
  postType: 'story' | 'lounge';
  content: string;
  author?: string;
  guestPassword?: string;
  parentId?: number;
}

export interface UpdateLikeRequest {
  postId: number;
  postType: 'story' | 'lounge';
  action: 'like' | 'unlike';
}

export interface UpdateScrapRequest {
  postId: number;
  postType: 'story' | 'lounge';
  action: 'scrap' | 'unscrap';
}

// 검색 및 필터링 파라미터
export interface SearchParams {
  query?: string;
  tags?: string[];
  type?: 'story' | 'lounge' | 'all';
  sortBy?: 'latest' | 'popular' | 'likes' | 'scraps';
  page?: number;
  limit?: number;
}

// 관리자 기능용 타입
export interface AdminDashboardStats {
  totalUsers: number;
  totalStories: number;
  totalLoungePosts: number;
  totalComments: number;
  thisMonthStories: number;
  thisMonthLoungePosts: number;
  pendingStories: number;
  excellentPosts: number;
}

export interface PromoteToStoryRequest {
  loungePostId: number;
  title: string;
  summary: string;
  content: string;
  imageUrl?: string;
  tags: string[];
  readTime: number;
}