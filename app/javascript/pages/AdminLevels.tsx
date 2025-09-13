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
import { userLevelService, getUserDisplayLevel } from '../services/userLevelService';
import { sessionUserService, initializeData } from '../services/sessionDataService';
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
    // 세션에서 저장된 설정이 있으면 사용, 없으면 기본값 사용
    return userLevelService.getCurrentLevelConfig();
  });

  // 관리자 권한 체크
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // 데이터 로드 (세션 데이터 기반)
  useEffect(() => {
    if (!isAdmin) return;
    
    initializeData();
    
    // 모든 사용자 레벨 데이터 동기화
    userLevelService.syncAllUserLevels();
    
    // 실제 활동 기록이 있는 사용자들만 가져오기
    const allUsers = sessionUserService.getAll();
    
    // 각 사용자의 레벨 정보 계산 (실제 데이터 기반)
    const usersWithLevels = allUsers.map(user => {
      const levelInfo = getUserDisplayLevel(user.id);
      return {
        ...user,
        ...levelInfo
      };
    });
    
    // 레벨별 통계 계산
    const stats: any = {};
    // 1부터 99까지 모든 레벨에 대해 통계 계산
    for (let level = 1; level <= 99; level++) {
      const usersAtLevel = usersWithLevels.filter(u => u.level === level);
      stats[level] = usersAtLevel.length;
    }
    
    setUsers(usersWithLevels);
    setLevelStats(stats);
    
    // 현재 레벨 설정도 세션에서 가져오기
    setCurrentConfig(userLevelService.getCurrentLevelConfig());
    
    console.log(`📈 관리자 페이지: ${allUsers.length}명의 사용자 레벨 정보 로드 완료`);
  }, [isAdmin]);

  const handleConfigSave = () => {
    // 세션 스토리지에 레벨 설정 저장
    userLevelService.updateLevelConfig(currentConfig);
    
    toast({
      title: "설정이 저장되었습니다",
      description: "레벨 시스템 설정이 세션에 저장되었습니다.",
      status: "success",
      duration: 3000,
    });
    
    // 모든 사용자 레벨 재계산
    userLevelService.syncAllUserLevels();
    
    // 데이터 새로고침
    const allUsers = sessionUserService.getAll();
    const usersWithLevels = allUsers.map(user => {
      const levelInfo = getUserDisplayLevel(user.id);
      return {
        ...user,
        ...levelInfo
      };
    });
    
    setUsers(usersWithLevels);
    onConfigClose();
  };

  const handleResetAllLevels = () => {
    // 세션 스토리지에서 모든 사용자 레벨 초기화
    userLevelService.resetAllLevels();
    
    // 모든 사용자 레벨 재동기화
    userLevelService.syncAllUserLevels();
    
    // 데이터 새로고침
    const allUsers = sessionUserService.getAll();
    const usersWithLevels = allUsers.map(user => {
      const levelInfo = getUserDisplayLevel(user.id);
      return {
        ...user,
        ...levelInfo
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
      description: "세션 스토리지의 모든 사용자 레벨이 초기화되었습니다.",
      status: "success",
      duration: 3000,
    });
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
              colorScheme="red"
              variant="outline"
              onClick={onResetOpen}
            >
              전체 초기화
            </Button>
          </HStack>
        </HStack>

        {/* 레벨 시스템 개요 */}
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
                  LV{Math.max(...users.map(u => u.level || 1), 1)}
                </Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card bg={colorMode === 'dark' ? '#3c3c47' : 'white'} border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}>
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>평균 레벨</Text>
                <Text fontSize="2xl" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  LV{users.length > 0 ? Math.round(users.reduce((sum, u) => sum + (u.level || 1), 0) / users.length) : 1}
                </Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card bg={colorMode === 'dark' ? '#3c3c47' : 'white'} border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}>
            <CardBody>
              <VStack spacing={2}>
                <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>레전드 (LV90+)</Text>
                <Text fontSize="2xl" fontWeight="bold" color="gold">
                  {users.filter(u => (u.level || 1) >= 90).length}명
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

        {/* 사용자 레벨 현황 */}
        <Card bg={colorMode === 'dark' ? '#3c3c47' : 'white'} border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}>
          <CardHeader>
            <HStack justify="space-between" align="center">
              <Heading as="h3" size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                사용자 레벨 현황
              </Heading>
              <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                총 {users.length}명
              </Text>
            </HStack>
          </CardHeader>
          <CardBody>
            <Table variant="simple" size="md">
              <Thead>
                <Tr>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>사용자</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>레벨</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>경험치</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>진행률</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>가입일</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users
                  .sort((a, b) => (b.level || 1) - (a.level || 1) || (b.totalExp || 0) - (a.totalExp || 0))
                  .slice(0, 20) // 상위 20명만 표시
                  .map((user) => {
                    const currentLevel = user.level || 1;
                    const nextLevel = currentLevel < 99 ? currentLevel + 1 : currentLevel;
                    const currentLevelExp = currentLevel > 1 ? LevelUtils.getRequiredExpForLevel(currentLevel) : 0;
                    const nextLevelExp = currentLevel < 99 ? LevelUtils.getRequiredExpForLevel(nextLevel) : user.totalExp || 0;
                    const progress = currentLevel >= 99 ? 100 : 
                      nextLevelExp > currentLevelExp ? 
                        ((user.totalExp || 0) - currentLevelExp) / (nextLevelExp - currentLevelExp) * 100 : 0;
                    
                    return (
                      <Tr key={user.id}>
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
                            <Progress 
                              value={Math.max(0, Math.min(100, progress))} 
                              size="sm" 
                              w="80px"
                              bg={colorMode === 'dark' ? '#4d4d59' : '#e2e8f0'}
                              colorScheme={currentLevel >= 90 ? 'yellow' : 'blue'}
                            />
                            <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                              {Math.round(progress)}%
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