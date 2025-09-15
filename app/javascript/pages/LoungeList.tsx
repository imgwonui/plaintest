import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  SimpleGrid,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Heading,
  Badge,
  useColorMode,
  IconButton,
  Tooltip,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  useToast,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AddIcon, ViewIcon, HamburgerIcon } from '@chakra-ui/icons';
import Card from '../components/Card';
import CustomSelect from '../components/CustomSelect';
import EmptyState from '../components/EmptyState';
import { CardSkeletonGrid } from '../components/LoadingSpinner';
import RewardModal from '../components/RewardModal';
import SEOHead from '../components/SEOHead';
import { useAuth } from '../contexts/AuthContext';
// 타입은 API 타입으로 교체 예정
type LoungePost = any;
import { loungeService, userService } from '../services/supabaseDataService';
import { optimizedLoungeService } from '../services/optimizedDataService';
import { getAllTags, getTagById } from '../data/tags';
import TagSelector from '../components/TagSelector';
import LevelBadge from '../components/UserLevel/LevelBadge';
import { getDatabaseUserLevel, databaseUserLevelService } from '../services/databaseUserLevelService';
import dayjs from 'dayjs';

type SortOption = 'latest' | 'popular';
type PopularitySort = 'likes' | 'scraps';
type TypeFilter = 'all' | 'question' | 'experience' | 'info' | 'free' | 'news' | 'advice' | 'recommend' | 'anonymous';
type ViewMode = 'card' | 'list';

// 실시간 작성자 레벨 표시 컴포넌트
const AuthorLevelBadge: React.FC<{ authorId: string }> = ({ authorId }) => {
  const [authorLevel, setAuthorLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 초기 레벨 로드
  useEffect(() => {
    const loadLevel = async () => {
      try {
        setIsLoading(true);
        const levelData = await getDatabaseUserLevel(authorId);
        setAuthorLevel(levelData.level);
      } catch (error) {
        console.warn('작성자 레벨 로드 실패:', error);
        setAuthorLevel(1);
      } finally {
        setIsLoading(false);
      }
    };

    if (authorId) {
      loadLevel();
    }
  }, [authorId]);

  // 레벨업 이벤트 리스너
  useEffect(() => {
    const handleLevelUp = (event: CustomEvent) => {
      if (event.detail.userId === authorId) {
        console.log(`📈 라운지 작성자 레벨업 반영: ${authorId} LV${event.detail.oldLevel} → LV${event.detail.newLevel}`);
        setAuthorLevel(event.detail.newLevel);
      }
    };

    // 캐시 무효화 이벤트 리스너 (다른 곳에서 활동이 업데이트될 때)
    const handleCacheInvalidated = (event: CustomEvent) => {
      if (event.detail.userId === authorId) {
        console.log(`🔄 작성자 캐시 무효화됨, 레벨 새로고침: ${authorId}`);
        // 새로운 레벨 데이터 로드
        getDatabaseUserLevel(authorId).then(levelData => {
          setAuthorLevel(levelData.level);
        }).catch(error => {
          console.warn('캐시 무효화 후 레벨 로드 실패:', error);
        });
      }
    };

    if (typeof window !== 'undefined' && authorId) {
      window.addEventListener('userLevelUp', handleLevelUp as EventListener);
      window.addEventListener('userCacheInvalidated', handleCacheInvalidated as EventListener);
      return () => {
        window.removeEventListener('userLevelUp', handleLevelUp as EventListener);
        window.removeEventListener('userCacheInvalidated', handleCacheInvalidated as EventListener);
      };
    }
  }, [authorId]);

  if (isLoading) {
    return <LevelBadge level={1} size="xs" variant="subtle" showIcon={true} />;
  }

  return (
    <LevelBadge 
      level={authorLevel} 
      size="xs" 
      variant="subtle"
      showIcon={true}
    />
  );
};

const LoungeList: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isOpen: isRewardOpen, onOpen: onRewardOpen, onClose: onRewardClose } = useDisclosure();
  
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [popularitySort, setPopularitySort] = useState<PopularitySort>('likes');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [rewardPost, setRewardPost] = useState<LoungePost | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'popular'>('all');
  const [loungePosts, setLoungePosts] = useState<LoungePost[]>([]);

  // 데이터 로드 함수
  const loadPosts = async () => {
    try {
      setIsLoading(true);
      
      let posts;
      if (activeTab === 'popular') {
        const response = await loungeService.getPopular(1, 100);
        posts = response.posts || [];
      } else {
        const response = await optimizedLoungeService.getAll(1, 50, typeFilter === 'all' ? undefined : typeFilter, true, true); // forceRefresh = true
        posts = response.posts || [];
      }
      
      console.log('✅ 라운지 포스트 로드 성공:', posts.length, '개');
      setLoungePosts(posts);
      
      // 좋아요 50개 이상인 글 체크 (사용자의 글만)
      if (user) {
        const userHighLikePosts = posts.filter(post => 
          post.author_id === user.id && 
          post.like_count >= 50 && 
          !post.reward_claimed
        );
        
        if (userHighLikePosts.length > 0) {
          setRewardPost(userHighLikePosts[0]);
          setTimeout(() => onRewardOpen(), 1000);
        }
      }
      
    } catch (error) {
      console.error('❌ 라운지 포스트 로드 실패:', error);
      toast({
        title: "데이터 로드 실패",
        description: "라운지 글을 불러오는 중 오류가 발생했습니다.",
        status: "error",
        duration: 5000,
      });
      setLoungePosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 데이터 로드 - 페이지 로드 시 및 탭/필터 변경시
  useEffect(() => {
    console.log('LoungeList 컴포넌트 마운트됨 또는 필터 변경됨');
    loadPosts();
  }, [activeTab, typeFilter]);

  // location 변경될 때마다 데이터 새로고침 (글 작성/삭제 후 돌아올 때 핵심!)
  useEffect(() => {
    console.log('라우팅 위치 변경됨:', location.pathname, location.state);
    if (location.pathname === '/lounge') {
      console.log('라운지 페이지 진입 - 새로고침 시작');
      
      // 글 작성 후 돌아온 경우 - 캐시 완전 무효화 후 강제 새로고침
      if (location.state?.refresh) {
        console.log('📝 글 작성 후 돌아옴 - 캐시 무효화 후 강제 새로고침');
        
        // 1. 캐시 완전 무효화
        if (typeof window !== 'undefined') {
          // LocalStorage와 SessionStorage 캐시 무효화
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.includes('lounge') || key.includes('cache')) {
              localStorage.removeItem(key);
            }
          });
          
          const sessionKeys = Object.keys(sessionStorage);
          sessionKeys.forEach(key => {
            if (key.includes('lounge') || key.includes('cache')) {
              sessionStorage.removeItem(key);
            }
          });
          console.log('💥 모든 라운지 관련 캐시 완전 무효화 완료');
        }
        
        // 2. 즉시 새로고침 (딜레이 없음)
        loadPosts();
        
        // 3. 1초 후 한번 더 새로고침 (확실한 동기화)
        setTimeout(() => {
          console.log('🔄 글 작성 후 추가 새로고침 (확실한 동기화)');
          loadPosts();
        }, 1000);
      }
      // 글 삭제 후 돌아온 경우 - 더 긴 딜레이와 강제 새로고침
      else if (location.state?.deleted) {
        console.log('🗑️ 글 삭제 후 돌아옴 - 강제 새로고침 with longer delay');
        const deletedPostId = location.state.deletedPostId;
        
        // 삭제된 글을 즉시 목록에서 제거
        if (deletedPostId) {
          setLoungePosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
          console.log(`🗑️ 삭제된 글 ${deletedPostId}을 목록에서 즉시 제거`);
        }
        
        // 1초 후 전체 목록 새로고침 (확실한 동기화)
        setTimeout(() => {
          console.log('🔄 삭제 후 전체 목록 강제 새로고침');
          loadPosts();
        }, 1000);
      } 
      else {
        loadPosts();
      }
    }
  }, [location.pathname, location.state?.timestamp, location.state?.refresh, location.state?.deleted]);

  // 페이지가 포커스될 때마다 데이터 새로고침 (글 작성 후 돌아올 때)
  useEffect(() => {
    const handleFocus = () => {
      console.log('페이지 포커스됨 - 데이터 새로고침');
      setTimeout(() => loadPosts(), 100); // 약간의 딜레이 추가
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('페이지 가시성 변경됨 - 데이터 새로고침');
        setTimeout(() => loadPosts(), 100); // 약간의 딜레이 추가
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);


  const filteredAndSortedPosts = useMemo(() => {
    console.log('🔍 필터링 시작:', {
      전체포스트: loungePosts.length,
      활성탭: activeTab,
      타입필터: typeFilter,
      선택된태그: selectedTags.length
    });
    
    let filtered = loungePosts;

    // 탭 필터링 (인기글은 이미 서버에서 필터링됨)
    if (activeTab === 'popular') {
      filtered = filtered.filter(post => post.is_excellent);
      console.log('👍 인기글 필터 후:', filtered.length, '개');
    }

    // 타입 필터링
    if (typeFilter !== 'all') {
      filtered = filtered.filter(post => post.type === typeFilter);
      console.log('📝 타입 필터 후:', filtered.length, '개');
    }

    // 태그 필터링  
    if (selectedTags.length > 0) {
      filtered = filtered.filter(post =>
        selectedTags.some(tagId => post.tags.includes(tagId))
      );
      console.log('🏷️ 태그 필터 후:', filtered.length, '개');
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      // 인기순은 설정된 기준에 따라 정렬
      let scoreA: number, scoreB: number;
      if (popularitySort === 'likes') {
        scoreA = a.like_count * 2 + a.comment_count;
        scoreB = b.like_count * 2 + b.comment_count;
      } else {
        scoreA = a.scrap_count * 2 + a.comment_count;
        scoreB = b.scrap_count * 2 + b.comment_count;
      }
      return scoreB - scoreA;
    });

    console.log('✅ 최종 결과:', sorted.length, '개');
    return sorted;
  }, [loungePosts, typeFilter, selectedTags, sortBy, popularitySort, activeTab]); // loungePosts 의존성 추가!


  const handleTagRemove = (tagId: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagId));
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
    setTypeFilter('all');
  };

  const handleWriteClick = () => {
    if (!user) {
      toast({
        title: "로그인이 필요해요",
        description: "로그인한 사용자만 글을 쓸 수 있어요",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    // 로그인 상태면 글쓰기 페이지로 이동 (Link 컴포넌트가 처리)
  };

  const getTypeFilterText = (type: TypeFilter) => {
    switch (type) {
      case 'question': return '질문/Q&A';
      case 'experience': return '경험담/사연 공유';
      case 'info': return '정보·팁 공유';
      case 'free': return '자유글/잡담';
      case 'news': return '뉴스에 한마디';
      case 'advice': return '같이 고민해요';
      case 'recommend': return '추천해주세요';
      case 'anonymous': return '익명 토크';
      default: return '전체';
    }
  };

  return (
    <>
      <SEOHead
        title="Lounge - HR 담당자들의 소통공간"
        description="인사담당자들이 고민을 나누고, 경험을 공유하며, 실무 팁을 교환하는 커뮤니티 공간. 질문하고 답하며 함께 성장해요."
        keywords="HR 커뮤니티, 인사담당자 모임, 질문답변, 경험공유, 실무팁, 채용고민, 인사업무, 직장생활, Q&A"
        url="/lounge"
      />
      <Container maxW="1200px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <VStack spacing={6} align="center" py={12}>
          <VStack spacing={4} align="center" textAlign="center">
            <Heading as="h1" size="2xl" color={colorMode === 'dark' ? 'gray.50' : 'gray.900'}>
              Lounge
            </Heading>
            <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} fontSize="xl" maxW="600px">
              인사담당자들의 생생한 경험과 노하우를 나누는 공간
            </Text>
            <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} fontSize="md" maxW="700px" lineHeight="1.6">
              실제 업무에서 경험한 사례나 노하우를 자유롭게 공유해요. 
              의견을 나누고 서로 도움을 주고받으며 더 나은 인사 업무를 만들어가요.
            </Text>
          </VStack>
          
          <HStack justify="flex-end" w="100%">
            <Button 
              as={user ? Link : undefined}
              to={user ? "/lounge/new" : undefined}
              leftIcon={<AddIcon />}
              size="lg"
              px={8}
              onClick={!user ? handleWriteClick : undefined}
            >
              글쓰기
            </Button>
          </HStack>
        </VStack>

        {/* 탭 메뉴 */}
        <HStack spacing={0} borderBottom="1px solid" borderColor={colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'}>
          <Button
            variant="ghost"
            size="lg"
            fontSize="lg"
            fontWeight="500"
            color={activeTab === 'all' ? 'brand.500' : (colorMode === 'dark' ? '#9e9ea4' : '#626269')}
            borderBottom={activeTab === 'all' ? '2px solid' : 'none'}
            borderColor="brand.500"
            borderRadius="none"
            pb={3}
            onClick={() => setActiveTab('all')}
            _hover={{
              bg: 'transparent',
              color: activeTab === 'all' ? 'brand.500' : (colorMode === 'dark' ? '#e4e4e5' : '#2c2c35')
            }}
          >
            전체글
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            fontSize="lg"
            fontWeight="500"
            color={activeTab === 'popular' ? 'brand.500' : (colorMode === 'dark' ? '#9e9ea4' : '#626269')}
            borderBottom={activeTab === 'popular' ? '2px solid' : 'none'}
            borderColor="brand.500"
            borderRadius="none"
            pb={3}
            onClick={() => setActiveTab('popular')}
            _hover={{
              bg: 'transparent',
              color: activeTab === 'popular' ? 'brand.500' : (colorMode === 'dark' ? '#e4e4e5' : '#2c2c35')
            }}
          >
            인기글
          </Button>
        </HStack>

        {/* 필터 및 태그 카드 */}
        <Box
          bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
          border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
          borderRadius="xl"
          p={6}
          shadow="sm"
        >
          <VStack spacing={5} align="stretch">
            
            {/* 정렬 및 버튼 */}
            <HStack justify="space-between" wrap="wrap" gap={4}>
              <HStack spacing={4} flex={1} wrap="wrap">
                <Text fontSize="sm" fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'} minW="fit-content">
                  유형:
                </Text>
                <Box width="150px">
                  <CustomSelect
                    value={typeFilter}
                    onChange={(value) => setTypeFilter(value as TypeFilter)}
                    options={[
                      { value: 'all', label: '전체' },
                      { value: 'question', label: '질문/Q&A' },
                      { value: 'experience', label: '경험담/사연 공유' },
                      { value: 'info', label: '정보·팁 공유' },
                      { value: 'free', label: '자유글/잡담' },
                      { value: 'news', label: '뉴스에 한마디' },
                      { value: 'advice', label: '같이 고민해요' },
                      { value: 'recommend', label: '추천해주세요' },
                      { value: 'anonymous', label: '익명 토크' }
                    ]}
                    size="sm"
                  />
                </Box>
                
                <Text fontSize="sm" fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'} minW="fit-content">
                  정렬:
                </Text>
                <CustomSelect
                  value={sortBy}
                  onChange={(value) => setSortBy(value as SortOption)}
                  options={[
                    { value: 'latest', label: '최신순' },
                    { value: 'popular', label: '인기순' }
                  ]}
                  size="sm"
                  maxW="120px"
                />
                
                {sortBy === 'popular' && (
                  <>
                    <Text fontSize="sm" fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'} minW="fit-content">
                      기준:
                    </Text>
                    <CustomSelect
                      value={popularitySort}
                      onChange={(value) => setPopularitySort(value as PopularitySort)}
                      options={[
                        { value: 'likes', label: '좋아요순' },
                        { value: 'scraps', label: '북마크순' }
                      ]}
                      size="sm"
                      maxW="120px"
                    />
                  </>
                )}
              </HStack>

              <HStack spacing={3}>
                {/* 뷰 모드 토글 */}
                <HStack spacing={1} bg={colorMode === 'dark' ? '#2c2c35' : '#f8f9fa'} borderRadius="md" p={1}>
                  <Tooltip label="카드 뷰">
                    <IconButton
                      aria-label="Card view"
                      icon={<ViewIcon />}
                      size="sm"
                      variant={viewMode === 'card' ? 'solid' : 'ghost'}
                      colorScheme={viewMode === 'card' ? 'brand' : 'gray'}
                      onClick={() => setViewMode('card')}
                    />
                  </Tooltip>
                  <Tooltip label="리스트 뷰">
                    <IconButton
                      aria-label="List view"
                      icon={<HamburgerIcon />}
                      size="sm"
                      variant={viewMode === 'list' ? 'solid' : 'ghost'}
                      colorScheme={viewMode === 'list' ? 'brand' : 'gray'}
                      onClick={() => setViewMode('list')}
                    />
                  </Tooltip>
                </HStack>
                
                {(selectedTags.length > 0 || typeFilter !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllFilters}
                    color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                    _hover={{
                      bg: colorMode === 'dark' ? '#4d4d59' : '#e4e4e5',
                      color: 'brand.500'
                    }}
                  >
                    전체 해제
                  </Button>
                )}
              </HStack>
            </HStack>

            {/* 선택된 필터 */}
            {(selectedTags.length > 0 || typeFilter !== 'all') && (
              <Box
                style={{
                  opacity: (selectedTags.length > 0 || typeFilter !== 'all') ? 1 : 0,
                  transform: (selectedTags.length > 0 || typeFilter !== 'all') ? 'translateY(0)' : 'translateY(-20px)',
                  transition: 'all 0.3s ease-out'
                }}
              >
                <VStack spacing={3} align="flex-start">
                  <Text fontSize="sm" fontWeight="600" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                    적용된 필터
                  </Text>
                  <Wrap spacing={2}>
                    {typeFilter !== 'all' && (
                      <WrapItem>
                        <Badge 
                          variant="solid" 
                          colorScheme="blue" 
                          size="md"
                          style={{
                            animation: 'fadeInUp 0.4s ease-out forwards'
                          }}
                        >
                          {getTypeFilterText(typeFilter)}
                        </Badge>
                      </WrapItem>
                    )}
                    {selectedTags.map((tagId, index) => {
                      const tag = getTagById(tagId);
                      return tag ? (
                        <WrapItem key={tagId}>
                          <Tag 
                            size="md" 
                            variant="solid" 
                            colorScheme="brand"
                            style={{
                              animationDelay: `${(typeFilter !== 'all' ? 1 : 0) + index * 0.1}s`,
                              animation: 'fadeInUp 0.4s ease-out forwards'
                            }}
                          >
                            <TagLabel>{tag.name}</TagLabel>
                            <TagCloseButton onClick={() => handleTagRemove(tagId)} />
                          </Tag>
                        </WrapItem>
                      ) : null;
                    })}
                  </Wrap>
                </VStack>
              </Box>
            )}

            {/* 태그 선택 */}
            <VStack spacing={3} align="flex-start">
              <Text fontSize="sm" fontWeight="600" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                태그 필터
              </Text>
              <TagSelector
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                maxTags={20}
                placeholder="태그를 선택해서 필터링하세요"
              />
            </VStack>
          </VStack>
        </Box>

        {/* 콘텐츠 영역 */}
        {isLoading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            <CardSkeletonGrid count={6} />
          </SimpleGrid>
        ) : filteredAndSortedPosts.length > 0 ? (
          <>
            <HStack justify="space-between" align="center">
              <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                총 {filteredAndSortedPosts.length}개의 글
              </Text>
              <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                {viewMode === 'card' ? '카드 뷰' : '리스트 뷰'}
              </Text>
            </HStack>
            
            {viewMode === 'card' ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {filteredAndSortedPosts.map((post) => (
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
              <Box
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                borderRadius="xl"
                overflow="hidden"
              >
                <Table variant="simple" size="md">
                  <Thead bg={colorMode === 'dark' ? '#2c2c35' : '#f8f9fa'}>
                    <Tr>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} width="45%">제목</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>작성자</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>유형</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} textAlign="center">좋아요</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} textAlign="center">댓글</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} textAlign="center">북마크</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>작성일</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredAndSortedPosts.map((post) => {
                      const getTypeBadge = (type: string) => {
                        const typeMap: Record<string, { label: string; colorScheme: string }> = {
                          'question': { label: '질문/Q&A', colorScheme: 'blue' },
                          'experience': { label: '경험담/사연 공유', colorScheme: 'green' },
                          'info': { label: '정보·팁 공유', colorScheme: 'purple' },
                          'free': { label: '자유글/잡담', colorScheme: 'gray' },
                          'news': { label: '뉴스에 한마디', colorScheme: 'orange' },
                          'advice': { label: '같이 고민해요', colorScheme: 'teal' },
                          'recommend': { label: '추천해주세요', colorScheme: 'pink' },
                          'anonymous': { label: '익명 토크', colorScheme: 'red' },
                        };
                        const config = typeMap[type] || { label: type, colorScheme: 'gray' };
                        return <Badge colorScheme={config.colorScheme} size="sm">{config.label}</Badge>;
                      };

                      return (
                        <Tr 
                          key={post.id}
                          _hover={{ 
                            bg: colorMode === 'dark' ? '#4d4d59' : '#f8f9fa',
                            cursor: 'pointer'
                          }}
                          onClick={() => navigate(`/lounge/${post.id}`)}
                        >
                          <Td>
                            <VStack spacing={1} align="start">
                              <HStack>
                                <Text 
                                  fontWeight="500" 
                                  color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                                  noOfLines={1}
                                  maxW="300px"
                                  wordBreak="break-word"
                                  overflowWrap="break-word"
                                >
                                  {post.title}
                                </Text>
                                {post.is_excellent && (
                                  <Badge colorScheme="yellow" size="sm">우수</Badge>
                                )}
                              </HStack>
                              {post.summary && (
                                <Text 
                                  fontSize="xs" 
                                  color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                                  noOfLines={1}
                                  maxW="350px"
                                >
                                  {post.summary}
                                </Text>
                              )}
                            </VStack>
                          </Td>
                          <Td>
                            <HStack>
                              <Avatar size="xs" name={post.author_name} />
                              <VStack spacing={0} align="start">
                                <Text fontSize="sm" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                                  {post.author_name}
                                </Text>
                                {post.author_id && (
                                  <AuthorLevelBadge authorId={post.author_id} />
                                )}
                              </VStack>
                            </HStack>
                          </Td>
                          <Td>{getTypeBadge(post.type)}</Td>
                          <Td textAlign="center">
                            <Text 
                              fontSize="sm" 
                              fontWeight={post.like_count >= 50 ? "600" : "normal"}
                              color={post.like_count >= 50 ? "orange.500" : (colorMode === 'dark' ? '#9e9ea4' : '#626269')}
                            >
                              {post.like_count}
                            </Text>
                          </Td>
                          <Td textAlign="center">
                            <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {post.comment_count}
                            </Text>
                          </Td>
                          <Td textAlign="center">
                            <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {post.scrapCount}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {dayjs(post.created_at).format('MM.DD HH:mm')}
                            </Text>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
            )}
          </>
        ) : (
          <EmptyState
            title={
              selectedTags.length > 0 || typeFilter !== 'all' 
                ? "검색 결과가 없어요" 
                : activeTab === 'popular'
                ? "아직 인기글로 올라온 글이 없어요"
                : "첫 번째 이야기를 들려주세요"
            }
            description={
              selectedTags.length > 0 || typeFilter !== 'all'
                ? "다른 조건으로 검색해보거나 필터를 해제해보세요"
                : activeTab === 'popular'
                ? "좋아요를 50개 이상 받아야 인기글이 될 수 있어요."
                : <Text color={colorMode === 'dark' ? '#c3c3c6' : '#626269'}>실전 사례일수록 더 좋아요. 민감정보는 가려주세요.</Text>
            }
            actionText={
              selectedTags.length > 0 || typeFilter !== 'all' 
                ? "필터 해제" 
                : "글 쓰러 가기"
            }
            onAction={
              selectedTags.length > 0 || typeFilter !== 'all' 
                ? clearAllFilters 
                : () => navigate('/lounge/new')
            }
          />
        )}

        {/* 보상 모달 */}
        {rewardPost && (
          <RewardModal
            isOpen={isRewardOpen}
            onClose={onRewardClose}
            postTitle={rewardPost.title}
            likeCount={rewardPost.likeCount}
            rewardPoints={500}
          />
        )}
      </VStack>
      </Container>
    </>
  );
};

export default LoungeList;