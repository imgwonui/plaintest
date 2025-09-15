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
import { compressImage, isImageFile, needsCompression } from '../utils/imageCompressor';

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


  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미진 파일 검증
    if (!isImageFile(file)) {
      toast({
        title: "이미진 파일만 업로드할 수 있습니다",
        status: "error",
        duration: 3000,
      });
      return;
    }

    // 최대 파일 크기 검증 (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "파일 크기가 너무 큽니다",
        description: "50MB 이하의 이미지를 선택해주세요.",
        status: "error",
        duration: 3000,
      });
      return;
    }

    let finalFile = file;

    try {
      // 5MB 이상인 경우 자동 압축 (사용자에게 알리지 않음)
      if (needsCompression(file, 5)) {
        console.log('큰 이미진 감지, 자동 압축 시작:', file.size, 'bytes');
        
        const compressionResult = await compressImage(file, {
          maxSizeMB: 5,
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8
        });

        if (compressionResult && compressionResult.compressedFile) {
          finalFile = compressionResult.compressedFile;
          console.log('이미지 압축 성공:', file.size, '→', finalFile.size, 'bytes');
        } else {
          console.warn('압축 실패, 원본 파일 사용');
          finalFile = file;
        }
      }
    } catch (compressionError) {
      console.error('이미진 압축 중 오류 발생:', compressionError);
      // 압축 실패 시 원본 파일 사용
      finalFile = file;
      console.log('압축 실패로 원본 파일 사용:', file.size, 'bytes');
    }

    // 파일 설정 및 미리보기 생성
    try {
      setThumbnailImage(finalFile);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setThumbnailPreview(event.target.result as string);
        }
      };
      
      reader.onerror = () => {
        console.error('파일 읽기 실패');
        toast({
          title: "이미직 읽기 실패",
          description: "이미지 파일을 읽는 중 오류가 발생했습니다.",
          status: "error",
          duration: 3000,
        });
      };
      
      reader.readAsDataURL(finalFile);
      
    } catch (error) {
      console.error('이미직 처리 실패:', error);
      toast({
        title: "이미짇 처리 실패",
        description: "이미짇를 처리하는 중 예상치 못한 오류가 발생했습니다. 다른 이미짇를 시도해보세요.",
        status: "error",
        duration: 4000,
      });
      
      // 에러 시 상태 초기화
      setThumbnailImage(null);
      setThumbnailPreview('');
    }
  };

  const removeThumbnailImage = () => {
    setThumbnailImage(null);
    setThumbnailPreview('');
  };

  const handleSubmit = async () => {
    // 입력 값 검증
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

    // 사용자 인증 확인
    if (!user || !isAdmin) {
      toast({
        title: "관리자 권한이 필요합니다",
        description: "스토리는 관리자만 작성할 수 있습니다.",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('==================== 스토리 작성 시작 ====================');
      console.log('👤 사용자 정보:', { 
        id: user.id, 
        name: user.name, 
        isAdmin: user.isAdmin 
      });
      console.log('📋 작성 데이터:', {
        title: title.trim(),
        summary: summary.trim(),
        contentLength: content.trim().length,
        readTime,
        tags: selectedTags,
        isVerified,
        thumbnailSize: thumbnailImage?.size
      });
      
      // 이미지 URL 준비 (실제로는 서버에 업로드 후 URL 받아와야 함)
      const imageUrl = thumbnailPreview;
      
      // 스토리 생성 데이터 준비
      const storyData = {
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim(),
        author_name: user.name,
        author_id: user.id,
        image_url: imageUrl,
        read_time: readTime,
        tags: selectedTags,
        is_verified: isVerified,
        verification_badge: isVerified ? verificationBadge : null
      };
      
      console.log('📤 Supabase로 전송할 데이터:', storyData);
      
      // 스토리 생성 시도
      const newStory = await storyService.create(storyData);
      
      console.log('✅ 스토리 생성 성공:', newStory);
      console.log('==================== 스토리 작성 완료 ====================');
      
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
      console.error('==================== 스토리 작성 오류 ====================');
      console.error('❌ 오류 상세:', error);
      
      // 에러 타입에 따른 메시지 처리
      let errorMessage = "스토리 작성 중 오류가 발생했습니다";
      let errorDescription = "";
      
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMsg = (error as Error).message;
        
        if (errorMsg.includes('RLS') || errorMsg.includes('policy')) {
          errorMessage = "데이터베이스 권한 문제";
          errorDescription = "Supabase 데이터베이스 접근 권한에 문제가 있습니다. 잠시 후 다시 시도해주세요.";
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
          errorMessage = "네트워크 연결 오류";
          errorDescription = "인터넷 연결을 확인하고 다시 시도해주세요.";
        } else if (errorMsg.includes('user') || errorMsg.includes('author')) {
          errorMessage = "사용자 인증 문제";
          errorDescription = "로그아웃 후 다시 로그인해주세요.";
        }
      }
      
      toast({
        title: errorMessage,
        description: errorDescription,
        status: "error",
        duration: 5000,
      });
      
      console.error('==================== 에러 처리 완료 ====================');
      
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