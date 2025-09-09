import React, { useState, useEffect } from 'react';
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

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const { colorMode } = useColorMode();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [hotSearchTerms, setHotSearchTerms] = useState([
    { term: 'HR 디지털 전환', rank: 1, change: 0 },
    { term: '원격근무 관리', rank: 2, change: 1 },
    { term: '성과평가 개선', rank: 3, change: -1 },
    { term: '채용 면접 기법', rank: 4, change: 2 },
    { term: '직무 교육 체계', rank: 5, change: -1 },
  ]);

  // 실시간 순위 업데이트 시뮬레이션
  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setHotSearchTerms(prev => {
        const newTerms = [...prev];
        // 랜덤하게 두 개의 항목 순위 변경
        const idx1 = Math.floor(Math.random() * newTerms.length);
        const idx2 = Math.floor(Math.random() * newTerms.length);
        
        if (idx1 !== idx2) {
          // 순위 교체
          [newTerms[idx1], newTerms[idx2]] = [newTerms[idx2], newTerms[idx1]];
          
          // 순위 변화 계산
          newTerms.forEach((term, index) => {
            const oldRank = term.rank;
            const newRank = index + 1;
            term.rank = newRank;
            term.change = oldRank - newRank; // 양수면 상승, 음수면 하락
          });
        }
        
        return newTerms;
      });
    }, 3000); // 3초마다 업데이트

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // 검색 히스토리에 추가
      setSearchHistory(prev => {
        const filtered = prev.filter(item => item !== query.trim());
        return [query.trim(), ...filtered].slice(0, 10); // 최대 10개
      });
      
      // 검색 결과 페이지로 이동
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      onClose();
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
                        setSearchQuery(item.term);
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
                          color={getRankChangeColor(item.change)}
                          fontWeight="600"
                        >
                          {getRankChangeIcon(item.change)}
                        </Text>
                        {Math.abs(item.change) > 0 && (
                          <Text
                            fontSize="xs"
                            color={getRankChangeColor(item.change)}
                          >
                            {Math.abs(item.change)}
                          </Text>
                        )}
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
                    onClick={() => setSearchHistory([])}
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
                        setSearchQuery(term);
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
                          setSearchHistory(prev => prev.filter((_, i) => i !== index));
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