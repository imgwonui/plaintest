import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { HelmetProvider } from 'react-helmet-async';
import theme from './theme';
import AppShell from './components/AppShell';
import { AuthProvider } from './contexts/AuthContext';
import { resetAllData, getDataStats } from './services/sessionDataService';

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

Supabase 테스트 명령어:
- Plain.checkSupabase()    : Supabase 테이블 상태 확인
- Plain.testLoungeCreate() : 라운지 글 작성 테스트

기본 개발용 명령어:
- Plain.getStats()         : 현재 데이터 상태 확인
- Plain.resetData()        : 모든 데이터 초기화
- Plain.login("admin")     : 관리자로 로그인 (기본값)
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
  
  // 시작 시 안내 메시지  
  console.log('🚀 Plain 개발 모드가 시작되었습니다! Plain.info() 를 입력해서 도움말을 확인하세요.');
}