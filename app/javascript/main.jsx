import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { HelmetProvider } from 'react-helmet-async';
import theme from './theme';
import AppShell from './components/AppShell';
import { AuthProvider } from './contexts/AuthContext';
import { resetAllData, getDataStats } from './services/sessionDataService';
import { initializePerformanceSystem } from './utils/performanceInit';
import { startConnectionMonitoring, cleanupSupabaseConnection } from './lib/supabaseClient';
import { optimizedQueries, performanceMonitor } from './lib/supabaseOptimizer';

// Pages
import Home from './pages/Home';
import StoryList from './pages/StoryList';
import StoryDetail from './pages/StoryDetail';
import StoryNew from './pages/StoryNew';
import StoryEdit from './pages/StoryEdit';
import LoungeList from './pages/LoungeList';
import LoungeDetail from './pages/LoungeDetail';
import LoungeNew from './pages/LoungeNew';
import LoungeEdit from './pages/LoungeEdit';
import AdminDashboard from './pages/AdminDashboard';
import AdminStory from './pages/AdminStory';
import AdminStoryNew from './pages/AdminStoryNew';
import AdminLounge from './pages/AdminLounge';
import AdminUsers from './pages/AdminUsers';
import AdminTags from './pages/AdminTags';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminLevels from './pages/AdminLevels';
import Ranking from './pages/Ranking';
import SearchResults from './pages/SearchResults';
import Login from './pages/Login';
import Scrap from './pages/Scrap';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import About from './pages/About';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

const App = () => {
  // 🚀 Supabase 성능 최적화 시스템 시작
  React.useEffect(() => {
    console.log('🔧 Supabase 성능 최적화 시작...');
    startConnectionMonitoring();
    
    // 앱 종료 시 정리
    return () => {
      console.log('🧹 Supabase 연결 정리 중...');
      cleanupSupabaseConnection();
    };
  }, []);

  return (
    <HelmetProvider>
      <ChakraProvider theme={theme}>
        <AuthProvider>
          <Router 
            future={{ 
              v7_startTransition: true,
              v7_relativeSplatPath: true 
            }}
          >
            <AppShell>
              <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/story" element={<StoryList />} />
              <Route path="/story/new" element={<StoryNew />} />
              <Route path="/story/:id/edit" element={<StoryEdit />} />
              <Route path="/story/:id" element={<StoryDetail />} />
              <Route path="/lounge" element={<LoungeList />} />
              <Route path="/lounge/:id/edit" element={<LoungeEdit />} />
              <Route path="/lounge/:id" element={<LoungeDetail />} />
              <Route path="/lounge/new" element={<LoungeNew />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/story" element={<AdminStory />} />
              <Route path="/admin/story/new" element={<AdminStoryNew />} />
              <Route path="/admin/lounge" element={<AdminLounge />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/tags" element={<AdminTags />} />
              <Route path="/admin/analytics" element={<AdminAnalytics />} />
              <Route path="/admin/levels" element={<AdminLevels />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/login" element={<Login />} />
              <Route path="/scrap" element={<Scrap />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              </Routes>
            </AppShell>
          </Router>
        </AuthProvider>
      </ChakraProvider>
    </HelmetProvider>
  );
};

// DOM에 React 앱 마운트
const container = document.getElementById('root');
console.log('🔍 Root 컨테이너 찾음:', container);

if (container) {
  try {
    const root = createRoot(container);
    root.render(<App />);
    console.log('✅ React 앱이 성공적으로 마운트되었습니다!');
  } catch (error) {
    console.error('❌ React 앱 마운트 중 오류 발생:', error);
  }
} else {
  console.error('❌ root 엘리먼트를 찾을 수 없습니다!');
}

// 개발용 전역 유틸리티 (브라우저 콘솔에서 사용 가능)
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  // 북마크 서비스 import
  Promise.all([
    import('./services/sessionDataService'),
    import('./services/supabaseDataService')
  ]).then(([sessionService, supabaseService]) => {
    const { sessionScrapService, sessionUserService } = sessionService;
    const { storyService, loungeService, interactionService } = supabaseService;
    window.Plain = {
      resetData: resetAllData,
      getStats: getDataStats,
      
      // Supabase 테이블 확인 함수들
      checkSupabase: async () => {
        console.log('🔍 Supabase 테이블 상태 확인 중...');
        try {
          // stories 테이블 확인
          const storiesTest = await storyService.getAll(1, 1);
          console.log('✅ stories 테이블:', storiesTest);
          
          // lounge_posts 테이블 확인  
          const loungeTest = await loungeService.getAll(1, 1);
          console.log('✅ lounge_posts 테이블:', loungeTest);
          
          return { stories: storiesTest, lounge: loungeTest };
        } catch (error) {
          console.error('❌ Supabase 테이블 확인 실패:', error);
          return { error };
        }
      },
      
      testLoungeCreate: async () => {
        console.log('🧪 라운지 글 작성 테스트...');
        try {
          const testPost = await loungeService.create({
            title: 'Test Post',
            content: 'Test content',
            author_id: 'test-user-id',
            author_name: 'Test User',
            type: 'question',
            tags: ['test']
          });
          console.log('✅ 라운지 글 작성 성공:', testPost);
          return testPost;
        } catch (error) {
          console.error('❌ 라운지 글 작성 실패:', error);
          console.error('에러 상세:', JSON.stringify(error, null, 2));
          return { error };
        }
      },
      
      // 북마크 테스트 함수들 추가
      testScrap: (postId, postType = 'story') => {
        const user = sessionUserService.getCurrentUser();
        if (!user) {
          console.log('❌ 로그인이 필요합니다. Plain.login("admin")으로 로그인하세요.');
          return;
        }
        const result = sessionScrapService.add(user.id, postId, postType);
        if (result) {
          console.log(`✅ ${postType} ${postId}번 글을 북마크했습니다!`);
        } else {
          console.log(`⚠️ ${postType} ${postId}번 글은 이미 북마크되어 있습니다.`);
        }
        return result;
      },
      unScrap: (postId, postType = 'story') => {
        const user = sessionUserService.getCurrentUser();
        if (!user) {
          console.log('❌ 로그인이 필요합니다.');
          return;
        }
        const result = sessionScrapService.remove(user.id, postId, postType);
        if (result) {
          console.log(`🗑️ ${postType} ${postId}번 글 북마크을 해제했습니다.`);
        } else {
          console.log(`⚠️ ${postType} ${postId}번 글은 북마크되어 있지 않습니다.`);
        }
        return result;
      },
      getMyScraps: () => {
        const user = sessionUserService.getCurrentUser();
        if (!user) {
          console.log('❌ 로그인이 필요합니다.');
          return;
        }
        const stories = sessionScrapService.getUserStories(user.id);
        const loungePosts = sessionScrapService.getUserLoungePosts(user.id);
        console.log('📌 내 북마크:', { stories: stories.length, loungePosts: loungePosts.length });
        return { stories, loungePosts };
      },
      
      // 좋아요 개수 동기화 (관리자용)
      syncLikes: async () => {
        console.log('🔄 전체 좋아요 개수 동기화 시작...');
        try {
          await interactionService.syncAllLikeCounts();
          console.log('✅ 좋아요 개수 동기화 완료!');
        } catch (error) {
          console.error('❌ 좋아요 개수 동기화 실패:', error);
        }
      },
      
      // 🚀 Supabase 성능 최적화 도구들
      optimized: {
        // 최적화된 쿼리 사용
        getUser: (userId, useCache = true) => optimizedQueries.getUser(userId, useCache),
        getStories: (page = 1, limit = 20, useCache = true) => optimizedQueries.getStories(page, limit, useCache),
        getLoungePosts: (page = 1, limit = 20, useCache = true) => optimizedQueries.getLoungePosts(page, limit, useCache),
        
        // 캐시 관리
        clearCache: () => optimizedQueries.clearCache(),
        invalidateTable: (table) => optimizedQueries.invalidateCache(table),
        getCacheStats: () => optimizedQueries.getCacheStats(),
        
        // 성능 모니터링
        getPerformanceReport: () => performanceMonitor.getPerformanceReport(),
        getAverageQueryTime: (queryName) => performanceMonitor.getAverageQueryTime(queryName),
        
        info: () => console.log(`
🚀 Plain Supabase 최적화 도구

성능 최적화된 쿼리:
- Plain.optimized.getUser(userId)           : 사용자 정보 (캐시됨)
- Plain.optimized.getStories(page, limit)   : 스토리 목록 (캐시됨)
- Plain.optimized.getLoungePosts()          : 라운지 글 목록 (캐시됨)

캐시 관리:
- Plain.optimized.clearCache()              : 전체 캐시 삭제
- Plain.optimized.invalidateTable('users')  : 특정 테이블 캐시 무효화
- Plain.optimized.getCacheStats()           : 캐시 통계 확인

성능 모니터링:
- Plain.optimized.getPerformanceReport()    : 전체 성능 리포트
- Plain.optimized.getAverageQueryTime('getUser') : 평균 쿼리 시간

자동 최적화 기능:
✅ 싱글톤 Supabase 클라이언트 (연결 재사용)
✅ 쿼리 결과 캐싱 (5분 TTL)
✅ 배치 쿼리 처리
✅ 연결 상태 모니터링
✅ 자동 타임아웃 설정 (10초)
        `)
      },

      // 특정 글의 좋아요 디버깅
      debugLikes: async (postId, postType = 'lounge') => {
        try {
          console.log(`🔍 ${postType} ${postId}번 글 좋아요 디버깅 시작...`);
          
          // 1. likes 테이블에서 실제 좋아요 수 조회
          const actualCount = await interactionService.getLikeCount(postId, postType);
          console.log(`📊 likes 테이블에서 실제 좋아요 수: ${actualCount}`);
          
          // 2. 해당 글의 현재 like_count 필드 값
          const tableName = postType === 'story' ? 'stories' : 'lounge_posts';
          console.log(`📋 ${tableName} 테이블 현재 like_count 확인 중...`);
          
          // 3. 동기화 실행
          await interactionService.syncLikeCount(postId, postType);
          console.log(`✅ ${postType} ${postId}번 글 좋아요 동기화 완료!`);
          
        } catch (error) {
          console.error('❌ 좋아요 디버깅 실패:', error);
        }
      },
      
      // 현재 사용자의 좋아요 수 디버깅 (프로필 문제 해결용)
      debugUserLikes: async () => {
        try {
          // AuthContext와 sessionUserService 둘 다 확인
          const sessionUser = sessionUserService.getCurrentUser();
          
          // localStorage에서 실제 인증된 사용자 확인
          let actualUser = null;
          try {
            const savedUser = localStorage.getItem('plain_user');
            if (savedUser) {
              actualUser = JSON.parse(savedUser);
            }
          } catch (parseError) {
            console.warn('⚠️ localStorage 사용자 파싱 실패:', parseError);
          }
          
          const user = actualUser || sessionUser;
          
          if (!user) {
            console.log('❌ 로그인이 필요합니다.');
            console.log('💡 다음 중 하나를 시도해보세요:');
            console.log('  - 웹페이지에서 카카오/구글 로그인');
            console.log('  - Plain.login("admin") - 관리자 테스트 로그인');
            console.log('  - Plain.login("user") - 일반 사용자 테스트 로그인');
            return;
          }
          
          console.log('👤 현재 사용자 정보:', {
            id: user.id,
            name: user.name,
            email: user.email,
            provider: user.provider,
            isFromSession: !!sessionUser,
            isFromStorage: !!actualUser
          });
          
          console.log(`🔍 ${user.name}(${user.id})의 받은 좋아요 디버깅 시작...`);
          
          // 1. 사용자가 작성한 글들 조회
          const [storiesResponse, loungeResponse] = await Promise.all([
            storyService.getByAuthor(user.id),
            loungeService.getByAuthor(user.id)
          ]);
          
          const myStories = storiesResponse.stories || [];
          const myLoungePosts = loungeResponse.posts || [];
          
          console.log(`📝 작성한 글: Story ${myStories.length}개, Lounge ${myLoungePosts.length}개`);
          
          // 2. 각 글의 현재 like_count와 실제 좋아요 수 비교
          console.log('\n📊 Story 글들의 좋아요 상태:');
          let totalStoryLikes = 0;
          for (const story of myStories) {
            const actualCount = await interactionService.getLikeCount(story.id, 'story');
            const dbCount = story.like_count || 0;
            totalStoryLikes += actualCount;
            console.log(`  - "${story.title?.substring(0, 30)}..." (ID: ${story.id})`);
            console.log(`    DB like_count: ${dbCount}, 실제 좋아요: ${actualCount} ${dbCount !== actualCount ? '❌ 불일치!' : '✅'}`);
            
            if (dbCount !== actualCount) {
              console.log(`    🔧 동기화 실행 중...`);
              await interactionService.syncLikeCount(story.id, 'story');
              console.log(`    ✅ 동기화 완료`);
            }
          }
          
          console.log('\n📊 Lounge 글들의 좋아요 상태:');
          let totalLoungeLikes = 0;
          for (const post of myLoungePosts) {
            const actualCount = await interactionService.getLikeCount(post.id, 'lounge');
            const dbCount = post.like_count || 0;
            totalLoungeLikes += actualCount;
            console.log(`  - "${post.title?.substring(0, 30)}..." (ID: ${post.id})`);
            console.log(`    DB like_count: ${dbCount}, 실제 좋아요: ${actualCount} ${dbCount !== actualCount ? '❌ 불일치!' : '✅'}`);
            
            if (dbCount !== actualCount) {
              console.log(`    🔧 동기화 실행 중...`);
              await interactionService.syncLikeCount(post.id, 'lounge');
              console.log(`    ✅ 동기화 완료`);
            }
          }
          
          const totalLikes = totalStoryLikes + totalLoungeLikes;
          console.log(`\n💖 총 받은 좋아요: ${totalLikes}개 (Story: ${totalStoryLikes}, Lounge: ${totalLoungeLikes})`);
          console.log(`📈 예상 점수: ${totalLikes * 2}점`);
          
          console.log('\n🔄 프로필 페이지를 새로고침하여 업데이트된 수치를 확인하세요!');
          
          return {
            totalLikes,
            storyLikes: totalStoryLikes,
            loungeLikes: totalLoungeLikes,
            expectedScore: totalLikes * 2
          };
          
        } catch (error) {
          console.error('❌ 사용자 좋아요 디버깅 실패:', error);
        }
      },
      
      // 프로필 페이지 강제 새로고침
      refreshProfile: () => {
        if (window.location.pathname === '/profile') {
          console.log('🔄 프로필 페이지 새로고침 중...');
          window.location.reload();
        } else {
          console.log('💡 프로필 페이지(/profile)로 이동한 후 다시 시도해주세요.');
        }
      },
      
      // 현재 사용자의 실제 좋아요 수 직접 조회
      checkCurrentUserLikes: async () => {
        try {
          const user = JSON.parse(localStorage.getItem('plain_user') || '{}');
          if (!user.id) {
            console.log('❌ 로그인된 사용자가 없습니다.');
            return;
          }
          
          console.log(`🔍 ${user.name} (${user.id})의 좋아요 수 직접 확인 중...`);
          
          // 기존 서비스 함수 사용해서 데이터 조회
          const loungeResponse = await loungeService.getByAuthor(user.id);
          const myLoungePosts = loungeResponse.posts || [];
          
          console.log('📋 라운지 글들의 현재 like_count:', myLoungePosts.map(p => ({
            id: p.id,
            title: p.title?.substring(0, 30) + '...',
            like_count: p.like_count || 0
          })));
          
          const totalLikes = myLoungePosts.reduce((sum, post) => sum + (post.like_count || 0), 0);
          console.log(`💖 현재 프로필에서 계산되는 총 받은 좋아요: ${totalLikes}개`);
          
          if (totalLikes === 0 && myLoungePosts.length > 0) {
            console.log('⚠️ 글은 있는데 like_count가 0입니다. 동기화를 시도합니다...');
            
            // 각 글에 대해 개별적으로 동기화 시도
            for (const post of myLoungePosts) {
              console.log(`🔧 글 "${post.title?.substring(0, 20)}..." (ID: ${post.id}) 동기화 중...`);
              await interactionService.syncLikeCount(post.id, 'lounge');
              
              // 동기화 직후 실제 데이터베이스 값 확인
              console.log(`🔍 동기화 직후 실제 데이터베이스에서 like_count 확인 중...`);
              try {
                const checkPost = await loungeService.getById(post.id);
                console.log(`  → 글 ID ${post.id}의 현재 like_count: ${checkPost?.like_count || '없음'}`);
              } catch (checkError) {
                console.error('  → 확인 실패:', checkError);
              }
            }
            
            // 동기화 후 다시 확인 (약간의 지연 추가)
            console.log('🔄 동기화 후 다시 확인 중... (1초 대기)');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const retryResponse = await loungeService.getByAuthor(user.id);
            const updatedPosts = retryResponse.posts || [];
            const updatedTotalLikes = updatedPosts.reduce((sum, post) => sum + (post.like_count || 0), 0);
            
            console.log('📋 동기화 후 like_count:', updatedPosts.map(p => ({
              id: p.id,
              title: p.title?.substring(0, 30) + '...',
              like_count: p.like_count || 0
            })));
            console.log(`💖 동기화 후 총 받은 좋아요: ${updatedTotalLikes}개`);
            
            if (updatedTotalLikes > 0) {
              console.log('✅ 동기화 성공! 이제 프로필을 새로고침하세요: Plain.refreshProfile()');
            }
          } else if (myLoungePosts.length === 0) {
            console.log('📝 작성한 라운지 글이 없습니다.');
          } else {
            console.log('✅ 좋아요 수가 정상적으로 계산되고 있습니다.');
          }
          
        } catch (error) {
          console.error('❌ 좋아요 수 확인 실패:', error);
        }
      },
      
      // 스토리 작성 테스트 도구 (상세 로깅 강화)
      testStoryCreation: async () => {
        const user = sessionUserService.getCurrentUser();
        if (!user || !user.isAdmin) {
          console.error('❌ 관리자로 로그인이 필요합니다. Plain.login("admin")을 먼저 실행하세요.');
          return;
        }
        
        console.log('\n🧪 관리자 스토리 작성 테스트 시작...');
        console.log('👤 현재 사용자:', { id: user.id, name: user.name, isAdmin: user.isAdmin });
        
        // 1단계: Supabase 연결 테스트
        console.log('\n📡 1단계: Supabase 연결 테스트...');
        try {
          const { storyService } = await import('./services/supabaseDataService');
          // 간단한 연결 테스트
          const testResult = await storyService.getAll(1, 1); // 1페이지, 1개 아이템만 가져오기
          console.log('✅ Supabase 연결 성공:', testResult ? '정상' : '비정상');
        } catch (connectionError) {
          console.error('❌ Supabase 연결 실패:', connectionError);
          return { error: 'connection_failed', details: connectionError };
        }
        
        // 2단계: 사용자 존재 확인 및 생성
        console.log('\n👤 2단계: 사용자 존재 확인 및 생성...');
        try {
          const { ensureUserExists } = await import('./services/supabaseDataService');
          const userResult = await ensureUserExists(user.id, {
            name: user.name,
            email: user.email || 'admin@plain.com',
            isAdmin: user.isAdmin
          });
          console.log('✅ 사용자 확인/생성 완료:', userResult);
        } catch (userError) {
          console.error('❌ 사용자 확인/생성 실패:', userError);
          console.error('🔍 상세 오류:', {
            message: userError.message,
            code: userError.code,
            details: userError.details
          });
          return { error: 'user_creation_failed', details: userError };
        }
        
        // 3단계: 테스트 이미지 생성 및 압축
        console.log('\n🖼️ 3단계: 테스트 이미지 생성 및 압축...');
        let testImageData;
        try {
          // 작은 SVG 이미지 생성 (압축 테스트 목적)
          const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240">
            <rect width="400" height="240" fill="#8B5CF6"/>
            <text x="200" y="130" text-anchor="middle" fill="white" font-size="24" font-family="Arial">TEST STORY</text>
            <text x="200" y="160" text-anchor="middle" fill="white" font-size="14" opacity="0.8">${new Date().toISOString().split('T')[0]}</text>
          </svg>`;
          
          testImageData = 'data:image/svg+xml;base64,' + btoa(svgContent);
          console.log('✅ 테스트 이미지 생성 성공 (크기:', testImageData.length, 'bytes)');
          
          // 압축 기능 테스트 (실제로는 SVG라서 압축되지 않지만 로직은 확인)
          const { needsCompression } = await import('./utils/imageCompressor');
          const needsComp = needsCompression({ size: 6 * 1024 * 1024 }, 5); // 가상으로 6MB 파일
          console.log('🔍 압축 필요성 테스트:', needsComp ? '압축 필요' : '압축 불필요');
          
        } catch (imageError) {
          console.error('❌ 테스트 이미지 생성 실패:', imageError);
          return { error: 'image_generation_failed', details: imageError };
        }
        
        // 4단계: 스토리 데이터 생성
        console.log('\n📝 4단계: 스토리 데이터 생성...');
        const timestamp = Date.now();
        const testStoryData = {
          title: `테스트 스토리 ${new Date().toLocaleString('ko-KR')}`,
          summary: `관리자 스토리 작성 기능 테스트 (${timestamp})`,
          content: `<h2>🧪 테스트 스토리</h2>
            <p>이것은 관리자가 작성한 테스트 스토리입니다.</p>
            <p><strong>테스트 목적:</strong></p>
            <ul>
              <li>이미지 압축 및 업로드 기능 확인</li>
              <li>Supabase 연동 및 RLS 정책 확인</li>
              <li>관리자 권한 확인</li>
              <li>사용자 생성 로직 확인</li>
            </ul>
            <p><em>생성 시간: ${new Date().toLocaleString('ko-KR')}</em></p>
            <p><em>테스트 ID: ${timestamp}</em></p>`,
          author_name: user.name,
          author_id: user.id,
          image_url: testImageData,
          read_time: 3,
          tags: ['테스트', '관리자', 'debug'],
          is_verified: true,
          verification_badge: `테스트용 검수 배지 (${timestamp})`
        };
        
        console.log('✅ 스토리 데이터 준비 완료');
        console.log('📊 데이터 요약:', {
          titleLength: testStoryData.title.length,
          summaryLength: testStoryData.summary.length,
          contentLength: testStoryData.content.length,
          imageSize: testStoryData.image_url.length,
          tagsCount: testStoryData.tags.length,
          isVerified: testStoryData.is_verified
        });
        
        // 5단계: 실제 스토리 생성
        console.log('\n💾 5단계: Supabase에 스토리 생성...');
        try {
          const { storyService } = await import('./services/supabaseDataService');
          
          console.log('📤 스토리 생성 시도 중...');
          const result = await storyService.create(testStoryData);
          
          console.log('\n🎉 스토리 작성 테스트 성공!');
          console.log('✅ 생성된 스토리 정보:');
          console.log('  - ID:', result.id);
          console.log('  - 제목:', result.title);
          console.log('  - 작성자:', result.author_name, '(ID:', result.author_id, ')');
          console.log('  - 검수 상태:', result.is_verified ? '✅ 검수됨' : '⏳ 검수 대기');
          console.log('  - 생성 시간:', result.created_at);
          console.log('  - 🔗 URL: /story/' + result.id);
          
          return {
            success: true,
            story: result,
            url: `/story/${result.id}`,
            testId: timestamp
          };
          
        } catch (error) {
          console.error('\n❌ 스토리 생성 실패!');
          console.error('🔍 오류 상세 분석:');
          console.error('  - 메시지:', error.message || 'Unknown error');
          console.error('  - 코드:', error.code || 'No code');
          console.error('  - 힌트:', error.hint || 'No hint');
          console.error('  - 세부사항:', error.details || 'No details');
          
          // 오류 타입별 해결책 제시
          if (error.message.includes('RLS') || error.message.includes('policy')) {
            console.error('\n💡 RLS 정책 문제 해결책:');
            console.error('  1. Supabase Dashboard → Authentication → RLS 정책 확인');
            console.error('  2. stories 테이블의 INSERT 정책이 관리자를 허용하는지 확인');
            console.error('  3. 사용자가 users 테이블에 정상적으로 생성되었는지 확인');
          } else if (error.message.includes('foreign key') || error.message.includes('author_id')) {
            console.error('\n💡 Foreign Key 제약 조건 문제 해결책:');
            console.error('  1. users 테이블에 해당 author_id가 존재하는지 확인');
            console.error('  2. Plain.checkSupabase()로 데이터베이스 상태 확인');
          } else if (error.message.includes('network') || error.message.includes('fetch')) {
            console.error('\n💡 네트워크 문제 해결책:');
            console.error('  1. 인터넷 연결 상태 확인');
            console.error('  2. Supabase 서비스 상태 확인');
            console.error('  3. 브라우저 개발자 도구에서 Network 탭 확인');
          }
          
          console.error('\n🛠️ 추가 디버깅 명령어:');
          console.error('  - Plain.checkSupabase()     : Supabase 연결 테스트');
          console.error('  - Plain.debugUserLikes()    : 사용자 데이터 확인');
          console.error('  - Plain.login("admin")      : 관리자 재로그인');
          
          return { 
            success: false,
            error: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            testId: timestamp,
            troubleshooting: {
              rls: error.message.includes('RLS') || error.message.includes('policy'),
              foreignKey: error.message.includes('foreign key') || error.message.includes('author_id'),
              network: error.message.includes('network') || error.message.includes('fetch')
            }
          };
        }
      },
      
      login: (type = 'admin') => {
        if (type === 'admin') {
          // UUID 형식의 관리자 ID 사용
          const adminId = 'admin-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
          sessionUserService.setCurrentUser({ 
            id: adminId, 
            name: 'Admin', 
            email: 'admin@plain.com', 
            provider: 'admin',
            isAdmin: true 
          });
          console.log('✅ 관리자로 로그인되었습니다. ID:', adminId);
          console.log('🧪 스토리 작성을 테스트하려면 Plain.testStoryCreation()을 실행하세요.');
        } else {
          // UUID 형식의 일반 사용자 ID 사용
          const userId = 'user-' + Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
          sessionUserService.setCurrentUser({ 
            id: userId, 
            name: '테스터', 
            email: 'test@plain.com', 
            provider: 'kakao',
            isAdmin: false 
          });
          console.log('✅ 일반 사용자로 로그인되었습니다. ID:', userId);
        }
      },
      info: () => console.log(`
🎉 Plain - Supabase 연동 완료!

🧪 관리자 스토리 작성 테스트:
- Plain.login("admin")     : 관리자로 로그인
- Plain.testStoryCreation() : 상세 로깅과 함께 스토리 작성 테스트

Supabase 테스트 명령어:
- Plain.checkSupabase()    : Supabase 테이블 상태 확인
- Plain.testLoungeCreate() : 라운지 글 작성 테스트

기본 개발용 명령어:
- Plain.getStats()         : 현재 데이터 상태 확인
- Plain.resetData()        : 모든 데이터 초기화
- Plain.login("user")      : 일반 사용자로 로그인
- Plain.testScrap(1)       : 1번 Story 북마크 테스트
- Plain.unScrap(1)         : 1번 Story 북마크 해제
- Plain.getMyScraps()      : 내 북마크 목록 확인
- Plain.syncLikes()        : 전체 글 좋아요 개수 동기화 (관리용)
- Plain.debugUserLikes()   : 현재 사용자의 받은 좋아요 디버깅 (프로필 문제 해결)
- Plain.checkCurrentUserLikes() : 현재 사용자 좋아요 수 직접 확인 및 자동 수정
- Plain.refreshProfile()   : 프로필 페이지 강제 새로고침
- Plain.info()             : 이 도움말 보기

북마크 테스트 방법:
1. Plain.login("admin") - 로그인
2. Plain.testScrap(1, "story") - Story 북마크
3. Plain.getMyScraps() - 북마크 확인
4. /scrap 페이지에서 확인

세션 스토리지 기반으로 모든 기능이 작동합니다:
✅ 실제 글쓰기 (Story, Lounge)
✅ 실제 댓글 작성 (로그인/비로그인)  
✅ 실제 좋아요, 북마크
✅ 인증 시스템 (세션 유지)
✅ 모든 CRUD 작업

API 연결만 하면 바로 운영 가능합니다!
    `)
    };
  });
  
  // 성능 최적화 시스템 초기화
  console.log('⚡ Plain 성능 최적화 시스템을 초기화합니다...');
  initializePerformanceSystem();

  // 이미지 압축 테스트 도구 추가
  Promise.all([
    import('./utils/imageCompressor'),
    import('./services/imageService')
  ]).then(([compressor, imageService]) => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      window.PlainImage = {
        // 직접 압축 테스트
        testCompression: async (file) => {
          if (!file || !(file instanceof File)) {
            console.error('❌ 파일을 제공해주세요. 예: PlainImage.testCompression(fileInput.files[0])');
            return;
          }

          console.log(`🖼️ 이미지 압축 테스트 시작: ${file.name}`);
          console.log(`📏 원본 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB`);

          try {
            const result = await compressor.compressImage(file);
            console.log(`✅ 압축 완료!`);
            console.log(`📊 결과:`, {
              원본크기: (result.originalSize / 1024 / 1024).toFixed(2) + 'MB',
              압축후크기: (result.compressedSize / 1024 / 1024).toFixed(2) + 'MB',
              압축여부: result.wasCompressed ? '✅' : '❌',
              압축비율: result.wasCompressed ? `${((1 - result.compressedSize / result.originalSize) * 100).toFixed(1)}% 감소` : '변경 없음'
            });
            return result;
          } catch (error) {
            console.error('❌ 압축 실패:', error);
          }
        },

        // 서비스 레벨 테스트
        testThumbnail: async (file) => {
          if (!file) {
            console.error('❌ 파일을 제공해주세요.');
            return;
          }

          console.log('🖼️ 썸네일 처리 테스트 시작...');
          const result = await imageService.imageService.processThumbnailImage(file, (message, type) => {
            console.log(`${type === 'info' ? '💬' : type === 'success' ? '✅' : '❌'} ${message}`);
          });
          
          console.log('📊 썸네일 처리 결과:', result);
          return result;
        },

        testEditor: async (file) => {
          if (!file) {
            console.error('❌ 파일을 제공해주세요.');
            return;
          }

          console.log('📝 에디터용 처리 테스트 시작...');
          const result = await imageService.imageService.processEditorImage(file, (message, type) => {
            console.log(`${type === 'info' ? '💬' : type === 'success' ? '✅' : '❌'} ${message}`);
          });
          
          console.log('📊 에디터 처리 결과:', result);
          return result;
        },

        // 파일 생성 도우미 (테스트용)
        createTestFile: (sizeMB = 10) => {
          console.log(`🧪 ${sizeMB}MB 테스트 이미지 생성 중...`);
          
          const canvas = document.createElement('canvas');
          // 큰 이미지 생성 (대략적인 크기 계산)
          const dimension = Math.sqrt((sizeMB * 1024 * 1024) / 4); // RGBA 4바이트
          canvas.width = Math.min(dimension, 4000);
          canvas.height = Math.min(dimension, 4000);
          
          const ctx = canvas.getContext('2d');
          // 랜덤 색상 패턴 그리기
          for (let i = 0; i < 100; i++) {
            ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
            ctx.fillRect(
              Math.random() * canvas.width,
              Math.random() * canvas.height,
              Math.random() * 200,
              Math.random() * 200
            );
          }

          return new Promise(resolve => {
            canvas.toBlob(blob => {
              const file = new File([blob], `test-${sizeMB}mb.png`, { type: 'image/png' });
              console.log(`✅ 테스트 파일 생성 완료: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
              resolve(file);
            }, 'image/png', 1.0);
          });
        },

        info: () => console.log(`
🖼️ Plain 이미지 압축 테스트 도구

사용 가능한 명령어:
- PlainImage.testCompression(file)  : 직접 압축 테스트
- PlainImage.testThumbnail(file)    : 썸네일용 처리 테스트  
- PlainImage.testEditor(file)       : 에디터용 처리 테스트
- PlainImage.createTestFile(sizeMB) : 테스트용 이미지 생성

테스트 방법:
1. const testFile = await PlainImage.createTestFile(10); // 10MB 테스트 파일
2. PlainImage.testCompression(testFile); // 압축 테스트
3. 또는 파일 input에서: PlainImage.testCompression(document.querySelector('input[type="file"]').files[0]);

기능:
✅ 5MB 이상 파일 자동 압축
✅ JPEG/PNG/WebP 지원
✅ 품질 자동 조정
✅ 진행 상태 알림
        `)
      };

      console.log('🖼️ PlainImage 테스트 도구가 활성화되었습니다!');
      console.log('💡 PlainImage.info() 명령어로 도움말을 확인하세요.');
    }
  });
  
  // 시작 시 안내 메시지  
  console.log('🚀 Plain 개발 모드가 시작되었습니다! Plain.info() 를 입력해서 도움말을 확인하세요.');
  console.log('⚡ 성능 최적화가 활성화되었습니다! PlainCache.info() 및 PlainOptimized.info() 명령어를 확인하세요.');
  console.log('🖼️ 이미지 압축 기능이 활성화되었습니다! PlainImage.info() 명령어를 확인하세요.');
}