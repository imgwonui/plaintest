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
import { storyService, loungeService, userService, commentService } from '../services/supabaseDataService';

const AdminDashboard: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [stories, setStories] = useState<any[]>([]);
  const [loungePosts, setLoungePosts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Supabase 실제 데이터 로드 및 통계 계산
  useEffect(() => {
    if (!isAdmin) {
      console.log('❌ 관리자가 아님, 데이터 로드 중단');
      return;
    }
    
    const loadAdminData = async () => {
      try {
        console.log('🔄 AdminDashboard 데이터 로딩 시작...', { isAdmin, user });
        
        // 모든 데이터를 병렬로 로드
        const [storiesResult, loungeResult, usersResult, commentsResult] = await Promise.all([
          storyService.getAll(1, 1000), // 모든 스토리
          loungeService.getAll(1, 1000), // 모든 라운지 글
          userService.getAllUsers(1, 1000), // 모든 사용자
          commentService.getAll(1, 1000) // 모든 댓글
        ]);
        
        console.log('📊 Raw data received:', {
          storiesResult,
          loungeResult, 
          usersResult,
          commentsResult
        });
        
        const loadedStories = storiesResult.stories || [];
        const loadedPosts = loungeResult.posts || [];
        const allUsers = usersResult.users || [];
        const allComments = commentsResult.comments || [];
        
        console.log('📋 Parsed data:', {
          loadedStoriesCount: loadedStories.length,
          loadedPostsCount: loadedPosts.length,
          allUsersCount: allUsers.length,
          allCommentsCount: allComments.length
        });
        
        setStories(loadedStories);
        setLoungePosts(loadedPosts);
        
        // 실제 데이터 기반 통계 계산
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const thisMonthStories = loadedStories.filter(story => 
          new Date(story.created_at) >= thisMonthStart
        ).length;
        
        const thisMonthPosts = loadedPosts.filter(post => 
          new Date(post.created_at) >= thisMonthStart
        ).length;
        
        // 이번 주 활동한 사용자 (스토리, 라운지, 댓글 작성자)
        const recentStoryAuthors = loadedStories
          .filter(story => new Date(story.created_at) >= thisWeekStart)
          .map(story => story.author_id);
        
        const recentPostAuthors = loadedPosts
          .filter(post => new Date(post.created_at) >= thisWeekStart)
          .map(post => post.author_id);
        
        const recentCommentAuthors = allComments
          .filter(comment => new Date(comment.created_at) >= thisWeekStart)
          .map(comment => comment.author_id);
        
        const recentActiveUsers = [...new Set([...recentStoryAuthors, ...recentPostAuthors, ...recentCommentAuthors])];
        
        // 월간 활성 사용자 (이번 달에 활동한 사용자)
        const monthlyStoryAuthors = loadedStories
          .filter(story => new Date(story.created_at) >= thisMonthStart)
          .map(story => story.author_id);
        
        const monthlyPostAuthors = loadedPosts
          .filter(post => new Date(post.created_at) >= thisMonthStart)
          .map(post => post.author_id);
        
        const monthlyCommentAuthors = allComments
          .filter(comment => new Date(comment.created_at) >= thisMonthStart)
          .map(comment => comment.author_id);
        
        const monthlyActiveUsers = [...new Set([...monthlyStoryAuthors, ...monthlyPostAuthors, ...monthlyCommentAuthors])];
        
        // 유저이탈율 계산 (월간 비활성 사용자 / 전체 사용자 * 100) - 항상 양수
        const monthlyInactiveUsers = Math.max(0, allUsers.length - monthlyActiveUsers.length);
        const userChurnRate = allUsers.length > 0 ? Math.round((monthlyInactiveUsers / allUsers.length) * 100) : 0;
        
        // 월간 신규 유입자 수 (이번 달에 가입한 사용자 수)
        const monthlyNewUsers = allUsers.filter(user => 
          new Date(user.created_at) >= thisMonthStart
        ).length;
        
        // Carrying Capacity = 월간 신규 유입자 수 ÷ (이탈율 ÷ 100)
        // 예시: 신규 5000명, 이탈율 10% → 5000 ÷ (10 ÷ 100) = 5000 ÷ 0.1 = 50000
        const carryingCapacity = userChurnRate > 0 ? 
          Math.round(monthlyNewUsers / (userChurnRate / 100)) : 
          monthlyNewUsers > 0 ? '∞' : 0;
        
        const calculatedStats = {
          totalUsers: allUsers.length,
          monthlyActiveUsers: monthlyActiveUsers.length,
          totalStories: loadedStories.length,
          totalLoungePosts: loadedPosts.length,
          totalComments: allComments.length,
          thisMonthStories,
          thisMonthPosts,
          recentSignups: recentActiveUsers.length,
          userChurnRate,
          monthlyNewUsers,
          carryingCapacity,
        };
        
        setStats(calculatedStats);
        
        console.log('✅ 관리자 대시보드 데이터 로드 성공:', {
          총사용자: allUsers.length,
          월간활성사용자: monthlyActiveUsers.length,
          총스토리: loadedStories.length,
          총라운지글: loadedPosts.length,
          총댓글: allComments.length,
          calculatedStats
        });
        
        console.log('🎯 Stats 설정 전 상태:', stats);
        console.log('🎯 새로 설정할 calculatedStats:', calculatedStats);
        
      } catch (error) {
        console.error('❌ 관리자 대시보드 데이터 로드 실패:', error);
        // 에러 시에도 빈 통계로 설정
        setStats({
          totalUsers: 0,
          monthlyActiveUsers: 0,
          totalStories: 0,
          totalLoungePosts: 0,
          totalComments: 0,
          thisMonthStories: 0,
          thisMonthPosts: 0,
          recentSignups: 0,
          userChurnRate: 0,
          monthlyNewUsers: 0,
          carryingCapacity: 0,
        });
      }
    };
    
    loadAdminData();
  }, [isAdmin]);

  // Stats 상태 변화 모니터링
  useEffect(() => {
    console.log('📊 Stats 상태 변경됨:', stats);
  }, [stats]);

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
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3);
    
    recentStories.forEach(story => {
      activities.push({
        id: `story-${story.id}`,
        type: 'story',
        action: 'published',
        title: story.title,
        user: story.author_name,
        time: getTimeAgo(story.created_at)
      });
    });
    
    // 최근 라운지 글들
    const recentPosts = loungePosts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2);
    
    recentPosts.forEach(post => {
      activities.push({
        id: `lounge-${post.id}`,
        type: 'lounge',
        action: 'posted',
        title: post.title,
        user: post.author_name,
        time: getTimeAgo(post.created_at)
      });
    });
    
    // 시간순 정렬
    return activities
      .sort((a, b) => {
        const timeA = new Date(stories.find(s => s.id === parseInt(a.id.split('-')[1]))?.created_at || 
                               loungePosts.find(p => p.id === parseInt(a.id.split('-')[1]))?.created_at || 0);
        const timeB = new Date(stories.find(s => s.id === parseInt(b.id.split('-')[1]))?.created_at || 
                               loungePosts.find(p => p.id === parseInt(b.id.split('-')[1]))?.created_at || 0);
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

  if (!isAdmin) {
    return null;
  }

  // 로딩 상태 표시
  if (!stats) {
    return (
      <Container maxW="1200px" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            관리자 대시보드
          </Heading>
          <Text>데이터 로딩 중...</Text>
        </VStack>
      </Container>
    );
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
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
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
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>유저이탈율</StatLabel>
              <StatNumber color="red.500">{stats.userChurnRate}%</StatNumber>
              <StatHelpText color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                월간 기준
              </StatHelpText>
            </Stat>

            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>Carrying Capacity</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{stats.carryingCapacity}</StatNumber>
              <StatHelpText color="blue.500">
                성장 지속성
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