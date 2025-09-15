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
                const latestUser = await userService.getById(parsedUser.id);
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
      
      console.log('🔍 로그인 시도:', { provider, userId });
      
      // ❗ 중요: 오직 DB에서만 사용자 데이터 가져오기 - 하드코딩 금지
      try {
        console.log(`🔍 DB에서 사용자 검색 중... ID: ${userId}`);
        const existingUser = await userService.getById(userId);
        
        console.log('🔍 DB 검색 결과:', existingUser ? `사용자 발견: ${existingUser.name}` : '사용자 없음');
        
        if (existingUser) {
          // 기존 사용자 발견 - DB 데이터 그대로 사용 (하드코딩 없음)
          console.log('✅ DB에서 기존 사용자 발견:', existingUser.name);
          
          // 로그인 시간만 업데이트하고 기존 데이터는 건드리지 않음
          const updatedUser = await userService.updateProfile(userId, {
            last_login_at: new Date().toISOString()
          });
          
          // DB에서 가져온 실제 사용자 데이터 사용
          const finalUser = updatedUser || existingUser;
          setUser(finalUser);
          
          try {
            localStorage.setItem('plain_user', JSON.stringify(finalUser));
            console.log('🔄 DB 사용자 데이터 복원 완료:', finalUser.name);
          } catch (storageError) {
            console.warn('⚠️ 로컬 스토리지 저장 실패:', storageError);
          }
          
          return; // DB 데이터 복원 완료
        } else {
          // DB에 사용자가 없음 - 김흑흑 사용자가 없는 이유 확인
          console.error('❌ DB에 사용자 데이터가 없습니다!');
          console.error('🔍 찾은 사용자 ID:', userId);
          console.error('🔍 예상 사용자: 김흑흑');
          console.error('💡 혹시 사용자 ID가 잘못되었나요? localStorage 확인이 필요합니다.');
          
          // localStorage에 저장된 ID 확인
          try {
            const storedKakaoId = localStorage.getItem('plain_user_id_kakao');
            console.log('📦 localStorage에 저장된 카카오 ID:', storedKakaoId);
          } catch (e) {
            console.error('localStorage 접근 실패:', e);
          }
          
          throw new Error(`김흑흑 사용자를 찾을 수 없습니다. 사용자 ID: ${userId}`);
        }
      } catch (dbError) {
        console.error('❌ 데이터베이스 연결 실패:', dbError);
        throw new Error('데이터베이스 연결에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('❌ 로그인 실패:', error);
      throw error;
    }
  };

  const adminLogin = async () => {
    try {
      // 유효한 UUID 형식의 관리자 ID 사용
      const adminId = '00000000-0000-4000-8000-000000000001'; // 고정된 UUID v4 형식
      
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
        const existingUser = await userService.getById(adminId);
        
        if (existingUser) {
          // 기존 사용자가 있으면 관리자 권한으로 업데이트
          console.log('✅ 기존 사용자 발견, 관리자로 업데이트 중...', existingUser.name);
          dbUser = await userService.updateProfile(adminId, {
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