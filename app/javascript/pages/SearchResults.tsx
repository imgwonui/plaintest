import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  SimpleGrid,
  Heading,
  useColorMode,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { storyService, loungeService, userService, searchService } from '../services/supabaseDataService';

const SearchResults: React.FC = () => {
  const { colorMode } = useColorMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [tabIndex, setTabIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<any>({ stories: [], loungePosts: [], total: 0 });
  const [hotKeywords, setHotKeywords] = useState<any[]>([]);
  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 검색 실행 함수
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults({ stories: [], loungePosts: [], total: 0 });
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔍 Supabase 검색 실행:', searchQuery);
      
      const results = await searchService.search(searchQuery.trim());
      console.log('✅ 검색 결과:', results);
      
      setSearchResults({
        stories: results.stories || [],
        loungePosts: results.loungePosts || [],
        total: results.totalResults || 0
      });
      
    } catch (error) {
      console.error('❌ 검색 실패:', error);
      setSearchResults({ stories: [], loungePosts: [], total: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 데이터 새로고침 함수  
  const refreshSearchData = async () => {
    try {
      const [topKeywords, recentKeywords] = await Promise.all([
        searchService.getTopKeywords(5),
        searchService.getRecentKeywords(8)
      ]);
      
      setHotKeywords(topKeywords.map((item, index) => ({
        term: item.keyword,
        rank: index + 1,
        count: item.search_count
      })));
      
      setRecentKeywords(recentKeywords.map(item => item.keyword));
      
    } catch (error) {
      console.error('❌ 검색 데이터 로드 실패:', error);
      setHotKeywords([]);
      setRecentKeywords([]);
    }
  };
  
  const handleSearch = (newQuery: string) => {
    if (newQuery.trim()) {
      setSearchParams({ q: newQuery.trim() });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchInput);
    }
  };

  // 초기 로드시 검색 데이터 로드
  useEffect(() => {
    refreshSearchData();
  }, []);

  // URL 파라미터 변경시 검색 실행 (중복 방지를 위해 한 번만)
  useEffect(() => {
    setSearchInput(query);
    if (query.trim()) {
      console.log('🔄 URL 파라미터 변경으로 검색 실행:', query);
      performSearch(query);
    } else {
      setSearchResults({ stories: [], loungePosts: [], total: 0 });
    }
  }, [query]);

  return (
    <Container maxW="1200px" py={{ base: 6, md: 8 }}>
      <VStack spacing={8} align="stretch">
        {/* 검색 헤더 */}
        <VStack spacing={4} align="stretch">
          <Heading as="h1" size="xl" color={colorMode === 'dark' ? 'gray.50' : 'gray.900'}>
            검색 결과
          </Heading>
          
          {/* 검색 입력 */}
          <HStack spacing={3} maxW="600px">
            <InputGroup size="lg">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="키워드로 검색해보세요"
                bg={colorMode === 'dark' ? 'gray.800' : 'white'}
                border="2px"
                borderColor={colorMode === 'dark' ? 'brand.400' : 'brand.200'}
                _focus={{
                  borderColor: 'brand.500',
                  shadow: '0 0 0 1px var(--chakra-colors-brand-500)'
                }}
                _hover={{
                  borderColor: colorMode === 'dark' ? 'brand.300' : 'brand.300'
                }}
              />
            </InputGroup>
            <Button 
              colorScheme="brand" 
              size="lg"
              onClick={() => handleSearch(searchInput)}
            >
              검색
            </Button>
          </HStack>

          {query && (
            <HStack spacing={2} flexWrap="wrap">
              <Text color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                "{query}"에 대한 검색 결과
              </Text>
              <Badge colorScheme="brand" variant="subtle">
                총 {searchResults.total}개
              </Badge>
            </HStack>
          )}
        </VStack>

        <Divider />

        {/* 검색 결과 탭 */}
        {query && (
          <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="brand">
            <TabList>
              <Tab>
                전체 ({searchResults.total})
              </Tab>
              <Tab>
                Story ({searchResults.stories.length})
              </Tab>
              <Tab>
                Lounge ({searchResults.loungePosts.length})
              </Tab>
            </TabList>

            <TabPanels>
              {/* 전체 탭 */}
              <TabPanel px={0}>
                <VStack spacing={8} align="stretch">
                  {isLoading ? (
                    <Box textAlign="center" py={8}>
                      <Text>검색 중...</Text>
                    </Box>
                  ) : searchResults.total === 0 ? (
                    <EmptyState
                      title="검색 결과가 없어요"
                      description="다른 키워드로 검색해보시거나 철자를 확인해주세요."
                    />
                  ) : (
                    <>
                      {/* Story 결과 */}
                      {searchResults.stories.length > 0 && (
                        <VStack spacing={4} align="stretch">
                          <HStack justify="space-between">
                            <Heading as="h2" size="md" color={colorMode === 'dark' ? 'gray.100' : 'gray.900'}>
                              Story 결과 ({searchResults.stories.length}개)
                            </Heading>
                            {searchResults.stories.length > 6 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setTabIndex(1)}
                              >
                                더 보기 →
                              </Button>
                            )}
                          </HStack>
                          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {searchResults.stories.slice(0, 6).map((story) => (
                              <Card
                                key={story.id}
                                type="story"
                                id={story.id}
                                title={story.title}
                                summary={story.summary}
                                imageUrl={story.image_url}
                                tags={story.tags}
                                createdAt={story.created_at}
                                readTime={story.read_time}
                                author={story.author_name}
                                authorId={story.author_id}
                                authorVerified={story.author_verified}
                              />
                            ))}
                          </SimpleGrid>
                        </VStack>
                      )}

                      {/* Lounge 결과 */}
                      {searchResults.loungePosts.length > 0 && (
                        <VStack spacing={4} align="stretch">
                          <HStack justify="space-between">
                            <Heading as="h2" size="md" color={colorMode === 'dark' ? 'gray.100' : 'gray.900'}>
                              Lounge 결과 ({searchResults.loungePosts.length}개)
                            </Heading>
                            {searchResults.loungePosts.length > 6 && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setTabIndex(2)}
                              >
                                더 보기 →
                              </Button>
                            )}
                          </HStack>
                          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                            {searchResults.loungePosts.slice(0, 6).map((post) => (
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
                                authorVerified={post.author_verified}
                              />
                            ))}
                          </SimpleGrid>
                        </VStack>
                      )}
                    </>
                  )}
                </VStack>
              </TabPanel>

              {/* Story 탭 */}
              <TabPanel px={0}>
                {isLoading ? (
                  <Box textAlign="center" py={8}>
                    <Text>검색 중...</Text>
                  </Box>
                ) : searchResults.stories.length === 0 ? (
                  <EmptyState
                    title="Story 검색 결과가 없어요"
                    description="다른 키워드로 검색해보세요."
                  />
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {searchResults.stories.map((story) => (
                      <Card
                        key={story.id}
                        type="story"
                        id={story.id}
                        title={story.title}
                        summary={story.summary}
                        imageUrl={story.image_url}
                        tags={story.tags}
                        createdAt={story.created_at}
                        readTime={story.read_time}
                        author={story.author_name}
                        authorId={story.author_id}
                        authorVerified={story.author_verified}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </TabPanel>

              {/* Lounge 탭 */}
              <TabPanel px={0}>
                {isLoading ? (
                  <Box textAlign="center" py={8}>
                    <Text>검색 중...</Text>
                  </Box>
                ) : searchResults.loungePosts.length === 0 ? (
                  <EmptyState
                    title="Lounge 검색 결과가 없어요"
                    description="다른 키워드로 검색해보세요."
                  />
                ) : (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    {searchResults.loungePosts.map((post) => (
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
                        authorVerified={post.author_verified}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}

        {/* 검색어가 없을 때 */}
        {!query && (
          <VStack spacing={8} align="stretch">
            {/* 최근 핫한 키워드 */}
            {hotKeywords.length > 0 && (
              <Box>
                <Heading as="h2" size="md" mb={4} color={colorMode === 'dark' ? 'gray.100' : 'gray.900'}>
                  🔥 최근 핫한 키워드 Top 5
                </Heading>
                <VStack spacing={3} align="stretch">
                  {hotKeywords.map((item, index) => (
                    <Flex
                      key={item.term}
                      align="center"
                      justify="space-between"
                      p={4}
                      borderRadius="lg"
                      bg={colorMode === 'dark' ? 'gray.800' : 'brand.50'}
                      border="1px"
                      borderColor={colorMode === 'dark' ? 'gray.700' : 'brand.100'}
                      _hover={{
                        bg: colorMode === 'dark' ? 'gray.700' : 'brand.100',
                        borderColor: colorMode === 'dark' ? 'brand.400' : 'brand.200',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        handleSearch(item.term);
                      }}
                      transition="all 0.2s"
                    >
                      <HStack spacing={3}>
                        <Badge
                          colorScheme={index < 3 ? 'brand' : 'gray'}
                          variant="solid"
                          fontSize="sm"
                          minW="28px"
                          textAlign="center"
                        >
                          {item.rank}
                        </Badge>
                        <Text fontWeight="600" fontSize="lg" color={colorMode === 'dark' ? 'gray.100' : 'gray.800'}>
                          {item.term}
                        </Text>
                      </HStack>
                      <Text
                        fontSize="sm"
                        color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}
                        fontWeight="500"
                      >
                        {item.count}회 검색
                      </Text>
                    </Flex>
                  ))}
                </VStack>
              </Box>
            )}
            
            {/* 최근 검색어 */}
            {recentKeywords.length > 0 && (
              <Box>
                <Heading as="h2" size="md" mb={4} color={colorMode === 'dark' ? 'gray.100' : 'gray.900'}>
                  🔍 최근 검색어
                </Heading>
                <Flex flexWrap="wrap" gap={3}>
                  {recentKeywords.map((term, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      colorScheme="gray"
                      fontSize="md"
                      px={4}
                      py={2}
                      borderRadius="full"
                      cursor="pointer"
                      _hover={{
                        bg: colorMode === 'dark' ? 'gray.700' : 'gray.100',
                        borderColor: colorMode === 'dark' ? 'brand.400' : 'brand.300'
                      }}
                      onClick={() => {
                        handleSearch(term);
                      }}
                    >
                      {term}
                    </Badge>
                  ))}
                </Flex>
              </Box>
            )}
            
            {/* 기본 메시지 */}
            {hotKeywords.length === 0 && recentKeywords.length === 0 && (
              <Box textAlign="center" py={12}>
                <Text fontSize="lg" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                  검색어를 입력해주세요
                </Text>
                <Text fontSize="md" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'} mt={2}>
                  Story와 Lounge의 모든 글을 검색할 수 있어요
                </Text>
              </Box>
            )}
          </VStack>
        )}
      </VStack>
    </Container>
  );
};

export default SearchResults;