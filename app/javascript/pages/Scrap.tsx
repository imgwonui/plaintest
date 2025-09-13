import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  SimpleGrid,
  Heading,
  useColorMode,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { sessionScrapService, sessionUserService, initializeData } from '../services/sessionDataService';

const Scrap: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  const [scrappedStories, setScrappedStories] = useState<any[]>([]);
  const [scrappedLoungePosts, setScrappedLoungePosts] = useState<any[]>([]);

  // 북마크 데이터 로드 함수
  const loadScraps = () => {
    if (isLoggedIn && user) {
      initializeData();
      const stories = sessionScrapService.getUserStories(user.id);
      const loungePosts = sessionScrapService.getUserLoungePosts(user.id);
      setScrappedStories(stories);
      setScrappedLoungePosts(loungePosts);
      console.log('북마크 데이터 로드:', { stories: stories.length, loungePosts: loungePosts.length });
    }
  };

  // 북마크 데이터 로드
  useEffect(() => {
    loadScraps();
  }, [isLoggedIn, user]);

  // 페이지가 포커스될 때마다 북마크 데이터 새로고침
  useEffect(() => {
    const handleFocus = () => {
      loadScraps();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadScraps();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isLoggedIn, user]);

  if (!isLoggedIn) {
    return (
      <Container maxW="800px" py={8}>
        <EmptyState
          title="로그인이 필요해요"
          description="북마크 기능을 사용하려면 로그인해주세요"
          actionText="로그인하기"
          onAction={() => navigate('/login')}
        />
      </Container>
    );
  }

  return (
    <Container maxW="1200px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <VStack spacing={4} align="center" py={8}>
          <Heading as="h1" size="2xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            내 북마크
          </Heading>
          <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} fontSize="lg" textAlign="center">
            관심 있는 글들을 모아서 언제든지 다시 읽어보세요
          </Text>
        </VStack>

        {/* 탭 영역 */}
        <Tabs variant="soft-rounded" colorScheme="brand">
          <TabList justifyContent="center" mb={8}>
            <Tab 
              px={6} 
              py={3}
              color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
              _selected={{
                color: 'white',
                bg: 'brand.500'
              }}
            >
              Story ({scrappedStories.length})
            </Tab>
            <Tab 
              px={6} 
              py={3}
              color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
              _selected={{
                color: 'white',
                bg: 'brand.500'
              }}
            >
              Lounge ({scrappedLoungePosts.length})
            </Tab>
          </TabList>
          
          <TabPanels>
            {/* Story 북마크 */}
            <TabPanel p={0}>
              {scrappedStories.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {scrappedStories.map((story) => (
                    <Card
                      key={story.id}
                      type="story"
                      id={story.id}
                      title={story.title}
                      summary={story.summary}
                      imageUrl={story.imageUrl}
                      tags={story.tags}
                      createdAt={story.createdAt}
                      readTime={story.readTime}
                      author={story.author}
                      authorId={story.author ? sessionUserService.getUserIdByName(story.author) : undefined}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <EmptyState
                  title="북마크한 스토리가 없어요"
                  description="마음에 드는 스토리를 북마크해보세요!"
                  actionText="스토리 둘러보기"
                  onAction={() => navigate('/story')}
                />
              )}
            </TabPanel>
            
            {/* Lounge 북마크 */}
            <TabPanel p={0}>
              {scrappedLoungePosts.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {scrappedLoungePosts.map((post) => (
                    <Card
                      key={post.id}
                      type="lounge"
                      id={post.id}
                      title={post.title}
                      summary={post.summary}
                      tags={post.tags}
                      createdAt={post.createdAt}
                      loungeType={post.type}
                      isExcellent={post.isExcellent}
                      likeCount={post.likeCount}
                      commentCount={post.commentCount}
                      author={post.author}
                      authorId={post.author ? sessionUserService.getUserIdByName(post.author) : undefined}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <EmptyState
                  title="북마크한 라운지 글이 없어요"
                  description="유용한 라운지 글을 북마크해보세요!"
                  actionText="라운지 둘러보기"
                  onAction={() => navigate('/lounge')}
                />
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default Scrap;