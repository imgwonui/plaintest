import React, { useState } from 'react';
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
  Switch,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { CloseIcon } from '@chakra-ui/icons';
import WYSIWYGEditor from '../components/WYSIWYGEditor';
import { storyService } from '../services/supabaseDataService';
import { useAuth } from '../contexts/AuthContext';
import TagSelector from '../components/TagSelector';

const StoryNew: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [readTime, setReadTime] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(true); // 관리자가 작성하므로 기본 검수됨
  const [verificationBadge, setVerificationBadge] = useState('페이롤 아웃소싱 전문회사인 월급날에서 검수한 글이에요.');

  // 관리자가 아니면 접근 불가
  React.useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "접근 권한이 없습니다",
        description: "관리자만 스토리를 작성할 수 있습니다",
        status: "error",
        duration: 3000,
      });
      navigate('/');
    }
  }, [isAdmin, navigate, toast]);


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB 제한
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
      
      // 미리보기 생성
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

    if (!thumbnailImage) {
      toast({
        title: "썸네일 이미지를 업로드해주세요",
        description: "스토리에는 썸네일 이미지가 필요합니다",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 실제로는 이미지를 서버에 업로드하고 URL을 받아와야 함
      // 여기서는 데모용으로 썸네일 미리보기 URL을 사용
      const imageUrl = thumbnailPreview;
      
      // 스토리 생성
      console.log('🔍 스토리 생성 전 검수 상태:', {
        isVerified
      });
      
      console.log('📝 스토리 생성 데이터 준비:', {
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim(),
        author_name: user?.name || '관리자'
      });
      
      const newStory = await storyService.create({
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim(),
        author_name: user?.name || '관리자',
        author_id: user?.id,
        image_url: imageUrl,
        read_time: readTime,
        tags: selectedTags,
        is_verified: isVerified
      });
      
      console.log('✅ 새 스토리가 생성되었습니다:', newStory);
      console.log('🔍 생성된 스토리의 검수 정보:', {
        is_verified: newStory.is_verified
      });
      
      toast({
        title: "✨ 스토리가 성공적으로 등록되었습니다!",
        description: "스토리 목록에서 확인하실 수 있습니다.",
        status: "success",
        duration: 3000,
      });
      
      // 스토리 목록으로 이동
      navigate('/story', { 
        state: { 
          refresh: true, 
          timestamp: Date.now() 
        },
        replace: false 
      });
      
    } catch (error) {
      console.error('스토리 작성 실패:', error);
      toast({
        title: "스토리 작성 중 오류가 발생했습니다",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) {
    return null; // 관리자가 아니면 아무것도 렌더링하지 않음
  }

  return (
    <Container maxW="1400px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <VStack spacing={4} align="flex-start">
          <Heading as="h1" size="xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            Story 작성
          </Heading>
          <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} fontSize="lg">
            전문적인 인사 관련 콘텐츠를 작성해주세요
          </Text>
        </VStack>

        <Divider />

        {/* 작성 폼 */}
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
              {title.length}/100자 - 독자의 관심을 끄는 명확한 제목을 작성해주세요
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
              placeholder="스토리 요약을 입력하세요 (카드에 표시됩니다)"
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
              {summary.length}/200자 - 독자가 한눈에 이해할 수 있는 핵심 내용을 요약해주세요
            </FormHelperText>
          </FormControl>

          {/* 썸네일 이미지 업로드 */}
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
              권장 크기: 400x240px, 최대 5MB (JPG, PNG, WebP)
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
            <FormHelperText>
              독자가 이 글을 읽는데 걸리는 예상 시간을 입력하세요
            </FormHelperText>
          </FormControl>

          {/* 내용 입력 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              내용 *
            </FormLabel>
            <WYSIWYGEditor
              value={content}
              onChange={setContent}
              placeholder="전문적인 스토리 내용을 작성해주세요..."
              minHeight="500px"
            />
            <FormHelperText>
              실시간으로 서식이 적용되는 에디터입니다. 툴바의 버튼들을 사용하여 텍스트 서식을 적용하고, 형광펜 기능과 이미지 업로드를 활용해보세요.
            </FormHelperText>
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

        {/* 작성 완료 버튼 */}
        <HStack justify="flex-end" spacing={4}>
          <Button 
            variant="outline" 
            onClick={() => navigate('/story')}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="등록 중..."
            disabled={!title.trim() || !content.trim() || !summary.trim() || !thumbnailImage}
          >
            스토리 등록하기
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
};

export default StoryNew;