import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  Card,
  CardBody,
  Badge,
  Avatar,
  Divider,
  useColorMode,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Link,
  Icon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ExternalLinkIcon, SettingsIcon, StarIcon, AttachmentIcon } from '@chakra-ui/icons';
import { sessionStoryService, sessionLoungeService, sessionScrapService, sessionLikeService, initializeData } from '../services/sessionDataService';
import { formatDate } from '../utils/format';
import LevelBadge from '../components/UserLevel/LevelBadge';
import UserLevelIcon from '../components/UserLevel/UserLevelIcon';
import { getUserDisplayLevel, userLevelService } from '../services/userLevelService';
import { LevelUtils } from '../data/levelConfig';
import dayjs from 'dayjs';

const Profile: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [userStats, setUserStats] = useState<any>(null);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [userLoungePosts, setUserLoungePosts] = useState<any[]>([]);
  const [userBookmarks, setUserBookmarks] = useState<any[]>([]);
  const [userLikes, setUserLikes] = useState<any[]>([]);

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  // 사용자 데이터 로드
  useEffect(() => {
    if (!user) return;
    
    initializeData();
    const allStories = sessionStoryService.getAll();
    const allLoungePosts = sessionLoungeService.getAll();
    const allBookmarks = sessionScrapService.getAll();
    const allLikes = sessionLikeService.getAll();
    
    // 사용자의 글들 - 관리자가 아닌 일반 사용자는 Story를 직접 작성할 수 없고, 라운지 글이 Story로 승격되는 경우만 있음
    const myStories = allStories.filter(story => 
      story.isFromLounge && story.originalAuthor === user.name
    );
    const myLoungePosts = allLoungePosts.filter(post => post.author === user.name);
    
    // 사용자의 북마크들
    const myBookmarks = allBookmarks
      .filter(bookmark => bookmark.userId === user.id)
      .map(bookmark => {
        if (bookmark.postType === 'story') {
          const story = allStories.find(s => s.id === bookmark.postId);
          return story ? { ...story, type: 'story', bookmarkedAt: bookmark.createdAt } : null;
        } else {
          const post = allLoungePosts.find(p => p.id === bookmark.postId);
          return post ? { ...post, type: 'lounge', bookmarkedAt: bookmark.createdAt } : null;
        }
      })
      .filter(item => item !== null)
      .sort((a, b) => new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime());
    
    // 사용자가 좋아요한 글들
    const myLikes = allLikes
      .filter(like => like.userId === user.id)
      .map(like => {
        if (like.postType === 'story') {
          const story = allStories.find(s => s.id === like.postId);
          return story ? { ...story, type: 'story', likedAt: like.createdAt } : null;
        } else {
          const post = allLoungePosts.find(p => p.id === like.postId);
          return post ? { ...post, type: 'lounge', likedAt: like.createdAt } : null;
        }
      })
      .filter(item => item !== null)
      .sort((a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime());
    
    // 통계 계산
    const totalLikes = allLikes.filter(like => {
      if (like.postType === 'story') {
        const story = allStories.find(s => s.id === like.postId);
        return story && story.author === user.name;
      } else {
        const post = allLoungePosts.find(p => p.id === like.postId);
        return post && post.author === user.name;
      }
    }).length;
    
    const stats = {
      storiesCount: myStories.length,
      loungePostsCount: myLoungePosts.length,
      totalLikes,
      bookmarksCount: myBookmarks.length,
      joinedDays: Math.ceil((new Date().getTime() - new Date(user.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
    };
    
    setUserStats(stats);
    setUserStories(myStories);
    setUserLoungePosts(myLoungePosts);
    setUserBookmarks(myBookmarks);
    setUserLikes(myLikes);
  }, [user]);

  const handleHRVerification = () => {
    window.open('https://salaryday.co.kr', '_blank');
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'kakao':
        return <Badge colorScheme="yellow" size="sm">카카오</Badge>;
      case 'google':
        return <Badge colorScheme="red" size="sm">구글</Badge>;
      default:
        return <Badge colorScheme="gray" size="sm">{provider}</Badge>;
    }
  };

  if (!isLoggedIn || !user || !userStats) {
    return null;
  }

  return (
    <Container maxW="1200px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 프로필 헤더 */}
        <Card 
          bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
          border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
        >
          <CardBody>
            <HStack spacing={6} align="start">
              <Avatar size="xl" name={user.name} src={user.avatar} />
              
              <VStack spacing={4} align="start" flex="1">
                <VStack spacing={2} align="start">
                  <HStack>
                    <Heading as="h2" size="lg" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                      {user.name}
                    </Heading>
                    <LevelBadge 
                      level={getUserDisplayLevel(user.id).level} 
                      size="md" 
                      variant="solid"
                      showIcon={true}
                      showTierName={true}
                    />
                    {getProviderBadge(user.provider || 'kakao')}
                    {user.isAdmin && (
                      <Badge colorScheme="purple" size="sm">관리자</Badge>
                    )}
                    {user.isVerified && (
                      <Badge colorScheme="green" size="sm">인사담당자</Badge>
                    )}
                  </HStack>
                  
                  <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                    {user.email}
                  </Text>
                  
                  <Text fontSize="sm" color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}>
                    {formatDate(user.createdAt || new Date().toISOString())}에 가입 • {userStats.joinedDays}일째
                  </Text>
                </VStack>
                
                <HStack spacing={4}>
                  <Button
                    leftIcon={<SettingsIcon />}
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/settings')}
                  >
                    설정
                  </Button>
                  
                  {!user.isVerified && (
                    <Button
                      colorScheme="brand"
                      size="sm"
                      onClick={handleHRVerification}
                    >
                      인사담당자 인증하기
                    </Button>
                  )}
                </HStack>
                
                {!user.isVerified && (
                  <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                    월급봉투를 통해 인사담당자 인증을 할 수 있어요.
                  </Text>
                )}
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        {/* 레벨 정보 카드 */}
        <Card 
          bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
          border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
        >
          <CardBody>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between" align="center">
                <Heading as="h3" size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  활동 레벨
                </Heading>
                <LevelBadge 
                  level={getUserDisplayLevel(user.id).level} 
                  size="lg" 
                  variant="solid"
                  showIcon={true}
                  showTierName={true}
                />
              </HStack>
              
              {(() => {
                const userLevel = getUserDisplayLevel(user.id);
                const currentTier = LevelUtils.getLevelTier(userLevel.level);
                const nextLevel = userLevel.level < 99 ? userLevel.level + 1 : userLevel.level;
                const nextLevelExp = userLevel.level < 99 ? LevelUtils.getRequiredExpForLevel(nextLevel) : userLevel.totalExp;
                const progressPercent = userLevel.level >= 99 ? 100 : ((userLevel.totalExp - LevelUtils.getRequiredExpForLevel(userLevel.level)) / (nextLevelExp - LevelUtils.getRequiredExpForLevel(userLevel.level))) * 100;
                
                return (
                  <VStack spacing={4} align="stretch">
                    {/* 레벨 진행률 */}
                    <VStack spacing={2} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                          {userLevel.level < 99 ? `LV${userLevel.level} → LV${nextLevel}` : 'MAX LEVEL'}
                        </Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                          {userLevel.totalExp.toLocaleString()} EXP
                        </Text>
                      </HStack>
                      
                      <Box
                        w="100%"
                        h="12px"
                        bg={colorMode === 'dark' ? '#2c2c35' : '#f7fafc'}
                        borderRadius="full"
                        overflow="hidden"
                        border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e2e8f0'}
                      >
                        <Box
                          h="100%"
                          w={`${Math.min(progressPercent, 100)}%`}
                          bg={currentTier?.color || '#68D391'}
                          borderRadius="full"
                          transition="width 0.3s ease"
                          boxShadow={userLevel.level >= 90 ? `0 0 8px ${currentTier?.color || '#FFD700'}` : undefined}
                        />
                      </Box>
                      
                      {userLevel.level < 99 && (
                        <Text fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}>
                          다음 레벨까지 {(nextLevelExp - userLevel.totalExp).toLocaleString()} EXP 필요
                        </Text>
                      )}
                    </VStack>
                    
                    {/* 티어 정보 */}
                    <HStack spacing={4} align="center">
                      <UserLevelIcon 
                        level={userLevel.level} 
                        size="lg"
                        showAnimation={userLevel.level >= 90}
                      />
                      <VStack spacing={1} align="start">
                        <Text fontWeight="600" color={currentTier?.color || (colorMode === 'dark' ? '#e4e4e5' : '#2c2c35')}>
                          {currentTier?.name || 'Unknown Tier'}
                        </Text>
                        <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                          {currentTier?.description || '레벨 정보를 불러올 수 없습니다'}
                        </Text>
                        {userLevel.level >= 90 && (
                          <Badge colorScheme="yellow" size="sm" variant="solid">
                            ✨ LEGEND
                          </Badge>
                        )}
                      </VStack>
                    </HStack>
                    
                    {/* 활동 점수 내역 */}
                    <Box>
                      <Text fontSize="sm" fontWeight="600" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'} mb={3}>
                        점수 획득 내역
                      </Text>
                      <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
                        <VStack spacing={1} align="center" p={3} bg={colorMode === 'dark' ? '#2c2c35' : '#f8f9fa'} borderRadius="md">
                          <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>받은 좋아요</Text>
                          <Text fontSize="sm" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                            {userStats.totalLikes} × 2 = {userStats.totalLikes * 2}점
                          </Text>
                        </VStack>
                        <VStack spacing={1} align="center" p={3} bg={colorMode === 'dark' ? '#2c2c35' : '#f8f9fa'} borderRadius="md">
                          <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>Story 승격</Text>
                          <Text fontSize="sm" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                            {userStats.storiesCount} × 50 = {userStats.storiesCount * 50}점
                          </Text>
                        </VStack>
                        <VStack spacing={1} align="center" p={3} bg={colorMode === 'dark' ? '#2c2c35' : '#f8f9fa'} borderRadius="md">
                          <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>글 작성</Text>
                          <Text fontSize="sm" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                            {userStats.loungePostsCount} × 3 = {userStats.loungePostsCount * 3}점
                          </Text>
                        </VStack>
                      </SimpleGrid>
                    </Box>
                  </VStack>
                );
              })()}
            </VStack>
          </CardBody>
        </Card>

        {/* 통계 카드 */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
          <Stat 
            p={6} 
            bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
            borderRadius="lg"
            border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
          >
            <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>내 글이 Story로</StatLabel>
            <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{userStats.storiesCount}</StatNumber>
          </Stat>

          <Stat 
            p={6} 
            bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
            borderRadius="lg"
            border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
          >
            <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>내가 쓴 Lounge</StatLabel>
            <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{userStats.loungePostsCount}</StatNumber>
          </Stat>

          <Stat 
            p={6} 
            bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
            borderRadius="lg"
            border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
          >
            <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>받은 좋아요</StatLabel>
            <StatNumber color="red.500">{userStats.totalLikes}</StatNumber>
          </Stat>

          <Stat 
            p={6} 
            bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
            borderRadius="lg"
            border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
          >
            <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>북마크</StatLabel>
            <StatNumber color="yellow.500">{userStats.bookmarksCount}</StatNumber>
          </Stat>
        </SimpleGrid>

        {/* 탭 메뉴 */}
        <Tabs variant="enclosed" colorScheme="brand">
          <TabList>
            <Tab>내 글이 Story로 ({userStats.storiesCount})</Tab>
            <Tab>내가 쓴 Lounge ({userStats.loungePostsCount})</Tab>
            <Tab>북마크 ({userStats.bookmarksCount})</Tab>
            <Tab>좋아요한 글 ({userLikes.length})</Tab>
          </TabList>

          <TabPanels>
            {/* 내 글이 Story로 승격된 목록 */}
            <TabPanel px={0}>
              <Card 
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              >
                <CardBody>
                  {userStories.length === 0 ? (
                    <Text textAlign="center" py={8} color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                      아직 Lounge 글이 Story로 승격된 적이 없습니다.
                    </Text>
                  ) : (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>제목</Th>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>작성일</Th>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>좋아요</Th>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>조회수</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {userStories.map((story) => (
                          <Tr key={story.id}>
                            <Td>
                              <Text 
                                as="button"
                                noOfLines={1} 
                                maxW="400px"
                                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                                textAlign="left"
                                _hover={{ color: 'brand.500', textDecoration: 'underline' }}
                                onClick={() => navigate(`/story/${story.id}`)}
                              >
                                {story.title}
                              </Text>
                            </Td>
                            <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {dayjs(story.createdAt).format('YYYY.MM.DD')}
                            </Td>
                            <Td color="red.500">{story.likeCount || 0}</Td>
                            <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {story.viewCount || 0}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* 내가 쓴 Lounge */}
            <TabPanel px={0}>
              <Card 
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              >
                <CardBody>
                  {userLoungePosts.length === 0 ? (
                    <Text textAlign="center" py={8} color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                      아직 작성한 Lounge 글이 없습니다.
                    </Text>
                  ) : (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>제목</Th>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>유형</Th>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>작성일</Th>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>좋아요</Th>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>댓글</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {userLoungePosts.map((post) => (
                          <Tr key={post.id}>
                            <Td>
                              <Text 
                                as="button"
                                noOfLines={1} 
                                maxW="400px"
                                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                                textAlign="left"
                                _hover={{ color: 'brand.500', textDecoration: 'underline' }}
                                onClick={() => navigate(`/lounge/${post.id}`)}
                              >
                                {post.title}
                              </Text>
                            </Td>
                            <Td>
                              <Badge colorScheme="blue" size="sm">{post.type}</Badge>
                            </Td>
                            <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {dayjs(post.createdAt).format('YYYY.MM.DD')}
                            </Td>
                            <Td color="red.500">{post.likeCount || 0}</Td>
                            <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {post.commentCount || 0}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* 북마크 */}
            <TabPanel px={0}>
              <Card 
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              >
                <CardBody>
                  {userBookmarks.length === 0 ? (
                    <Text textAlign="center" py={8} color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                      아직 북마크한 글이 없습니다.
                    </Text>
                  ) : (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>제목</Th>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>작성자</Th>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>유형</Th>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>북마크 일시</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {userBookmarks.map((item) => (
                          <Tr key={`${item.type}-${item.id}`}>
                            <Td>
                              <Text 
                                as="button"
                                noOfLines={1} 
                                maxW="400px"
                                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                                textAlign="left"
                                _hover={{ color: 'brand.500', textDecoration: 'underline' }}
                                onClick={() => navigate(`/${item.type}/${item.id}`)}
                              >
                                {item.title}
                              </Text>
                            </Td>
                            <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {item.author}
                            </Td>
                            <Td>
                              <Badge 
                                colorScheme={item.type === 'story' ? 'blue' : 'green'} 
                                size="sm"
                              >
                                {item.type === 'story' ? 'Story' : 'Lounge'}
                              </Badge>
                            </Td>
                            <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {dayjs(item.bookmarkedAt).format('YYYY.MM.DD HH:mm')}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </TabPanel>

            {/* 좋아요한 글 */}
            <TabPanel px={0}>
              <Card 
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              >
                <CardBody>
                  {userLikes.length === 0 ? (
                    <Text textAlign="center" py={8} color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                      아직 좋아요한 글이 없습니다.
                    </Text>
                  ) : (
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>제목</Th>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>작성자</Th>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>유형</Th>
                          <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>좋아요 일시</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {userLikes.map((item) => (
                          <Tr key={`${item.type}-${item.id}`}>
                            <Td>
                              <Text 
                                as="button"
                                noOfLines={1} 
                                maxW="400px"
                                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                                textAlign="left"
                                _hover={{ color: 'brand.500', textDecoration: 'underline' }}
                                onClick={() => navigate(`/${item.type}/${item.id}`)}
                              >
                                {item.title}
                              </Text>
                            </Td>
                            <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {item.author}
                            </Td>
                            <Td>
                              <Badge 
                                colorScheme={item.type === 'story' ? 'blue' : 'green'} 
                                size="sm"
                              >
                                {item.type === 'story' ? 'Story' : 'Lounge'}
                              </Badge>
                            </Td>
                            <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {dayjs(item.likedAt).format('YYYY.MM.DD HH:mm')}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default Profile;