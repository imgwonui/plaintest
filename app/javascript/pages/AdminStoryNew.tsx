import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  useToast,
  useColorMode,
  Divider,
  Select,
  Card,
  CardBody,
  Badge,
  Image,
  IconButton,
  Tooltip,
  Switch,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import WYSIWYGEditor from '../components/WYSIWYGEditor';
import { AttachmentIcon, DeleteIcon, CloseIcon } from '@chakra-ui/icons';
import { storyService } from '../services/supabaseDataService';
import { compressImage, isImageFile, needsCompression } from '../utils/imageCompressor';

interface StoryForm {
  title: string;
  summary: string;
  content: string;
  category: 'recruitment' | 'interview' | 'culture' | 'management' | 'startup' | 'career';
  readTime: number;
  imageUrl?: string;
  tags: string[];
  isVerified: boolean;
  verificationBadge?: string;
}

const AdminStoryNew: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // 관리자가 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const [storyForm, setStoryForm] = useState<StoryForm>({
    title: '',
    summary: '',
    content: '',
    category: 'recruitment',
    readTime: 5,
    tags: [],
    isVerified: false,
    verificationBadge: '',
  });

  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 썸네일 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이미지 파일 검증
    if (!isImageFile(file)) {
      toast({
        title: "이미지 파일만 업로드할 수 있습니다",
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
      // 5MB 이상인 경우 자동 압축
      if (needsCompression(file, 5)) {
        console.log('큰 이미지 감지, 자동 압축 시작:', file.size, 'bytes');
        
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
      console.error('이미지 압축 중 오류 발생:', compressionError);
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
          title: "이미지 읽기 실패",
          description: "이미지 파일을 읽는 중 오류가 발생했습니다.",
          status: "error",
          duration: 3000,
        });
      };
      
      reader.readAsDataURL(finalFile);
      
    } catch (error) {
      console.error('이미지 처리 실패:', error);
      toast({
        title: "이미지 처리 실패",
        description: "이미지를 처리하는 중 예상치 못한 오류가 발생했습니다. 다른 이미지를 시도해보세요.",
        status: "error",
        duration: 4000,
      });
      
      // 에러 시 상태 초기화
      setThumbnailImage(null);
      setThumbnailPreview('');
    }
  };

  // 썸네일 이미지 제거
  const removeThumbnailImage = () => {
    setThumbnailImage(null);
    setThumbnailPreview('');
  };

  const handleSubmit = async () => {
    if (!storyForm.title.trim() || !storyForm.content.trim() || !storyForm.summary.trim()) {
      toast({
        title: "필수 입력 항목을 확인해주세요",
        description: "제목, 요약, 내용은 필수 입력 사항입니다",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (!thumbnailImage || !thumbnailPreview) {
      toast({
        title: "썸네일 이미지를 업로드해주세요",
        description: "Story에는 썸네일 이미지가 필요합니다",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('📝 관리자 스토리 생성 시작:', storyForm);
      
      // 이미지 URL 준비 (실제로는 서버에 업로드 후 URL 받아와야 함)
      const imageUrl = thumbnailPreview;

      // Supabase에 Story 저장 (검수 배지 및 썸네일 포함)
      const storyData = {
        title: storyForm.title.trim(),
        content: storyForm.content.trim(),
        summary: storyForm.summary.trim(),
        author_name: user?.name || '관리자',
        image_url: imageUrl,
        read_time: storyForm.readTime,
        is_verified: storyForm.isVerified,
        verification_badge: storyForm.isVerified ? storyForm.verificationBadge : null
      };
      
      console.log('📝 전송할 스토리 데이터:', storyData);
      
      const newStory = await storyService.create(storyData);
      
      console.log('✅ 관리자 스토리 생성 성공:', newStory);
      
      toast({
        title: "✨ Story가 성공적으로 생성되었습니다!",
        description: "데이터베이스에 저장되었습니다",
        status: "success",
        duration: 5000,
      });
      
      // Story 관리 페이지로 이동
      navigate('/admin/story');
      
    } catch (error) {
      console.error('❌ 관리자 스토리 생성 실패:', error);
      toast({
        title: "생성 실패",
        description: "Story 생성 중 오류가 발생했습니다",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryText = (category: string) => {
    const categoryMap: Record<string, string> = {
      'recruitment': '채용',
      'interview': '면접',
      'culture': '조직문화',
      'management': '인사관리',
      'startup': '스타트업',
      'career': '커리어',
    };
    return categoryMap[category] || category;
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Container maxW="1400px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <VStack spacing={4} align="flex-start">
          <HStack>
            <Button 
              as={RouterLink} 
              to="/admin/story" 
              variant="ghost" 
              size="sm"
              color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
            >
              ← Story 관리로
            </Button>
          </HStack>
          <Heading as="h1" size="xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            ✍️ 새 Story 작성
          </Heading>
          <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
            관리자가 작성하는 Story는 즉시 발행되며, 5분 내에 취소할 수 있습니다
          </Text>
        </VStack>

        <Divider />

        {/* Story 작성 폼 */}
        <VStack spacing={6} align="stretch">
          {/* 카테고리 선택 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              카테고리
            </FormLabel>
            <Select
              value={storyForm.category}
              onChange={(e) => setStoryForm(prev => ({ ...prev, category: e.target.value as any }))}
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
            >
              <option value="recruitment">채용</option>
              <option value="interview">면접</option>
              <option value="culture">조직문화</option>
              <option value="management">인사관리</option>
              <option value="startup">스타트업</option>
              <option value="career">커리어</option>
            </Select>
            <FormHelperText>
              Story의 주제 카테고리를 선택해주세요
            </FormHelperText>
          </FormControl>

          {/* 제목 입력 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              제목 *
            </FormLabel>
            <Input
              value={storyForm.title}
              onChange={(e) => setStoryForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="매력적이고 구체적인 제목을 작성해주세요"
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
              {storyForm.title.length}/100자
            </FormHelperText>
          </FormControl>

          {/* 요약 입력 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              요약 *
            </FormLabel>
            <Input
              value={storyForm.summary}
              onChange={(e) => setStoryForm(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="Story의 핵심 내용을 한 줄로 요약해주세요"
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
              maxLength={150}
            />
            <FormHelperText>
              {storyForm.summary.length}/150자 - Story 목록에서 표시되는 요약문입니다
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
              권장 크기: 400x240px, 최대 50MB (자동 압축됩니다)
            </FormHelperText>
          </FormControl>

          {/* 예상 읽기 시간 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              예상 읽기 시간
            </FormLabel>
            <HStack spacing={4}>
              <Select
                value={storyForm.readTime}
                onChange={(e) => setStoryForm(prev => ({ ...prev, readTime: parseInt(e.target.value) }))}
                maxW="200px"
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
              >
                <option value={3}>3분</option>
                <option value={5}>5분</option>
                <option value={7}>7분</option>
                <option value={10}>10분</option>
                <option value={15}>15분</option>
                <option value={20}>20분 이상</option>
              </Select>
              <Badge colorScheme="blue" px={3} py={1}>
                {storyForm.readTime}분 읽기
              </Badge>
            </HStack>
            <FormHelperText>
              독자가 이 Story를 읽는 데 걸리는 예상 시간입니다
            </FormHelperText>
          </FormControl>

          {/* 내용 입력 */}
          <FormControl>
            <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              Story 내용 *
            </FormLabel>
            <WYSIWYGEditor
              value={storyForm.content}
              onChange={(value) => setStoryForm(prev => ({ ...prev, content: value }))}
              placeholder="풍부한 서식을 활용해 Story를 작성해주세요.

📝 작성 팁:
- 제목, 소제목을 활용해 구조를 명확히 하세요
- 중요한 내용은 굵게 표시하고 핵심은 형광펜으로 강조하세요
- 구체적인 사례와 경험을 포함해주세요
- 독자에게 도움이 되는 실용적인 정보를 제공하세요"
              minHeight="500px"
            />
            <FormHelperText>
              실시간으로 서식이 적용되는 WYSIWYG 에디터입니다. 툴바의 버튼들로 볼드, 이탤릭, 형광펜, 글씨 색상 등을 적용하고, 이미지 업로드 및 드래그로 위치 이동과 크기 조절이 가능합니다.
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
                  isChecked={storyForm.isVerified}
                  onChange={(e) => setStoryForm(prev => ({ 
                    ...prev, 
                    isVerified: e.target.checked,
                    verificationBadge: e.target.checked ? prev.verificationBadge || '페이롤 아웃소싱 전문회사인 월급날에서 검수한 글이에요.' : ''
                  }))}
                  colorScheme="brand"
                />
                <Text color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  검수 완료 배지 표시
                </Text>
              </HStack>
              
              {storyForm.isVerified && (
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="400" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                    배지 문구
                  </FormLabel>
                  <Input
                    value={storyForm.verificationBadge}
                    onChange={(e) => setStoryForm(prev => ({ ...prev, verificationBadge: e.target.value }))}
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

        {/* 발행 버튼 */}
        <Card 
          bg={colorMode === 'dark' ? '#3c3c47' : '#f8f9fa'}
          border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
        >
          <CardBody>
            <VStack spacing={4}>
              <VStack spacing={2}>
                <Text fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  ⚡ 관리자 즉시 발행
                </Text>
                <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} textAlign="center">
                  관리자가 작성하는 Story는 검수 없이 즉시 발행됩니다.<br />
                  발행 후 5분 이내에 Story 관리 페이지에서 취소할 수 있습니다.
                </Text>
              </VStack>
              
              <HStack spacing={4}>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/admin/story')}
                  disabled={isSubmitting}
                >
                  취소
                </Button>
                <Button
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  loadingText="발행 중..."
                  disabled={!storyForm.title.trim() || !storyForm.content.trim() || !storyForm.summary.trim() || !thumbnailImage}
                  size="lg"
                  px={8}
                >
                  즉시 발행하기
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default AdminStoryNew;