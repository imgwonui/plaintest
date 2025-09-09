import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  Card,
  CardBody,
  CardHeader,
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
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  IconButton,
  Tooltip,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Avatar,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Progress,
  Select,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { DeleteIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons';
import dayjs from 'dayjs';

interface User {
  id: string;
  name: string;
  email: string;
  provider: 'kakao' | 'google' | 'admin';
  joinedAt: string;
  lastActiveAt: string;
  isActive: boolean;
  storiesCount: number;
  loungePostsCount: number;
  totalLikes: number;
  status: 'active' | 'inactive' | 'banned';
}

const AdminUsers: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // 관리자가 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // 임시 사용자 데이터 (실제로는 서버에서 가져와야 함)
  const [users, setUsers] = useState<User[]>([
    {
      id: 'kakao_123',
      name: '김인사',
      email: 'kim@example.com',
      provider: 'kakao',
      joinedAt: '2024-01-10T09:00:00Z',
      lastActiveAt: '2024-01-15T14:30:00Z',
      isActive: true,
      storiesCount: 3,
      loungePostsCount: 12,
      totalLikes: 156,
      status: 'active',
    },
    {
      id: 'google_456',
      name: 'John Doe',
      email: 'john@example.com',
      provider: 'google',
      joinedAt: '2024-01-05T11:20:00Z',
      lastActiveAt: '2024-01-14T16:45:00Z',
      isActive: true,
      storiesCount: 1,
      loungePostsCount: 8,
      totalLikes: 89,
      status: 'active',
    },
    {
      id: 'kakao_789',
      name: '박신입',
      email: 'park@example.com',
      provider: 'kakao',
      joinedAt: '2024-01-12T10:15:00Z',
      lastActiveAt: '2024-01-13T09:30:00Z',
      isActive: false,
      storiesCount: 0,
      loungePostsCount: 3,
      totalLikes: 15,
      status: 'inactive',
    },
    {
      id: 'google_101',
      name: '이대표',
      email: 'lee@startup.com',
      provider: 'google',
      joinedAt: '2024-01-08T13:40:00Z',
      lastActiveAt: '2024-01-15T18:20:00Z',
      isActive: true,
      storiesCount: 5,
      loungePostsCount: 25,
      totalLikes: 312,
      status: 'active',
    },
  ]);

  // 통계 계산
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    inactiveUsers: users.filter(u => u.status === 'inactive').length,
    bannedUsers: users.filter(u => u.status === 'banned').length,
    newUsersThisWeek: users.filter(u => dayjs(u.joinedAt).isAfter(dayjs().subtract(7, 'day'))).length,
    mau: users.filter(u => dayjs(u.lastActiveAt).isAfter(dayjs().subtract(30, 'day'))).length,
    totalStories: users.reduce((sum, u) => sum + u.storiesCount, 0),
    totalLoungePosts: users.reduce((sum, u) => sum + u.loungePostsCount, 0),
    averageEngagement: Math.round(users.reduce((sum, u) => sum + u.totalLikes, 0) / users.length),
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete) {
      setSelectedUser(userToDelete);
      setSelectedUserId(userId);
      onDeleteOpen();
    }
  };

  const confirmDeleteUser = () => {
    if (selectedUserId) {
      setUsers(prev => prev.filter(u => u.id !== selectedUserId));
      
      toast({
        title: "사용자가 탈퇴 처리되었습니다",
        description: `${selectedUser?.name}님이 서비스에서 탈퇴되었습니다`,
        status: "warning",
        duration: 3000,
      });
    }
    setSelectedUserId(null);
    setSelectedUser(null);
    onDeleteClose();
  };

  const handleBanUser = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, status: 'banned' as const }
        : u
    ));

    const targetUser = users.find(u => u.id === userId);
    toast({
      title: "사용자가 차단되었습니다",
      description: `${targetUser?.name}님이 차단되었습니다`,
      status: "error",
      duration: 3000,
    });
  };

  const handleUnbanUser = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId 
        ? { ...u, status: 'active' as const }
        : u
    ));

    const targetUser = users.find(u => u.id === userId);
    toast({
      title: "사용자 차단이 해제되었습니다",
      description: `${targetUser?.name}님의 차단이 해제되었습니다`,
      status: "success",
      duration: 3000,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge colorScheme="green" size="sm">활성</Badge>;
      case 'inactive':
        return <Badge colorScheme="gray" size="sm">비활성</Badge>;
      case 'banned':
        return <Badge colorScheme="red" size="sm">차단</Badge>;
      default:
        return <Badge colorScheme="gray" size="sm">{status}</Badge>;
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'kakao':
        return <Badge colorScheme="yellow" size="sm">카카오</Badge>;
      case 'google':
        return <Badge colorScheme="red" size="sm">구글</Badge>;
      case 'admin':
        return <Badge colorScheme="purple" size="sm">관리자</Badge>;
      default:
        return <Badge colorScheme="gray" size="sm">{provider}</Badge>;
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Container maxW="1200px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <VStack spacing={4} align="flex-start">
          <HStack>
            <Button 
              as={RouterLink} 
              to="/admin" 
              variant="ghost" 
              size="sm"
              color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
            >
              ← 대시보드로
            </Button>
          </HStack>
          <Heading as="h1" size="xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            👥 사용자 관리
          </Heading>
          <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
            사용자 현황을 관리하고 통계를 확인할 수 있습니다
          </Text>
        </VStack>

        <Divider />

        {/* 주요 지표 */}
        <Box>
          <Heading as="h2" size="lg" mb={6} color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            📊 주요 지표
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>전체 사용자</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{stats.totalUsers}</StatNumber>
              <StatHelpText color="brand.500">
                +{stats.newUsersThisWeek} 이번 주
              </StatHelpText>
            </Stat>

            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>월간 활성 사용자 (MAU)</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{stats.mau}</StatNumber>
              <StatHelpText color="green.500">
                {Math.round((stats.mau / stats.totalUsers) * 100)}% 활성도
              </StatHelpText>
            </Stat>

            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>활성 사용자</StatLabel>
              <StatNumber color="green.500">{stats.activeUsers}</StatNumber>
              <StatHelpText color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                비활성: {stats.inactiveUsers}, 차단: {stats.bannedUsers}
              </StatHelpText>
            </Stat>

            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>평균 참여도</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{stats.averageEngagement}</StatNumber>
              <StatHelpText color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                좋아요/사용자
              </StatHelpText>
            </Stat>
          </SimpleGrid>
        </Box>

        {/* 활동 통계 */}
        <Box>
          <Heading as="h2" size="lg" mb={6} color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            📈 활동 통계
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Card 
              p={6}
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <VStack spacing={3}>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">{stats.totalStories}</Text>
                <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>총 Story 수</Text>
                <Text fontSize="sm" color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}>
                  평균 {(stats.totalStories / stats.totalUsers).toFixed(1)}개/사용자
                </Text>
              </VStack>
            </Card>

            <Card 
              p={6}
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <VStack spacing={3}>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">{stats.totalLoungePosts}</Text>
                <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>총 Lounge 글 수</Text>
                <Text fontSize="sm" color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}>
                  평균 {(stats.totalLoungePosts / stats.totalUsers).toFixed(1)}개/사용자
                </Text>
              </VStack>
            </Card>

            <Card 
              p={6}
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <VStack spacing={3}>
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {Math.round((stats.mau / stats.totalUsers) * 100)}%
                </Text>
                <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>사용자 유지율</Text>
                <Progress 
                  value={(stats.mau / stats.totalUsers) * 100} 
                  colorScheme="orange" 
                  size="sm" 
                  w="100%" 
                />
              </VStack>
            </Card>
          </SimpleGrid>
        </Box>

        {/* 사용자 목록 */}
        <Card 
          bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
          border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
        >
          <CardHeader>
            <HStack justify="space-between">
              <Heading as="h3" size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                전체 사용자 목록
              </Heading>
              <Select size="sm" maxW="200px">
                <option value="all">전체 사용자</option>
                <option value="active">활성 사용자만</option>
                <option value="inactive">비활성 사용자만</option>
                <option value="banned">차단된 사용자만</option>
              </Select>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>사용자</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>가입 경로</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>상태</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>가입일</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>최근 활동</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>게시물</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>좋아요</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>액션</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.id}>
                    <Td>
                      <HStack>
                        <Avatar size="sm" name={user.name} />
                        <VStack spacing={0} align="start">
                          <Text 
                            fontWeight="500"
                            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                          >
                            {user.name}
                          </Text>
                          <Text 
                            fontSize="xs" 
                            color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                          >
                            {user.email}
                          </Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td>{getProviderBadge(user.provider)}</Td>
                    <Td>{getStatusBadge(user.status)}</Td>
                    <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                      {dayjs(user.joinedAt).format('YYYY.MM.DD')}
                    </Td>
                    <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                      {dayjs(user.lastActiveAt).format('YYYY.MM.DD')}
                    </Td>
                    <Td color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                      Story: {user.storiesCount}, Lounge: {user.loungePostsCount}
                    </Td>
                    <Td color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                      {user.totalLikes}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        {user.status === 'banned' ? (
                          <Tooltip label="차단 해제">
                            <IconButton
                              aria-label="Unban user"
                              icon={<InfoIcon />}
                              size="sm"
                              colorScheme="green"
                              variant="outline"
                              onClick={() => handleUnbanUser(user.id)}
                            />
                          </Tooltip>
                        ) : user.status === 'active' && (
                          <Tooltip label="사용자 차단">
                            <IconButton
                              aria-label="Ban user"
                              icon={<WarningIcon />}
                              size="sm"
                              colorScheme="orange"
                              variant="outline"
                              onClick={() => handleBanUser(user.id)}
                            />
                          </Tooltip>
                        )}
                        
                        <Tooltip label="사용자 탈퇴">
                          <IconButton
                            aria-label="Delete user"
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            variant="outline"
                            onClick={() => handleDeleteUser(user.id)}
                          />
                        </Tooltip>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* 사용자 탈퇴 확인 다이얼로그 */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent bg={colorMode === 'dark' ? '#3c3c47' : 'white'}>
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                사용자 탈퇴 처리 확인
              </AlertDialogHeader>
              <AlertDialogBody color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                정말로 <strong>{selectedUser?.name}</strong>님을 탈퇴 처리하시겠습니까? 
                <br />
                사용자의 모든 데이터가 삭제되며, 이 작업은 되돌릴 수 없습니다.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  취소
                </Button>
                <Button colorScheme="red" onClick={confirmDeleteUser} ml={3}>
                  탈퇴 처리
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Container>
  );
};

export default AdminUsers;