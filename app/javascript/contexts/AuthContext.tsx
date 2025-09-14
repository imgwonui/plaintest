import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userService } from '../services/supabaseDataService';
import { supabase } from '../lib/supabaseClient';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// UUID 생성 함수 (임시 - Supabase Auth 연동 전까지 사용)
const generateUUID = (): string => {
  try {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  } catch (error) {
    console.warn('UUID 생성 실패, 단순 ID 사용:', error);
    return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }
};

// 사용자 ID 일관성 확보 - 같은 provider로 로그인시 항상 동일한 ID 사용
const getOrCreateUserId = (provider: 'kakao' | 'google' | 'admin'): string => {
  const storageKey = `plain_user_id_${provider}`;
  
  try {
    const existingId = localStorage.getItem(storageKey);
    
    if (existingId && existingId.length > 0) {
      console.log(`📋 기존 사용자 ID 발견 (${provider}):`, existingId);
      return existingId;
    }
    
    // 새로운 ID 생성 및 저장
    const newId = generateUUID();
    localStorage.setItem(storageKey, newId);
    console.log(`🆕 새 사용자 ID 생성 (${provider}):`, newId);
    return newId;
  } catch (storageError) {
    console.warn('⚠️ localStorage 접근 실패, 임시 ID 사용:', storageError);
    return generateUUID();
  }
};

interface User {
  id: string;
  name: string;
  email: string;
  provider: 'kakao' | 'google' | 'admin';
  avatar?: string;
  bio?: string;
  isAdmin?: boolean;
  isVerified?: boolean;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  weeklyDigest?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
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
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase Auth 상태 변경 감지
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth 상태 변경:', event, session?.user?.id);
        
        if (session?.user) {
          setSupabaseUser(session.user);
          
          // 사용자 정보를 DB에서 가져오기
          try {
            const currentUser = await userService.getCurrentUser();
            if (currentUser) {
              setUser(currentUser);
            } else {
              // DB에 사용자가 없으면 생성
              const isAdmin = session.user.user_metadata?.provider === 'admin' || session.user.email === 'admin@plain.com';
              const newUser = await userService.createUser({
                id: session.user.id,
                name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '사용자',
                email: session.user.email || '',
                provider: (session.user.user_metadata?.provider as 'kakao' | 'google' | 'admin') || 'kakao',
                is_admin: isAdmin,
                is_verified: session.user.user_metadata?.provider === 'google' || isAdmin
              });
              setUser(newUser);
            }
          } catch (error) {
            console.error('사용자 정보 로드/생성 실패:', error);
          }
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // 컴포넌트 마운트 시 현재 세션 확인
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        console.log('🔍 초기 세션 확인 시작...');
        setIsLoading(true);
        
        // 1. 먼저 로컬 스토리지에서 세션 복원 시도 (빠른 복원)
        const savedUser = localStorage.getItem('plain_user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser) as User;
            console.log('📦 로컬 스토리지에서 사용자 발견:', parsedUser.name, parsedUser.id);
            
            // 즉시 UI 상태 복원 (로딩 완료)
            setUser(parsedUser);
            setIsLoading(false);
            console.log('✅ 빠른 세션 복원 완료:', parsedUser.name);
            
            // 백그라운드에서 DB 동기화 (사용자 경험 방해하지 않음)
            setTimeout(async () => {
              try {
                const latestUser = await userService.getCurrentUserById(parsedUser.id);
                if (latestUser) {
                  console.log('🔄 백그라운드 DB 동기화:', latestUser.name);
                  setUser(latestUser);
                  try {
                    localStorage.setItem('plain_user', JSON.stringify(latestUser));
                    console.log('💾 최신 사용자 정보 저장 완료');
                  } catch (storageError) {
                    console.warn('⚠️ DB 동기화 후 로컬 스토리지 저장 실패:', storageError);
                  }
                } else {
                  console.warn('⚠️ DB에서 사용자를 찾을 수 없음, 로컬 세션 유지');
                }
              } catch (dbError) {
                console.warn('⚠️ 백그라운드 DB 동기화 실패, 로컬 세션 유지:', dbError);
              }
            }, 100); // 100ms 후 백그라운드에서 동기화
            
            return; // 로컬 세션이 있으면 여기서 종료
          } catch (parseError) {
            console.error('❌ 저장된 사용자 정보 파싱 실패:', parseError);
            localStorage.removeItem('plain_user');
          }
        }
        
        // 2. 로컬 세션이 없으면 Supabase 세션 확인
        console.log('🔐 로컬 세션 없음, Supabase 세션 확인 중...');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          console.log('🔐 Supabase 세션 발견:', session.user.id);
          setSupabaseUser(session.user);
          
          const currentUser = await userService.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            try {
              localStorage.setItem('plain_user', JSON.stringify(currentUser));
              console.log('✅ Supabase 세션에서 사용자 복원:', currentUser.name);
            } catch (storageError) {
              console.warn('⚠️ Supabase 세션 복원 후 로컬 스토리지 저장 실패:', storageError);
            }
          }
        } else {
          console.log('📝 활성 세션 없음 - 로그인 필요');
        }
      } catch (error) {
        console.error('❌ 초기 세션 로드 실패:', error);
      } finally {
        // 세션 복원 완료
        setIsLoading(false);
        console.log('🏁 세션 복원 프로세스 완료');
      }
    };
    
    getInitialSession();
  }, []);

  const login = async (provider: 'kakao' | 'google') => {
    try {
      // 일관된 사용자 ID 사용 - 같은 provider로 로그인시 항상 동일한 ID
      const userId = getOrCreateUserId(provider);
      const userName = provider === 'kakao' ? '김인사' : 'John Doe';
      const userEmail = provider === 'kakao' ? 'kim@plain.com' : 'john@plain.com';
      
      // 로컬 사용자 상태 설정
      const mockUser: User = {
        id: userId,
        name: userName,
        email: userEmail,
        provider,
        avatar: undefined,
        isAdmin: false,
        isVerified: provider === 'google'
      };
      
      // 먼저 상태 업데이트
      setUser(mockUser);
      console.log('🔐 로그인되었습니다:', mockUser.name, provider === 'google' ? '(인사담당자 인증됨)' : '');
      
      // 로컬 스토리지에 사용자 정보 저장 (새로고침 시 세션 유지용)
      try {
        localStorage.setItem('plain_user', JSON.stringify(mockUser));
        console.log('💾 로컬 스토리지에 세션 저장됨');
      } catch (storageError) {
        console.warn('⚠️ 로컬 스토리지 저장 실패:', storageError);
      }
      
      // 백그라운드에서 DB에 사용자 생성/업데이트 시도
      try {
        let dbUser;
        const existingUser = await userService.getCurrentUserById(userId);
        
        if (existingUser) {
          // 기존 사용자가 있으면 로그인 시간만 업데이트하고 기존 데이터 유지
          console.log('✅ 기존 사용자 발견, 데이터 복원 중...', existingUser.name);
          dbUser = await userService.updateUser(userId, {
            last_login_at: new Date().toISOString()
          });
          
          // 기존 사용자 데이터를 우선시 (프로필 설정 등 유지)
          if (dbUser) {
            console.log('🔄 기존 사용자 데이터 복원됨:', {
              name: dbUser.name,
              email: dbUser.email,
              isVerified: dbUser.isVerified,
              emailNotifications: dbUser.emailNotifications
            });
          }
        } else {
          // 새 사용자 생성
          console.log('🆕 새 사용자 생성 중...');
          dbUser = await userService.createUser({
            id: userId,
            name: userName,
            email: userEmail,
            provider: provider as 'kakao' | 'google',
            is_admin: false,
            is_verified: provider === 'google'
          });
        }
        
        // DB에서 가져온 실제 사용자 정보로 업데이트 (기존 데이터 보존)
        if (dbUser) {
          setUser(dbUser);
          try {
            localStorage.setItem('plain_user', JSON.stringify(dbUser));
            console.log('📝 데이터베이스 사용자 정보 동기화됨:', dbUser.name);
          } catch (storageError) {
            console.warn('⚠️ DB 동기화 후 로컬 스토리지 저장 실패:', storageError);
          }
        }
      } catch (dbError) {
        console.warn('데이터베이스 사용자 생성/업데이트 실패 (로컬 로그인 유지됨):', dbError);
        // DB 실패 시에도 로컬 상태는 유지하여 앱 사용 가능하게 함
      }
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    }
  };

  const adminLogin = async () => {
    try {
      // 고정된 관리자 ID 사용 (랜덤 ID 생성 방지)
      const adminId = 'admin-fixed-id-2024';
      
      // 로컬 관리자 상태 설정
      const adminUser: User = {
        id: adminId,
        name: '관리자',
        email: 'admin@plain.com',
        provider: 'admin',
        avatar: undefined,
        bio: '시스템 관리자',
        isAdmin: true,
        isVerified: true,
        emailNotifications: true,
        pushNotifications: false,
        weeklyDigest: true
      };
      
      // 먼저 상태 업데이트
      setUser(adminUser);
      console.log('👑 관리자로 로그인되었습니다');
      
      // 기존 localStorage의 랜덤 admin ID 제거 후 고정 ID 저장
      try {
        localStorage.removeItem('plain_user_id_admin'); // 기존 랜덤 ID 제거
        localStorage.setItem('plain_user', JSON.stringify(adminUser));
        console.log('💾 관리자 세션이 로컬 스토리지에 저장됨');
      } catch (storageError) {
        console.warn('⚠️ 로컬 스토리지 저장 실패:', storageError);
      }
      
      // 백그라운드에서 DB에 관리자 생성/업데이트 시도
      try {
        let dbUser;
        const existingUser = await userService.getCurrentUserById(adminId);
        
        if (existingUser) {
          // 기존 사용자가 있으면 관리자 권한으로 업데이트
          console.log('✅ 기존 사용자 발견, 관리자로 업데이트 중...', existingUser.name);
          dbUser = await userService.updateUser(adminId, {
            name: '관리자',
            email: 'admin@plain.com', 
            provider: 'admin',
            is_admin: true,
            is_verified: true,
            last_login_at: new Date().toISOString()
          });
          
          console.log('🔄 관리자 권한으로 업데이트됨');
        } else {
          // 새 관리자 생성
          console.log('🆕 새 관리자 생성 중...');
          dbUser = await userService.createUser({
            id: adminId,
            name: '관리자',
            email: 'admin@plain.com',
            provider: 'admin',
            is_admin: true,
            is_verified: true,
            bio: '시스템 관리자'
          });
        }
        
        // DB에서 가져온 실제 사용자 정보로 업데이트 (기존 데이터 보존)
        if (dbUser) {
          setUser(dbUser);
          try {
            localStorage.setItem('plain_user', JSON.stringify(dbUser));
            console.log('📝 데이터베이스 관리자 정보 동기화됨:', dbUser.name);
          } catch (storageError) {
            console.warn('⚠️ 관리자 DB 동기화 후 로컬 스토리지 저장 실패:', storageError);
          }
        }
      } catch (dbError) {
        console.warn('데이터베이스 관리자 생성/업데이트 실패 (로그인은 유지됨):', dbError);
      }
    } catch (error) {
      console.error('관리자 로그인 실패:', error);
      throw error;
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      try {
        const updatedUserFromDB = await userService.updateProfile(user.id, updates);
        setUser(updatedUserFromDB);
        
        // 로컬 스토리지에도 업데이트된 사용자 정보 저장
        try {
          localStorage.setItem('plain_user', JSON.stringify(updatedUserFromDB));
          console.log('👤 사용자 정보가 업데이트되었습니다:', updates);
        } catch (storageError) {
          console.warn('⚠️ 사용자 정보 업데이트 후 로컬 스토리지 저장 실패:', storageError);
        }
      } catch (error) {
        console.error('사용자 정보 업데이트 실패:', error);
        console.error('에러 상세:', error instanceof Error ? error.message : JSON.stringify(error));
        throw error;
      }
    }
  };

  const logout = async () => {
    try {
      console.log('👋 로그아웃 시작...');
      
      // Supabase 인증 로그아웃 (에러가 나도 계속 진행)
      try {
        await supabase.auth.signOut();
        console.log('✅ Supabase 로그아웃 완료');
      } catch (supabaseError) {
        console.warn('⚠️ Supabase 로그아웃 실패 (계속 진행):', supabaseError);
      }
      
      // 상태 초기화
      setUser(null);
      setSupabaseUser(null);
      
      // 로컬 스토리지 정리
      localStorage.removeItem('plain_user');
      
      console.log('✅ 로그아웃 완료');
    } catch (error) {
      console.error('❌ 로그아웃 중 오류 발생:', error);
      
      // 오류가 있어도 강제로 상태 초기화
      setUser(null);
      setSupabaseUser(null);
      localStorage.removeItem('plain_user');
      console.log('🔧 강제 로그아웃 완료');
    }
  };

  const isLoggedIn = user !== null;
  const isAdmin = user?.isAdmin === true;

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, isAdmin, isLoading, login, adminLogin, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};