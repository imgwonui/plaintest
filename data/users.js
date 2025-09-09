export const users = [
  {
    id: 1,
    name: "김인사",
    email: "hr@company.com",
    profileImage: null,
    isLoggedIn: false,
    provider: null, // 'kakao', 'google', or null for email signup
    joinedAt: "2023-06-01T00:00:00Z",
    company: "테크스타트업",
    position: "HR 매니저",
    bio: "5년차 HR 담당자입니다. 조직문화와 인재 개발에 관심이 많아요!",
  }
];

export const authState = {
  isLoggedIn: false,
  currentUser: null,
  loginModal: false,
};

// 소셜 로그인 설정
export const socialLoginConfig = {
  kakao: {
    clientId: 'YOUR_KAKAO_CLIENT_ID', // 실제 구현시 환경변수로 관리
    redirectUri: `${window.location.origin}/auth/kakao/callback`,
  },
  google: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID', // 실제 구현시 환경변수로 관리
    redirectUri: `${window.location.origin}/auth/google/callback`,
  }
};

// 소셜 로그인 함수들 (목업)
export const loginWithKakao = () => {
  console.log('카카오 로그인 시도...');
  // 실제 구현시 카카오 SDK 사용
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockUser = {
        id: Date.now(),
        name: "김카카오",
        email: "kakao@example.com",
        profileImage: "https://via.placeholder.com/100x100",
        provider: "kakao",
        joinedAt: new Date().toISOString(),
      };
      resolve(mockUser);
    }, 1000);
  });
};

export const loginWithGoogle = () => {
  console.log('구글 로그인 시도...');
  // 실제 구현시 구글 SDK 사용
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockUser = {
        id: Date.now(),
        name: "김구글",
        email: "google@example.com", 
        profileImage: "https://via.placeholder.com/100x100",
        provider: "google",
        joinedAt: new Date().toISOString(),
      };
      resolve(mockUser);
    }, 1000);
  });
};

export const logout = () => {
  console.log('로그아웃...');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 500);
  });
};