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
  Flex,
  Badge,
  Image,
  useColorMode,
  IconButton,
} from '@chakra-ui/react';
import { ChevronRightIcon, ChevronLeftIcon, StarIcon, AttachmentIcon, ViewIcon, TimeIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { CardSkeletonGrid } from '../components/LoadingSpinner';
import SEOHead from '../components/SEOHead';
import { OrganizationJsonLd, WebSiteJsonLd } from '../components/JsonLd';
import { WebAnalytics } from '../components/Analytics';
import { sessionStoryService, sessionLoungeService, sessionUserService, initializeData } from '../services/sessionDataService';
import LevelBadge from '../components/UserLevel/LevelBadge';
import { getUserDisplayLevel } from '../services/userLevelService';
import { testConnection } from '../services/supabaseService';

const Home: React.FC = () => {
  const { colorMode } = useColorMode();
  const [currentWeeklyIndex, setCurrentWeeklyIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [loungePosts, setLoungePosts] = useState<any[]>([]);
  
  // 세션 데이터 로드
  useEffect(() => {
    initializeData();
    setStories(sessionStoryService.getAll());
    setLoungePosts(sessionLoungeService.getAll());
  }, []);
  
  // First 5 stories as weekly topics
  const weeklyTopics = stories.slice(0, 5);
  const currentWeeklyTopic = weeklyTopics[currentWeeklyIndex];

  // Supabase 연결 테스트
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await testConnection();
        if (isConnected) {
          console.log('🎉 Supabase 데이터베이스 연결이 성공적으로 설정되었습니다!');
        }
      } catch (error) {
        console.error('🔥 Supabase 연결 중 오류 발생:', error);
      }
    };

    checkConnection();
  }, []);
  
  const latestStories = stories.slice(5, 11); // Next 6 stories as latest
  console.log('🔍 홈페이지 라운지 데이터:', {
    전체라운지글수: loungePosts.length,
    라운지글목록: loungePosts.map(p => ({ title: p.title, likeCount: p.likeCount, isExcellent: p.isExcellent }))
  });

  const hotLoungePosts = loungePosts
    .filter(post => post.isExcellent || (post.likeCount && post.likeCount > 5) || true) // 임시로 모든 글 표시
    .slice(0, 12);
    
  console.log('🔍 필터링 후 라운지 글:', hotLoungePosts.length, '개');

  const handleNextWeekly = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentWeeklyIndex((prev) => (prev + 1) % weeklyTopics.length);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  const handlePrevWeekly = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentWeeklyIndex((prev) => (prev - 1 + weeklyTopics.length) % weeklyTopics.length);
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  };

  return (
    <>
      <SEOHead
        title="Plain - 인사담당자를 위한 이야기와 라운지"
        description="HR 전문가들의 실무 경험과 노하우를 공유하는 커뮤니티. 채용, 교육, 평가, 조직문화 등 인사업무의 모든 것을 함께 나눕니다."
        keywords="HR, 인사, 인사담당자, 채용, 면접, 온보딩, 성과평가, 조직문화, 인사관리, 커뮤니티, MZ세대, 원격근무, 워라밸"
        url="/"
      />
      <OrganizationJsonLd
        name="Plain"
        description="HR 전문가들의 실무 경험과 노하우를 공유하는 커뮤니티"
        url="https://plain-hr.com"
        logo="https://plain-hr.com/logo/plain.png"
      />
      <WebSiteJsonLd />
      <WebAnalytics />
      <Container maxW="1200px" py={{ base: 6, md: 8 }}>
      <VStack spacing={10} align="stretch">
        {/* Weekly Topic Feature - Full Width */}
        {currentWeeklyTopic && (
            <Box py={4}>
              
              <HStack spacing={8} align="stretch" w="100%">
                {/* Image Section - 완전히 독립적 */}
                <Box 
                  as={Link}
                  to={`/story/${currentWeeklyTopic.id}`}
                  w="750px" 
                  h="550px" 
                  flexShrink={0}
                  opacity={isTransitioning ? 0.3 : 1}
                  transform={isTransitioning ? 'scale(0.95) translateX(10px)' : 'scale(1) translateX(0px)'}
                  _hover={{
                    transform: isTransitioning ? 'scale(0.95) translateX(10px)' : 'scale(1.02)',
                    shadow: '2xl',
                  }}
                  transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                  borderRadius="8px"
                  overflow="hidden"
                >
                  <Image
                    src={currentWeeklyTopic.imageUrl}
                    alt={currentWeeklyTopic.title}
                    w="750px"
                    h="550px"
                    objectFit="cover"
                    borderRadius="8px"
                  />
                </Box>
                
                {/* Content Section - 완전히 독립적 */}
                <VStack 
                  flex="1" 
                  spacing={4} 
                  align="flex-start" 
                  justify="center"
                  minH="550px"
                  py={12}
                  as={Link}
                  to={`/story/${currentWeeklyTopic.id}`}
                  _hover={{
                    '& .card-title': {
                      color: 'brand.500'
                    }
                  }}
                  transition="all 0.3s ease"
                >
                  <Text
                    fontSize="20px"
                    fontWeight="500"
                    color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                  >
                    이 주의 토픽
                  </Text>
                  
                  <Heading
                    className="card-title"
                    as="h1"
                    fontSize="30px"
                    fontWeight="700"
                    color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                    lineHeight="1.3"
                    transition="color 0.3s ease"
                    maxW="100%"
                  >
                    {currentWeeklyTopic.title}
                  </Heading>
                  
                  <Text 
                    color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
                    fontSize="15px"
                    lineHeight="1.6"
                    maxW="90%"
                  >
                    {currentWeeklyTopic.summary}
                  </Text>
                  
                  <VStack spacing={3} align="flex-start" mt={4}>
                    <HStack spacing={6} fontSize="15px" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                      <HStack spacing={2}>
                        <StarIcon boxSize={4} />
                        <Text fontWeight="500">{currentWeeklyTopic.likeCount}</Text>
                      </HStack>
                      <HStack spacing={2}>
                        <AttachmentIcon boxSize={4} />
                        <Text fontWeight="500">{currentWeeklyTopic.scrapCount}</Text>
                      </HStack>
                      <HStack spacing={2}>
                        <ViewIcon boxSize={4} />
                        <Text fontWeight="500">{currentWeeklyTopic.viewCount || 1245}</Text>
                      </HStack>
                    </HStack>
                    
                    <Text 
                      fontSize="15px" 
                      fontStyle="italic" 
                      color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                    >
                      읽는 데에 {currentWeeklyTopic.readTime}분 정도 걸려요.
                    </Text>
                  </VStack>
                </VStack>
              </HStack>
            </Box>
          )}

        {/* Latest Stories */}
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between" align="flex-end">
            <Heading as="h2" size="lg" color={colorMode === 'dark' ? 'gray.50' : 'gray.700'}>
              최신 Story
            </Heading>
            <Button as={Link} to="/story" variant="ghost" size="sm">
              모두 보기 →
            </Button>
          </HStack>

          {latestStories.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {latestStories.map((story) => (
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
              title="아직 게시된 이야기가 없어요"
              description="곧 유익한 콘텐츠로 찾아뵐게요!"
            />
          )}
        </VStack>

        {/* Lounge List */}
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between" align="flex-end">
            <Heading as="h2" size="lg" color={colorMode === 'dark' ? 'gray.50' : 'gray.700'}>
              라운지
            </Heading>
            <Button as={Link} to="/lounge" variant="ghost" size="sm">
              모두 보기 →
            </Button>
          </HStack>

          {hotLoungePosts.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {hotLoungePosts.map((post) => (
                <Box
                  key={post.id}
                  as={Link}
                  to={`/lounge/${post.id}`}
                  p={5}
                  bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                  borderRadius="xl"
                  border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                  _hover={{
                    transform: 'translateY(-1px)',
                    shadow: 'md',
                    bg: colorMode === 'dark' ? '#4d4d59' : '#c3c3c6'
                  }}
                  transition="all 0.2s"
                >
                  <VStack align="flex-start" spacing={3}>
                    <HStack spacing={2}>
                      <Badge
                        colorScheme={
                          post.type === 'question' ? 'blue' :
                          post.type === 'experience' ? 'green' : 'purple'
                        }
                        size="sm"
                      >
                        {post.type === 'question' ? '질문' :
                         post.type === 'experience' ? '경험' : '도움'}
                      </Badge>
                      {post.isExcellent && (
                        <Badge colorScheme="yellow" size="sm">
                          우수
                        </Badge>
                      )}
                    </HStack>
                    
                    <Text
                      fontSize="md"
                      fontWeight="600"
                      color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                      lineHeight="1.4"
                      noOfLines={2}
                    >
                      {post.title}
                    </Text>
                    
                    <Text
                      fontSize="sm"
                      color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                      lineHeight="1.4"
                      noOfLines={2}
                    >
                      {post.summary}
                    </Text>
                    
                    <HStack spacing={4} fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#626269'}>
                      <HStack spacing={2} align="center">
                        <Text>{post.author}</Text>
                        {post.author && (
                          <LevelBadge 
                            level={getUserDisplayLevel(sessionUserService.getUserIdByName(post.author) || 1).level} 
                            size="xs" 
                            variant="subtle"
                            showIcon={true}
                          />
                        )}
                      </HStack>
                      <Text>·</Text>
                      <Text>{post.likeCount}개 좋아요</Text>
                      <Text>·</Text>
                      <Text>{post.commentCount}개 댓글</Text>
                    </HStack>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          ) : (
            <EmptyState
              title="아직 라운지 글이 없어요"
              description={<Text color={colorMode === 'dark' ? '#c3c3c6' : '#626269'}>첫 번째 이야기를 들려주세요! 실전 사례일수록 더 좋아요. 민감정보는 가려주세요.</Text>}
            />
          )}
        </VStack>
      </VStack>
      </Container>
    </>
  );
};

export default Home;