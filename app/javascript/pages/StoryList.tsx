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
  useColorMode,
  useToast,
} from '@chakra-ui/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AddIcon } from '@chakra-ui/icons';
import Card from '../components/Card';
import CustomSelect from '../components/CustomSelect';
import EmptyState from '../components/EmptyState';
import { CardSkeletonGrid } from '../components/LoadingSpinner';
import SEOHead from '../components/SEOHead';
import { sessionStoryService, sessionUserService, initializeData } from '../services/sessionDataService';
import { useAuth } from '../contexts/AuthContext';
import { getAllTags, getTagById } from '../data/tags';
import TagSelector from '../components/TagSelector';

type SortOption = 'latest' | 'popular';

const StoryList: React.FC = () => {
  const { colorMode } = useColorMode();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stories, setStories] = useState<any[]>([]);

  // 데이터 로드 함수
  const loadStories = () => {
    initializeData();
    const allStories = sessionStoryService.getAll();
    console.log('스토리 데이터 로드:', allStories.length, '개');
    setStories([...allStories]); // 새로운 배열 객체 생성
  };

  // 세션 데이터 로드
  useEffect(() => {
    loadStories();
  }, []);

  // location 변경될 때마다 데이터 새로고침 (스토리 작성 후 돌아올 때)
  useEffect(() => {
    console.log('스토리 페이지 라우팅 변경됨:', location.pathname, location.state);
    if (location.pathname === '/story') {
      console.log('스토리 페이지 진입 - 새로고침 시작');
      loadStories();
    }
  }, [location.pathname, location.state?.timestamp]);


  const filteredAndSortedStories = useMemo(() => {
    let filtered = stories;

    // 태그 필터링
    if (selectedTags.length > 0) {
      filtered = stories.filter(story =>
        selectedTags.some(tagId => story.tags.includes(tagId))
      );
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // 인기순은 조회수와 북마크 수를 기준으로
      const scoreA = (a.viewCount || 0) + (a.scrapCount || 0) * 2;
      const scoreB = (b.viewCount || 0) + (b.scrapCount || 0) * 2;
      return scoreB - scoreA;
    });

    return sorted;
  }, [stories, selectedTags, sortBy]); // stories 의존성 추가


  const handleTagRemove = (tagId: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagId));
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  const handleWriteClick = () => {
    if (!isAdmin) {
      toast({
        title: "관리자 권한이 필요합니다",
        description: "스토리는 관리자만 작성할 수 있습니다",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    // 관리자면 글쓰기 페이지로 이동 (Link 컴포넌트가 처리)
  };

  return (
    <>
      <SEOHead
        title="Story - HR 전문가들의 실무 이야기"
        description="인사담당자들의 실무 경험과 노하우를 담은 전문 아티클. 채용, 온보딩, 성과평가, 조직문화 등 HR업무의 모든 것을 전문가들과 함께 나누세요."
        keywords="HR 전문, 인사관리, 실무경험, 채용노하우, 온보딩, 성과평가, 조직문화, 인사담당자, HR팁"
        url="/story"
      />
      <Container maxW="1200px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <VStack spacing={6} align="center" py={12}>
          <VStack spacing={4} align="center" textAlign="center">
            <Heading as="h1" size="2xl" color={colorMode === 'dark' ? 'gray.50' : 'gray.900'}>
              Story
            </Heading>
            <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} fontSize="xl" maxW="600px">
              전문가가 엄선하고 검수한 인사 콘텐츠
            </Text>
            <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} fontSize="md" maxW="700px" lineHeight="1.6">
              실무에 바로 적용할 수 있는 전문 지식을 쉽게 이해할 수 있도록 정리해요. 
              원하는 정보를 북마크하고 저장하여 언제든지 다시 찾아볼 수 있어요.
            </Text>
          </VStack>
          
          {/* 관리자용 글쓰기 버튼 */}
          {isAdmin && (
            <HStack justify="flex-end" w="100%">
              <Button 
                as={Link}
                to="/story/new"
                leftIcon={<AddIcon />}
                size="lg"
                px={8}
                onClick={handleWriteClick}
              >
                스토리 작성
              </Button>
            </HStack>
          )}
        </VStack>

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
              </HStack>

              {selectedTags.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllTags}
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

            {/* 선택된 태그 */}
            {selectedTags.length > 0 && (
              <Box
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                as="div"
                style={{
                  opacity: selectedTags.length > 0 ? 1 : 0,
                  transform: selectedTags.length > 0 ? 'translateY(0)' : 'translateY(-20px)',
                  transition: 'all 0.3s ease-out'
                }}
              >
                <VStack spacing={3} align="flex-start">
                  <Text fontSize="sm" fontWeight="600" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                    선택된 태그
                  </Text>
                  <Wrap spacing={2}>
                    {selectedTags.map((tagId, index) => {
                      const tag = getTagById(tagId);
                      return tag ? (
                        <WrapItem key={tagId}>
                          <Tag 
                            size="md" 
                            variant="solid" 
                            colorScheme="brand"
                            style={{
                              animationDelay: `${index * 0.1}s`,
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
        ) : filteredAndSortedStories.length > 0 ? (
          <>
            <HStack justify="space-between" align="center">
              <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                총 {filteredAndSortedStories.length}개의 스토리
              </Text>
            </HStack>
            
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredAndSortedStories.map((story) => (
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
          </>
        ) : (
          <EmptyState
            title={selectedTags.length > 0 ? "검색 결과가 없어요" : "아직 게시된 이야기가 없어요"}
            description={
              selectedTags.length > 0
                ? "다른 태그로 검색해보거나 태그를 해제해보세요"
                : "곧 유익한 콘텐츠로 찾아뵐게요!"
            }
            actionText={selectedTags.length > 0 ? "태그 해제" : undefined}
            onAction={selectedTags.length > 0 ? clearAllTags : undefined}
          />
        )}
      </VStack>
      </Container>
    </>
  );
};

export default StoryList;