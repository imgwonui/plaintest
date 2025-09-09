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
import { stories } from '../mocks/stories';
import { loungePosts } from '../mocks/lounge';

const SearchResults: React.FC = () => {
  const { colorMode } = useColorMode();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(query);
  const [tabIndex, setTabIndex] = useState(0);

  // 검색 결과 계산
  const searchResults = useMemo(() => {
    if (!query.trim()) return { stories: [], loungePosts: [] };

    const searchTerm = query.toLowerCase().trim();
    
    const filteredStories = stories.filter(story => 
      story.title.toLowerCase().includes(searchTerm) ||
      story.summary.toLowerCase().includes(searchTerm) ||
      story.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );

    const filteredLoungePosts = loungePosts.filter(post =>
      post.title.toLowerCase().includes(searchTerm) ||
      post.summary.toLowerCase().includes(searchTerm) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );

    return {
      stories: filteredStories,
      loungePosts: filteredLoungePosts
    };
  }, [query]);

  const totalResults = searchResults.stories.length + searchResults.loungePosts.length;

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

  useEffect(() => {
    setSearchInput(query);
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
          <Box textAlign="center" py={12}>
            <Text fontSize="lg" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
              검색어를 입력해주세요
            </Text>
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default SearchResults;