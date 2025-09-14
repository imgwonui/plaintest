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
import { userService, storyService, loungeService, commentService } from '../services/supabaseDataService';
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

  // Supabase에서 사용자 데이터 로드
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>(null);

  // 데이터 로드 (Supabase 실제 데이터)
  useEffect(() => {
    const loadUsersData = async () => {
      try {
        console.log('🔄 AdminUsers 데이터 로딩 시작...');
        
        // 모든 데이터를 병렬로 로드
        const [usersResult, storiesResult, loungeResult, commentsResult] = await Promise.all([
          userService.getAllUsers(1, 1000), // 모든 사용자
          storyService.getAll(1, 1000), // 모든 스토리
          loungeService.getAll(1, 1000), // 모든 라운지 글
          commentService.getAll(1, 1000) // 모든 댓글
        ]);
        
        const allUsers = usersResult.users || [];
        const allStories = storiesResult.stories || [];
        const allLoungePosts = loungeResult.posts || [];
        const allComments = commentsResult.comments || [];
        
        console.log('📊 AdminUsers Raw data:', {
          사용자수: allUsers.length,
          스토리수: allStories.length,
          라운지글수: allLoungePosts.length,
          댓글수: allComments.length
        });
        
        // 사용자별 통계 계산
        const usersWithStats = allUsers.map(user => {
          const userStories = allStories.filter(story => story.author_id === user.id);
          const userLoungePosts = allLoungePosts.filter(post => post.author_id === user.id);
          const userComments = allComments.filter(comment => comment.author_id === user.id);
          
          // 좋아요 수 계산 (본인이 작성한 글에 받은 좋아요)
          const totalLikes = userStories.reduce((sum, story) => sum + (story.like_count || 0), 0) +
                           userLoungePosts.reduce((sum, post) => sum + (post.like_count || 0), 0);
          
          // 최근 활동 확인 (30일 이내)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const hasRecentActivity = 
            userStories.some(story => new Date(story.created_at) > thirtyDaysAgo) ||
            userLoungePosts.some(post => new Date(post.created_at) > thirtyDaysAgo) ||
            userComments.some(comment => new Date(comment.created_at) > thirtyDaysAgo);
          
          // 최근 활동 시간 계산
          const allActivities = [
            ...userStories.map(s => s.created_at),
            ...userLoungePosts.map(p => p.created_at),
            ...userComments.map(c => c.created_at)
          ].sort().reverse();
          
          const lastActiveAt = allActivities[0] || user.created_at;
          
          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            provider: user.provider || 'kakao' as const,
            joinedAt: user.created_at,
            lastActiveAt,
            isActive: hasRecentActivity,
            storiesCount: userStories.length,
            loungePostsCount: userLoungePosts.length,
            totalLikes,
            status: (hasRecentActivity ? 'active' : 'inactive') as const,
          };
        });
        
        setUsers(usersWithStats);
        console.log('✅ AdminUsers 데이터 로드 성공:', {
          총사용자수: usersWithStats.length,
          활성사용자수: usersWithStats.filter(u => u.status === 'active').length
        });
        
      } catch (error) {
        console.error('❌ AdminUsers 데이터 로드 실패:', error);
        setUsers([]);
      }
    };
    
    loadUsersData();
  }, []);

  // 통계 계산 (users가 로드된 후)
  useEffect(() => {
    if (users.length > 0) {
      const calculatedStats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        inactiveUsers: users.filter(u => u.status === 'inactive').length,
        bannedUsers: users.filter(u => u.status === 'banned').length,
        newUsersThisWeek: users.filter(u => dayjs(u.joinedAt).isAfter(dayjs().subtract(7, 'day'))).length,
        mau: users.filter(u => dayjs(u.lastActiveAt).isAfter(dayjs().subtract(30, 'day'))).length,
        totalStories: users.reduce((sum, u) => sum + u.storiesCount, 0),
        totalLoungePosts: users.reduce((sum, u) => sum + u.loungePostsCount, 0),
        averageEngagement: users.length > 0 ? Math.round(users.reduce((sum, u) => sum + u.totalLikes, 0) / users.length) : 0,
      };
      setStats(calculatedStats);
    }
  }, [users]);

  const handleDeleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete) {
      setSelectedUser(userToDelete);
      setSelectedUserId(userId);
      onDeleteOpen();
    }
  };

  const confirmDeleteUser = async () => {
    if (selectedUserId) {
      try {
        // Supabase에서 사용자 삭제 (실제 구현에서는 비활성화 또는 소프트 삭제 권장)
        await userService.deleteUser(selectedUserId);
        
        // 로컬 상태에서 제거
        setUsers(prev => prev.filter(u => u.id !== selectedUserId));
        
        toast({
          title: "사용자가 탈퇴 처리되었습니다",
          description: `${selectedUser?.name}님이 서비스에서 탈퇴되었습니다`,
          status: "warning",
          duration: 3000,
        });
        
      } catch (error) {
        console.error('사용자 삭제 실패:', error);
        toast({
          title: "탈퇴 처리 실패",
          description: "사용자 탈퇴 처리 중 오류가 발생했습니다",
          status: "error",
          duration: 3000,
        });
      }
    }
    setSelectedUserId(null);
    setSelectedUser(null);
    onDeleteClose();
  };

  const handleBanUser = (userId: string) => {
    // 실제 구현에서는 Supabase에서 사용자 상태 업데이트 필요
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
    // 실제 구현에서는 Supabase에서 사용자 상태 업데이트 필요
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

  if (!isAdmin || !stats) {
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