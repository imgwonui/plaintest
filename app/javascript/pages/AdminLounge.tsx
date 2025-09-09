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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loungePosts } from '../mocks/lounge';
import { DeleteIcon, StarIcon, EditIcon } from '@chakra-ui/icons';
import dayjs from 'dayjs';

interface PromoteToStoryForm {
  title: string;
  content: string;
}

const AdminLounge: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { isOpen: isPromoteOpen, onOpen: onPromoteOpen, onClose: onPromoteClose } = useDisclosure();
  
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [promoteForm, setPromoteForm] = useState<PromoteToStoryForm>({
    title: '',
    content: ''
  });
  
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // 관리자가 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Lounge 글 목록 (실제로는 서버에서 가져와야 함)
  const [adminLoungePosts, setAdminLoungePosts] = useState(loungePosts);

  const handleDeletePost = (postId: number) => {
    setSelectedPostId(postId);
    onDeleteOpen();
  };

  const confirmDeletePost = () => {
    if (selectedPostId) {
      setAdminLoungePosts(prev => prev.filter(post => post.id !== selectedPostId));
      
      toast({
        title: "Lounge 글이 삭제되었습니다",
        status: "warning",
        duration: 3000,
      });
    }
    setSelectedPostId(null);
    onDeleteClose();
  };

  const handlePromoteToStory = (post: any) => {
    setSelectedPost(post);
    setPromoteForm({
      title: post.title,
      content: post.summary || "Story로 승격된 내용입니다..."
    });
    onPromoteOpen();
  };

  const confirmPromoteToStory = () => {
    if (selectedPost) {
      // 실제로는 여기서 Story 작성 API를 호출해야 함
      toast({
        title: "Story로 승격 처리되었습니다",
        description: `"${promoteForm.title}"이 Story 섹션에 게시됩니다`,
        status: "success",
        duration: 5000,
      });
      
      // 승격된 글은 Lounge에서 제거하거나 표시를 변경할 수 있음
      setAdminLoungePosts(prev => prev.map(post => 
        post.id === selectedPost.id 
          ? { ...post, isPromotedToStory: true }
          : post
      ));
    }
    setSelectedPost(null);
    setPromoteForm({ title: '', content: '' });
    onPromoteClose();
  };

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; colorScheme: string }> = {
      'question': { label: '질문/Q&A', colorScheme: 'blue' },
      'experience': { label: '경험담/사연 공유', colorScheme: 'green' },
      'info': { label: '정보·팁 공유', colorScheme: 'purple' },
      'free': { label: '자유글/잡담', colorScheme: 'gray' },
      'news': { label: '뉴스에 한마디', colorScheme: 'orange' },
      'advice': { label: '같이 고민해요', colorScheme: 'teal' },
      'recommend': { label: '추천해주세요', colorScheme: 'pink' },
      'anonymous': { label: '익명 토크', colorScheme: 'red' },
    };

    const config = typeMap[type] || { label: type, colorScheme: 'gray' };
    return <Badge colorScheme={config.colorScheme} size="sm">{config.label}</Badge>;
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
            💬 Lounge 관리
          </Heading>
          <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
            Lounge 글을 관리하고 우수한 글을 Story로 승격시킬 수 있습니다
          </Text>
        </VStack>

        <Divider />

        {/* 통계 카드 */}
        <HStack spacing={6}>
          <Card 
            p={4}
            bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
            border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
          >
            <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>전체 Lounge 글</Text>
            <Text fontSize="2xl" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              {adminLoungePosts.length}
            </Text>
          </Card>
          
          <Card 
            p={4}
            bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
            border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
          >
            <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>승격 후보 (우수글)</Text>
            <Text fontSize="2xl" fontWeight="bold" color="orange.500">
              {adminLoungePosts.filter(post => post.isExcellent).length}
            </Text>
          </Card>
          
          <Card 
            p={4}
            bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
            border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
          >
            <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>이미 승격됨</Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.500">
              {adminLoungePosts.filter(post => (post as any).isPromotedToStory).length}
            </Text>
          </Card>
        </HStack>

        {/* Lounge 글 목록 */}
        <Card 
          bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
          border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
        >
          <CardHeader>
            <Heading as="h3" size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              전체 Lounge 글 목록
            </Heading>
          </CardHeader>
          <CardBody pt={0}>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>제목</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>작성자</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>유형</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>좋아요</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>댓글</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>작성일</Th>
                  <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>액션</Th>
                </Tr>
              </Thead>
              <Tbody>
                {adminLoungePosts.map((post) => (
                  <Tr key={post.id} opacity={(post as any).isPromotedToStory ? 0.6 : 1}>
                    <Td>
                      <VStack spacing={1} align="start">
                        <Text 
                          noOfLines={1} 
                          maxW="300px"
                          color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                          fontWeight={post.isExcellent ? "600" : "normal"}
                        >
                          {post.title}
                        </Text>
                        {post.isExcellent && (
                          <HStack>
                            <Badge colorScheme="yellow" size="sm">
                              <StarIcon mr={1} boxSize={2} />
                              우수글
                            </Badge>
                          </HStack>
                        )}
                        {(post as any).isPromotedToStory && (
                          <Badge colorScheme="green" size="sm">Story 승격됨</Badge>
                        )}
                      </VStack>
                    </Td>
                    <Td color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                      {post.author}
                    </Td>
                    <Td>{getTypeBadge(post.type)}</Td>
                    <Td>
                      <Text color={post.likeCount > 50 ? "orange.500" : (colorMode === 'dark' ? '#9e9ea4' : '#626269')}>
                        {post.likeCount}
                      </Text>
                    </Td>
                    <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                      {post.commentCount}
                    </Td>
                    <Td color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                      {dayjs(post.createdAt).format('YYYY.MM.DD')}
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        {post.isExcellent && !(post as any).isPromotedToStory && (
                          <Tooltip label="Story로 승격">
                            <IconButton
                              aria-label="Promote to Story"
                              icon={<StarIcon />}
                              size="sm"
                              colorScheme="orange"
                              variant="outline"
                              onClick={() => handlePromoteToStory(post)}
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
                            onClick={() => handleDeletePost(post.id)}
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

        {/* 삭제 확인 다이얼로그 */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent bg={colorMode === 'dark' ? '#3c3c47' : 'white'}>
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                Lounge 글 삭제 확인
              </AlertDialogHeader>
              <AlertDialogBody color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                정말로 이 글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  취소
                </Button>
                <Button colorScheme="red" onClick={confirmDeletePost} ml={3}>
                  삭제
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* Story 승격 모달 */}
        <Modal isOpen={isPromoteOpen} onClose={onPromoteClose} size="xl">
          <ModalOverlay />
          <ModalContent bg={colorMode === 'dark' ? '#3c3c47' : 'white'}>
            <ModalHeader color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              Story로 승격
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={6} align="stretch">
                <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                  우수한 Lounge 글을 Story로 승격시킵니다. 내용을 편집하여 더 완성도 높은 Story로 만들어주세요.
                </Text>
                
                <FormControl>
                  <FormLabel color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                    Story 제목
                  </FormLabel>
                  <Input
                    value={promoteForm.title}
                    onChange={(e) => setPromoteForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Story 제목을 입력하세요"
                    bg={colorMode === 'dark' ? '#2c2c35' : 'white'}
                    border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                    color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                    Story 내용
                  </FormLabel>
                  <Textarea
                    value={promoteForm.content}
                    onChange={(e) => setPromoteForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Story 내용을 작성하세요"
                    minH="200px"
                    bg={colorMode === 'dark' ? '#2c2c35' : 'white'}
                    border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                    color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onPromoteClose}>
                취소
              </Button>
              <Button 
                colorScheme="brand" 
                onClick={confirmPromoteToStory}
                disabled={!promoteForm.title.trim() || !promoteForm.content.trim()}
              >
                Story로 승격
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
};

export default AdminLounge;