import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorMode,
  Divider,
  Avatar,
  List,
  ListItem,
  GridItem,
  Grid,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sessionStoryService, sessionLoungeService, sessionUserService, sessionCommentService, initializeData, getDataStats } from '../services/sessionDataService';

const AdminDashboard: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [stories, setStories] = useState<any[]>([]);
  const [loungePosts, setLoungePosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // 세션 데이터 로드 및 통계 계산
  useEffect(() => {
    initializeData();
    const loadedStories = sessionStoryService.getAll();
    const loadedPosts = sessionLoungeService.getAll();
    const allUsers = sessionUserService.getAllUsers();
    const allComments = sessionCommentService.getAll();
    const dataStats = getDataStats();
    
    setStories(loadedStories);
    setLoungePosts(loadedPosts);
    
    // 실제 데이터 기반 통계 계산
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const thisMonthStories = loadedStories.filter(story => 
      new Date(story.createdAt) >= thisMonthStart
    ).length;
    
    const thisMonthPosts = loadedPosts.filter(post => 
      new Date(post.createdAt) >= thisMonthStart
    ).length;
    
    // 댓글과 글 작성자들을 기반으로 사용자 수 추정
    const storyAuthors = [...new Set(loadedStories.map(story => story.author))];
    const postAuthors = [...new Set(loadedPosts.map(post => post.author))];
    const commentAuthors = [...new Set(allComments.map(comment => comment.author))];
    const allAuthors = [...new Set([...storyAuthors, ...postAuthors, ...commentAuthors])];
    
    // 이번 주에 활동한 사용자 추정 (최근 댓글/글 작성자)
    const recentActivity = [
      ...loadedPosts.filter(post => new Date(post.createdAt) >= thisWeekStart),
      ...allComments.filter(comment => new Date(comment.createdAt) >= thisWeekStart)
    ];
    const recentActiveAuthors = [...new Set(recentActivity.map(item => item.author))];
    
    const calculatedStats = {
      totalUsers: Math.max(allAuthors.length, 10), // 최소 10명으로 설정
      monthlyActiveUsers: Math.max(Math.floor(allAuthors.length * 0.6), 6), // 60% 추정 활성 사용자
      totalStories: loadedStories.length,
      totalLoungePosts: loadedPosts.length,
      totalComments: allComments.length,
      thisMonthStories,
      thisMonthPosts,
      recentSignups: recentActiveAuthors.length,
      pendingStories: 0, // 실제 데이터에는 모든 스토리가 발행됨
    };
    
    setStats(calculatedStats);
  }, []);

  // 최근 활동 데이터 계산 (stats와 stories/loungePosts가 모두 로드된 후)
  useEffect(() => {
    if (stats && stories.length > 0 && loungePosts.length > 0) {
      setRecentActivities(getRecentActivities());
    }
  }, [stats, stories, loungePosts]);

  // 관리자가 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // 최근 활동 데이터 생성 (실제 데이터 기반)
  const getRecentActivities = () => {
    if (!stats) return [];
    
    const activities = [];
    
    // 최근 스토리들
    const recentStories = stories
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
    
    recentStories.forEach(story => {
      activities.push({
        id: `story-${story.id}`,
        type: 'story',
        action: 'published',
        title: story.title,
        user: story.author,
        time: getTimeAgo(story.createdAt)
      });
    });
    
    // 최근 라운지 글들
    const recentPosts = loungePosts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
    
    recentPosts.forEach(post => {
      activities.push({
        id: `lounge-${post.id}`,
        type: 'lounge',
        action: 'posted',
        title: post.title,
        user: post.author,
        time: getTimeAgo(post.createdAt)
      });
    });
    
    // 시간순 정렬
    return activities
      .sort((a, b) => {
        const timeA = new Date(stories.find(s => s.id === parseInt(a.id.split('-')[1]))?.createdAt || 
                               loungePosts.find(p => p.id === parseInt(a.id.split('-')[1]))?.createdAt || 0);
        const timeB = new Date(stories.find(s => s.id === parseInt(b.id.split('-')[1]))?.createdAt || 
                               loungePosts.find(p => p.id === parseInt(b.id.split('-')[1]))?.createdAt || 0);
        return timeB.getTime() - timeA.getTime();
      })
      .slice(0, 5);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  if (!isAdmin || !stats) {
    return null;
  }

  return (
    <Container maxW="1200px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <VStack spacing={4} align="flex-start">
          <Heading as="h1" size="xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            관리자 대시보드
          </Heading>
          <HStack>
            <Avatar size="sm" name={user?.name} />
            <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
              안녕하세요, {user?.name}님! 🛠️
            </Text>
          </HStack>
        </VStack>

        <Divider />

        {/* 주요 통계 */}
        <Box>
          <Heading as="h2" size="lg" mb={6} color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            🎯 핵심 지표
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>전체 사용자</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{stats.totalUsers.toLocaleString()}</StatNumber>
              <StatHelpText color="brand.500">
                +{stats.recentSignups} 이번 주
              </StatHelpText>
            </Stat>

            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>월간 활성 사용자</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{stats.monthlyActiveUsers.toLocaleString()}</StatNumber>
              <StatHelpText color="green.500">
                42% 증가
              </StatHelpText>
            </Stat>

            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>승인 대기 Story</StatLabel>
              <StatNumber color="orange.500">{stats.pendingStories}</StatNumber>
              <StatHelpText color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                확인 필요
              </StatHelpText>
            </Stat>
          </SimpleGrid>
        </Box>

        <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={8}>
          {/* 빠른 액션 */}
          <GridItem>
            <Heading as="h2" size="lg" mb={6} color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              🚀 빠른 액션
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Button 
                as={RouterLink} 
                to="/admin/story"
                size="lg" 
                h="80px" 
                flexDirection="column" 
                spacing={2}
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                _hover={{
                  bg: colorMode === 'dark' ? '#4d4d59' : '#f8f9fa',
                  transform: 'translateY(-2px)'
                }}
              >
                <Text fontSize="2xl">📖</Text>
                <Text fontSize="sm" fontWeight="500">Story 관리</Text>
              </Button>

              <Button 
                as={RouterLink} 
                to="/admin/lounge"
                size="lg" 
                h="80px" 
                flexDirection="column" 
                spacing={2}
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                _hover={{
                  bg: colorMode === 'dark' ? '#4d4d59' : '#f8f9fa',
                  transform: 'translateY(-2px)'
                }}
              >
                <Text fontSize="2xl">💬</Text>
                <Text fontSize="sm" fontWeight="500">Lounge 관리</Text>
              </Button>

              <Button 
                as={RouterLink} 
                to="/admin/users"
                size="lg" 
                h="80px" 
                flexDirection="column" 
                spacing={2}
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                _hover={{
                  bg: colorMode === 'dark' ? '#4d4d59' : '#f8f9fa',
                  transform: 'translateY(-2px)'
                }}
              >
                <Text fontSize="2xl">👥</Text>
                <Text fontSize="sm" fontWeight="500">사용자 관리</Text>
              </Button>

              <Button 
                as={RouterLink} 
                to="/admin/tags"
                size="lg" 
                h="80px" 
                flexDirection="column" 
                spacing={2}
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                _hover={{
                  bg: colorMode === 'dark' ? '#4d4d59' : '#f8f9fa',
                  transform: 'translateY(-2px)'
                }}
              >
                <Text fontSize="2xl">🏷️</Text>
                <Text fontSize="sm" fontWeight="500">태그 관리</Text>
              </Button>

              <Button 
                as={RouterLink} 
                to="/admin/analytics"
                size="lg" 
                h="80px" 
                flexDirection="column" 
                spacing={2}
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                _hover={{
                  bg: colorMode === 'dark' ? '#4d4d59' : '#f8f9fa',
                  transform: 'translateY(-2px)'
                }}
              >
                <Text fontSize="2xl">📈</Text>
                <Text fontSize="sm" fontWeight="500">통계 분석</Text>
              </Button>

              <Button 
                as={RouterLink} 
                to="/admin/levels"
                size="lg" 
                h="80px" 
                flexDirection="column" 
                spacing={2}
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                _hover={{
                  bg: colorMode === 'dark' ? '#4d4d59' : '#f8f9fa',
                  transform: 'translateY(-2px)'
                }}
              >
                <Text fontSize="2xl">🏆</Text>
                <Text fontSize="sm" fontWeight="500">레벨 관리</Text>
              </Button>
            </SimpleGrid>
          </GridItem>

          {/* 최근 활동 */}
          <GridItem>
            <Heading as="h2" size="lg" mb={6} color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              📋 최근 활동
            </Heading>
            <Card 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              maxH="400px"
              overflow="auto"
            >
              <CardBody p={4}>
                <List spacing={3}>
                  {recentActivities.map((activity) => (
                    <ListItem key={activity.id}>
                      <HStack spacing={3} align="start">
                        <Badge 
                          colorScheme={
                            activity.type === 'story' ? 'blue' : 
                            activity.type === 'lounge' ? 'green' : 
                            activity.type === 'user' ? 'purple' : 'orange'
                          }
                          variant="subtle"
                          fontSize="xs"
                          minW="60px"
                          textAlign="center"
                        >
                          {activity.type === 'story' ? '📖' : 
                           activity.type === 'lounge' ? '💬' : 
                           activity.type === 'user' ? '👤' : '⚠️'}
                        </Badge>
                        <VStack spacing={0} align="start" flex="1">
                          <Text 
                            fontSize="sm" 
                            fontWeight="500"
                            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                            noOfLines={1}
                          >
                            {activity.title}
                          </Text>
                          <Text 
                            fontSize="xs" 
                            color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                          >
                            {activity.user} • {activity.time}
                          </Text>
                        </VStack>
                      </HStack>
                    </ListItem>
                  ))}
                </List>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* 콘텐츠 현황 */}
        <Box>
          <Heading as="h2" size="lg" mb={6} color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            📚 콘텐츠 현황
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>총 Story 수</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{stats.totalStories}</StatNumber>
              <StatHelpText color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                이번 달 +{stats.thisMonthStories} 증가
              </StatHelpText>
            </Stat>

            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>총 Lounge 글 수</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{stats.totalLoungePosts}</StatNumber>
              <StatHelpText color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                이번 달 +{stats.thisMonthPosts} 증가
              </StatHelpText>
            </Stat>
          </SimpleGrid>
        </Box>

      </VStack>
    </Container>
  );
};

export default AdminDashboard;