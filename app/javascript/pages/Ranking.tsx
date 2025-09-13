import React, { useState, useEffect } from 'react';
import {
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  useColorMode,
  Card,
  CardBody,
  Avatar,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  SimpleGrid,
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  Flex,
  Icon,
  Tooltip,
  Button,
} from '@chakra-ui/react';
import { Crown, Trophy, Medal, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userLevelService, getUserDisplayLevel } from '../services/userLevelService';
import { sessionUserService, initializeData } from '../services/sessionDataService';
import { LevelUtils } from '../data/levelConfig';
import LevelBadge from '../components/UserLevel/LevelBadge';
import UserLevelIcon from '../components/UserLevel/UserLevelIcon';
import SEOHead from '../components/SEOHead';

interface RankingUser {
  id: number;
  name: string;
  level: number;
  totalExp: number;
  avatar?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  rank: number;
}

const Ranking: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user } = useAuth();
  const [rankingUsers, setRankingUsers] = useState<RankingUser[]>([]);
  const [myRanking, setMyRanking] = useState<RankingUser | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    initializeData();
    loadRankingData();
  }, [selectedPeriod]);

  const loadRankingData = () => {
    const allUsers = sessionUserService.getAll();
    
    // 모든 사용자의 레벨 정보 계산
    const usersWithLevels = allUsers.map(userData => {
      const levelInfo = getUserDisplayLevel(userData.id);
      return {
        id: userData.id,
        name: userData.name,
        level: levelInfo.level,
        totalExp: levelInfo.totalExp,
        avatar: userData.avatar,
        isVerified: userData.isVerified,
        isAdmin: userData.isAdmin,
        rank: 0 // 나중에 설정
      };
    });

    // 레벨과 경험치로 정렬
    usersWithLevels.sort((a, b) => {
      if (a.level !== b.level) {
        return b.level - a.level; // 레벨 높은 순
      }
      return b.totalExp - a.totalExp; // 같은 레벨이면 경험치 높은 순
    });

    // 순위 부여
    const rankedUsers = usersWithLevels.map((userData, index) => ({
      ...userData,
      rank: index + 1
    }));

    setRankingUsers(rankedUsers);

    // 현재 사용자의 랭킹 찾기
    if (user) {
      const myRank = rankedUsers.find(u => u.id === user.id);
      setMyRanking(myRank || null);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Icon as={Crown} color="gold" boxSize="6" />;
      case 2:
        return <Icon as={Trophy} color="silver" boxSize="6" />;
      case 3:
        return <Icon as={Medal} color="#CD7F32" boxSize="6" />; // Bronze
      default:
        return <Text fontSize="lg" fontWeight="bold" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>#{rank}</Text>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return colorMode === 'dark' 
          ? 'linear(135deg, gold, yellow.300)' 
          : 'linear(135deg, yellow.100, gold)';
      case 2:
        return colorMode === 'dark'
          ? 'linear(135deg, gray.300, silver)'
          : 'linear(135deg, gray.100, gray.300)';
      case 3:
        return colorMode === 'dark'
          ? 'linear(135deg, orange.400, orange.600)'
          : 'linear(135deg, orange.100, orange.300)';
      default:
        return colorMode === 'dark' ? '#3c3c47' : 'white';
    }
  };

  const topThree = rankingUsers.slice(0, 3);
  const restOfRanking = rankingUsers.slice(3, 50); // 상위 50명까지

  return (
    <>
      <SEOHead
        title="레벨 랭킹 - HR 커뮤니티 활동 순위"
        description="HR 커뮤니티에서 가장 활발하게 활동하는 멤버들의 레벨 랭킹을 확인해보세요. 레벨, 경험치, 활동 통계를 한눈에 볼 수 있습니다."
        keywords="랭킹, 레벨, 순위, HR 커뮤니티, 활동, 경험치, 리더보드"
        url="/ranking"
      />
      
      <Container maxW="1200px" py={8}>
        <VStack spacing={8} align="stretch">
          {/* 헤더 */}
          <VStack spacing={4} align="center" textAlign="center">
            <HStack spacing={3}>
              <Icon as={Trophy} boxSize="8" color="gold" />
              <Heading as="h1" size="xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                레벨 랭킹
              </Heading>
            </HStack>
            <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} fontSize="lg">
              가장 활발하게 활동하는 HR 전문가들의 순위
            </Text>
          </VStack>

          {/* 내 랭킹 (로그인된 경우만) */}
          {user && myRanking && (
            <Card 
              bg={getRankBg(myRanking.rank)}
              border={colorMode === 'dark' ? '2px solid #4d4d59' : '2px solid #e4e4e5'}
              borderColor={myRanking.rank <= 3 ? 'transparent' : undefined}
            >
              <CardBody>
                <HStack justify="space-between" align="center">
                  <HStack spacing={4}>
                    <Box>{getRankIcon(myRanking.rank)}</Box>
                    <Avatar size="md" name={myRanking.name} src={myRanking.avatar} />
                    <VStack spacing={1} align="start">
                      <HStack>
                        <Text fontWeight="bold" fontSize="lg" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                          {myRanking.name} (나)
                        </Text>
                        {myRanking.isAdmin && (
                          <Badge colorScheme="purple" size="sm">관리자</Badge>
                        )}
                        {myRanking.isVerified && (
                          <Badge colorScheme="green" size="sm">인증</Badge>
                        )}
                      </HStack>
                      <HStack spacing={3}>
                        <LevelBadge level={myRanking.level} size="sm" variant="solid" showIcon={true} />
                        <Text fontSize="sm" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                          {myRanking.totalExp.toLocaleString()} EXP
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>
                  
                  <VStack spacing={1} align="end">
                    <Text fontSize="2xl" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                      #{myRanking.rank}
                    </Text>
                    <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                      전체 {rankingUsers.length}명 중
                    </Text>
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          )}

          {/* 상위 3명 포디움 */}
          {topThree.length >= 3 && (
            <Card bg={colorMode === 'dark' ? '#3c3c47' : 'white'} border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}>
              <CardBody p={8}>
                <VStack spacing={6}>
                  <Heading as="h2" size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'} textAlign="center">
                    🏆 명예의 전당
                  </Heading>
                  
                  <HStack spacing={8} justify="center" align="end" w="100%">
                    {/* 2등 */}
                    {topThree[1] && (
                      <VStack spacing={4}>
                        <Box
                          bg={getRankBg(2)}
                          p={6}
                          borderRadius="xl"
                          textAlign="center"
                          minW="200px"
                          h="220px"
                          display="flex"
                          flexDirection="column"
                          justifyContent="center"
                        >
                          <VStack spacing={3}>
                            <Icon as={Trophy} color="silver" boxSize="8" />
                            <Avatar size="xl" name={topThree[1].name} src={topThree[1].avatar} />
                            <VStack spacing={1}>
                              <HStack>
                                <Text fontWeight="bold" fontSize="lg" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                                  {topThree[1].name}
                                </Text>
                                {topThree[1].isVerified && <Badge colorScheme="green" size="sm">인증</Badge>}
                              </HStack>
                              <LevelBadge level={topThree[1].level} size="md" variant="solid" showIcon={true} />
                              <Text fontSize="sm" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                                {topThree[1].totalExp.toLocaleString()} EXP
                              </Text>
                            </VStack>
                          </VStack>
                        </Box>
                        <Badge colorScheme="gray" size="lg" px={4} py={2} fontSize="lg" fontWeight="bold">
                          2등
                        </Badge>
                      </VStack>
                    )}

                    {/* 1등 (가장 크게) */}
                    {topThree[0] && (
                      <VStack spacing={4}>
                        <Box
                          bg={getRankBg(1)}
                          p={8}
                          borderRadius="xl"
                          textAlign="center"
                          minW="240px"
                          h="260px"
                          display="flex"
                          flexDirection="column"
                          justifyContent="center"
                          border="3px solid"
                          borderColor="gold"
                          position="relative"
                          overflow="visible"
                        >
                          {/* 왕관 효과 */}
                          <Box position="absolute" top="-10px" left="50%" transform="translateX(-50%)" zIndex={10}>
                            <Icon as={Crown} color="gold" boxSize="10" />
                          </Box>
                          
                          <VStack spacing={4}>
                            <Avatar size="2xl" name={topThree[0].name} src={topThree[0].avatar} />
                            <VStack spacing={1}>
                              <HStack>
                                <Text fontWeight="bold" fontSize="xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                                  {topThree[0].name}
                                </Text>
                                {topThree[0].isVerified && <Badge colorScheme="green" size="sm">인증</Badge>}
                              </HStack>
                              <LevelBadge level={topThree[0].level} size="lg" variant="solid" showIcon={true} />
                              <Text fontSize="md" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'} fontWeight="600">
                                {topThree[0].totalExp.toLocaleString()} EXP
                              </Text>
                            </VStack>
                          </VStack>
                        </Box>
                        <Badge colorScheme="yellow" size="lg" px={6} py={2} fontSize="xl" fontWeight="bold">
                          🥇 1등
                        </Badge>
                      </VStack>
                    )}

                    {/* 3등 */}
                    {topThree[2] && (
                      <VStack spacing={4}>
                        <Box
                          bg={getRankBg(3)}
                          p={6}
                          borderRadius="xl"
                          textAlign="center"
                          minW="200px"
                          h="220px"
                          display="flex"
                          flexDirection="column"
                          justifyContent="center"
                        >
                          <VStack spacing={3}>
                            <Icon as={Medal} color="#CD7F32" boxSize="8" />
                            <Avatar size="xl" name={topThree[2].name} src={topThree[2].avatar} />
                            <VStack spacing={1}>
                              <HStack>
                                <Text fontWeight="bold" fontSize="lg" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                                  {topThree[2].name}
                                </Text>
                                {topThree[2].isVerified && <Badge colorScheme="green" size="sm">인증</Badge>}
                              </HStack>
                              <LevelBadge level={topThree[2].level} size="md" variant="solid" showIcon={true} />
                              <Text fontSize="sm" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                                {topThree[2].totalExp.toLocaleString()} EXP
                              </Text>
                            </VStack>
                          </VStack>
                        </Box>
                        <Badge colorScheme="orange" size="lg" px={4} py={2} fontSize="lg" fontWeight="bold">
                          3등
                        </Badge>
                      </VStack>
                    )}
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* 전체 랭킹 테이블 */}
          <Card bg={colorMode === 'dark' ? '#3c3c47' : 'white'} border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="center">
                  <Heading as="h2" size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                    전체 랭킹
                  </Heading>
                  <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                    상위 {Math.min(50, rankingUsers.length)}명
                  </Text>
                </HStack>

                <Table variant="simple" size="md">
                  <Thead>
                    <Tr>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} textAlign="center">순위</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>사용자</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>레벨</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>경험치</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>진행률</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {rankingUsers.slice(0, 50).map((rankUser) => {
                      const currentLevel = rankUser.level;
                      const nextLevel = currentLevel < 99 ? currentLevel + 1 : currentLevel;
                      const currentLevelExp = currentLevel > 1 ? LevelUtils.getRequiredExpForLevel(currentLevel) : 0;
                      const nextLevelExp = currentLevel < 99 ? LevelUtils.getRequiredExpForLevel(nextLevel) : rankUser.totalExp;
                      const progress = currentLevel >= 99 ? 100 : 
                        nextLevelExp > currentLevelExp ? 
                          ((rankUser.totalExp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100 : 0;
                      
                      const isCurrentUser = user && rankUser.id === user.id;
                      
                      return (
                        <Tr 
                          key={rankUser.id}
                          bg={isCurrentUser ? (colorMode === 'dark' ? '#4d4d59' : '#f0f8ff') : undefined}
                          _hover={{ bg: colorMode === 'dark' ? '#4d4d59' : '#f8f9fa' }}
                        >
                          <Td textAlign="center">
                            <Box display="flex" justifyContent="center">
                              {getRankIcon(rankUser.rank)}
                            </Box>
                          </Td>
                          <Td>
                            <HStack spacing={3}>
                              <Avatar size="sm" name={rankUser.name} src={rankUser.avatar} />
                              <VStack spacing={0} align="start">
                                <HStack>
                                  <Text fontWeight="500" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                                    {rankUser.name}
                                    {isCurrentUser && (
                                      <Text as="span" fontSize="xs" color="brand.500" ml={2}>
                                        (나)
                                      </Text>
                                    )}
                                  </Text>
                                  {rankUser.isAdmin && (
                                    <Badge colorScheme="purple" size="sm">관리자</Badge>
                                  )}
                                  {rankUser.isVerified && (
                                    <Badge colorScheme="green" size="sm">인증</Badge>
                                  )}
                                </HStack>
                              </VStack>
                            </HStack>
                          </Td>
                          <Td>
                            <LevelBadge level={rankUser.level} size="sm" variant="solid" showIcon={true} />
                          </Td>
                          <Td>
                            <Text fontSize="sm" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                              {rankUser.totalExp.toLocaleString()} EXP
                            </Text>
                          </Td>
                          <Td>
                            <VStack spacing={1} align="start">
                              <Progress 
                                value={Math.max(0, Math.min(100, progress))} 
                                size="sm" 
                                w="100px"
                                bg={colorMode === 'dark' ? '#2c2c35' : '#e2e8f0'}
                                colorScheme={currentLevel >= 90 ? 'yellow' : 'blue'}
                              />
                              <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                                {Math.round(progress)}%
                              </Text>
                            </VStack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </VStack>
            </CardBody>
          </Card>

          {/* 통계 요약 */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Card bg={colorMode === 'dark' ? '#3c3c47' : 'white'} border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}>
              <CardBody textAlign="center">
                <VStack spacing={2}>
                  <Icon as={Star} color="gold" boxSize="6" />
                  <Text fontSize="2xl" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                    {rankingUsers.filter(u => u.level >= 90).length}명
                  </Text>
                  <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                    레전드 레벨 (90+)
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card bg={colorMode === 'dark' ? '#3c3c47' : 'white'} border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}>
              <CardBody textAlign="center">
                <VStack spacing={2}>
                  <Text fontSize="2xl">📈</Text>
                  <Text fontSize="2xl" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                    LV{rankingUsers.length > 0 ? Math.round(rankingUsers.reduce((sum, u) => sum + u.level, 0) / rankingUsers.length) : 0}
                  </Text>
                  <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                    평균 레벨
                  </Text>
                </VStack>
              </CardBody>
            </Card>
            
            <Card bg={colorMode === 'dark' ? '#3c3c47' : 'white'} border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}>
              <CardBody textAlign="center">
                <VStack spacing={2}>
                  <Text fontSize="2xl">⚡</Text>
                  <Text fontSize="2xl" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                    {rankingUsers.length > 0 ? Math.round(rankingUsers.reduce((sum, u) => sum + u.totalExp, 0) / rankingUsers.length).toLocaleString() : 0}
                  </Text>
                  <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                    평균 경험치
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </Container>
    </>
  );
};

export default Ranking;