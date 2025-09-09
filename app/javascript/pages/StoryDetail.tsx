import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Image,
  Tag,
  TagLabel,
  Divider,
  SimpleGrid,
  Heading,
  Badge,
  useColorMode,
  Button,
  useToast,
  Flex,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { StarIcon, AttachmentIcon, ExternalLinkIcon, LinkIcon } from '@chakra-ui/icons';
import Card from '../components/Card';
import { CommentList, CommentForm } from '../components/Comment';
import EmptyState from '../components/EmptyState';
import AdminHint from '../components/AdminHint';
import { useAuth } from '../contexts/AuthContext';
import { stories } from '../mocks/stories';
import { comments } from '../mocks/comments';
import { formatDate } from '../utils/format';

const StoryDetail: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const storyId = parseInt(id || '0');
  
  const [storyComments, setStoryComments] = useState(
    comments.filter(c => c.postId === storyId && c.postType === 'story')
  );
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(story?.likeCount || 0);
  const [scrapCount, setScrapCount] = useState(story?.scrapCount || 0);
  const [headings, setHeadings] = useState<Array<{id: string, text: string, level: number}>>([]);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const story = stories.find(s => s.id === storyId);
  
  const handleLike = () => {
    const newLikeCount = isLiked ? likeCount - 1 : likeCount + 1;
    setLikeCount(newLikeCount);
    setIsLiked(!isLiked);
    
    toast({
      title: isLiked ? "좋아요를 취소했습니다" : "좋아요를 눌렀습니다",
      status: "success",
      duration: 2000,
    });
  };

  const handleBookmark = () => {
    const newScrapCount = isBookmarked ? scrapCount - 1 : scrapCount + 1;
    setScrapCount(newScrapCount);
    setIsBookmarked(!isBookmarked);
    
    toast({
      title: isBookmarked ? "북마크를 해제했습니다" : "북마크에 추가했습니다",
      status: "success",
      duration: 2000,
    });
  };
  
  // H1, H2 태그를 찾아서 내비게이션 메뉴 생성
  useEffect(() => {
    if (!story) return;
    
    const h1Regex = /^# (.+)$/gm;
    const h2Regex = /^## (.+)$/gm;
    const matches = [];
    
    // H1 태그 찾기
    let match;
    while ((match = h1Regex.exec(story.content)) !== null) {
      const id = match[1].toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      matches.push({
        id,
        text: match[1],
        level: 1,
        index: match.index
      });
    }
    
    // H2 태그 찾기
    story.content.replace(/^## (.+)$/gm, (match, text, index) => {
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      matches.push({
        id,
        text,
        level: 2,
        index
      });
      return match;
    });
    
    // 인덱스 순서로 정렬
    matches.sort((a, b) => a.index - b.index);
    
    setHeadings(matches);
  }, [story]);
  
  // 스크롤 시 현재 섹션 감지
  useEffect(() => {
    const handleScroll = () => {
      if (headings.length === 0) return;
      
      const scrollTop = window.pageYOffset;
      const viewportHeight = window.innerHeight;
      const scrollPosition = scrollTop + viewportHeight / 3; // 화면 상단 1/3 지점을 기준으로
      
      let currentActiveId = '';
      let closestDistance = Infinity;
      
      // 각 헤딩의 위치를 확인하여 가장 가까운 것을 찾기
      headings.forEach(heading => {
        const element = document.getElementById(heading.id);
        if (element) {
          const elementTop = element.getBoundingClientRect().top + scrollTop;
          const distance = Math.abs(scrollPosition - elementTop);
          
          // 현재 스크롤 위치보다 위에 있으면서 가장 가까운 헤딩을 찾기
          if (elementTop <= scrollPosition && distance < closestDistance) {
            closestDistance = distance;
            currentActiveId = heading.id;
          }
        }
      });
      
      // 만약 아무것도 찾지 못했다면 첫 번째 헤딩을 활성화
      if (!currentActiveId && headings.length > 0) {
        const firstElement = document.getElementById(headings[0].id);
        if (firstElement) {
          const firstElementTop = firstElement.getBoundingClientRect().top + scrollTop;
          if (scrollPosition >= firstElementTop - 200) {
            currentActiveId = headings[0].id;
          }
        }
      }
      
      setActiveHeading(currentActiveId);
    };
    
    // 디바운스 적용
    let timeoutId: NodeJS.Timeout;
    const debouncedHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 50);
    };
    
    // 초기 로드 시에도 실행
    handleScroll();
    
    window.addEventListener('scroll', debouncedHandleScroll);
    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
      clearTimeout(timeoutId);
    };
  }, [headings]);
  
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -120; // 헤더와 여백을 고려한 오프셋
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
      
      // 스크롤 완료 후 active 상태 설정
      setTimeout(() => {
        setActiveHeading(id);
      }, 100);
    }
  };
  
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: story?.title,
        text: story?.summary,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: '링크가 복사되었습니다',
        status: 'success',
        duration: 2000,
      });
    }
  };
  
  const relatedStories = useMemo(() => {
    if (!story) return [];
    
    return stories
      .filter(s => 
        s.id !== storyId && 
        s.tags.some(tag => story.tags.includes(tag))
      )
      .slice(0, 3);
  }, [story, storyId]);

  const handleCommentSubmit = async (content: string, author?: string, password?: string) => {
    setIsSubmittingComment(true);
    
    // 실제 구현에서는 API 호출
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newComment = {
      id: Date.now(),
      postId: storyId,
      postType: 'story' as const,
      author: user ? user.name : (author || "익명"),
      content,
      createdAt: new Date().toISOString(),
      isGuest: !user,
      guestPassword: password // 실제로는 해시화해서 저장
    };
    
    setStoryComments([...storyComments, newComment]);
    setIsSubmittingComment(false);
  };

  if (!story) {
    return (
      <Container maxW="800px" py={8}>
        <EmptyState
          title="스토리를 찾을 수 없어요"
          description="요청하신 스토리가 존재하지 않거나 삭제되었습니다"
          actionText="스토리 목록으로"
          onAction={() => window.location.href = '/story'}
        />
      </Container>
    );
  }

  return (
    <Box>
      <Flex maxW="1400px" mx="auto" py={8} px={4} gap={8}>
        {/* 왼쪽 사이드바 - 목차 네비게이션 */}
        <Box w="250px" flexShrink={0}>
          <Box position="sticky" top="100px">
            {headings.length > 0 && (
              <VStack spacing={4} align="stretch">
                <Text fontSize="sm" fontWeight="600" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                  목차
                </Text>
                <VStack spacing={1} align="stretch">
                  {headings.map((heading) => (
                    <Button
                      key={heading.id}
                      variant="ghost"
                      size="sm"
                      justifyContent="flex-start"
                      fontSize={heading.level === 1 ? "sm" : "xs"}
                      fontWeight={activeHeading === heading.id ? "600" : (heading.level === 1 ? "500" : "400")}
                      color={activeHeading === heading.id ? '#8B5CF6' : (colorMode === 'dark' ? '#9e9ea4' : '#626269')}
                      bg={activeHeading === heading.id ? (colorMode === 'dark' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(139, 92, 246, 0.05)') : 'transparent'}
                      _hover={{
                        bg: colorMode === 'dark' ? '#4d4d59' : '#e4e4e5',
                        color: colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'
                      }}
                      onClick={() => scrollToHeading(heading.id)}
                      px={heading.level === 1 ? 3 : 2}
                      py={2}
                      pl={heading.level === 1 ? 3 : 6}
                      h="auto"
                      borderRadius="md"
                      ml={heading.level === 2 ? 2 : 0}
                    >
                      <Text noOfLines={2} textAlign="left" opacity={heading.level === 2 ? 0.8 : 1}>
                        {heading.text}
                      </Text>
                    </Button>
                  ))}
                </VStack>
              </VStack>
            )}
          </Box>
        </Box>

        {/* 메인 콘텐츠 */}
        <Box flex="1" maxW="800px">
          <VStack spacing={8} align="stretch">
          {/* 스토리 헤더 */}
          <VStack spacing={6} align="stretch">
            {story.imageUrl && (
              <Image
                src={story.imageUrl}
                alt={story.title}
                w="full"
                h="300px"
                objectFit="cover"
                borderRadius="lg"
              />
            )}
            
            {/* 라운지 출처 배지 */}
            {story.isFromLounge && (
              <AdminHint type="info">
                라운지의 {story.originalAuthor}님 글을 바탕으로 재구성했어요.
              </AdminHint>
            )}
            
            {story.isVerified && (
              <AdminHint type="success">
                본 글은 (주)월급날에서 검수했어요.
              </AdminHint>
            )}

            <Heading as="h1" size="xl" lineHeight="1.4" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              {story.title}
            </Heading>

            <HStack spacing={4} fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
              <Text>{story.author}</Text>
              <Text>·</Text>
              <Text>{formatDate(story.createdAt)}</Text>
              <Text>·</Text>
              <Text>{story.readTime}분 읽기</Text>
            </HStack>

            <HStack spacing={2} flexWrap="wrap">
              {story.tags.map((tag, index) => {
                const tagColors = ['blue', 'green', 'purple', 'orange', 'teal', 'pink'];
                const colorScheme = tagColors[index % tagColors.length];
                return (
                  <Tag key={index} size="sm" variant="subtle" colorScheme={colorScheme}>
                    <TagLabel>{tag}</TagLabel>
                  </Tag>
                );
              })}
            </HStack>
          </VStack>

          <Divider />

          {/* 스토리 본문 */}
          <Box
            ref={contentRef}
            fontSize="lg"
            lineHeight="1.8"
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
            sx={{
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                fontWeight: '600',
                color: colorMode === 'dark' ? '#e4e4e5' : '#2c2c35',
                mt: 8,
                mb: 4,
              },
              '& h1': { fontSize: '2xl' },
              '& h2': { fontSize: 'xl' },
              '& h3': { fontSize: 'lg' },
              '& p': {
                mb: 4,
                color: colorMode === 'dark' ? '#c3c3c6' : '#4d4d59',
              },
              '& blockquote': {
                pl: 4,
                py: 2,
                my: 4,
                borderLeft: '4px solid',
                borderColor: 'brand.400',
                bg: colorMode === 'dark' ? '#4d4d59' : '#e4e4e5',
                color: colorMode === 'dark' ? '#9e9ea4' : '#626269',
                fontStyle: 'italic',
              },
              '& code': {
                bg: colorMode === 'dark' ? '#4d4d59' : '#e4e4e5',
                color: 'brand.500',
                px: 1,
                py: 0.5,
                borderRadius: 'sm',
                fontSize: '0.9em',
              },
              '& pre': {
                bg: colorMode === 'dark' ? '#2c2c35' : '#4d4d59',
                color: colorMode === 'dark' ? '#e4e4e5' : '#c3c3c6',
                p: 4,
                borderRadius: 'md',
                overflow: 'auto',
                my: 4,
              },
              '& pre code': {
                bg: 'transparent',
                color: 'inherit',
                p: 0,
              },
              '& ul, & ol': {
                pl: 6,
                mb: 4,
              },
              '& li': {
                mb: 1,
                color: colorMode === 'dark' ? '#c3c3c6' : '#4d4d59',
              },
            }}
            dangerouslySetInnerHTML={{
              __html: story.content
                .replace(/==(.*?)==/g, '<span style="background: rgba(63, 213, 153, 0.21); padding: 2px 4px; border-radius: 3px;">$1</span>')
                .replace(/^# (.*)$/gm, (match, text) => {
                  const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                  return `<h1 id="${id}">${text}</h1>`;
                })
                .replace(/^## (.*)$/gm, (match, text) => {
                  const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                  return `<h2 id="${id}">${text}</h2>`;
                })
                .replace(/^### (.*)$/gm, '<h3>$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/~~(.*?)~~/g, '<del>$1</del>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/^/, '<p>')
                .replace(/$/, '</p>')
            }}
          />

          {/* 좋아요 및 북마크 버튼 */}
          <HStack justify="center" spacing={4} py={4}>
            <Button
              leftIcon={<StarIcon />}
              variant={isLiked ? "solid" : "outline"}
              colorScheme={isLiked ? "red" : "gray"}
              size="md"
              onClick={handleLike}
            >
              좋아요 {likeCount}
            </Button>
            
            <Button
              leftIcon={<AttachmentIcon />}
              variant={isBookmarked ? "solid" : "outline"}
              colorScheme={isBookmarked ? "yellow" : "gray"}
              size="md"
              onClick={handleBookmark}
            >
              북마크 {scrapCount}
            </Button>
          </HStack>

          <Divider />

          {/* 댓글 섹션 */}
          <VStack spacing={6} align="stretch">
            <Heading as="h3" size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              댓글 {storyComments.length}개
            </Heading>
            
            <CommentForm 
              onSubmit={handleCommentSubmit}
              isSubmitting={isSubmittingComment}
              isLoggedIn={!!user}
              currentUserName={user?.name || ''}
            />
            
            <CommentList comments={storyComments} />
          </VStack>
        </VStack>
        </Box>

        {/* 오른쪽 사이드바 - 공유 및 스크랩 */}
        <Box w="80px" flexShrink={0}>
          <Box position="sticky" top="100px">
            <VStack spacing={4}>
              <Tooltip label="공유하기" placement="left">
                <IconButton
                  aria-label="공유하기"
                  icon={<ExternalLinkIcon />}
                  variant="outline"
                  colorScheme="gray"
                  size="md"
                  borderRadius="full"
                  onClick={handleShare}
                />
              </Tooltip>
              
              <Tooltip label="북마크" placement="left">
                <IconButton
                  aria-label="북마크"
                  icon={<AttachmentIcon />}
                  variant={isBookmarked ? "solid" : "outline"}
                  colorScheme={isBookmarked ? "yellow" : "gray"}
                  size="md"
                  borderRadius="full"
                  onClick={handleBookmark}
                />
              </Tooltip>
            </VStack>
          </Box>
        </Box>
      </Flex>

      {/* 관련 스토리 */}
      {relatedStories.length > 0 && (
        <Box bg={colorMode === 'dark' ? '#2c2c35' : '#e4e4e5'} mt={16}>
          <Container maxW="1200px" py={16}>
            <VStack spacing={8} align="stretch">
              <Heading as="h3" size="lg" textAlign="center" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                관련 스토리
              </Heading>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                {relatedStories.map((relatedStory) => (
                  <Card
                    key={relatedStory.id}
                    type="story"
                    id={relatedStory.id}
                    title={relatedStory.title}
                    summary={relatedStory.summary}
                    imageUrl={relatedStory.imageUrl}
                    tags={relatedStory.tags}
                    createdAt={relatedStory.createdAt}
                    readTime={relatedStory.readTime}
                  />
                ))}
              </SimpleGrid>
            </VStack>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default StoryDetail;