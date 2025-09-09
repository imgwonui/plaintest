import React, { useState, useMemo } from 'react';
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
} from '@chakra-ui/react';
import Card from '../components/Card';
import CustomSelect from '../components/CustomSelect';
import EmptyState from '../components/EmptyState';
import { CardSkeletonGrid } from '../components/LoadingSpinner';
import { stories } from '../mocks/stories';
import { getPopularTags } from '../mocks/tags';

type SortOption = 'latest' | 'popular';

const StoryList: React.FC = () => {
  const { colorMode } = useColorMode();
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const popularTags = getPopularTags(20).filter(tag => 
    stories.some(story => story.tags.includes(tag.name))
  );

  const filteredAndSortedStories = useMemo(() => {
    let filtered = stories;

    // 태그 필터링
    if (selectedTags.length > 0) {
      filtered = stories.filter(story =>
        selectedTags.some(tag => story.tags.includes(tag))
      );
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // 인기순은 읽기 시간과 태그 수를 기준으로 임시 구현
      const scoreA = a.readTime + a.tags.length * 2;
      const scoreB = b.readTime + b.tags.length * 2;
      return scoreB - scoreA;
    });

    return sorted;
  }, [selectedTags, sortBy]);

  const handleTagSelect = (tagName: string) => {
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleTagRemove = (tagName: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagName));
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  };

  return (
    <Container maxW="1200px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <VStack spacing={6} align="center" py={12}>
          <VStack spacing={4} align="center" textAlign="center">
            <Heading as="h1" size="2xl" color={colorMode === 'dark' ? 'gray.50' : 'gray.900'}>
              Story
            </Heading>
            <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.600'} fontSize="xl" maxW="600px">
              전문가가 엄선하고 검수한 인사 관련 콘텐츠
            </Text>
            <Text color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} fontSize="md" maxW="700px" lineHeight="1.6">
              실무에 바로 적용할 수 있는 전문 지식을 쉽게 이해할 수 있도록 정리해요. 
              원하는 정보를 스크랩하고 저장하여 언제든지 다시 찾아볼 수 있어요.
            </Text>
          </VStack>
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
                    {selectedTags.map((tag, index) => (
                      <WrapItem key={tag}>
                        <Tag 
                          size="md" 
                          variant="solid" 
                          colorScheme="brand"
                          style={{
                            animationDelay: `${index * 0.1}s`,
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
  );
};

export default StoryList;