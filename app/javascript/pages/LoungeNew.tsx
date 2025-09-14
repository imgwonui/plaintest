import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
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
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import WYSIWYGEditor from '../components/WYSIWYGEditor';
// 태그는 API 연결 후 동적으로 로드 예정
import { loungeService } from '../services/supabaseDataService';
import { useAuth } from '../contexts/AuthContext';
import TagSelector from '../components/TagSelector';
import PromotionBadge from '../components/PromotionBadge';

type LoungeType = 'question' | 'experience' | 'info' | 'free' | 'news' | 'advice' | 'recommend' | 'anonymous';

const LoungeNew: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<LoungeType>('question');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "제목과 내용을 모두 입력해주세요",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (!user) {
      toast({
        title: "로그인이 필요합니다",
        status: "error",
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 실제 글 작성 - Supabase에 저장
      const newPost = await loungeService.create({
        title: title.trim(),
        content: content.trim(),
        author_id: user.id,
        author_name: type === 'anonymous' ? '익명' : user.name,
        type,
        tags: selectedTags
      });
      
      console.log('새 글이 생성되었습니다:', newPost);
      
      toast({
        title: "✨ 글이 성공적으로 등록되었습니다!",
        description: "라운지에서 확인하실 수 있습니다.",
        status: "success",
        duration: 3000,
      });
      
      // 라운지 목록으로 이동 (state로 새로고침 신호 전달)
      navigate('/lounge', { 
        state: { 
          refresh: true, 
          timestamp: Date.now() 
        },
        replace: false 
      });
      
    } catch (error) {
      console.error('글 작성 실패:', error);
      toast({
        title: "글 작성 중 오류가 발생했습니다",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSubmitting(false);
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

  const getPlaceholderText = (type: LoungeType) => {
    switch (type) {
      case 'question': 
        return "궁금한 점이나 도움이 필요한 상황을 자세히 설명해주세요.\n\n예시:\n- 현재 상황과 배경\n- 시도해본 것들\n- 구체적으로 알고 싶은 점\n\n실전 사례일수록 더 좋아요. 민감정보는 가려주세요.";
      case 'experience':
        return "겪으신 경험을 구체적으로 공유해주세요.\n\n예시:\n- 상황 설명\n- 문제 해결 과정\n- 결과와 배운 점\n- 다른 분들께 드리고 싶은 조언\n\n실전 사례일수록 더 좋아요. 민감정보는 가려주세요.";
      case 'info':
        return "다른 분들께 도움이 될 정보나 팁을 공유해주세요.\n\n예시:\n- 유용한 도구나 방법론\n- 효과적인 프로세스\n- 참고할 만한 자료\n- 주의사항이나 고려사항\n\n실전 사례일수록 더 좋아요. 민감정보는 가려주세요.";
      case 'free':
        return "자유롭게 하고 싶은 이야기를 써주세요.\n\n예시:\n- 일상적인 고민이나 생각\n- 가벼운 수다나 잡담\n- 개인적인 경험담\n- 업무 중 재미있었던 일\n\n편하게 작성해주세요!";
      case 'news':
        return "뉴스나 업계 소식에 대한 짧은 의견을 남겨주세요.\n\n예시:\n- 관련 뉴스 링크나 요약\n- 개인적인 견해나 생각\n- 업계에 미칠 영향 분석\n- 동료들의 의견이 궁금한 점\n\n속도감 있는 소통을 위해 간결하게 작성해주세요!";
      case 'advice':
        return "딜레마나 선택 상황에 대한 조언을 구해주세요.\n\n예시:\n- 현재 고민하는 상황\n- 가능한 선택지들\n- 각 선택지의 장단점\n- 결정에 고려하는 요소들\n\n투표 기능과 함께 활용하면 더 좋아요!";
      case 'recommend':
        return "추천받고 싶은 것을 구체적으로 적어주세요.\n\n예시:\n- 추천받고 싶은 분야 (책, 서비스, 툴, 강의 등)\n- 사용 목적이나 상황\n- 예산이나 조건\n- 현재 사용 중인 것들\n\n구체적일수록 더 정확한 추천을 받을 수 있어요!";
      case 'anonymous':
        return "익명으로 민감한 주제를 편히 이야기해주세요.\n\n예시:\n- 직장 내 고민이나 갈등\n- 말하기 어려운 상황들\n- 개인적인 고충\n- 조심스러운 주제들\n\n익명이니 편하게 털어놓으세요. 따뜻한 조언을 받으실 수 있을 거예요.";
      default: return "";
    }
  };

  return (
    <Container maxW="1400px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <VStack spacing={4} align="flex-start">
          <Heading as="h1" size="xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            글쓰기
          </Heading>
          <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} fontSize="lg">
            동료들과 경험과 노하우를 나눠보세요
          </Text>
        </VStack>

        <Divider />

        {/* 글쓰기 폼 */}
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
            <FormHelperText>
              {type === 'question' && "궁금한 점이나 조언이 필요한 상황을 공유해주세요"}
              {type === 'experience' && "겪으신 경험담을 다른 분들과 나눠주세요"}  
              {type === 'info' && "다른 분들께 유용한 정보나 팁을 공유해주세요"}
              {type === 'free' && "자유롭게 하고 싶은 이야기를 편하게 써주세요"}
              {type === 'news' && "뉴스나 업계 소식에 대한 짧은 의견을 남겨주세요"}
              {type === 'advice' && "딜레마나 선택 상황에 대한 조언을 구해주세요"}
              {type === 'recommend' && "책,서비스, 툴, 강의 등 추천을 요청해주세요"}
              {type === 'anonymous' && "익명으로 민감한 주제를 편히 이야기해주세요"}
            </FormHelperText>
          </FormControl>

          {/* Story 승격 안내 */}
          {(type === 'info' || type === 'news') && (
            <Box
              p={4}
              bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'}
              border="1px"
              borderColor={colorMode === 'dark' ? 'blue.700' : 'blue.200'}
              borderRadius="lg"
            >
              <HStack spacing={2} mb={2}>
                <Text fontSize="sm" fontWeight="600" color={colorMode === 'dark' ? 'blue.200' : 'blue.700'}>
                  🚀 Story 승격 기회
                </Text>
              </HStack>
              <Text fontSize="sm" color={colorMode === 'dark' ? 'blue.100' : 'blue.600'} lineHeight="1.5">
                이 글 유형은 50개 이상의 좋아요를 받으면 Story로 승격될 수 있어요! 
                좋은 정보와 팁을 공유해서 더 많은 사람들에게 도움을 주세요.
              </Text>
            </Box>
          )}

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
              {title.length}/100자 - 구체적이고 명확한 제목을 작성해주세요
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
              placeholder={getPlaceholderText(type)}
              minHeight="500px"
            />
            <FormHelperText>
              실시간으로 서식이 적용되는 에디터입니다. 텍스트를 선택 후 툴바의 버튼들을 사용하여 볼드, 이탤릭, 형광펜 등 다양한 서식을 적용하고, 이미지 버튼으로 이미지를 업로드할 수 있습니다.
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
              placeholder="글과 관련된 태그를 선택해주세요"
            />
            <FormHelperText>
              글 내용과 관련된 태그를 선택하면 다른 사용자가 찾기 쉬워집니다
            </FormHelperText>
          </FormControl>
        </VStack>

        <Divider />

        {/* 작성 완료 버튼 */}
        <HStack justify="flex-end" spacing={4}>
          <Button 
            variant="outline" 
            onClick={() => navigate('/lounge')}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="등록 중..."
            disabled={!title.trim() || !content.trim()}
          >
            글 등록하기
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
};

export default LoungeNew;