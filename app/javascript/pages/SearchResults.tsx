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
import { sessionStoryService, sessionLoungeService, sessionUserService, sessionSearchService, initializeData } from '../services/sessionDataService';

const SearchResults: React.FC = () => {
  const { colorMode } = useColorMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [tabIndex, setTabIndex] = useState(0);
  const [stories, setStories] = useState<any[]>([]);
  const [loungePosts, setLoungePosts] = useState<any[]>([]);
  const [hotKeywords, setHotKeywords] = useState<any[]>([]);
  const [recentKeywords, setRecentKeywords] = useState<string[]>([]);

  // 세션 데이터 로드
  useEffect(() => {
    initializeData();
    setStories(sessionStoryService.getAll());
    setLoungePosts(sessionLoungeService.getAll());
    
    // 검색 관련 데이터 로드
    refreshSearchData();
  }, [refreshSearchData]);

  // 검색 결과 계산
  const searchResults = useMemo(() => {
    if (!query.trim()) return { stories: [], loungePosts: [] };

    const searchTerm = query.toLowerCase().trim();
    
    const filteredStories = stories.filter(story => 
      (story.title && story.title.toLowerCase().includes(searchTerm)) ||
      (story.summary && story.summary.toLowerCase().includes(searchTerm)) ||
      (story.tags && story.tags.some(tag => tag && tag.toLowerCase().includes(searchTerm)))
    );

    const filteredLoungePosts = loungePosts.filter(post =>
      (post.title && post.title.toLowerCase().includes(searchTerm)) ||
      (post.summary && post.summary.toLowerCase().includes(searchTerm)) ||
      (post.tags && post.tags.some(tag => tag && tag.toLowerCase().includes(searchTerm)))
    );

    return {
      stories: filteredStories,
      loungePosts: filteredLoungePosts
    };
  }, [query, stories, loungePosts]);

  const totalResults = searchResults.stories.length + searchResults.loungePosts.length;

  // 검색 데이터 새로고침 함수
  const refreshSearchData = React.useCallback(() => {
    const topKeywords = sessionSearchService.getTopKeywords(5);
    setHotKeywords(topKeywords.map((item, index) => ({
      term: item.keyword,
      rank: index + 1,
      count: item.count
    })));
    
    const recent = sessionSearchService.getRecentKeywords(8);
    setRecentKeywords(recent.map(item => item.keyword));
  }, []);
  
  const handleSearch = (newQuery: string) => {
    if (newQuery.trim()) {
      // 세션 스토리지에 검색어 추가
      sessionSearchService.addSearchKeyword(newQuery.trim());
      setSearchParams({ q: newQuery.trim() });
      
      // 검색 데이터 새로고침
      refreshSearchData();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchInput);
    }
  };

  useEffect(() => {
    setSearchInput(query);
    // URL에 검색어가 있으면 세션에 추가
    if (query.trim()) {
      sessionSearchService.addSearchKeyword(query.trim());
      // 검색 후 데이터 새로고침
      refreshSearchData();
    }
  }, [query, refreshSearchData]);

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
                총 {totalResults}개
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
                전체 ({totalResults})
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
                  {totalResults === 0 ? (
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
                                imageUrl={story.imageUrl}
                                tags={story.tags}
                                createdAt={story.createdAt}
                                readTime={story.readTime}
                                author={story.author}
                                authorId={story.author ? sessionUserService.getUserIdByName(story.author) : undefined}
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
                                summary={post.summary}
                                tags={post.tags}
                                createdAt={post.createdAt}
                                loungeType={post.type}
                                isExcellent={post.isExcellent}
                                likeCount={post.likeCount}
                                commentCount={post.commentCount}
                                author={post.author}
                                authorId={post.author ? sessionUserService.getUserIdByName(post.author) : undefined}
                                promotionStatus={post.promotionStatus}
                                promotionNote={post.promotionNote}
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
                {searchResults.stories.length === 0 ? (
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
                        imageUrl={story.imageUrl}
                        tags={story.tags}
                        createdAt={story.createdAt}
                        readTime={story.readTime}
                        author={story.author}
                        authorId={story.author ? sessionUserService.getUserIdByName(story.author) : undefined}
                      />
                    ))}
                  </SimpleGrid>
                )}
              </TabPanel>

              {/* Lounge 탭 */}
              <TabPanel px={0}>
                {searchResults.loungePosts.length === 0 ? (
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
                        summary={post.summary}
                        tags={post.tags}
                        createdAt={post.createdAt}
                        loungeType={post.type}
                        isExcellent={post.isExcellent}
                        likeCount={post.likeCount}
                        commentCount={post.commentCount}
                        author={post.author}
                        authorId={post.author ? sessionUserService.getUserIdByName(post.author) : undefined}
                        promotionStatus={post.promotionStatus}
                        promotionNote={post.promotionNote}
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