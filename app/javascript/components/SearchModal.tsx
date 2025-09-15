import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  useColorMode,
  Flex,
  IconButton,
  Fade,
  ScaleFade,
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { searchService } from '../services/supabaseDataService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { colorMode } = useColorMode();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [hotSearchTerms, setHotSearchTerms] = useState<any[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 검색어 디바운싱 (300ms 지연)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen) {
      const loadSearchData = async () => {
        try {
          // 인기 검색어 로드 (전역 데이터)
          const topKeywords = await searchService.getTopKeywords(5);
          const formattedKeywords = topKeywords.map((item, index) => ({
            term: item.keyword,
            rank: index + 1,
            count: item.search_count,
            change: 0 // 실제로는 이전 순위와 비교해서 계산
          }));
          setHotSearchTerms(formattedKeywords);
          
          // 최근 검색어 로드 (세션스토리지 기반)
          const recentSearches = getRecentSearchesFromSession();
          setSearchHistory(recentSearches);
        } catch (error) {
          console.error('❌ 검색 데이터 로드 실패:', error);
          setHotSearchTerms([]);
          setSearchHistory([]);
        }
      };
      
      loadSearchData();
    }
  }, [isOpen]);

  // 세션스토리지에서 최근 검색어 가져오기
  const getRecentSearchesFromSession = (): string[] => {
    try {
      const saved = sessionStorage.getItem('recentSearches');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('세션스토리지에서 검색어 로드 실패:', error);
      return [];
    }
  };

  // 세션스토리지에 최근 검색어 저장하기
  const saveRecentSearchToSession = (query: string) => {
    try {
      const current = getRecentSearchesFromSession();
      // 중복 제거 후 맨 앞에 추가
      const updated = [query, ...current.filter(item => item !== query)].slice(0, 8);
      sessionStorage.setItem('recentSearches', JSON.stringify(updated));
      setSearchHistory(updated);
    } catch (error) {
      console.error('세션스토리지에 검색어 저장 실패:', error);
    }
  };

  // 세션스토리지에서 검색어 제거하기
  const removeRecentSearchFromSession = (indexToRemove: number) => {
    try {
      const current = getRecentSearchesFromSession();
      const updated = current.filter((_, index) => index !== indexToRemove);
      sessionStorage.setItem('recentSearches', JSON.stringify(updated));
      setSearchHistory(updated);
    } catch (error) {
      console.error('세션스토리지에서 검색어 제거 실패:', error);
    }
  };

  // 세션스토리지에서 모든 검색어 삭제하기
  const clearAllRecentSearches = () => {
    try {
      sessionStorage.removeItem('recentSearches');
      setSearchHistory([]);
    } catch (error) {
      console.error('세션스토리지 검색어 전체 삭제 실패:', error);
    }
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // 세션스토리지에 최근 검색어 저장
      saveRecentSearchToSession(query.trim());
      
      // 검색 결과 페이지로 이동 (검색어 추가는 searchService.search()에서 자동 처리됨)
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
      setSearchQuery(''); // 검색어 초기화
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  const getRankChangeColor = (change: number) => {
    if (change > 0) return 'green.500';
    if (change < 0) return 'red.500';
    return 'gray.400';
  };

  const getRankChangeIcon = (change: number) => {
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '—';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={colorMode === 'dark' ? 'gray.700' : 'white'} mx={4}>
        <ModalHeader pb={2}>
          <Text fontSize="lg" fontWeight="600" color={colorMode === 'dark' ? 'gray.100' : 'gray.800'}>
            통합검색
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody pb={6}>
          <VStack spacing={6} align="stretch">
            {/* 검색 입력 */}
            <HStack spacing={3}>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="키워드로 찾아볼까요?"
                size="lg"
                bg={colorMode === 'dark' ? 'gray.800' : 'white'}
                border="2px"
                borderColor={colorMode === 'dark' ? 'brand.400' : 'brand.200'}
                _focus={{
                  bg: colorMode === 'dark' ? 'gray.800' : 'white',
                  borderColor: 'brand.500',
                  shadow: '0 0 0 1px var(--chakra-colors-brand-500)'
                }}
                _hover={{
                  borderColor: colorMode === 'dark' ? 'brand.300' : 'brand.300'
                }}
              />
              <IconButton
                aria-label="검색"
                icon={<SearchIcon />}
                onClick={() => handleSearch(searchQuery)}
                colorScheme="brand"
                size="lg"
              />
            </HStack>

            {/* 최근 핫한 검색어 Top 5 */}
            <Box>
              <Text fontSize="md" fontWeight="600" mb={3} color={colorMode === 'dark' ? 'gray.200' : 'gray.700'}>
                🔥 최근 핫한 검색어 Top 5
              </Text>
              <VStack spacing={2} align="stretch">
                {hotSearchTerms.map((item, index) => (
                  <ScaleFade key={`${item.term}-${item.rank}`} in={true}>
                    <Flex
                      align="center"
                      justify="space-between"
                      p={3}
                      borderRadius="md"
                      bg={colorMode === 'dark' ? 'gray.800' : 'brand.50'}
                      border="1px"
                      borderColor={colorMode === 'dark' ? 'gray.600' : 'brand.100'}
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
                          fontSize="xs"
                          minW="24px"
                          textAlign="center"
                        >
                          {item.rank}
                        </Badge>
                        <Text fontWeight="500" color={colorMode === 'dark' ? 'gray.100' : 'gray.800'}>
                          {item.term}
                        </Text>
                      </HStack>
                      <HStack spacing={1}>
                        <Text
                          fontSize="xs"
                          color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}
                          fontWeight="500"
                        >
                          {item.count}회
                        </Text>
                      </HStack>
                    </Flex>
                  </ScaleFade>
                ))}
              </VStack>
            </Box>

            {/* 최근 검색어 */}
            {searchHistory.length > 0 && (
              <Box>
                <HStack justify="space-between" mb={3}>
                  <Text fontSize="md" fontWeight="600" color={colorMode === 'dark' ? 'gray.200' : 'gray.700'}>
                    최근 검색어
                  </Text>
                  <Text
                    fontSize="sm"
                    color="gray.400"
                    cursor="pointer"
                    _hover={{ color: 'gray.300' }}
                    onClick={clearAllRecentSearches}
                  >
                    모두 지우기
                  </Text>
                </HStack>
                <Flex flexWrap="wrap" gap={2}>
                  {searchHistory.slice(0, 8).map((term, index) => (
                    <HStack
                      key={index}
                      spacing={2}
                      px={3}
                      py={1}
                      bg={colorMode === 'dark' ? 'gray.700' : 'brand.50'}
                      border="1px"
                      borderColor={colorMode === 'dark' ? 'gray.600' : 'brand.200'}
                      borderRadius="full"
                      cursor="pointer"
                      _hover={{
                        bg: colorMode === 'dark' ? 'gray.600' : 'brand.100',
                        borderColor: colorMode === 'dark' ? 'brand.400' : 'brand.300'
                      }}
                      onClick={() => {
                        handleSearch(term);
                      }}
                    >
                      <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.200' : 'gray.600'}>
                        {term}
                      </Text>
                      <IconButton
                        aria-label="검색어 삭제"
                        icon={<CloseIcon />}
                        size="xs"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearchFromSession(index);
                        }}
                      />
                    </HStack>
                  ))}
                </Flex>
              </Box>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default SearchModal;