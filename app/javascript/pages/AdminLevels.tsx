import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  useColorMode,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  FormControl,
  FormLabel,
  FormHelperText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Progress,
  Tooltip,
  IconButton,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EditIcon, InfoIcon, SettingsIcon } from '@chakra-ui/icons';
import { levelConfig, LevelUtils } from '../data/levelConfig';
import { userService } from '../services/supabaseDataService';
import { supabase } from '../lib/supabaseClient';
import { getUserDisplayLevel } from '../services/userLevelService';
import UserLevelIcon from '../components/UserLevel/UserLevelIcon';
import LevelBadge from '../components/UserLevel/LevelBadge';

const AdminLevels: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isConfigOpen, onOpen: onConfigOpen, onClose: onConfigClose } = useDisclosure();
  const { isOpen: isResetOpen, onOpen: onResetOpen, onClose: onResetClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  
  const [users, setUsers] = useState<any[]>([]);
  const [levelStats, setLevelStats] = useState<any>({});
  const [currentConfig, setCurrentConfig] = useState(() => {
    // 기본 레벨 설정 사용
    return levelConfig;
  });
  
  // 페이지네이션 및 필터링 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [levelFilter, setLevelFilter] = useState<string>('all'); // 'all', '1-10', '11-20', etc.
  const [isLoading, setIsLoading] = useState(false);

  // 관리자 권한 체크
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // 데이터 로드 함수 (재사용 가능)
  const loadUserLevelData = async () => {
    if (!isAdmin) {
      console.log('❌ 관리자 권한 없음, 레벨 데이터 로드 중단');
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🔄 사용자 레벨 데이터 로드 시작...');
      
      // Supabase에서 모든 사용자 레벨 정보 조회
      const userLevelsResult = await userService.getAllUserLevels(1, 1000);
      const userLevelsData = userLevelsResult.userLevels || [];
      
      console.log('📊 사용자 레벨 원시 데이터:', userLevelsData.length, '개 레코드');
      
      // 사용자 정보와 레벨 정보 결합
      const usersWithLevels = userLevelsData.map(userLevel => {
        const userData = userLevel.user;
        return {
          id: userLevel.user_id,
          name: userData?.name || 'Unknown User',
          email: userData?.email || 'no-email@plain.com',
          isAdmin: userData?.is_admin || false,
          isVerified: userData?.is_verified || false,
          createdAt: userData?.created_at || new Date().toISOString(),
          level: userLevel.level || 1,
          totalExp: userLevel.current_exp || 0,
          totalLikes: userLevel.total_likes || 0,
          storyPromotions: userLevel.story_promotions || 0,
          totalBookmarks: userLevel.total_bookmarks || 0,
          totalPosts: userLevel.total_posts || 0,
          totalComments: userLevel.total_comments || 0,
          excellentPosts: userLevel.excellent_posts || 0,
          achievements: userLevel.achievements || []
        };
      });
      
      // 레벨별 통계 계산 (1~99레벨)
      const stats: any = {};
      for (let level = 1; level <= 99; level++) {
        const usersAtLevel = usersWithLevels.filter(u => u.level === level);
        if (usersAtLevel.length > 0) {
          stats[level] = usersAtLevel.length;
        }
      }
      
      setUsers(usersWithLevels);
      setLevelStats(stats);
      
      console.log(`✅ 관리자 페이지: ${usersWithLevels.length}명의 사용자 레벨 정보 로드 완료`);
      
    } catch (error) {
      console.error('❌ 사용자 레벨 데이터 로드 실패:', error);
      
      setUsers([]);
      setLevelStats({});
      
      toast({
        title: "데이터 로드 실패",
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadUserLevelData();
  }, [isAdmin]);

  // 레벨 필터링된 사용자 목록 계산
  const filteredUsers = users.filter(user => {
    if (levelFilter === 'all') return true;
    
    const [minLevel, maxLevel] = levelFilter.split('-').map(Number);
    return user.level >= minLevel && user.level <= maxLevel;
  });

  // 페이지네이션된 사용자 목록 계산
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = filteredUsers
    .sort((a, b) => (b.level - a.level) || (b.totalExp - a.totalExp))
    .slice(startIndex, endIndex);

  // 실시간 통계 계산 (최신 데이터 반영)
  const maxLevel = users.length > 0 ? Math.max(...users.map(u => u.level)) : 1;
  const avgLevel = users.length > 0 ? Math.round(users.reduce((sum, u) => sum + u.level, 0) / users.length) : 1;
  const legendUsers = users.filter(u => u.level >= 90).length; // 90레벨 이상을 레전드로 설정

  const handleConfigSave = async () => {
    try {
      // 레벨 설정 저장 (로컬 스토리지에 저장)
      localStorage.setItem('levelConfig', JSON.stringify(currentConfig));
      
      toast({
        title: "설정이 저장되었습니다",
        description: "레벨 시스템 설정이 저장되었습니다.",
        status: "success",
        duration: 3000,
      });
      
      onConfigClose();
    } catch (error) {
      console.error('설정 저장 실패:', error);
      toast({
        title: "오류",
        description: "설정 저장에 실패했습니다.",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleResetAllLevels = async () => {
    try {
      // 데이터베이스에서 모든 사용자 레벨 초기화
      const { data: allUserLevels } = await supabase
        .from('user_levels')
        .select('user_id');
      
      if (allUserLevels && allUserLevels.length > 0) {
        // 모든 사용자 레벨을 1로, 경험치를 0으로 초기화
        for (const userLevel of allUserLevels) {
          await userService.updateUserLevel(userLevel.user_id, {
            current_exp: 0,
            level: 1,
            total_likes: 0,
            story_promotions: 0,
            total_bookmarks: 0,
            total_posts: 0,
            total_comments: 0,
            excellent_posts: 0,
            achievements: []
          });
        }
      }
      
      // 데이터 다시 로드
      const userLevelsResult = await userService.getAllUserLevels(1, 1000);
      const userLevelsData = userLevelsResult.userLevels || [];
      
      const usersWithLevels = userLevelsData.map(userLevel => {
        const userData = userLevel.user;
        return {
          id: userLevel.user_id,
          name: userData?.name || 'Unknown',
          email: userData?.email || '',
          isAdmin: userData?.is_admin || false,
          isVerified: userData?.is_verified || false,
          createdAt: userData?.created_at,
          level: userLevel.level,
          totalExp: userLevel.current_exp,
          totalLikes: userLevel.total_likes
        };
      });
      
      // 레벨별 통계 재계산
      const stats: any = {};
      for (let level = 1; level <= 99; level++) {
        const usersAtLevel = usersWithLevels.filter(u => u.level === level);
        stats[level] = usersAtLevel.length;
      }
      
      setUsers(usersWithLevels);
      setLevelStats(stats);
      
      toast({
        title: "모든 레벨이 초기화되었습니다",
        description: "데이터베이스의 모든 사용자 레벨이 초기화되었습니다.",
        status: "success",
        duration: 3000,
      });
      
    } catch (error) {
      console.error('레벨 초기화 실패:', error);
      toast({
        title: "오류",
        description: "레벨 초기화에 실패했습니다.",
        status: "error",
        duration: 3000,
      });
    }
    
    onResetClose();
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Container maxW="1400px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <HStack justify="space-between" align="center">
          <VStack spacing={2} align="start">
            <Heading as="h1" size="xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              레벨 시스템 관리
            </Heading>
            <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
              사용자 레벨 시스템 설정 및 현황을 관리합니다
            </Text>
          </VStack>
          
          <HStack spacing={3}>
            <Button
              leftIcon={<SettingsIcon />}
              onClick={onConfigOpen}
            >
              시스템 설정
            </Button>
            <Button
              colorScheme="blue"
              isLoading={isLoading}
              onClick={async () => {
                try {
                  setIsLoading(true);
                  toast({
                    title: "실제 레벨 재계산 중...",
                    description: "모든 사용자의 실제 활동 데이터를 기반으로 레벨을 재계산합니다.",
                    status: "loading",
                    duration: null,
                  });
                  
                  // 모든 사용자의 레벨 재계산
                  const allUsers = await userService.getAllUsers(1, 1000);
                  console.log(`🔄 ${allUsers.users.length}명의 사용자 레벨 재계산 시작`);
                  
                  for (const user of allUsers.users) {
                    await userService.recalculateUserLevel(user.id);
                  }
                  
                  console.log('✅ 모든 사용자 레벨 재계산 완료');
                  
                  // 데이터 다시 로드 (강제 새로고침)
                  await loadUserLevelData();
                  
                  toast.closeAll();
                  toast({
                    title: "실제 레벨 재계산 완료!",
                    description: `${users.length}명 사용자의 실제 활동 기반 레벨이 업데이트되었습니다.`,
                    status: "success",
                    duration: 5000,
                  });
                  
                } catch (error) {
                  toast.closeAll();
                  toast({
                    title: "재계산 실패",
                    description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
                    status: "error",
                    duration: 5000,
                  });
                } finally {
                  setIsLoading(false);
                }
              }}
            >
              실제 데이터로 재계산
            </Button>
            <Button
              colorScheme="red"
              variant="outline"
              onClick={onResetOpen}
            >
              전체 초기화
            </Button>
          </HStack>
        </HStack>

        {/* 레벨 시스템 개요 (실시간 데이터) */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Card bg={colorMode === 'dark' ? '#3c3c47' : 'white'} border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}>
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>총 사용자</Text>
                <Text fontSize="2xl" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  {users.length}명
                </Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card bg={colorMode === 'dark' ? '#3c3c47' : 'white'} border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}>
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>최고 레벨</Text>
                <Text fontSize="2xl" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  LV{maxLevel}
                </Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card bg={colorMode === 'dark' ? '#3c3c47' : 'white'} border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}>
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>평균 레벨</Text>
                <Text fontSize="2xl" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  LV{avgLevel}
                </Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card bg={colorMode === 'dark' ? '#3c3c47' : 'white'} border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}>
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>레전드 (LV90+)</Text>
                <Text fontSize="2xl" fontWeight="bold" color="gold">
                  {legendUsers}명
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* 레벨 분포 현황 */}
        <Card bg={colorMode === 'dark' ? '#3c3c47' : 'white'} border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}>
          <CardHeader>
            <Heading as="h3" size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              레벨 분포 현황
            </Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {currentConfig.tiers.map((tier, index) => {
                const tierUsers = users.filter(u => {
                  const userLevel = u.level || 1;
                  return userLevel >= tier.minLevel && userLevel <= tier.maxLevel;
                });
                const percentage = users.length > 0 ? (tierUsers.length / users.length) * 100 : 0;
                
                return (
                  <Card key={index} bg={colorMode === 'dark' ? '#2c2c35' : '#f8f9fa'} border="none">
                    <CardBody p={4}>
                      <VStack spacing={3}>
                        <HStack spacing={2} align="center">
                          <UserLevelIcon level={tier.minLevel} size="sm" showAnimation={tier.minLevel >= 90} />
                          <VStack spacing={0} align="start">
                            <Text fontSize="sm" fontWeight="600" color={tier.color}>
                              {tier.name}
                            </Text>
                            <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              LV{tier.minLevel}-{tier.maxLevel}
                            </Text>
                          </VStack>
                        </HStack>
                        
                        <VStack spacing={1} w="100%">
                          <HStack justify="space-between" w="100%">
                            <Text fontSize="sm" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                              {tierUsers.length}명
                            </Text>
                            <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {percentage.toFixed(1)}%
                            </Text>
                          </HStack>
                          <Progress 
                            value={percentage} 
                            size="sm" 
                            w="100%"
                            bg={colorMode === 'dark' ? '#4d4d59' : '#e2e8f0'}
                            sx={{
                              '& > div': {
                                bg: tier.color
                              }
                            }}
                          />
                        </VStack>
                      </VStack>
                    </CardBody>
                  </Card>
                );
              })}
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* 사용자 레벨 현황 (필터링 및 페이지네이션) */}
        <Card bg={colorMode === 'dark' ? '#3c3c47' : 'white'} border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}>
          <CardHeader>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between" align="center">
                <Heading as="h3" size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  사용자 레벨 현황
                </Heading>
                <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                  총 {filteredUsers.length}명 ({users.length}명 중)
                </Text>
              </HStack>
              
              {/* 레벨 필터 (99레벨까지) */}
              <HStack spacing={2} flexWrap="wrap">
                <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                  레벨 구간:
                </Text>
                <Button 
                  size="xs" 
                  variant={levelFilter === 'all' ? 'solid' : 'outline'}
                  onClick={() => {
                    setLevelFilter('all');
                    setCurrentPage(1);
                  }}
                >
                  전체
                </Button>
                <Button 
                  size="xs" 
                  variant={levelFilter === '1-10' ? 'solid' : 'outline'}
                  onClick={() => {
                    setLevelFilter('1-10');
                    setCurrentPage(1);
                  }}
                >
                  LV 1-10
                </Button>
                <Button 
                  size="xs" 
                  variant={levelFilter === '11-30' ? 'solid' : 'outline'}
                  onClick={() => {
                    setLevelFilter('11-30');
                    setCurrentPage(1);
                  }}
                >
                  LV 11-30
                </Button>
                <Button 
                  size="xs" 
                  variant={levelFilter === '31-50' ? 'solid' : 'outline'}
                  onClick={() => {
                    setLevelFilter('31-50');
                    setCurrentPage(1);
                  }}
                >
                  LV 31-50
                </Button>
                <Button 
                  size="xs" 
                  variant={levelFilter === '51-70' ? 'solid' : 'outline'}
                  onClick={() => {
                    setLevelFilter('51-70');
                    setCurrentPage(1);
                  }}
                >
                  LV 51-70
                </Button>
                <Button 
                  size="xs" 
                  variant={levelFilter === '71-90' ? 'solid' : 'outline'}
                  onClick={() => {
                    setLevelFilter('71-90');
                    setCurrentPage(1);
                  }}
                >
                  LV 71-90
                </Button>
                <Button 
                  size="xs" 
                  variant={levelFilter === '91-99' ? 'solid' : 'outline'}
                  onClick={() => {
                    setLevelFilter('91-99');
                    setCurrentPage(1);
                  }}
                >
                  LV 91-99
                </Button>
              </HStack>
            </VStack>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <Box textAlign="center" py={8}>
                <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                  데이터 로딩 중...
                </Text>
              </Box>
            ) : currentUsers.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                  해당 레벨 구간에 사용자가 없습니다.
                </Text>
              </Box>
            ) : (
              <>
                <Table variant="simple" size="md">
                  <Thead>
                    <Tr>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>순위</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>사용자</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>레벨</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>경험치</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>활동</Th>
                      <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>가입일</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {currentUsers.map((user, index) => {
                      const globalRank = startIndex + index + 1;
                      const currentLevel = user.level || 1;
                      
                      return (
                        <Tr key={user.id}>
                          <Td>
                            <Text fontSize="sm" fontWeight="bold" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                              #{globalRank}
                            </Text>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <Text fontWeight="500" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                                {user.name}
                              </Text>
                              {user.isAdmin && (
                                <Badge colorScheme="purple" size="sm">관리자</Badge>
                              )}
                              {user.isVerified && (
                                <Badge colorScheme="green" size="sm">인증</Badge>
                              )}
                            </HStack>
                          </Td>
                          <Td>
                            <LevelBadge 
                              level={currentLevel} 
                              size="sm" 
                              variant="solid"
                              showIcon={true}
                            />
                          </Td>
                          <Td>
                            <Text fontSize="sm" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                              {(user.totalExp || 0).toLocaleString()} EXP
                            </Text>
                          </Td>
                          <Td>
                            <VStack spacing={1} align="start">
                              <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                                글 {user.totalPosts}개 • 좋아요 {user.totalLikes}개
                              </Text>
                              <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                                댓글 {user.totalComments}개 • 북마크 {user.totalBookmarks}개
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {new Date(user.createdAt || Date.now()).toLocaleDateString('ko-KR')}
                            </Text>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
                
                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <HStack justify="center" spacing={2} mt={6}>
                    <Button 
                      size="sm" 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      isDisabled={currentPage === 1}
                    >
                      이전
                    </Button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        size="sm"
                        variant={currentPage === page ? 'solid' : 'outline'}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    
                    <Button 
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      isDisabled={currentPage === totalPages}
                    >
                      다음
                    </Button>
                  </HStack>
                )}
              </>
            )}
          </CardBody>
        </Card>

        {/* 레벨 시스템 설정 모달 */}
        <Modal isOpen={isConfigOpen} onClose={onConfigClose} size="6xl">
          <ModalOverlay />
          <ModalContent maxH="90vh">
            <ModalHeader>레벨 시스템 설정</ModalHeader>
            <ModalCloseButton />
            <ModalBody overflowY="auto">
              <Tabs variant="enclosed" colorScheme="brand">
                <TabList>
                  <Tab>활동 점수</Tab>
                  <Tab>레벨 구간</Tab>
                </TabList>
                
                <TabPanels>
                  {/* 활동 점수 설정 탭 */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <Text color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                        활동별 점수 가중치를 설정합니다.
                      </Text>
                
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl>
                    <FormLabel fontSize="sm">받은 좋아요</FormLabel>
                    <NumberInput
                      value={currentConfig.scoreWeights.likeReceived}
                      onChange={(_, value) => setCurrentConfig({
                        ...currentConfig,
                        scoreWeights: { ...currentConfig.scoreWeights, likeReceived: value }
                      })}
                      min={0}
                      max={10}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormHelperText>좋아요 1개당 획득 점수</FormHelperText>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel fontSize="sm">Story 승격</FormLabel>
                    <NumberInput
                      value={currentConfig.scoreWeights.storyPromoted}
                      onChange={(_, value) => setCurrentConfig({
                        ...currentConfig,
                        scoreWeights: { ...currentConfig.scoreWeights, storyPromoted: value }
                      })}
                      min={0}
                      max={100}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormHelperText>글이 Story로 승격될 때 획득 점수</FormHelperText>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel fontSize="sm">북마크</FormLabel>
                    <NumberInput
                      value={currentConfig.scoreWeights.bookmarked}
                      onChange={(_, value) => setCurrentConfig({
                        ...currentConfig,
                        scoreWeights: { ...currentConfig.scoreWeights, bookmarked: value }
                      })}
                      min={0}
                      max={20}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormHelperText>북마크 1개당 획득 점수</FormHelperText>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel fontSize="sm">글 작성</FormLabel>
                    <NumberInput
                      value={currentConfig.scoreWeights.postCreated}
                      onChange={(_, value) => setCurrentConfig({
                        ...currentConfig,
                        scoreWeights: { ...currentConfig.scoreWeights, postCreated: value }
                      })}
                      min={0}
                      max={10}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormHelperText>글 작성당 획득 점수</FormHelperText>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel fontSize="sm">댓글 작성</FormLabel>
                    <NumberInput
                      value={currentConfig.scoreWeights.commentCreated}
                      onChange={(_, value) => setCurrentConfig({
                        ...currentConfig,
                        scoreWeights: { ...currentConfig.scoreWeights, commentCreated: value }
                      })}
                      min={0}
                      max={5}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormHelperText>댓글 작성당 획득 점수</FormHelperText>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel fontSize="sm">우수 글 선정</FormLabel>
                    <NumberInput
                      value={currentConfig.scoreWeights.excellentPost}
                      onChange={(_, value) => setCurrentConfig({
                        ...currentConfig,
                        scoreWeights: { ...currentConfig.scoreWeights, excellentPost: value }
                      })}
                      min={0}
                      max={100}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormHelperText>우수 글로 선정될 때 획득 점수</FormHelperText>
                  </FormControl>
                      </SimpleGrid>
                    </VStack>
                  </TabPanel>
                  
                  {/* 레벨 구간 설정 탭 */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <VStack spacing={3} align="stretch">
                        <Text color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                          레벨 구간별 경험치 설정을 조정합니다. 높은 구간일수록 레벨업이 어려워집니다.
                        </Text>
                        
                        <Card bg={colorMode === 'dark' ? '#2c2c35' : '#f0f8ff'} border="1px solid" borderColor="blue.200">
                          <CardBody py={3}>
                            <VStack spacing={2} align="start">
                              <Text fontSize="sm" fontWeight="600" color="blue.600">
                                📚 설정 가이드
                              </Text>
                              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="100%">
                                <VStack spacing={1} align="start">
                                  <Text fontSize="xs" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                                    🎯 기본 경험치
                                  </Text>
                                  <Text fontSize="xs" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                                    해당 구간의 첫 번째 레벨에 도달하는데 필요한 경험치입니다.
                                  </Text>
                                </VStack>
                                <VStack spacing={1} align="start">
                                  <Text fontSize="xs" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                                    📈 레벨당 증가량
                                  </Text>
                                  <Text fontSize="xs" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                                    다음 레벨로 가기 위해 추가로 필요한 기본 경험치량입니다.
                                  </Text>
                                </VStack>
                                <VStack spacing={1} align="start">
                                  <Text fontSize="xs" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                                    🚀 증가 배율
                                  </Text>
                                  <Text fontSize="xs" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                                    레벨이 오를수록 경험치가 지수적으로 증가하는 비율입니다.
                                    <br />
                                    1.0 = 선형증가, 1.5 = 빠른증가, 2.0 = 매우빠른증가
                                  </Text>
                                </VStack>
                                <VStack spacing={1} align="start">
                                  <Text fontSize="xs" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                                    💡 예시 계산법
                                  </Text>
                                  <Text fontSize="xs" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                                    LV2 = 기본 + (증가량 × 1.0)
                                    <br />
                                    LV3 = LV2 + (증가량 × 배율¹)
                                    <br />
                                    LV4 = LV3 + (증가량 × 배율²)
                                  </Text>
                                </VStack>
                              </SimpleGrid>
                            </VStack>
                          </CardBody>
                        </Card>
                      </VStack>
                      
                      {currentConfig.levelTierSettings.map((tierSetting, index) => (
                        <Card key={index} bg={colorMode === 'dark' ? '#2c2c35' : '#f8f9fa'} border="1px solid" borderColor={colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'}>
                          <CardBody>
                            <VStack spacing={4} align="stretch">
                              <HStack justify="space-between" align="center">
                                <VStack spacing={1} align="start">
                                  <Heading size="sm" color={currentConfig.tiers[index]?.color || 'gray.500'}>
                                    {tierSetting.name} (LV{tierSetting.levels[0]}-{tierSetting.levels[1]})
                                  </Heading>
                                  <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                                    {tierSetting.description}
                                  </Text>
                                </VStack>
                              </HStack>
                              
                              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                                <FormControl>
                                  <FormLabel fontSize="xs">🎯 기본 경험치</FormLabel>
                                  <NumberInput
                                    value={tierSetting.baseExp}
                                    onChange={(_, value) => {
                                      const newConfig = { ...currentConfig };
                                      newConfig.levelTierSettings[index].baseExp = value;
                                      setCurrentConfig(newConfig);
                                    }}
                                    min={0}
                                    max={50000}
                                    size="sm"
                                  >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                      <NumberIncrementStepper />
                                      <NumberDecrementStepper />
                                    </NumberInputStepper>
                                  </NumberInput>
                                  <FormHelperText fontSize="xs">
                                    LV{tierSetting.levels[0]}에 도달하는데 필요한 경험치
                                    <br />
                                    <Text as="span" color="blue.500">
                                      예: {tierSetting.baseExp.toLocaleString()} EXP → LV{tierSetting.levels[0]}
                                    </Text>
                                  </FormHelperText>
                                </FormControl>
                                
                                <FormControl>
                                  <FormLabel fontSize="xs">📈 레벨당 증가량</FormLabel>
                                  <NumberInput
                                    value={tierSetting.expIncrement}
                                    onChange={(_, value) => {
                                      const newConfig = { ...currentConfig };
                                      newConfig.levelTierSettings[index].expIncrement = value;
                                      setCurrentConfig(newConfig);
                                    }}
                                    min={1}
                                    max={2000}
                                    size="sm"
                                  >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                      <NumberIncrementStepper />
                                      <NumberDecrementStepper />
                                    </NumberInputStepper>
                                  </NumberInput>
                                  <FormHelperText fontSize="xs">
                                    다음 레벨까지 추가 경험치 (기본값)
                                    <br />
                                    <Text as="span" color="green.500">
                                      예: +{tierSetting.expIncrement} EXP (첫 레벨업)
                                    </Text>
                                  </FormHelperText>
                                </FormControl>
                                
                                <FormControl>
                                  <FormLabel fontSize="xs">🚀 증가 배율</FormLabel>
                                  <NumberInput
                                    value={tierSetting.expMultiplier}
                                    onChange={(_, value) => {
                                      const newConfig = { ...currentConfig };
                                      newConfig.levelTierSettings[index].expMultiplier = value;
                                      setCurrentConfig(newConfig);
                                    }}
                                    min={1.0}
                                    max={3.0}
                                    step={0.05}
                                    precision={2}
                                    size="sm"
                                  >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                      <NumberIncrementStepper />
                                      <NumberDecrementStepper />
                                    </NumberInputStepper>
                                  </NumberInput>
                                  <FormHelperText fontSize="xs">
                                    매 레벨마다 경험치 증가 비율
                                    <br />
                                    <Text as="span" color={tierSetting.expMultiplier >= 1.3 ? 'red.500' : 'orange.500'}>
                                      {tierSetting.expMultiplier}x = {tierSetting.expMultiplier >= 1.5 ? '매우 어려움' : tierSetting.expMultiplier >= 1.3 ? '어려움' : tierSetting.expMultiplier >= 1.2 ? '보통' : '쉬움'}
                                    </Text>
                                  </FormHelperText>
                                </FormControl>
                                
                                <VStack spacing={1} align="start">
                                  <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                                    💎 예상 최고 레벨 경험치
                                  </Text>
                                  <Text fontSize="sm" fontWeight="bold" color={levelConfig.tiers[index]?.color || 'gray.500'}>
                                    {(() => {
                                      const levelsInTier = tierSetting.levels[1] - tierSetting.levels[0] + 1;
                                      let totalExp = tierSetting.baseExp;
                                      for (let i = 0; i < levelsInTier - 1; i++) {
                                        totalExp += tierSetting.expIncrement * Math.pow(tierSetting.expMultiplier, i);
                                      }
                                      return Math.floor(totalExp).toLocaleString();
                                    })()}
                                  </Text>
                                  <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                                    LV{tierSetting.levels[1]} 도달에 필요한 총 경험치
                                    <br />
                                    {(() => {
                                      const difficultyLevel = 
                                        tierSetting.expMultiplier >= 1.4 ? '🔥 극악' : 
                                        tierSetting.expMultiplier >= 1.3 ? '😰 어려움' :
                                        tierSetting.expMultiplier >= 1.2 ? '😐 보통' : '😊 쉬움';
                                      return `난이도: ${difficultyLevel}`;
                                    })()}
                                  </Text>
                                </VStack>
                              </SimpleGrid>
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onConfigClose}>
                취소
              </Button>
              <Button onClick={handleConfigSave}>
                저장
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 전체 초기화 확인 다이얼로그 */}
        <AlertDialog
          isOpen={isResetOpen}
          leastDestructiveRef={cancelRef}
          onClose={onResetClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                모든 레벨 초기화
              </AlertDialogHeader>

              <AlertDialogBody>
                정말로 모든 사용자의 레벨을 초기화하시겠습니까?
                이 작업은 되돌릴 수 없습니다.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onResetClose}>
                  취소
                </Button>
                <Button colorScheme="red" onClick={handleResetAllLevels} ml={3}>
                  초기화
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Container>
  );
};

export default AdminLevels;