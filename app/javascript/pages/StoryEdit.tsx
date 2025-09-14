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
  Image,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Switch,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { CloseIcon, DeleteIcon } from '@chakra-ui/icons';
import WYSIWYGEditor from '../components/WYSIWYGEditor';
import { storyService } from '../services/supabaseDataService';
import { useAuth } from '../contexts/AuthContext';
import { getTagById } from '../data/tags';
import TagSelector from '../components/TagSelector';

const StoryEdit: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const storyId = parseInt(id || '0');
  const toast = useToast();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const [story, setStory] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [readTime, setReadTime] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationBadge, setVerificationBadge] = useState('');

  // 스토리 로드 및 권한 확인
  useEffect(() => {
    const loadStory = async () => {
      try {
        const foundStory = await storyService.getById(storyId);
        if (!foundStory) {
          toast({
            title: "스토리를 찾을 수 없습니다",
            status: "error",
            duration: 3000,
          });
          navigate('/story');
          return;
        }

        // 권한 확인: 관리자만 편집 가능
        if (!isAdmin) {
          toast({
            title: "권한이 없습니다",
            description: "관리자만 스토리를 수정할 수 있습니다",
            status: "error",
            duration: 3000,
          });
          navigate('/story');
          return;
        }

        // 폼 데이터 설정
        setStory(foundStory);
        setTitle(foundStory.title);
        setContent(foundStory.content);
        setSummary(foundStory.summary);
        setReadTime(foundStory.read_time || 5);
        setSelectedTags(foundStory.tags || []);
        setIsVerified(foundStory.is_verified || false);
        setVerificationBadge(foundStory.verification_badge || '');
        if (foundStory.image_url) {
          setThumbnailPreview(foundStory.image_url);
        }
      } catch (error) {
        console.error('스토리 로드 실패:', error);
        toast({
          title: "스토리 로드 실패",
          description: "스토리를 불러오는 중 오류가 발생했습니다",
          status: "error",
          duration: 3000,
        });
        navigate('/story');
      }
    };
    
    loadStory();
  }, [storyId, isAdmin, navigate, toast]);



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "파일 크기가 너무 큽니다",
          description: "5MB 이하의 이미지를 선택해주세요",
          status: "error",
          duration: 3000,
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "이미지 파일만 업로드할 수 있습니다",
          status: "error",
          duration: 3000,
        });
        return;
      }

      setThumbnailImage(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setThumbnailPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeThumbnailImage = () => {
    setThumbnailImage(null);
    setThumbnailPreview('');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !summary.trim()) {
      toast({
        title: "필수 필드를 모두 입력해주세요",
        description: "제목, 요약, 내용은 필수입니다",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 이미지 처리
      let imageUrl = story?.image_url;
      if (thumbnailImage) {
        imageUrl = thumbnailPreview; // 실제로는 서버에 업로드해야 함
      }
      
      // 이미지는 필수
      if (!imageUrl && !thumbnailPreview) {
        toast({
          title: "썸네일 이미지를 업로드해주세요",
          description: "스토리에는 썸네일 이미지가 필요합니다",
          status: "error",
          duration: 3000,
        });
        return;
      }
      
      // 스토리 수정 (모든 필드 포함)
      const updatedStory = await storyService.update(storyId, {
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim(),
        image_url: imageUrl,
        read_time: readTime,
        tags: selectedTags,
        is_verified: isVerified,
        verification_badge: isVerified ? verificationBadge : null
      });
      
      console.log('스토리가 수정되었습니다:', updatedStory);
      
      toast({
        title: "✨ 스토리가 성공적으로 수정되었습니다!",
        status: "success",
        duration: 3000,
      });
      
      navigate(`/story/${storyId}`);
      
    } catch (error) {
      console.error('스토리 수정 실패:', error);
      toast({
        title: "스토리 수정 중 오류가 발생했습니다",
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
      const success = await storyService.delete(storyId);
      
      if (success) {
        toast({
          title: "스토리가 삭제되었습니다",
          status: "success",
          duration: 3000,
        });
        navigate('/story');
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      console.error('스토리 삭제 실패:', error);
      toast({
        title: "스토리 삭제 중 오류가 발생했습니다",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
      onDeleteClose();
    }
  };

  if (!story) {
    return null;
  }

  return (
    <Container maxW="1400px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <HStack justify="space-between" align="flex-start">
          <VStack spacing={4} align="flex-start">
            <Heading as="h1" size="xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              Story 수정
            </Heading>
            <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} fontSize="lg">
              "{story.title}" 스토리를 수정합니다
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
          {/* 제목 입력 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              제목 *
            </FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="스토리 제목을 입력하세요"
              size="lg"
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
              _placeholder={{ color: colorMode === 'dark' ? '#7e7e87' : '#9e9ea4' }}
              _hover={{ borderColor: colorMode === 'dark' ? '#626269' : '#9e9ea4' }}
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

          {/* 요약 입력 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              요약 *
            </FormLabel>
            <Input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="스토리 요약을 입력하세요"
              size="lg"
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
              _placeholder={{ color: colorMode === 'dark' ? '#7e7e87' : '#9e9ea4' }}
              _hover={{ borderColor: colorMode === 'dark' ? '#626269' : '#9e9ea4' }}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
              }}
              maxLength={200}
            />
            <FormHelperText>
              {summary.length}/200자
            </FormHelperText>
          </FormControl>

          {/* 썸네일 이미지 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              썸네일 이미지 *
            </FormLabel>
            
            {thumbnailPreview ? (
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Image
                    src={thumbnailPreview}
                    alt="썸네일 미리보기"
                    w="200px"
                    h="120px"
                    objectFit="cover"
                    borderRadius="md"
                    border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                  />
                  <IconButton
                    aria-label="이미지 제거"
                    icon={<CloseIcon />}
                    size="sm"
                    colorScheme="red"
                    onClick={removeThumbnailImage}
                  />
                </HStack>
              </VStack>
            ) : (
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                _hover={{ borderColor: colorMode === 'dark' ? '#626269' : '#9e9ea4' }}
              />
            )}
            
            <FormHelperText>
              권장 크기: 400x240px, 최대 5MB
            </FormHelperText>
          </FormControl>

          {/* 예상 읽기 시간 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              예상 읽기 시간 (분)
            </FormLabel>
            <Input
              type="number"
              value={readTime}
              onChange={(e) => setReadTime(parseInt(e.target.value) || 1)}
              min={1}
              max={60}
              size="md"
              w="120px"
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
              _hover={{ borderColor: colorMode === 'dark' ? '#626269' : '#9e9ea4' }}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
              }}
            />
          </FormControl>

          {/* 내용 입력 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              내용 *
            </FormLabel>
            <WYSIWYGEditor
              value={content}
              onChange={setContent}
              placeholder="스토리 내용을 수정하세요..."
              minHeight="500px"
            />
          </FormControl>

          {/* 태그 선택 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              태그
            </FormLabel>
            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              maxTags={5}
              placeholder="스토리와 관련된 태그를 선택해주세요"
            />
            <FormHelperText>
              관련 태그를 선택하면 독자가 찾기 쉬워집니다
            </FormHelperText>
          </FormControl>

          {/* 검수 배지 설정 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              검수 배지 설정
            </FormLabel>
            <VStack spacing={4} align="stretch">
              <HStack spacing={4}>
                <Switch
                  isChecked={isVerified}
                  onChange={(e) => {
                    setIsVerified(e.target.checked);
                    if (e.target.checked && !verificationBadge) {
                      setVerificationBadge('페이롤 아웃소싱 전문회사인 월급날에서 검수한 글이에요.');
                    } else if (!e.target.checked) {
                      setVerificationBadge('');
                    }
                  }}
                  colorScheme="brand"
                />
                <Text color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  검수 완료 배지 표시
                </Text>
              </HStack>
              
              {isVerified && (
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="400" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                    배지 문구
                  </FormLabel>
                  <Input
                    value={verificationBadge}
                    onChange={(e) => setVerificationBadge(e.target.value)}
                    placeholder="검수 배지에 표시할 문구를 입력하세요"
                    bg={colorMode === 'dark' ? '#2c2c35' : 'white'}
                    border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                    color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                    maxLength={100}
                  />
                  <FormHelperText>
                    Story 상단에 초록색 배지로 표시됩니다. (예: "페이롤 아웃소싱 전문회사인 월급날에서 검수한 글이에요.")
                  </FormHelperText>
                </FormControl>
              )}
            </VStack>
          </FormControl>
        </VStack>

        <Divider />

        {/* 버튼들 */}
        <HStack justify="flex-end" spacing={4}>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/story/${storyId}`)}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="수정 중..."
            disabled={!title.trim() || !content.trim() || !summary.trim()}
          >
            수정 완료
          </Button>
        </HStack>
      </VStack>

      {/* 삭제 확인 모달 */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>스토리 삭제</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>
              정말로 이 스토리를 삭제하시겠습니까?
            </Text>
            <Text mt={2} fontSize="sm" color="gray.500">
              삭제된 스토리와 모든 댓글, 좋아요, 북마크이 영구적으로 삭제됩니다.
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

export default StoryEdit;