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
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { storyService } from '../services/supabaseDataService';
import { EditIcon, DeleteIcon, CheckIcon, TimeIcon } from '@chakra-ui/icons';
import dayjs from 'dayjs';

interface AdminStory {
  id: number;
  title: string;
  author: string;
  content: string;
  createdAt: string;
  status: 'draft' | 'pending' | 'published' | 'cancelled';
  isVerified: boolean;
  publishedAt?: string;
  cancelReason?: string;
}

const AdminStory: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isCancelOpen, onOpen: onCancelOpen, onClose: onCancelClose } = useDisclosure();
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // 관리자가 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Supabase에서 실제 Story 데이터 로드
  const [adminStories, setAdminStories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 데이터 로드
  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setIsLoading(true);
      console.log('📖 관리자 스토리 목록 로드 시작...');
      const response = await storyService.getAll(1, 100);
      console.log('📖 관리자 스토리 서비스 응답:', response);
      setAdminStories(response.stories || []);
      console.log('✅ 관리자 스토리 데이터 로드 성공:', response.stories?.length || 0, '개');
    } catch (error) {
      console.error('❌ 관리자 스토리 데이터 로드 실패:', error);
      toast({
        title: "데이터 로드 실패",
        description: "스토리를 불러오는 중 오류가 발생했습니다.",
        status: "error",
        duration: 5000,
      });
      setAdminStories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishStory = async (storyId: number) => {
    try {
      console.log('📝 스토리 발행 시작:', storyId);
      
      // Supabase에서 스토리 업데이트
      const updatedStory = await storyService.update(storyId, {
        is_verified: true,
        published_at: new Date().toISOString()
      });

      console.log('✅ 스토리 발행 성공:', updatedStory);

      // 로컬 상태 업데이트
      setAdminStories(prev => prev.map(story => 
        story.id === storyId ? { ...story, is_verified: true, published_at: updatedStory.published_at } : story
      ));

      toast({
        title: "Story가 발행되었습니다",
        description: "데이터베이스에 성공적으로 저장되었습니다",
        status: "success",
        duration: 5000,
      });
    } catch (error) {
      console.error('❌ 스토리 발행 실패:', error);
      toast({
        title: "발행 실패",
        description: "Story 발행 중 오류가 발생했습니다",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleCancelStory = (storyId: number) => {
    setSelectedStoryId(storyId);
    onCancelOpen();
  };

  const confirmCancelStory = async () => {
    if (selectedStoryId) {
      try {
        console.log('📝 스토리 취소 시작:', selectedStoryId);
        
        // Supabase에서 스토리 업데이트
        const updatedStory = await storyService.update(selectedStoryId, {
          published_at: null,
          status: 'cancelled',
          cancel_reason: '관리자에 의해 취소됨',
          cancelled_at: new Date().toISOString()
        });

        console.log('✅ 스토리 취소 성공:', updatedStory);

        // 로컬 상태 업데이트
        setAdminStories(prev => prev.map(story => 
          story.id === selectedStoryId ? { ...story, published_at: null, status: 'cancelled' } : story
        ));

        toast({
          title: "Story가 취소되었습니다",
          description: "데이터베이스에서 성공적으로 취소되었습니다",
          status: "info",
          duration: 3000,
        });
      } catch (error) {
        console.error('❌ 스토리 취소 실패:', error);
        toast({
          title: "취소 실패",
          description: "Story 취소 중 오류가 발생했습니다",
          status: "error",
          duration: 3000,
        });
      }
    }
    setSelectedStoryId(null);
    onCancelClose();
  };

  const handleDeleteStory = (storyId: number) => {
    setSelectedStoryId(storyId);
    onDeleteOpen();
  };

  const confirmDeleteStory = async () => {
    if (selectedStoryId) {
      try {
        console.log('📝 스토리 삭제 시작:', selectedStoryId);
        
        // Supabase에서 스토리 삭제
        await storyService.delete(selectedStoryId);
        
        console.log('✅ 스토리 삭제 성공:', selectedStoryId);
        
        // 로컬 상태에서 제거
        setAdminStories(prev => prev.filter(story => story.id !== selectedStoryId));
        
        toast({
          title: "Story가 삭제되었습니다",
          description: "데이터베이스에서 성공적으로 삭제되었습니다",
          status: "warning",
          duration: 3000,
        });
      } catch (error) {
        console.error('❌ 스토리 삭제 실패:', error);
        toast({
          title: "삭제 실패",
          description: "Story 삭제 중 오류가 발생했습니다",
          status: "error",
          duration: 3000,
        });
      }
    }
    setSelectedStoryId(null);
    onDeleteClose();
  };

  const getStatusBadge = (story: any) => {
    if (story.status === 'cancelled') {
      return <Badge colorScheme="red">취소됨</Badge>;
    } else if (story.published_at) {
      return <Badge colorScheme="green">발행됨</Badge>;
    } else {
      return <Badge colorScheme="yellow">준비중</Badge>;
    }
  };

  const canCancel = (story: any) => {
    if (story.status === 'cancelled' || !story.published_at) return false;
    
    const publishedTime = new Date(story.published_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - publishedTime.getTime()) / (1000 * 60);
    
    return diffMinutes <= 5; // 5분 이내만 취소 가능
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
            📖 Story 관리
          </Heading>
          <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
            Story 콘텐츠를 관리하고 즉시 발행하거나 취소할 수 있습니다
          </Text>
        </VStack>

        <Divider />

        {/* 액션 버튼 */}
        <HStack>
          <Button 
            as={RouterLink}
            to="/admin/story/new"
            colorScheme="brand" 
            leftIcon={<EditIcon />}
          >
            새 Story 작성
          </Button>
        </HStack>

        {/* Story 목록 */}
        <Card 
          bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
          border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
        >
          <CardHeader>
            <Heading as="h3" size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              전체 Story 목록
            </Heading>
          </CardHeader>
          <CardBody pt={0}>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>제목</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>작성자</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>상태</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>작성일</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>발행일</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>액션</Th>
                </Tr>
              </Thead>
              <Tbody>
                {isLoading ? (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={8}>
                      <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                        데이터를 불러오는 중...
                      </Text>
                    </Td>
                  </Tr>
                ) : adminStories.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} textAlign="center" py={8}>
                      <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                        등록된 Story가 없습니다
                      </Text>
                    </Td>
                  </Tr>
                ) : (
                  adminStories.map((story) => (
                    <Tr key={story.id}>
                      <Td>
                        <Text 
                          noOfLines={1} 
                          maxW="300px"
                          color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                        >
                          {story.title}
                        </Text>
                      </Td>
                      <Td color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                        {story.author_name}
                      </Td>
                      <Td>{getStatusBadge(story)}</Td>
                      <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                        {dayjs(story.created_at).format('YYYY.MM.DD HH:mm')}
                      </Td>
                      <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                        {story.published_at 
                          ? dayjs(story.published_at).format('YYYY.MM.DD HH:mm')
                          : '-'
                        }
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          {/* 편집 버튼 */}
                          <Tooltip label="편집">
                            <IconButton
                              aria-label="Edit"
                              icon={<EditIcon />}
                              size="sm"
                              colorScheme="blue"
                              variant="outline"
                              onClick={() => navigate(`/story/${story.id}/edit`)}
                            />
                          </Tooltip>
                          
                          {canCancel(story) && (
                            <Tooltip label="5분 내 취소 가능">
                              <IconButton
                                aria-label="Cancel"
                                icon={<TimeIcon />}
                                size="sm"
                                colorScheme="orange"
                                variant="outline"
                                onClick={() => handleCancelStory(story.id)}
                              />
                            </Tooltip>
                          )}
                          
                          <Tooltip label="삭제">
                            <IconButton
                              aria-label="Delete"
                              icon={<DeleteIcon />}
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => handleDeleteStory(story.id)}
                            />
                          </Tooltip>
                        </HStack>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </CardBody>
        </Card>

        {/* 삭제 확인 다이얼로그 */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent bg={colorMode === 'dark' ? '#3c3c47' : 'white'}>
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                Story 삭제 확인
              </AlertDialogHeader>
              <AlertDialogBody color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                정말로 이 Story를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  취소
                </Button>
                <Button colorScheme="red" onClick={confirmDeleteStory} ml={3}>
                  삭제
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* 취소 확인 다이얼로그 */}
        <AlertDialog
          isOpen={isCancelOpen}
          leastDestructiveRef={cancelRef}
          onClose={onCancelClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent bg={colorMode === 'dark' ? '#3c3c47' : 'white'}>
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                Story 발행 취소
              </AlertDialogHeader>
              <AlertDialogBody color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                발행된 Story를 취소하시겠습니까? 취소된 Story는 다시 수정하여 재발행할 수 있습니다.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onCancelClose}>
                  아니요
                </Button>
                <Button colorScheme="orange" onClick={confirmCancelStory} ml={3}>
                  취소하기
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Container>
  );
};

export default AdminStory;