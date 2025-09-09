import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  provider: 'kakao' | 'google' | 'admin';
  avatar?: string;
  isAdmin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  login: (provider: 'kakao' | 'google') => void;
  adminLogin: () => void;
  logout: () => void;
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

  const login = (provider: 'kakao' | 'google') => {
    // 실제로는 여기서 OAuth 로그인을 처리하겠지만, 지금은 임시로 설정
    const mockUser: User = {
      id: provider === 'kakao' ? 'kakao_123' : 'google_456',
      name: provider === 'kakao' ? '김인사' : 'John Doe',
      email: provider === 'kakao' ? 'kim@example.com' : 'john@example.com',
      provider,
      avatar: undefined,
      isAdmin: false
    };
    setUser(mockUser);
  };

  const adminLogin = () => {
    const adminUser: User = {
      id: 'admin_001',
      name: '관리자',
      email: 'admin@plain.com',
      provider: 'admin',
      avatar: undefined,
      isAdmin: true
    };
    setUser(adminUser);
  };

  const logout = () => {
    setUser(null);
  };

  const isLoggedIn = user !== null;
  const isAdmin = user?.isAdmin === true;

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isAdmin, login, adminLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};