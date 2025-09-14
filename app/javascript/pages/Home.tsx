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
import { storyService, loungeService, userService, testConnection } from '../services/supabaseDataService';
import LevelBadge from '../components/UserLevel/LevelBadge';
import { getUserDisplayLevel } from '../services/userLevelService';

const Home: React.FC = () => {
  const { colorMode } = useColorMode();
  const [currentWeeklyIndex, setCurrentWeeklyIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [loungePosts, setLoungePosts] = useState<any[]>([]);
  const [displayedLoungePosts, setDisplayedLoungePosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showingAllLounge, setShowingAllLounge] = useState(false);
  
  // Supabase 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // 스토리와 라운지 포스트를 병렬로 로드
        const [storiesData, loungeData] = await Promise.all([
          storyService.getAll(1, 50), // 홈페이지용으로 50개까지
          loungeService.getAll(1, 50)
        ]);
        
        setStories(storiesData.stories || []);
        setLoungePosts(loungeData.posts || []);
        setDisplayedLoungePosts((loungeData.posts || []).slice(0, 15));
        
        console.log('✅ Home 데이터 로드 성공:', {
          스토리수: storiesData.stories?.length || 0,
          라운지글수: loungeData.posts?.length || 0
        });
        
      } catch (error) {
        console.error('❌ Home 데이터 로드 실패:', error);
        // 에러가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록
        setStories([]);
        setLoungePosts([]);
        setDisplayedLoungePosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
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
  
  // 최신 스토리 6개 (Weekly Topic과 중복 허용)
  const latestStories = stories.slice(0, 6);

  // 더보기 버튼 핸들러
  const handleShowMoreLounge = () => {
    setDisplayedLoungePosts(loungePosts);
    setShowingAllLounge(true);
  };

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
                    src={currentWeeklyTopic.image_url}
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
                        <Text fontWeight="500">{currentWeeklyTopic.like_count}</Text>
                      </HStack>
                      <HStack spacing={2}>
                        <AttachmentIcon boxSize={4} />
                        <Text fontWeight="500">{currentWeeklyTopic.scrap_count}</Text>
                      </HStack>
                      <HStack spacing={2}>
                        <ViewIcon boxSize={4} />
                        <Text fontWeight="500">{currentWeeklyTopic.view_count || 0}</Text>
                      </HStack>
                    </HStack>
                    
                    <Text 
                      fontSize="15px" 
                      fontStyle="italic" 
                      color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                    >
                      읽는 데에 {currentWeeklyTopic.read_time}분 정도 걸려요.
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

          {isLoading ? (
            <CardSkeletonGrid count={6} />
          ) : latestStories.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {latestStories.map((story) => (
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
                  authorVerified={story.author_verified}
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

          {isLoading ? (
            <CardSkeletonGrid count={15} />
          ) : displayedLoungePosts.length > 0 ? (
            <>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {displayedLoungePosts.map((post) => (
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
                          post.type === 'experience' ? 'green' :
                          post.type === 'info' ? 'purple' :
                          post.type === 'free' ? 'gray' :
                          post.type === 'news' ? 'orange' :
                          post.type === 'advice' ? 'teal' :
                          post.type === 'recommend' ? 'pink' :
                          post.type === 'anonymous' ? 'red' : 'gray'
                        }
                        size="sm"
                      >
                        {post.type === 'question' ? '질문' :
                         post.type === 'experience' ? '경험' : 
                         post.type === 'info' ? '정보' :
                         post.type === 'free' ? '자유' :
                         post.type === 'news' ? '뉴스에 한마디' :
                         post.type === 'advice' ? '조언' :
                         post.type === 'recommend' ? '추천' :
                         post.type === 'anonymous' ? '익명' : '기타'}
                      </Badge>
                      {post.is_excellent && (
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
                      {(() => {
                        if (!post.content) return '';
                        
                        // HTML 태그 제거
                        let stripped = post.content.replace(/<[^>]*>/g, '');
                        
                        // HTML 엔티티 디코딩
                        stripped = stripped
                          .replace(/&nbsp;/g, ' ')
                          .replace(/&amp;/g, '&')
                          .replace(/&lt;/g, '<')
                          .replace(/&gt;/g, '>')
                          .replace(/&quot;/g, '"')
                          .replace(/&#39;/g, "'")
                          .replace(/&apos;/g, "'");
                        
                        // 여러 공백을 하나로 정리
                        stripped = stripped.replace(/\s+/g, ' ').trim();
                        
                        // 길이 제한
                        return stripped.length > 100 ? 
                          `${stripped.substring(0, 97)}...` : 
                          stripped;
                      })()}
                    </Text>
                    
                    <HStack spacing={4} fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#626269'}>
                      <HStack spacing={2} align="center">
                        <Text>{post.author_name}</Text>
                        {post.author_id && (
                          <LevelBadge 
                            level={getUserDisplayLevel(post.author_id).level} 
                            size="xs" 
                            variant="subtle"
                            showIcon={true}
                          />
                        )}
                      </HStack>
                      <Text>·</Text>
                      <Text>{new Date(post.created_at).toLocaleDateString('ko-KR', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</Text>
                      <Text>·</Text>
                      <Text>{post.like_count}개 좋아요</Text>
                      <Text>·</Text>
                      <Text>{post.comment_count}개 댓글</Text>
                    </HStack>
                  </VStack>
                </Box>
              ))}
              </SimpleGrid>
              
              {/* 더보기 버튼 */}
              {!showingAllLounge && loungePosts.length > 15 && (
                <HStack justify="center" pt={6}>
                  <Button 
                    onClick={handleShowMoreLounge}
                    variant="outline" 
                    size="md"
                    colorScheme="brand"
                  >
                    더보기 ({loungePosts.length - 15}개 더)
                  </Button>
                </HStack>
              )}
            </>
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