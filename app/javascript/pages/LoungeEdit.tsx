import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  useToast,
  Heading,
  Divider,
  useColorMode,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { DeleteIcon } from '@chakra-ui/icons';
import CustomSelect from '../components/CustomSelect';
import WYSIWYGEditor from '../components/WYSIWYGEditor';
import { sessionLoungeService } from '../services/sessionDataService';
import { useAuth } from '../contexts/AuthContext';
import { getTagById } from '../data/tags';

type LoungeType = 'question' | 'experience' | 'info' | 'free' | 'news' | 'advice' | 'recommend' | 'anonymous';

const LoungeEdit: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const postId = parseInt(id || '0');
  const toast = useToast();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const [post, setPost] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<LoungeType>('question');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 포스트 로드 및 권한 확인
  useEffect(() => {
    const foundPost = sessionLoungeService.getById(postId);
    if (!foundPost) {
      toast({
        title: "글을 찾을 수 없습니다",
        status: "error",
        duration: 3000,
      });
      navigate('/lounge');
      return;
    }

    // 권한 확인: 본인 글이거나 관리자만 편집 가능
    if (!user || (!isAdmin && foundPost.author !== user.name)) {
      toast({
        title: "권한이 없습니다",
        description: "본인이 작성한 글만 수정할 수 있습니다",
        status: "error",
        duration: 3000,
      });
      navigate('/lounge');
      return;
    }

    // 폼 데이터 설정
    setPost(foundPost);
    setTitle(foundPost.title);
    setContent(foundPost.content);
    setType(foundPost.type);
    setSelectedTags(foundPost.tags || []);
  }, [postId, user, isAdmin, navigate, toast]);

  // 기본 태그 목록
  const popularTags = [
    { id: 1, name: '채용' },
    { id: 2, name: '면접' },
    { id: 3, name: '조직문화' },
    { id: 4, name: '인사제도' },
    { id: 5, name: '성과평가' },
    { id: 6, name: '교육훈련' },
    { id: 7, name: '복리후생' },
    { id: 8, name: '노무관리' },
    { id: 9, name: '급여' },
    { id: 10, name: '퇴직' },
    { id: 11, name: '스타트업' },
    { id: 12, name: '대기업' },
    { id: 13, name: '중견기업' },
    { id: 14, name: '공기업' },
    { id: 15, name: '외국계기업' },
    { id: 16, name: 'IT' },
    { id: 17, name: '제조업' },
    { id: 18, name: '금융' },
    { id: 19, name: '유통' },
    { id: 20, name: '서비스업' },
    { id: 21, name: '신입사원' },
    { id: 22, name: '경력직' },
    { id: 23, name: '인턴' },
    { id: 24, name: '계약직' },
    { id: 25, name: '프리랜서' },
    { id: 26, name: '워라밸' },
    { id: 27, name: '커리어' },
    { id: 28, name: '승진' },
    { id: 29, name: '이직' },
    { id: 30, name: '전직' }
  ];

  const handleTagSelect = (tagName: string) => {
    if (selectedTags.length >= 5) {
      toast({
        title: "태그는 최대 5개까지 선택할 수 있어요",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    
    if (!selectedTags.includes(tagName)) {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  const handleTagRemove = (tagName: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagName));
  };

  const handleNewTagAdd = () => {
    const trimmedTag = newTagInput.trim();
    
    if (!trimmedTag) return;
    
    if (selectedTags.length >= 5) {
      toast({
        title: "태그는 최대 5개까지 선택할 수 있어요",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    
    if (selectedTags.includes(trimmedTag)) {
      toast({
        title: "이미 선택된 태그입니다",
        status: "warning",
        duration: 2000,
      });
      setNewTagInput('');
      return;
    }
    
    if (trimmedTag.length > 10) {
      toast({
        title: "태그는 10자 이내로 입력해주세요",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    
    setSelectedTags([...selectedTags, trimmedTag]);
    setNewTagInput('');
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNewTagAdd();
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "제목과 내용을 모두 입력해주세요",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 라운지 포스트 수정
      const updatedPost = sessionLoungeService.update(postId, {
        title: title.trim(),
        content: content.trim(),
        type,
        tags: selectedTags
      });
      
      console.log('라운지 포스트가 수정되었습니다:', updatedPost);
      
      toast({
        title: "✨ 글이 성공적으로 수정되었습니다!",
        status: "success",
        duration: 3000,
      });
      
      navigate(`/lounge/${postId}`);
      
    } catch (error) {
      console.error('글 수정 실패:', error);
      toast({
        title: "글 수정 중 오류가 발생했습니다",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      const success = sessionLoungeService.delete(postId);
      
      if (success) {
        toast({
          title: "글이 삭제되었습니다",
          status: "success",
          duration: 3000,
        });
        navigate('/lounge');
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      console.error('글 삭제 실패:', error);
      toast({
        title: "글 삭제 중 오류가 발생했습니다",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
      onDeleteClose();
    }
  };

  const getTypeText = (type: LoungeType) => {
    switch (type) {
      case 'question': return '질문/Q&A';
      case 'experience': return '경험담/사연 공유';
      case 'info': return '정보·팁 공유';
      case 'free': return '자유글/잡담';
      case 'news': return '뉴스에 한마디';
      case 'advice': return '같이 고민해요';
      case 'recommend': return '추천해주세요';
      case 'anonymous': return '익명 토크';
      default: return '';
    }
  };

  if (!post) {
    return null;
  }

  return (
    <Container maxW="1400px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <HStack justify="space-between" align="flex-start">
          <VStack spacing={4} align="flex-start">
            <Heading as="h1" size="xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              글 수정
            </Heading>
            <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} fontSize="lg">
              "{post.title}" 글을 수정합니다
            </Text>
          </VStack>
          
          <Button
            leftIcon={<DeleteIcon />}
            colorScheme="red"
            variant="ghost"
            onClick={onDeleteOpen}
          >
            삭제
          </Button>
        </HStack>

        <Divider />

        {/* 수정 폼 */}
        <VStack spacing={6} align="stretch">
          {/* 글 유형 선택 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              글 유형
            </FormLabel>
            <CustomSelect
              value={type}
              onChange={(value) => setType(value as LoungeType)}
              options={[
                { value: 'question', label: '질문/Q&A' },
                { value: 'experience', label: '경험담/사연 공유' },
                { value: 'info', label: '정보·팁 공유' },
                { value: 'free', label: '자유글/잡담' },
                { value: 'news', label: '뉴스에 한마디' },
                { value: 'advice', label: '같이 고민해요' },
                { value: 'recommend', label: '추천해주세요' },
                { value: 'anonymous', label: '익명 토크' }
              ]}
            />
          </FormControl>

          {/* 제목 입력 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              제목
            </FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              size="lg"
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
              _placeholder={{
                color: colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'
              }}
              _hover={{
                borderColor: colorMode === 'dark' ? '#626269' : '#9e9ea4'
              }}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
              }}
              maxLength={100}
            />
            <FormHelperText>
              {title.length}/100자
            </FormHelperText>
          </FormControl>

          {/* 내용 입력 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              내용
            </FormLabel>
            <WYSIWYGEditor
              value={content}
              onChange={setContent}
              placeholder="내용을 수정하세요..."
              minHeight="500px"
            />
          </FormControl>

          {/* 태그 선택 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              태그 ({selectedTags.length}/5)
            </FormLabel>
            
            {/* 선택된 태그 */}
            {selectedTags.length > 0 && (
              <VStack spacing={3} align="flex-start" mb={4}>
                <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                  선택된 태그:
                </Text>
                <Wrap>
                  {selectedTags.map((tag) => {
                    const tagData = getTagById(tag);
                    return (
                      <WrapItem key={tag}>
                        <Tag size="md" variant="solid" colorScheme="brand">
                          <TagLabel>{tagData ? tagData.name : tag}</TagLabel>
                          <TagCloseButton onClick={() => handleTagRemove(tag)} />
                        </Tag>
                      </WrapItem>
                    );
                  })}
                </Wrap>
              </VStack>
            )}

            {/* 직접 태그 입력 */}
            <VStack spacing={3} align="flex-start">
              <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                원하는 태그를 직접 입력하세요:
              </Text>
              <HStack w="100%">
                <Input
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyPress={handleTagInputKeyPress}
                  placeholder="태그 입력 (최대 10자)"
                  size="sm"
                  maxW="200px"
                  maxLength={10}
                  bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                  border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                  color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                  _placeholder={{
                    color: colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'
                  }}
                  disabled={selectedTags.length >= 5}
                />
                <Button 
                  size="sm" 
                  onClick={handleNewTagAdd}
                  disabled={!newTagInput.trim() || selectedTags.length >= 5}
                >
                  추가
                </Button>
              </HStack>
            </VStack>

            {/* 인기 태그 */}
            <VStack spacing={3} align="flex-start">
              <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                또는 인기 태그에서 선택하세요:
              </Text>
              <Wrap>
                {popularTags.map((tag) => (
                  <WrapItem key={tag.id}>
                    <Tag
                      size="sm"
                      variant="outline"
                      cursor="pointer"
                      borderColor={colorMode === 'dark' ? '#626269' : '#9e9ea4'}
                      color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                      _hover={{ 
                        bg: colorMode === 'dark' ? '#4d4d59' : '#e4e4e5',
                        borderColor: 'brand.500',
                        color: 'brand.500'
                      }}
                      onClick={() => handleTagSelect(tag.name)}
                      opacity={selectedTags.includes(tag.name) ? 0.5 : 1}
                    >
                      <TagLabel>{tag.name}</TagLabel>
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </VStack>
          </FormControl>
        </VStack>

        <Divider />

        {/* 버튼들 */}
        <HStack justify="flex-end" spacing={4}>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/lounge/${postId}`)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="수정 중..."
            disabled={!title.trim() || !content.trim()}
          >
            수정 완료
          </Button>
        </HStack>
      </VStack>

      {/* 삭제 확인 모달 */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>글 삭제</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              정말로 이 글을 삭제하시겠습니까?
            </Text>
            <Text mt={2} fontSize="sm" color="gray.500">
              삭제된 글과 모든 댓글, 좋아요, 북마크이 영구적으로 삭제됩니다.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              취소
            </Button>
            <Button 
              colorScheme="red"
              onClick={handleDelete}
              isLoading={isDeleting}
              loadingText="삭제 중..."
            >
              삭제
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default LoungeEdit;