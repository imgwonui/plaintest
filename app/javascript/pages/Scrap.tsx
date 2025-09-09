import React, { useState } from 'react';
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
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { stories } from '../mocks/stories';
import { loungePosts } from '../mocks/lounge';

const Scrap: React.FC = () => {
  const { colorMode } = useColorMode();
  const { isLoggedIn } = useAuth();
  
  // 임시 스크랩 데이터 (실제로는 사용자별로 관리되어야 함)
  const [scrappedStories] = useState(stories.slice(0, 3)); // 처음 3개 스토리를 스크랩한 것으로 가정
  const [scrappedLoungePosts] = useState(loungePosts.slice(0, 2)); // 처음 2개 라운지 글을 스크랩한 것으로 가정

  if (!isLoggedIn) {
    return (
      <Container maxW="800px" py={8}>
        <EmptyState
          title="로그인이 필요해요"
          description="스크랩 기능을 사용하려면 로그인해주세요"
          actionText="로그인하기"
          onAction={() => window.location.href = '/login'}
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
            내 스크랩
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
            {/* Story 스크랩 */}
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
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <EmptyState
                  title="스크랩한 스토리가 없어요"
                  description="마음에 드는 스토리를 스크랩해보세요!"
                  actionText="스토리 둘러보기"
                  onAction={() => window.location.href = '/story'}
                />
              )}
            </TabPanel>
            
            {/* Lounge 스크랩 */}
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
                    />
                  ))}
                </SimpleGrid>
              ) : (
                <EmptyState
                  title="스크랩한 라운지 글이 없어요"
                  description="유용한 라운지 글을 스크랩해보세요!"
                  actionText="라운지 둘러보기"
                  onAction={() => window.location.href = '/lounge'}
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