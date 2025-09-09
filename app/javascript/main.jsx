import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';
import AppShell from './components/AppShell';
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Home from './pages/Home';
import StoryList from './pages/StoryList';
import StoryDetail from './pages/StoryDetail';
import LoungeList from './pages/LoungeList';
import LoungeDetail from './pages/LoungeDetail';
import LoungeNew from './pages/LoungeNew';
import AdminDashboard from './pages/AdminDashboard';
import AdminStory from './pages/AdminStory';
import AdminStoryNew from './pages/AdminStoryNew';
import AdminLounge from './pages/AdminLounge';
import AdminUsers from './pages/AdminUsers';
import SearchResults from './pages/SearchResults';
import Login from './pages/Login';
import Scrap from './pages/Scrap';

const App = () => {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <AppShell>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/story" element={<StoryList />} />
              <Route path="/story/:id" element={<StoryDetail />} />
              <Route path="/lounge" element={<LoungeList />} />
              <Route path="/lounge/:id" element={<LoungeDetail />} />
              <Route path="/lounge/new" element={<LoungeNew />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/story" element={<AdminStory />} />
              <Route path="/admin/story/new" element={<AdminStoryNew />} />
              <Route path="/admin/lounge" element={<AdminLounge />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/login" element={<Login />} />
              <Route path="/scrap" element={<Scrap />} />
            </Routes>
          </AppShell>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
};

// DOM에 React 앱 마운트
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}