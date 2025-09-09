export interface User {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
  joinedAt: string;
  company?: string;
  position?: string;
}

export const currentUser: User = {
  id: 1,
  name: "김인사",
  email: "hr@company.com",
  isAdmin: false,
  joinedAt: "2023-06-01T00:00:00Z",
  company: "테크스타트업",
  position: "HR 매니저",
};

export const adminUser: User = {
  id: 2,
  name: "월급날 관리자",
  email: "admin@walgeunal.kr", 
  isAdmin: true,
  joinedAt: "2023-01-01T00:00:00Z",
  company: "월급날",
  position: "서비스 관리자",
};

export const users: User[] = [
  currentUser,
  adminUser,
  {
    id: 3,
    name: "박인사",
    email: "park@example.com",
    isAdmin: false,
    joinedAt: "2023-08-15T00:00:00Z",
    company: "중견기업",
    position: "HR 팀장",
  },
  {
    id: 4,
    name: "이중재",
    email: "lee@company.kr",
    isAdmin: false,
    joinedAt: "2023-04-20T00:00:00Z",
    company: "대기업",
    position: "HR 부장",
  },
];

// 로그인 상태 시뮬레이션을 위한 함수들
export const getCurrentUser = (): User => currentUser;

export const switchToAdmin = (): User => adminUser;

export const isCurrentUserAdmin = (): boolean => currentUser.isAdmin;