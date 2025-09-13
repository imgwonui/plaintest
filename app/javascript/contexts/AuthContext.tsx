import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sessionUserService } from '../services/sessionDataService';

interface User {
  id: string;
  name: string;
  email: string;
  provider: 'kakao' | 'google' | 'admin';
  avatar?: string;
  isAdmin?: boolean;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (provider: 'kakao' | 'google') => void;
  adminLogin: () => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // 컴포넌트 마운트 시 세션에서 사용자 정보 복원
  useEffect(() => {
    const savedUser = sessionUserService.getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const login = (provider: 'kakao' | 'google') => {
    // API 연결 전까지는 목업 사용자 생성
    const mockUser: User = {
      id: provider === 'kakao' ? 'kakao_123' : 'google_456',
      name: provider === 'kakao' ? '김인사' : 'John Doe',
      email: provider === 'kakao' ? 'kim@example.com' : 'john@example.com',
      provider,
      avatar: undefined,
      isAdmin: false,
      isVerified: provider === 'google' // 구글 로그인은 자동으로 인사담당자 인증
    };
    setUser(mockUser);
    sessionUserService.setCurrentUser(mockUser);
    console.log('🔐 로그인되었습니다:', mockUser.name, provider === 'google' ? '(인사담당자 인증됨)' : '');
  };

  const adminLogin = () => {
    const adminUser: User = {
      id: 'admin_001',
      name: '관리자',
      email: 'admin@plain.com',
      provider: 'admin',
      avatar: undefined,
      isAdmin: true,
      isVerified: true
    };
    setUser(adminUser);
    sessionUserService.setCurrentUser(adminUser);
    console.log('👑 관리자로 로그인되었습니다');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      sessionUserService.setCurrentUser(updatedUser);
      console.log('👤 사용자 정보가 업데이트되었습니다:', updates);
    }
  };

  const logout = () => {
    setUser(null);
    sessionUserService.clearCurrentUser();
    console.log('👋 로그아웃되었습니다');
  };

  const isLoggedIn = user !== null;
  const isAdmin = user?.isAdmin === true;

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isAdmin, login, adminLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};