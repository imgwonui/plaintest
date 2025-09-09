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
import { Link } from 'react-router-dom';
import { AddIcon, ViewIcon, HamburgerIcon } from '@chakra-ui/icons';
import Card from '../components/Card';
import CustomSelect from '../components/CustomSelect';
import EmptyState from '../components/EmptyState';
import { CardSkeletonGrid } from '../components/LoadingSpinner';
import RewardModal from '../components/RewardModal';
import { useAuth } from '../contexts/AuthContext';
import { loungePosts, LoungePost } from '../mocks/lounge';
import { getPopularTags } from '../mocks/tags';
import dayjs from 'dayjs';

type SortOption = 'latest' | 'popular';
type PopularitySort = 'likes' | 'scraps';
type TypeFilter = 'all' | 'question' | 'experience' | 'help';
type ViewMode = 'card' | 'list';

const LoungeList: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen: isRewardOpen, onOpen: onRewardOpen, onClose: onRewardClose } = useDisclosure();
  
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [popularitySort, setPopularitySort] = useState<PopularitySort>('likes');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [rewardPost, setRewardPost] = useState<LoungePost | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'popular'>('all');

  // 좋아요 50개 이상인 글 체크
  useEffect(() => {
    const highLikePosts = loungePosts.filter(post => post.likeCount >= 50 && !post.rewardClaimed);
    if (highLikePosts.length > 0) {
      // 실제로는 사용자의 글인지 체크해야 함
      const userPost = highLikePosts[0]; // 임시로 첫 번째 글
      setRewardPost(userPost);
      setTimeout(() => onRewardOpen(), 1000); // 1초 후 모달 표시
    }
  }, [onRewardOpen]);

  const popularTags = getPopularTags(20).filter(tag => 
    loungePosts.some(post => post.tags.includes(tag.name))
  );

  const filteredAndSortedPosts = useMemo(() => {
    let filtered = loungePosts;

    // 탭 필터링 (인기글은 좋아요 50개 이상)
    if (activeTab === 'popular') {
      filtered = filtered.filter(post => post.likeCount >= 50);
    }

    // 타입 필터링
    if (typeFilter !== 'all') {
      filtered = filtered.filter(post => post.type === typeFilter);
    }

    // 태그 필터링
    if (selectedTags.length > 0) {
      filtered = filtered.filter(post =>
        selectedTags.some(tag => post.tags.includes(tag))
      );
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // 인기순은 설정된 기준에 따라 정렬
      let scoreA: number, scoreB: number;
      if (popularitySort === 'likes') {
        scoreA = a.likeCount * 2 + a.commentCount;
        scoreB = b.likeCount * 2 + b.commentCount;
      } else {
        scoreA = a.scrapCount * 2 + a.commentCount;
        scoreB = b.scrapCount * 2 + b.commentCount;
      }
      return scoreB - scoreA;
    });

    return sorted;
  }, [typeFilter, selectedTags, sortBy, popularitySort, activeTab]);

  const handleTagSelect = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleTagRemove = (tagName: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagName));
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
      case 'question': return '물어보고 싶어요';
      case 'experience': return '이런 일이 있었어요';
      case 'help': return '도움이 될 글이에요';
      default: return '전체';
    }
  };

  return (
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
            전체글 보기
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
            인기 글 모아보기
            <Badge 
              ml={2} 
              colorScheme="red" 
              variant="solid" 
              fontSize="xs"
            >
              50+
            </Badge>
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
            {/* 탭 설명 */}
            {activeTab === 'popular' && (
              <Box 
                bg={colorMode === 'dark' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(220, 38, 38, 0.05)'} 
                border="1px solid" 
                borderColor="red.200" 
                borderRadius="lg" 
                p={3}
              >
                <HStack>
                  <Badge colorScheme="red" variant="solid">HOT</Badge>
                  <Text fontSize="sm" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                    좋아요 50개 이상을 받은 인기 글들만 모아서 보여드려요!
                  </Text>
                </HStack>
              </Box>
            )}
            
            {/* 정렬 및 버튼 */}
            <HStack justify="space-between" wrap="wrap" gap={4}>
              <HStack spacing={4} flex={1} wrap="wrap">
                <Text fontSize="sm" fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'} minW="fit-content">
                  유형:
                </Text>
                <CustomSelect
                  value={typeFilter}
                  onChange={(value) => setTypeFilter(value as TypeFilter)}
                  options={[
                    { value: 'all', label: '전체' },
                    { value: 'question', label: '물어보고 싶어요' },
                    { value: 'experience', label: '이런 일이 있었어요' },
                    { value: 'help', label: '도움이 될 글이에요' }
                  ]}
                  size="sm"
                  maxW="160px"
                />
                
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
                        { value: 'scraps', label: '스크랩순' }
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
                    {selectedTags.map((tag, index) => (
                      <WrapItem key={tag}>
                        <Tag 
                          size="md" 
                          variant="solid" 
                          colorScheme="brand"
                          style={{
                            animationDelay: `${(typeFilter !== 'all' ? 1 : 0) + index * 0.1}s`,
                            animation: 'fadeInUp 0.4s ease-out forwards'
                          }}
                        >
                          <TagLabel>{tag}</TagLabel>
                          <TagCloseButton onClick={() => handleTagRemove(tag)} />
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </VStack>
              </Box>
            )}

            {/* 인기 태그 */}
            <VStack spacing={3} align="flex-start">
              <Text fontSize="sm" fontWeight="600" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                인기 태그
              </Text>
              <Wrap spacing={2}>
                {popularTags.map((tag) => (
                  <WrapItem key={tag.id}>
                    <Tag
                      size="sm"
                      variant="outline"
                      cursor="pointer"
                      borderColor={colorMode === 'dark' ? '#626269' : '#9e9ea4'}
                      color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                      _hover={{ 
                        bg: colorMode === 'dark' ? '#4d4d59' : '#e4e4e5',
                        borderColor: 'brand.500',
                        color: 'brand.500',
                        transform: 'translateY(-1px)'
                      }}
                      onClick={() => handleTagSelect(tag.name)}
                      opacity={selectedTags.includes(tag.name) ? 0.5 : 1}
                      transition="all 0.2s ease"
                    >
                      <TagLabel>{tag.name}</TagLabel>
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
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
                    summary={post.summary}
                    tags={post.tags}
                    createdAt={post.createdAt}
                    loungeType={post.type}
                    isExcellent={post.isExcellent}
                    likeCount={post.likeCount}
                    commentCount={post.commentCount}
                    scrapCount={post.scrapCount}
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
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} textAlign="center">스크랩</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>작성일</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredAndSortedPosts.map((post) => {
                      const getTypeBadge = (type: string) => {
                        const typeMap: Record<string, { label: string; colorScheme: string }> = {
                          'question': { label: '질문', colorScheme: 'blue' },
                          'experience': { label: '경험담', colorScheme: 'green' },
                          'info': { label: '정보', colorScheme: 'purple' },
                          'free': { label: '자유', colorScheme: 'gray' },
                          'news': { label: '뉴스', colorScheme: 'orange' },
                          'advice': { label: '고민', colorScheme: 'teal' },
                          'recommend': { label: '추천', colorScheme: 'pink' },
                          'anonymous': { label: '익명', colorScheme: 'red' },
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
                          onClick={() => window.location.href = `/lounge/${post.id}`}
                        >
                          <Td>
                            <VStack spacing={1} align="start">
                              <HStack>
                                <Text 
                                  fontWeight="500" 
                                  color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                                  noOfLines={1}
                                  maxW="300px"
                                >
                                  {post.title}
                                </Text>
                                {post.isExcellent && (
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
                              <Avatar size="xs" name={post.author} />
                              <Text fontSize="sm" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                                {post.author}
                              </Text>
                            </HStack>
                          </Td>
                          <Td>{getTypeBadge(post.type)}</Td>
                          <Td textAlign="center">
                            <Text 
                              fontSize="sm" 
                              fontWeight={post.likeCount >= 50 ? "600" : "normal"}
                              color={post.likeCount >= 50 ? "orange.500" : (colorMode === 'dark' ? '#9e9ea4' : '#626269')}
                            >
                              {post.likeCount}
                            </Text>
                          </Td>
                          <Td textAlign="center">
                            <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {post.commentCount}
                            </Text>
                          </Td>
                          <Td textAlign="center">
                            <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {post.scrapCount}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {dayjs(post.createdAt).format('MM.DD')}
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
                : "첫 번째 이야기를 들려주세요"
            }
            description={
              selectedTags.length > 0 || typeFilter !== 'all'
                ? "다른 조건으로 검색해보거나 필터를 해제해보세요"
                : "실전 사례일수록 더 좋아요. 민감정보는 가려주세요."
            }
            actionText={
              selectedTags.length > 0 || typeFilter !== 'all' 
                ? "필터 해제" 
                : "글 쓰러 가기"
            }
            onAction={
              selectedTags.length > 0 || typeFilter !== 'all' 
                ? clearAllFilters 
                : () => window.location.href = '/lounge/new'
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
  );
};

export default LoungeList;