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
import { storyService, loungeService, interactionService, userService } from '../services/supabaseDataService';
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
  const [isLoading, setIsLoading] = useState(true);

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  // 사용자 데이터 로드
  useEffect(() => {
    if (!user) return;
    
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        // 사용자의 글들 로드
        console.log('🔍 사용자 ID로 글 조회 시작:', user.id);
        const [storiesResponse, loungeResponse] = await Promise.all([
          storyService.getByAuthor(user.id),
          loungeService.getByAuthor(user.id)
        ]);
        
        const myStories = storiesResponse.stories || [];
        const myLoungePosts = loungeResponse.posts || [];
        
        console.log('📊 조회된 사용자 글들:', {
          stories: myStories.length,
          loungePosts: myLoungePosts.length,
          storiesData: myStories.slice(0, 2), // 처음 2개만 로그
          loungeData: myLoungePosts.slice(0, 2)
        });
        
        // 사용자의 북마크들 로드
        const bookmarksResponse = await interactionService.getUserBookmarks(user.id);
        const rawBookmarks = bookmarksResponse || [];
        
        // 북마크된 실제 게시글들 가져오기
        const bookmarkDetails = await Promise.all(
          rawBookmarks.map(async (bookmark) => {
            try {
              if (bookmark.post_type === 'story') {
                const story = await storyService.getById(bookmark.post_id);
                return story ? {
                  ...story,
                  type: 'story',
                  author: story.author_name,
                  bookmarkedAt: bookmark.created_at
                } : null;
              } else {
                const post = await loungeService.getById(bookmark.post_id);
                return post ? {
                  ...post,
                  type: 'lounge',
                  author: post.author_name,
                  bookmarkedAt: bookmark.created_at
                } : null;
              }
            } catch (error) {
              console.error('북마크 세부정보 로드 실패:', bookmark, error);
              return null;
            }
          })
        );
        
        const myBookmarks = bookmarkDetails.filter(item => item !== null)
          .sort((a, b) => new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime());
        
        // 사용자가 좋아요한 글들 로드
        const likesResponse = await interactionService.getUserLikes(user.id);
        const rawLikes = likesResponse?.likes || [];
        
        // 좋아요한 실제 게시글들 가져오기
        const likeDetails = await Promise.all(
          rawLikes.map(async (like) => {
            try {
              if (like.post_type === 'story') {
                const story = await storyService.getById(like.post_id);
                return story ? {
                  ...story,
                  type: 'story',
                  author: story.author_name,
                  likedAt: like.created_at
                } : null;
              } else {
                const post = await loungeService.getById(like.post_id);
                return post ? {
                  ...post,
                  type: 'lounge',
                  author: post.author_name,
                  likedAt: like.created_at
                } : null;
              }
            } catch (error) {
              console.error('좋아요 세부정보 로드 실패:', like, error);
              return null;
            }
          })
        );
        
        const myLikes = likeDetails.filter(item => item !== null)
          .sort((a, b) => new Date(b.likedAt).getTime() - new Date(a.likedAt).getTime());
        
        // 통계 계산 - 실제 likes 테이블에서 직접 계산
        console.log('🔄 실제 좋아요 수 계산 중...');
        let storyLikes = 0;
        let loungeLikes = 0;
        
        // Story 글들의 실제 좋아요 수 계산
        for (const story of myStories) {
          try {
            const actualCount = await interactionService.getLikeCount(story.id, 'story');
            storyLikes += actualCount;
          } catch (error) {
            console.warn(`Story ${story.id} 좋아요 수 조회 실패:`, error);
          }
        }
        
        // Lounge 글들의 실제 좋아요 수 계산
        for (const post of myLoungePosts) {
          try {
            const actualCount = await interactionService.getLikeCount(post.id, 'lounge');
            loungeLikes += actualCount;
          } catch (error) {
            console.warn(`Lounge ${post.id} 좋아요 수 조회 실패:`, error);
          }
        }
        
        const totalLikes = storyLikes + loungeLikes;
        
        // 각 라운지 글의 실시간 좋아요/댓글 수 업데이트
        console.log('🔄 라운지 글 통계 업데이트 중...');
        const updatedLoungePosts = await Promise.all(
          myLoungePosts.map(async (post) => {
            try {
              console.log(`📊 글 ${post.id} 통계 업데이트 중...`);
              
              // 좋아요 수와 댓글 수 조회
              const [actualLikeCount, actualCommentCount] = await Promise.all([
                interactionService.getLikeCount(post.id, 'lounge'),
                interactionService.getCommentCount(post.id, 'lounge')
              ]);
              console.log(`  → 좋아요: ${actualLikeCount}개`);
              console.log(`  → 댓글: ${actualCommentCount}개`);
              
              return {
                ...post,
                like_count: actualLikeCount,
                comment_count: actualCommentCount
              };
            } catch (error) {
              console.warn(`라운지 글 ${post.id} 통계 업데이트 실패:`, error);
              return {
                ...post,
                like_count: 0,
                comment_count: post.comment_count || 0
              };
            }
          })
        );
        
        console.log('💖 좋아요 수 계산:', {
          storyLikes,
          loungeLikes,
          totalLikes,
          storyLikeCounts: myStories.map(s => ({ id: s.id, title: s.title?.substring(0, 20), likes: s.like_count })),
          loungeLikeCounts: updatedLoungePosts.map(p => ({ id: p.id, title: p.title?.substring(0, 20), likes: p.like_count }))
        });
        
        // 사용자 활동 점수 계산 및 레벨 업데이트
        const activityScore = (totalLikes * 2) + (myStories.length * 50) + (myLoungePosts.length * 3);
        console.log(`📈 활동 점수 계산: 좋아요 ${totalLikes}×2 + Story ${myStories.length}×50 + Lounge ${myLoungePosts.length}×3 = ${activityScore}점`);
        
        // 레벨 업데이트 시도 (사용자 ID를 숫자로 변환)
        try {
          const numericUserId = parseInt(user.id) || stringToHash(user.id);
          console.log(`🔄 사용자 ${user.name} (ID: ${user.id} → ${numericUserId}) 레벨 업데이트 시도...`);
          console.log(`📊 계산된 활동 점수: ${activityScore}점`);
          
          // 현재 레벨 정보
          const currentLevel = getUserDisplayLevel(numericUserId);
          console.log(`📈 현재 레벨: LV${currentLevel.level}, 경험치: ${currentLevel.totalExp}`);
          
          // 직접 경험치 설정 (관리자 모드)
          userLevelService.setUserExp(numericUserId, activityScore);
          
          // 업데이트 후 레벨 정보
          const updatedLevel = getUserDisplayLevel(numericUserId);
          console.log(`🎉 업데이트 후 레벨: LV${updatedLevel.level}, 경험치: ${updatedLevel.totalExp}`);
          
          if (updatedLevel.level > currentLevel.level) {
            console.log(`🎊 레벨업! LV${currentLevel.level} → LV${updatedLevel.level}`);
          }
          
          // 🔥 세션 레벨을 데이터베이스에 동기화
          try {
            const syncResult = await userService.syncSessionLevelToDatabase(
              user.id, 
              updatedLevel.level, 
              updatedLevel.totalExp,
              {
                totalLikes,
                totalPosts: myStories.length + myLoungePosts.length,
                totalComments: 0 // 댓글은 별도로 계산 필요시 추가
              }
            );
            
            if (syncResult) {
              console.log(`✅ 세션 레벨이 데이터베이스에 동기화됨: ${user.name} LV${updatedLevel.level}`);
            } else {
              console.warn(`⚠️ 데이터베이스 동기화 실패: ${user.name}`);
            }
          } catch (syncError) {
            console.error('데이터베이스 동기화 중 오류:', syncError);
          }
          
          console.log('✅ 레벨 업데이트 완료');
        } catch (levelError) {
          console.warn('⚠️ 레벨 업데이트 실패:', levelError);
        }
        
        const stats = {
          storiesCount: myStories.length,
          loungePostsCount: updatedLoungePosts.length,
          totalLikes,
          bookmarksCount: myBookmarks.length,
          joinedDays: Math.ceil((new Date().getTime() - new Date(user.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)),
          activityScore
        };
        
        setUserStats(stats);
        setUserStories(myStories);
        setUserLoungePosts(updatedLoungePosts); // 업데이트된 라운지 글들 사용
        setUserBookmarks(myBookmarks);
        setUserLikes(myLikes);
      } catch (error) {
        console.error('사용자 데이터 로드 실패:', error);
        toast({
          title: "데이터를 불러오는 중 오류가 발생했습니다",
          status: "error",
          duration: 5000,
        });
        
        // 에러 시 기본값 설정
        setUserStats({
          storiesCount: 0,
          loungePostsCount: 0,
          totalLikes: 0,
          bookmarksCount: 0,
          joinedDays: 1,
        });
        setUserStories([]);
        setUserLoungePosts([]);
        setUserBookmarks([]);
        setUserLikes([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [user, toast]);

  const handleHRVerification = () => {
    window.open('https://salaryday.co.kr', '_blank');
  };

  // 영어 타입을 한국어로 변환하는 함수
  const getTypeInKorean = (type: string) => {
    switch (type) {
      case 'question': return '질문/Q&A';
      case 'experience': return '경험담/사연 공유';
      case 'info': return '정보·팁 공유';
      case 'free': return '자유글/잡담';
      case 'news': return '뉴스에 한마디';
      case 'advice': return '같이 고민해요';
      case 'recommend': return '추천해주세요';
      case 'anonymous': return '익명 토크';
      default: return type;
    }
  };

  // 문자열을 숫자 해시로 변환하는 함수
  const stringToHash = (str: string): number => {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit 정수로 변환
    }
    return Math.abs(hash);
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

  if (!isLoggedIn || !user) {
    return null;
  }

  if (isLoading || !userStats) {
    return (
      <Container maxW="1200px" py={8}>
        <VStack spacing={8} align="stretch">
          <Box h="200px" bg={colorMode === 'dark' ? '#3c3c47' : '#f7f7f7'} borderRadius="xl" />
          <Box h="150px" bg={colorMode === 'dark' ? '#3c3c47' : '#f7f7f7'} borderRadius="xl" />
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
            {[...Array(4)].map((_, index) => (
              <Box key={index} h="100px" bg={colorMode === 'dark' ? '#3c3c47' : '#f7f7f7'} borderRadius="lg" />
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    );
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
                      level={getUserDisplayLevel(parseInt(user.id) || stringToHash(user.id)).level} 
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
                    {formatDate(user.created_at || new Date().toISOString())}에 가입 • {userStats.joinedDays}일째
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
                  level={getUserDisplayLevel(parseInt(user.id) || stringToHash(user.id)).level} 
                  size="lg" 
                  variant="solid"
                  showIcon={true}
                  showTierName={true}
                />
              </HStack>
              
              {(() => {
                // 사용자 ID를 숫자로 변환해서 레벨 정보 가져오기
                const numericUserId = parseInt(user.id) || stringToHash(user.id);
                const userLevel = getUserDisplayLevel(numericUserId);
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
                              {dayjs(story.created_at).format('YYYY.MM.DD')}
                            </Td>
                            <Td color="red.500">{story.like_count || 0}</Td>
                            <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {story.view_count || 0}
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
                              <Badge colorScheme="blue" size="sm">{getTypeInKorean(post.type)}</Badge>
                            </Td>
                            <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {dayjs(post.created_at).format('YYYY.MM.DD')}
                            </Td>
                            <Td color="red.500">{post.like_count || 0}</Td>
                            <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {post.comment_count || 0}
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