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
          <Router>
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
  import('./services/sessionDataService').then(({ sessionScrapService, sessionUserService }) => {
    window.Plain = {
      resetData: resetAllData,
      getStats: getDataStats,
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
      login: (type = 'admin') => {
        if (type === 'admin') {
          sessionUserService.setCurrentUser({ id: 999, name: 'Admin', email: 'admin@plain.com', isAdmin: true });
          console.log('✅ 관리자로 로그인되었습니다.');
        } else {
          sessionUserService.setCurrentUser({ id: 1, name: '테스터', email: 'test@plain.com', isAdmin: false });
          console.log('✅ 일반 사용자로 로그인되었습니다.');
        }
      },
      info: () => console.log(`
🎉 Plain - API 연결 준비 완료!

개발용 명령어:
- Plain.getStats()        : 현재 데이터 상태 확인
- Plain.resetData()       : 모든 데이터 초기화
- Plain.login("admin")    : 관리자로 로그인 (기본값)
- Plain.login("user")     : 일반 사용자로 로그인
- Plain.testScrap(1)      : 1번 Story 북마크 테스트
- Plain.unScrap(1)        : 1번 Story 북마크 해제
- Plain.getMyScraps()     : 내 북마크 목록 확인
- Plain.info()            : 이 도움말 보기

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