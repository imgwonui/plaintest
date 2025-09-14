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
import { interactionService, storyService, loungeService } from '../services/supabaseDataService';

const Scrap: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  const [scrappedStories, setScrappedStories] = useState<any[]>([]);
  const [scrappedLoungePosts, setScrappedLoungePosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 북마크 데이터 로드 함수
  const loadScraps = async () => {
    if (isLoggedIn && user) {
      try {
        setIsLoading(true);
        console.log('🔖 북마크 데이터 로드 시작:', { userId: user.id });
        
        // 사용자의 북마크 목록 가져오기
        const bookmarks = await interactionService.getUserBookmarks(user.id);
        console.log('📋 북마크 목록:', bookmarks);
        
        // 스토리와 라운지 북마크 분리
        const storyBookmarks = bookmarks.filter(bookmark => bookmark.post_type === 'story');
        const loungeBookmarks = bookmarks.filter(bookmark => bookmark.post_type === 'lounge');
        
        // 각 북마크의 실제 게시글 데이터 가져오기
        const [storyDetails, loungeDetails] = await Promise.all([
          Promise.all(storyBookmarks.map(async (bookmark) => {
            try {
              const story = await storyService.getById(bookmark.post_id);
              return story ? { ...story, bookmarkCreatedAt: bookmark.created_at } : null;
            } catch (error) {
              console.error('스토리 로드 실패:', bookmark.post_id, error);
              return null;
            }
          })),
          Promise.all(loungeBookmarks.map(async (bookmark) => {
            try {
              const post = await loungeService.getById(bookmark.post_id);
              return post ? { ...post, bookmarkCreatedAt: bookmark.created_at } : null;
            } catch (error) {
              console.error('라운지 글 로드 실패:', bookmark.post_id, error);
              return null;
            }
          }))
        ]);
        
        // null 값 제거하고 북마크 생성 시간순으로 정렬
        const validStories = storyDetails.filter(story => story !== null)
          .sort((a, b) => new Date(b.bookmarkCreatedAt).getTime() - new Date(a.bookmarkCreatedAt).getTime());
        const validLounges = loungeDetails.filter(post => post !== null)
          .sort((a, b) => new Date(b.bookmarkCreatedAt).getTime() - new Date(a.bookmarkCreatedAt).getTime());
        
        setScrappedStories(validStories);
        setScrappedLoungePosts(validLounges);
        
        console.log('✅ 북마크 데이터 로드 성공:', { 
          stories: validStories.length, 
          loungePosts: validLounges.length 
        });
        
      } catch (error) {
        console.error('❌ 북마크 데이터 로드 실패:', error);
        setScrappedStories([]);
        setScrappedLoungePosts([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
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
              {isLoading ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {[...Array(6)].map((_, index) => (
                    <Box key={index} h="300px" bg={colorMode === 'dark' ? '#3c3c47' : '#f7f7f7'} borderRadius="xl" />
                  ))}
                </SimpleGrid>
              ) : scrappedStories.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {scrappedStories.map((story) => (
                    <Card
                      key={story.id}
                      type="story"
                      id={story.id}
                      title={story.title}
                      summary={story.summary}
                      imageUrl={story.image_url}
                      tags={story.tags}
                      createdAt={story.created_at}
                      readTime={story.read_time}
                      author={story.author_name}
                      authorId={story.author_id}
                      authorVerified={story.author_verified}
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
              {isLoading ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {[...Array(6)].map((_, index) => (
                    <Box key={index} h="300px" bg={colorMode === 'dark' ? '#3c3c47' : '#f7f7f7'} borderRadius="xl" />
                  ))}
                </SimpleGrid>
              ) : scrappedLoungePosts.length > 0 ? (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {scrappedLoungePosts.map((post) => (
                    <Card
                      key={post.id}
                      type="lounge"
                      id={post.id}
                      title={post.title}
                      summary={post.content}
                      tags={post.tags}
                      createdAt={post.created_at}
                      loungeType={post.type}
                      isExcellent={post.is_excellent}
                      likeCount={post.like_count}
                      commentCount={post.comment_count}
                      scrapCount={post.scrap_count}
                      author={post.author_name}
                      authorId={post.author_id}
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