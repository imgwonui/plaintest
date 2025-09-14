import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
  useColorMode,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  CardHeader,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Select,
  Button,
  GridItem,
  Grid,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  storyService, 
  loungeService, 
  userService, 
  commentService
} from '../services/supabaseDataService';
import { getAllTags, getTagById } from '../data/tags';
import dayjs from 'dayjs';

const AdminAnalytics: React.FC = () => {
  const { colorMode } = useColorMode();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [period, setPeriod] = useState('7'); // 7일, 30일, 90일
  const [analytics, setAnalytics] = useState<any>(null);

  // 관리자가 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    
    loadAnalytics();
  }, [isAdmin, navigate, period]);

  const loadAnalytics = async () => {
    try {
      console.log('🔄 AdminAnalytics 데이터 로딩 시작...');
      
      // Supabase에서 모든 데이터를 병렬로 로드
      const [storiesResult, loungeResult, commentsResult] = await Promise.all([
        storyService.getAll(1, 1000),
        loungeService.getAll(1, 1000),
        commentService.getAll(1, 1000)
      ]);
      
      const stories = storiesResult.stories || [];
      const loungePosts = loungeResult.posts || [];
      const comments = commentsResult.comments || [];
      
      console.log('📊 AdminAnalytics Raw data:', {
        스토리수: stories.length,
        라운지글수: loungePosts.length,
        댓글수: comments.length
      });
      
      // 기간별 데이터 필터링
      const daysAgo = parseInt(period);
      const periodStart = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      const periodStories = stories.filter(story => new Date(story.created_at) >= periodStart);
      const periodPosts = loungePosts.filter(post => new Date(post.created_at) >= periodStart);
      const periodComments = comments.filter(comment => new Date(comment.created_at) >= periodStart);
      
      // 태그 분석
      const tagUsage = {};
      [...stories, ...loungePosts].forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach((tagId: string) => {
            const tag = getTagById(tagId);
            if (tag) {
              tagUsage[tag.name] = (tagUsage[tag.name] || 0) + 1;
            }
          });
        }
      });
      
      const topTags = Object.entries(tagUsage)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));
      
      // 인기 콘텐츠
      const topStories = stories
        .sort((a, b) => (b.view_count || 0) + (b.scrap_count || 0) * 2 - ((a.view_count || 0) + (a.scrap_count || 0) * 2))
        .slice(0, 5);
      
      const topLoungePosts = loungePosts
        .sort((a, b) => (b.like_count || 0) + (b.comment_count || 0) - ((a.like_count || 0) + (a.comment_count || 0)))
        .slice(0, 5);
      
      // 활성 사용자 (최근 활동 기준)
      const recentAuthors = [
        ...periodStories.map(s => s.author_name),
        ...periodPosts.map(p => p.author_name),
        ...periodComments.map(c => c.author_name)
      ];
      const uniqueActiveUsers = [...new Set(recentAuthors.filter(Boolean))];
      
      // 콘텐츠 유형별 통계
      const loungeTypeStats = {};
      loungePosts.forEach(post => {
        const type = post.type || 'free';
        loungeTypeStats[type] = (loungeTypeStats[type] || 0) + 1;
      });
      
      // 스크랩 수 계산 (스토리에서 scrap_count 합산)
      const totalScraps = stories.reduce((sum, story) => sum + (story.scrap_count || 0), 0);
      
      setAnalytics({
        period: daysAgo,
        totalStories: stories.length,
        totalLoungePosts: loungePosts.length,
        totalComments: comments.length,
        totalScraps: totalScraps,
        periodStories: periodStories.length,
        periodPosts: periodPosts.length,
        periodComments: periodComments.length,
        activeUsers: uniqueActiveUsers.length,
        topTags,
        topStories,
        topLoungePosts,
        loungeTypeStats,
        avgCommentsPerStory: stories.length > 0 ? (comments.filter(c => c.post_type === 'story').length / stories.length).toFixed(1) : '0',
        avgCommentsPerLounge: loungePosts.length > 0 ? (comments.filter(c => c.post_type === 'lounge').length / loungePosts.length).toFixed(1) : '0'
      });
      
      console.log('✅ AdminAnalytics 데이터 로드 성공');
      
    } catch (error) {
      console.error('❌ AdminAnalytics 데이터 로드 실패:', error);
      setAnalytics({
        period: parseInt(period),
        totalStories: 0,
        totalLoungePosts: 0,
        totalComments: 0,
        totalScraps: 0,
        periodStories: 0,
        periodPosts: 0,
        periodComments: 0,
        activeUsers: 0,
        topTags: [],
        topStories: [],
        topLoungePosts: [],
        loungeTypeStats: {},
        avgCommentsPerStory: '0',
        avgCommentsPerLounge: '0'
      });
    }
  };

  const getLoungeTypeName = (type: string) => {
    const typeMap = {
      'question': '질문/Q&A',
      'experience': '경험담/사연 공유',
      'info': '정보·팁 공유',
      'free': '자유글/잡담',
      'news': '뉴스에 한마디',
      'advice': '같이 고민해요',
      'recommend': '추천해주세요',
      'anonymous': '익명 토크'
    };
    return typeMap[type] || type;
  };

  const getProgressColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'green';
    if (percentage >= 60) return 'blue';
    if (percentage >= 40) return 'yellow';
    return 'red';
  };

  if (!isAdmin || !analytics) {
    return null;
  }

  return (
    <Container maxW="1400px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <VStack spacing={4} align="flex-start">
          <Heading as="h1" size="xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            📈 통계 분석
          </Heading>
          <HStack spacing={4} wrap="wrap">
            <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} fontSize="lg">
              플랫폼 사용 현황과 콘텐츠 분석을 확인하세요
            </Text>
            <Select 
              value={period} 
              onChange={(e) => setPeriod(e.target.value)}
              w="150px"
              size="sm"
            >
              <option value="7">최근 7일</option>
              <option value="30">최근 30일</option>
              <option value="90">최근 90일</option>
            </Select>
          </HStack>
        </VStack>

        <Divider />

        {/* 전체 통계 */}
        <Box>
          <Heading as="h2" size="lg" mb={6} color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            🎯 전체 현황
          </Heading>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>전체 Story</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{analytics.totalStories}</StatNumber>
              <StatHelpText color="blue.500">
                최근 {analytics.period}일: +{analytics.periodStories}
              </StatHelpText>
            </Stat>

            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>전체 Lounge</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{analytics.totalLoungePosts}</StatNumber>
              <StatHelpText color="green.500">
                최근 {analytics.period}일: +{analytics.periodPosts}
              </StatHelpText>
            </Stat>

            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>전체 댓글</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{analytics.totalComments}</StatNumber>
              <StatHelpText color="purple.500">
                최근 {analytics.period}일: +{analytics.periodComments}
              </StatHelpText>
            </Stat>

            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>활성 사용자</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{analytics.activeUsers}</StatNumber>
              <StatHelpText color="orange.500">
                최근 {analytics.period}일 활동
              </StatHelpText>
            </Stat>
          </SimpleGrid>
        </Box>

        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
          {/* 인기 태그 */}
          <GridItem>
            <Card 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <CardHeader>
                <Heading size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  🏷️ 인기 태그 TOP 10
                </Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  {analytics.topTags.map((tag, index) => (
                    <HStack key={tag.name} justify="space-between">
                      <HStack>
                        <Badge colorScheme={index < 3 ? 'gold' : 'gray'} variant="subtle">
                          #{index + 1}
                        </Badge>
                        <Text color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                          {tag.name}
                        </Text>
                      </HStack>
                      <HStack spacing={2}>
                        <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                          {tag.count}회
                        </Text>
                        <Box w="100px">
                          <Progress 
                            value={(tag.count / analytics.topTags[0].count) * 100} 
                            colorScheme={getProgressColor(tag.count, analytics.topTags[0].count)}
                            size="sm"
                          />
                        </Box>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Lounge 유형별 통계 */}
          <GridItem>
            <Card 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <CardHeader>
                <Heading size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  💬 Lounge 유형별 현황
                </Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={3} align="stretch">
                  {Object.entries(analytics.loungeTypeStats)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .map(([type, count]) => (
                    <HStack key={type} justify="space-between">
                      <Text color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                        {getLoungeTypeName(type)}
                      </Text>
                      <HStack spacing={2}>
                        <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                          {count}개
                        </Text>
                        <Box w="80px">
                          <Progress 
                            value={(count as number / analytics.totalLoungePosts) * 100} 
                            colorScheme="blue"
                            size="sm"
                          />
                        </Box>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* 인기 콘텐츠 */}
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
          {/* 인기 Story */}
          <GridItem>
            <Card 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <CardHeader>
                <Heading size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  📖 인기 Story TOP 5
                </Heading>
              </CardHeader>
              <CardBody>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>제목</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} textAlign="center">조회</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} textAlign="center">북마크</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {analytics.topStories.map((story, index) => (
                      <Tr key={story.id}>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Badge size="sm" colorScheme={index < 3 ? 'gold' : 'gray'}>
                                #{index + 1}
                              </Badge>
                              <Text 
                                fontSize="sm" 
                                fontWeight="500" 
                                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                                noOfLines={1}
                              >
                                {story.title}
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {dayjs(story.created_at).format('MM/DD')}
                            </Text>
                          </VStack>
                        </Td>
                        <Td textAlign="center">
                          <Text fontSize="sm" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                            {story.view_count || 0}
                          </Text>
                        </Td>
                        <Td textAlign="center">
                          <Text fontSize="sm" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                            {story.scrap_count || 0}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </GridItem>

          {/* 인기 Lounge */}
          <GridItem>
            <Card 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <CardHeader>
                <Heading size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  💬 인기 Lounge TOP 5
                </Heading>
              </CardHeader>
              <CardBody>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>제목</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} textAlign="center">좋아요</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} textAlign="center">댓글</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {analytics.topLoungePosts.map((post, index) => (
                      <Tr key={post.id}>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Badge size="sm" colorScheme={index < 3 ? 'gold' : 'gray'}>
                                #{index + 1}
                              </Badge>
                              <Text 
                                fontSize="sm" 
                                fontWeight="500" 
                                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                                noOfLines={1}
                              >
                                {post.title}
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {dayjs(post.created_at).format('MM/DD')}
                            </Text>
                          </VStack>
                        </Td>
                        <Td textAlign="center">
                          <Text fontSize="sm" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                            {post.like_count || 0}
                          </Text>
                        </Td>
                        <Td textAlign="center">
                          <Text fontSize="sm" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                            {post.comment_count || 0}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* 참여도 지표 */}
        <Box>
          <Heading as="h2" size="lg" mb={6} color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            📊 참여도 지표
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>Story당 평균 댓글</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{analytics.avgCommentsPerStory}</StatNumber>
              <StatHelpText color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                높을수록 참여도가 좋습니다
              </StatHelpText>
            </Stat>

            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>Lounge당 평균 댓글</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{analytics.avgCommentsPerLounge}</StatNumber>
              <StatHelpText color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                높을수록 활발한 토론이 이루어집니다
              </StatHelpText>
            </Stat>
          </SimpleGrid>
        </Box>

      </VStack>
    </Container>
  );
};

export default AdminAnalytics;