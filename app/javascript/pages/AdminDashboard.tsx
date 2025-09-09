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
import { stories } from '../mocks/stories';
import { loungePosts } from '../mocks/lounge';

const AdminDashboard: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // 관리자가 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // 통계 데이터 (더 많은 지표 추가)
  const [stats] = useState({
    totalUsers: 1247,
    monthlyActiveUsers: 523, // MAU
    totalStories: stories.length,
    totalLoungePosts: loungePosts.length,
    thisMonthStories: stories.filter(story => 
      new Date(story.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length,
    pendingStories: 5,
    recentSignups: 15,
  });

  // 최근 활동 데이터
  const [recentActivities] = useState([
    { id: 1, type: 'story', action: 'published', title: '채용 프로세스 개선 사례', user: '김인사', time: '5분 전' },
    { id: 2, type: 'lounge', action: 'posted', title: '면접관 교육은 어떻게 하시나요?', user: 'John Doe', time: '12분 전' },
    { id: 3, type: 'user', action: 'joined', title: '새 사용자 가입', user: '박신입', time: '23분 전' },
    { id: 4, type: 'story', action: 'pending', title: '스타트업 채용 경험담', user: '이대표', time: '1시간 전' },
  ]);

  if (!isAdmin) {
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
                이번 달 +48 증가
              </StatHelpText>
            </Stat>
          </SimpleGrid>
        </Box>

      </VStack>
    </Container>
  );
};

export default AdminDashboard;