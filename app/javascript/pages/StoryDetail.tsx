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
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { StarIcon, AttachmentIcon, ExternalLinkIcon, LinkIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import Card from '../components/Card';
import { CommentList, CommentForm } from '../components/Comment';
import EmptyState from '../components/EmptyState';
import AdminHint from '../components/AdminHint';
import SEOHead from '../components/SEOHead';
import { ArticleJsonLd, BreadcrumbJsonLd } from '../components/JsonLd';
import { useAuth } from '../contexts/AuthContext';
import { storyService, commentService, interactionService, userService } from '../services/supabaseDataService';
import { optimizedStoryService, optimizedCommentService, optimizedInteractionService } from '../services/optimizedDataService';
import { formatDate } from '../utils/format';
import { getTagById } from '../data/tags';

const StoryDetail: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isLoggedIn } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const storyId = parseInt(id || '0');

  // 로딩 상태 처리
  const [isLoading, setIsLoading] = useState(true);
  
  const [story, setStory] = useState<any>(null);
  const [storyComments, setStoryComments] = useState<any[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [scrapCount, setScrapCount] = useState(0);
  const [headings, setHeadings] = useState<Array<{id: string, text: string, level: number}>>([]);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // 스토리 데이터 로드
  useEffect(() => {
    const loadStoryData = async () => {
      try {
        setIsLoading(true);
        
        // 스토리 데이터 로드
        const foundStory = await optimizedStoryService.getById(storyId, true); // 프리로딩 활성화
        if (!foundStory) {
          toast({
            title: "스토리를 찾을 수 없습니다",
            description: "존재하지 않거나 삭제된 스토리입니다.",
            status: "error",
            duration: 5000,
          });
          navigate('/story');
          return;
        }

        console.log('✅ 스토리 로드됨:', foundStory.title);
        setStory(foundStory);
        setLikeCount(foundStory.like_count || 0);
        setScrapCount(foundStory.scrap_count || 0);
        
        // 로그인된 사용자의 상호작용 상태 확인
        if (isLoggedIn && user) {
          const interactionStatus = await interactionService.checkInteractionStatus(
            user.id, 
            storyId, 
            'story'
          );
          setIsLiked(interactionStatus.liked);
          setIsBookmarked(interactionStatus.scraped);
        } else {
          // 로그아웃 시에도 기존 북마크/좋아요 개수는 유지하되, 사용자 개인의 상태만 초기화
          setIsLiked(false);
          setIsBookmarked(false);
        }
        
        // 댓글 로드
        const comments = await optimizedCommentService.getByPost(storyId, 'story');
        // Supabase 댓글 데이터를 Comment 컴포넌트 형식으로 변환
        const transformedComments = (comments || []).map(comment => ({
          id: comment.id,
          author: comment.author_name,
          content: comment.content,
          createdAt: comment.created_at,
          isGuest: comment.is_guest,
          guestPassword: comment.guest_password,
          authorVerified: comment.author_verified,
          parentId: comment.parent_id,
          authorId: comment.author_id,
          replies: comment.replies ? comment.replies.map(reply => ({
            id: reply.id,
            author: reply.author_name,
            content: reply.content,
            createdAt: reply.created_at,
            isGuest: reply.is_guest,
            guestPassword: reply.guest_password,
            authorVerified: reply.author_verified,
            parentId: reply.parent_id,
            authorId: reply.author_id,
          })) : []
        }));
        setStoryComments(transformedComments);
        
      } catch (error) {
        console.error('❌ 스토리 데이터 로드 실패:', error);
        toast({
          title: "데이터 로드 실패",
          description: "스토리를 불러오는 중 오류가 발생했습니다.",
          status: "error",
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (storyId) {
      loadStoryData();
    }
  }, [storyId, isLoggedIn, user, navigate, toast]);
  
  const handleLike = async () => {
    if (!isLoggedIn || !user) {
      toast({
        title: "로그인이 필요해요",
        description: "로그인한 사용자만 좋아요를 누를 수 있어요",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      const result = await interactionService.toggleLike(user.id, storyId, 'story');
      
      if (result.action === 'added') {
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        toast({
          title: "좋아요를 눌렀습니다",
          status: "success",
          duration: 2000,
        });
      } else {
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
        toast({
          title: "좋아요를 취소했습니다",
          status: "success",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      toast({
        title: "오류가 발생했습니다",
        description: "잠시 후 다시 시도해주세요",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleBookmark = async () => {
    if (!isLoggedIn || !user) {
      toast({
        title: "로그인이 필요해요",
        description: "로그인한 사용자만 북마크를 사용할 수 있어요",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      const result = await interactionService.toggleScrap(user.id, storyId, 'story');
      
      if (result.action === 'added') {
        setIsBookmarked(true);
        setScrapCount(prev => prev + 1);
        toast({
          title: "북마크에 추가했습니다",
          status: "success",
          duration: 2000,
        });
      } else {
        setIsBookmarked(false);
        setScrapCount(prev => prev - 1);
        toast({
          title: "북마크를 해제했습니다",
          status: "success",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('북마크 처리 실패:', error);
      toast({
        title: "오류가 발생했습니다",
        description: "잠시 후 다시 시도해주세요",
        status: "error",
        duration: 3000,
      });
    }
  };
  
  // H1, H2 태그를 찾아서 내비게이션 메뉴 생성
  useEffect(() => {
    if (!story) return;
    
    const matches = [];
    const content = story.content;
    const usedIds = new Set<string>(); // 중복 ID 방지
    
    // 마크다운 형태의 H1, H2 태그 찾기
    const h1Regex = /^# (.+)$/gm;
    const h2Regex = /^## (.+)$/gm;
    
    // HTML 형태의 H1, H2 태그 찾기
    const htmlH1Regex = /<h1[^>]*>([^<]+)<\/h1>/gi;
    const htmlH2Regex = /<h2[^>]*>([^<]+)<\/h2>/gi;
    
    // ID 생성 및 중복 방지 함수 (한글 지원)
    const generateUniqueId = (text: string) => {
      // 한글, 영문, 숫자, 공백, 하이픈만 유지
      let baseId = text.toLowerCase()
        .replace(/[^\w\s\-가-힣]/g, '') // 한글 범위 추가
        .replace(/\s+/g, '-') // 공백을 하이픈으로
        .replace(/-+/g, '-') // 연속 하이픈 제거
        .replace(/^-|-$/g, ''); // 시작/끝 하이픈 제거
      
      // 빈 ID인 경우 기본값 설정
      if (!baseId) {
        baseId = 'heading';
      }
      
      let id = baseId;
      let counter = 1;
      
      while (usedIds.has(id)) {
        id = `${baseId}-${counter}`;
        counter++;
      }
      
      usedIds.add(id);
      return id;
    };
    
    // 마크다운 H1 태그 찾기
    let match;
    while ((match = h1Regex.exec(content)) !== null) {
      const id = generateUniqueId(match[1]);
      matches.push({
        id,
        text: match[1],
        level: 1,
        index: match.index
      });
    }
    
    // 마크다운 H2 태그 찾기
    content.replace(h2Regex, (match, text, index) => {
      const id = generateUniqueId(text);
      matches.push({
        id,
        text,
        level: 2,
        index
      });
      return match;
    });
    
    // HTML H1 태그 찾기
    while ((match = htmlH1Regex.exec(content)) !== null) {
      const id = generateUniqueId(match[1]);
      matches.push({
        id,
        text: match[1],
        level: 1,
        index: match.index
      });
    }
    
    // HTML H2 태그 찾기
    while ((match = htmlH2Regex.exec(content)) !== null) {
      const id = generateUniqueId(match[1]);
      matches.push({
        id,
        text: match[1],
        level: 2,
        index: match.index
      });
    }
    
    // 인덱스 순서로 정렬
    matches.sort((a, b) => a.index - b.index);
    
    setHeadings(matches);
  }, [story]);
  
  // 스크롤 시 현재 섹션 감지
  useEffect(() => {
    const handleScroll = () => {
      if (headings.length === 0) return;
      
      const scrollTop = window.pageYOffset;
      const offset = 150; // 헤더 높이 고려한 오프셋
      
      let currentActiveId = '';
      let minDistance = Infinity;
      
      // 각 헤딩을 순회하며 가장 가까운 섹션 찾기
      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        
        if (element) {
          const elementTop = element.getBoundingClientRect().top + scrollTop;
          const distance = Math.abs(scrollTop + offset - elementTop);
          
          // 현재 스크롤 위치가 해당 섹션을 지났고, 가장 가까운 섹션이면 활성화
          if (scrollTop + offset >= elementTop && distance < minDistance) {
            currentActiveId = heading.id;
            minDistance = distance;
          }
        }
      }
      
      // 만약 아무 섹션도 활성화되지 않았다면 첫 번째 헤딩 활성화
      if (!currentActiveId && headings.length > 0) {
        currentActiveId = headings[0].id;
      }
      
      // 현재 활성화된 헤딩과 다르면 업데이트 (중복 방지)
      if (currentActiveId && currentActiveId !== activeHeading) {
        setActiveHeading(currentActiveId);
      }
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
      const elementRect = element.getBoundingClientRect();
      const elementTop = elementRect.top + window.pageYOffset;
      
      // 썸네일 높이(800px)와 헤더 높이를 고려한 오프셋
      const thumbnailHeight = 800;
      const headerHeight = 120;
      const yOffset = -headerHeight;
      
      // 첫 번째 헤딩이 썸네일 영역 내에 있는지 확인
      const isInThumbnailArea = elementTop < thumbnailHeight;
      
      let scrollTarget;
      if (isInThumbnailArea) {
        // 썸네일 영역 내의 헤딩은 썸네일 바로 아래로 스크롤
        scrollTarget = thumbnailHeight - headerHeight;
      } else {
        // 일반적인 경우
        scrollTarget = elementTop + yOffset;
      }
      
      // 최소 스크롤 위치 보장 (맨 위로 올라가지 않게)
      scrollTarget = Math.max(0, scrollTarget);
      
      window.scrollTo({
        top: scrollTarget,
        behavior: 'smooth'
      });
      
      // 스크롤 완료 후 active 상태 설정
      setTimeout(() => {
        setActiveHeading(id);
      }, 100);
    }
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: story?.title,
          text: story?.summary,
          url: window.location.href
        });
      } catch (error: any) {
        // 사용자가 공유를 취소한 경우는 에러를 표시하지 않음
        if (error.name !== 'AbortError') {
          console.error('공유 실패:', error);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: '링크가 복사되었습니다',
          status: 'success',
          duration: 2000,
        });
      } catch (error) {
        toast({
          title: '링크 복사에 실패했습니다',
          status: 'error',
          duration: 2000,
        });
      }
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('정말로 이 스토리를 삭제하시겠습니까?\n삭제된 스토리는 복구할 수 없습니다.')) {
      try {
        const success = await storyService.delete(storyId);
        if (success) {
          toast({
            title: '스토리가 삭제되었습니다',
            status: 'success',
            duration: 3000,
          });
          navigate('/story');
        } else {
          throw new Error('삭제 실패');
        }
      } catch (error) {
        console.error('스토리 삭제 실패:', error);
        toast({
          title: '스토리 삭제 중 오류가 발생했습니다',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };
  
  const [relatedStories, setRelatedStories] = useState([]);
  
  useEffect(() => {
    const loadRelatedStories = async () => {
      if (!story) return;
      
      try {
        const allStoriesResponse = await storyService.getAll();
        const allStories = allStoriesResponse.stories || [];
        const related = allStories
          .filter(s => 
            s.id !== storyId && 
            s.tags && story.tags && s.tags.some(tag => story.tags.includes(tag))
          )
          .slice(0, 3);
        setRelatedStories(related);
      } catch (error) {
        console.error('관련 스토리 로드 실패:', error);
        setRelatedStories([]);
      }
    };
    
    loadRelatedStories();
  }, [story, storyId]);

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <Container maxW="1200px" py={8}>
        <VStack spacing={8}>
          <Box w="100%" h="400px" bg={colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'} borderRadius="md" />
          <VStack spacing={4} w="100%">
            <Box w="80%" h="40px" bg={colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'} borderRadius="md" />
            <Box w="60%" h="20px" bg={colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'} borderRadius="md" />
            <Box w="100%" h="200px" bg={colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'} borderRadius="md" />
          </VStack>
        </VStack>
      </Container>
    );
  }

  // 스토리가 없는 경우
  if (!story) {
    return (
      <Container maxW="1200px" py={8}>
        <EmptyState
          title="스토리를 찾을 수 없습니다"
          description="존재하지 않거나 삭제된 스토리입니다."
          actionText="스토리 목록으로 돌아가기"
          onAction={() => navigate('/story')}
        />
      </Container>
    );
  }

  const handleCommentSubmit = async (content: string, author?: string, password?: string) => {
    setIsSubmittingComment(true);
    
    try {
      // 댓글 데이터 생성
      const newComment = await commentService.create({
        post_id: storyId,
        post_type: 'story' as const,
        author_id: user?.id || null,
        author_name: user ? user.name : (author || "익명"),
        content,
        is_guest: !user,
        guest_password: password, // Supabase에서 해시화 처리
        author_verified: user?.isVerified || false
      });
      
      // 댓글 목록 새로 로드
      const updatedComments = await optimizedCommentService.getByPost(storyId, 'story');
      // Supabase 댓글 데이터를 Comment 컴포넌트 형식으로 변환
      const transformedComments = (updatedComments || []).map(comment => ({
        id: comment.id,
        author: comment.author_name,
        content: comment.content,
        createdAt: comment.created_at,
        isGuest: comment.is_guest,
        guestPassword: comment.guest_password,
        authorVerified: comment.author_verified,
        parentId: comment.parent_id,
        authorId: comment.author_id,
        replies: comment.replies ? comment.replies.map(reply => ({
          id: reply.id,
          author: reply.author_name,
          content: reply.content,
          createdAt: reply.created_at,
          isGuest: reply.is_guest,
          guestPassword: reply.guest_password,
          authorVerified: reply.author_verified,
          parentId: reply.parent_id,
          authorId: reply.author_id,
        })) : []
      }));
      setStoryComments(transformedComments);
      
      toast({
        title: "댓글이 등록되었습니다",
        status: "success",
        duration: 2000,
      });
      
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      toast({
        title: "댓글 작성 중 오류가 발생했습니다",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentReply = async (parentId: number, content: string, author?: string, password?: string) => {
    setIsSubmittingComment(true);
    
    try {
      // 대댓글 생성 - Supabase에 저장
      const newReply = await commentService.create({
        post_id: storyId,
        post_type: 'story' as const,
        author_id: user?.id || null,
        author_name: user ? user.name : (author || "익명"),
        content,
        is_guest: !user,
        guest_password: password,
        author_verified: user?.isVerified || false,
        parent_id: parentId // 부모 댓글 ID
      });
      
      // 댓글 목록 새로고침
      const updatedComments = await optimizedCommentService.getByPost(storyId, 'story');
      // Supabase 댓글 데이터를 Comment 컴포넌트 형식으로 변환
      const transformedComments = (updatedComments || []).map(comment => ({
        id: comment.id,
        author: comment.author_name,
        content: comment.content,
        createdAt: comment.created_at,
        isGuest: comment.is_guest,
        guestPassword: comment.guest_password,
        authorVerified: comment.author_verified,
        parentId: comment.parent_id,
        authorId: comment.author_id,
        replies: comment.replies ? comment.replies.map(reply => ({
          id: reply.id,
          author: reply.author_name,
          content: reply.content,
          createdAt: reply.created_at,
          isGuest: reply.is_guest,
          guestPassword: reply.guest_password,
          authorVerified: reply.author_verified,
          parentId: reply.parent_id,
          authorId: reply.author_id,
        })) : []
      }));
      setStoryComments(transformedComments);
      
      toast({
        title: "답글이 등록되었습니다",
        status: "success",
        duration: 2000,
      });
      
    } catch (error) {
      console.error('답글 작성 실패:', error);
      toast({
        title: "답글 작성 중 오류가 발생했습니다",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentEdit = async (commentId: number, newContent: string, password?: string) => {
    try {
      await commentService.update(commentId, newContent, password);
      
      // 댓글 목록 새로고침
      const updatedComments = await optimizedCommentService.getByPost(storyId, 'story');
      // Supabase 댓글 데이터를 Comment 컴포넌트 형식으로 변환
      const transformedComments = (updatedComments || []).map(comment => ({
        id: comment.id,
        author: comment.author_name,
        content: comment.content,
        createdAt: comment.created_at,
        isGuest: comment.is_guest,
        guestPassword: comment.guest_password,
        authorVerified: comment.author_verified,
        parentId: comment.parent_id,
        authorId: comment.author_id,
        replies: comment.replies ? comment.replies.map(reply => ({
          id: reply.id,
          author: reply.author_name,
          content: reply.content,
          createdAt: reply.created_at,
          isGuest: reply.is_guest,
          guestPassword: reply.guest_password,
          authorVerified: reply.author_verified,
          parentId: reply.parent_id,
          authorId: reply.author_id,
        })) : []
      }));
      setStoryComments(transformedComments);
      
      toast({
        title: "댓글이 수정되었습니다",
        status: "success",
        duration: 2000,
      });
      
    } catch (error: any) {
      toast({
        title: "댓글 수정 실패",
        description: error.message || "댓글 수정 중 오류가 발생했습니다",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleCommentDelete = async (commentId: number, password?: string) => {
    try {
      await commentService.delete(commentId, password);
      
      // 댓글 목록 새로고침
      const updatedComments = await optimizedCommentService.getByPost(storyId, 'story');
      // Supabase 댓글 데이터를 Comment 컴포넌트 형식으로 변환
      const transformedComments = (updatedComments || []).map(comment => ({
        id: comment.id,
        author: comment.author_name,
        content: comment.content,
        createdAt: comment.created_at,
        isGuest: comment.is_guest,
        guestPassword: comment.guest_password,
        authorVerified: comment.author_verified,
        parentId: comment.parent_id,
        authorId: comment.author_id,
        replies: comment.replies ? comment.replies.map(reply => ({
          id: reply.id,
          author: reply.author_name,
          content: reply.content,
          createdAt: reply.created_at,
          isGuest: reply.is_guest,
          guestPassword: reply.guest_password,
          authorVerified: reply.author_verified,
          parentId: reply.parent_id,
          authorId: reply.author_id,
        })) : []
      }));
      setStoryComments(transformedComments);
      
      toast({
        title: "댓글이 삭제되었습니다",
        status: "success",
        duration: 2000,
      });
      
    } catch (error: any) {
      toast({
        title: "댓글 삭제 실패",
        description: error.message || "댓글 삭제 중 오류가 발생했습니다",
        status: "error",
        duration: 3000,
      });
    }
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
    <>
      <SEOHead
        title={story.title}
        description={story.summary || story.content?.substring(0, 150).replace(/[#*`]/g, '') + '...'}
        keywords={`HR, 인사, ${story.tags?.join(', ')}, ${story.title.split(' ').slice(0, 3).join(', ')}`}
        image={story.imageUrl}
        url={`/story/${story.id}`}
        type="article"
        author={story.author}
        publishedTime={story.createdAt}
        tags={story.tags}
      />
      <ArticleJsonLd
        title={story.title}
        description={story.summary || story.content?.substring(0, 150).replace(/[#*`]/g, '') + '...'}
        author={story.author_name}
        datePublished={story.created_at}
        image={story.image_url}
        keywords={story.tags}
        url={`/story/${story.id}`}
        readTime={story.read_time}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Story', url: '/story' },
          { name: story.title, url: `/story/${story.id}` }
        ]}
      />
      <Box>
      {/* 썸네일 이미지 - 화면 전체 너비, 헤더 덮음 */}
      {story.image_url && (
        <Box 
          position="absolute"
          top="0"
          left="0"
          w="100vw" 
          h="800px"
          zIndex="50"
        >
          <Image
            src={story.image_url}
            alt={story.title}
            w="100%"
            h="100%"
            objectFit="cover"
          />
          
          {/* 글 제목과 요약 오버레이 */}
          <Box
            position="absolute"
            bottom="0"
            left="0"
            right="0"
            bg="linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4), transparent)"
            p={12}
            color="white"
          >
            <Container maxW="1200px">
              <VStack spacing={4} align="flex-start">
                <Heading 
                  as="h1" 
                  fontSize="56px" 
                  fontWeight="700" 
                  lineHeight="1.2"
                  textShadow="2px 2px 4px rgba(0,0,0,0.6)"
                >
                  {story.title}
                </Heading>
                {story.summary && (
                  <Text 
                    fontSize="18px" 
                    lineHeight="1.6"
                    maxW="800px"
                    textShadow="1px 1px 2px rgba(0,0,0,0.6)"
                  >
                    {story.summary}
                  </Text>
                )}
              </VStack>
            </Container>
          </Box>
        </Box>
      )}

      <Box position="relative" zIndex="10" mt={story.image_url ? "800px" : "0"}>
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
            
            {/* 라운지 출처 배지 */}
            {story.isFromLounge && (
              <AdminHint type="info">
                라운지의 {story.originalAuthor}님 글을 바탕으로 재구성했어요.
              </AdminHint>
            )}
            
            {story.is_verified && (
              <AdminHint type="success">
                {story.verification_badge || "페이롤 아웃소싱 전문회사인 월급날에서 검수한 글이에요."}
              </AdminHint>
            )}

            <HStack justify="space-between" align="flex-start">
              <Heading as="h1" size="xl" lineHeight="1.4" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'} flex="1">
                {story.title}
              </Heading>
              
              {/* 관리자 수정/삭제 버튼 */}
              {user?.isAdmin && (
                <HStack spacing={3} flexShrink={0} ml={6}>
                  <Button
                    leftIcon={<EditIcon />}
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/story/${storyId}/edit`)}
                  >
                    수정하기
                  </Button>
                  <Button
                    leftIcon={<DeleteIcon />}
                    variant="outline"
                    colorScheme="red"
                    size="sm"
                    onClick={() => handleDelete()}
                  >
                    삭제하기
                  </Button>
                </HStack>
              )}
            </HStack>

            <HStack spacing={4} fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
              <HStack spacing={2} align="center">
                <Text>{story.author_name}</Text>
                {story.author_verified && (
                  <Badge colorScheme="green" size="sm">인사담당자</Badge>
                )}
              </HStack>
              <Text>·</Text>
              <Text>{formatDate(story.created_at)}</Text>
              <Text>·</Text>
              <Text>{story.read_time}분 읽기</Text>
            </HStack>

            <HStack spacing={2} flexWrap="wrap">
              {story.tags.map((tag, index) => {
                const tagColors = ['blue', 'green', 'purple', 'orange', 'teal', 'pink'];
                const colorScheme = tagColors[index % tagColors.length];
                const tagData = getTagById(tag);
                return (
                  <Tag key={index} size="sm" variant="subtle" colorScheme={colorScheme}>
                    <TagLabel>{tagData ? tagData.name : tag}</TagLabel>
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
              __html: (() => {
                const content = story.content;
                
                // HTML 콘텐츠인지 확인 (WYSIWYG 에디터로 작성된 경우)
                const isHTML = content.includes('<p>') || content.includes('<h1>') || content.includes('<span style=');
                
                // ID 생성 및 중복 방지 함수 (한글 지원)
                const usedHtmlIds = new Set<string>();
                const generateHtmlId = (text: string) => {
                  // 한글, 영문, 숫자, 공백, 하이픈만 유지
                  let baseId = text.toLowerCase()
                    .replace(/[^\w\s\-가-힣]/g, '') // 한글 범위 추가
                    .replace(/\s+/g, '-') // 공백을 하이픈으로
                    .replace(/-+/g, '-') // 연속 하이픈 제거
                    .replace(/^-|-$/g, ''); // 시작/끝 하이픈 제거
                  
                  // 빈 ID인 경우 기본값 설정
                  if (!baseId) {
                    baseId = 'heading';
                  }
                  
                  let id = baseId;
                  let counter = 1;
                  
                  while (usedHtmlIds.has(id)) {
                    id = `${baseId}-${counter}`;
                    counter++;
                  }
                  
                  usedHtmlIds.add(id);
                  return id;
                };
                
                if (isHTML) {
                  // HTML 콘텐츠 - H1, H2 태그에 ID 추가
                  return content
                    .replace(/background-color:\s*rgb\(254,\s*240,\s*138\)/g, 'background-color: #fef08a; color: #1f2937')
                    .replace(/background-color:\s*rgb\(187,\s*247,\s*208\)/g, 'background-color: #bbf7d0; color: #1f2937')
                    .replace(/background-color:\s*rgb\(191,\s*219,\s*254\)/g, 'background-color: #bfdbfe; color: #1f2937')
                    .replace(/background-color:\s*rgb\(252,\s*231,\s*243\)/g, 'background-color: #fce7f3; color: #1f2937')
                    .replace(/background-color:\s*rgb\(233,\s*213,\s*255\)/g, 'background-color: #e9d5ff; color: #1f2937')
                    .replace(/<h1[^>]*>([^<]+)<\/h1>/gi, (match, text) => {
                      const id = generateHtmlId(text);
                      return `<h1 id="${id}">${text}</h1>`;
                    })
                    .replace(/<h2[^>]*>([^<]+)<\/h2>/gi, (match, text) => {
                      const id = generateHtmlId(text);
                      return `<h2 id="${id}">${text}</h2>`;
                    });
                } else {
                  // 마크다운 콘텐츠면 변환
                  return content
                    .replace(/==(.*?)==/g, '<span style="background-color: #fef08a; color: #1f2937; padding: 2px 4px; border-radius: 3px;">$1</span>')
                    .replace(/==green\[(.*?)\]==/g, '<span style="background-color: #bbf7d0; color: #1f2937; padding: 2px 4px; border-radius: 3px;">$1</span>')
                    .replace(/==blue\[(.*?)\]==/g, '<span style="background-color: #bfdbfe; color: #1f2937; padding: 2px 4px; border-radius: 3px;">$1</span>')
                    .replace(/==pink\[(.*?)\]==/g, '<span style="background-color: #fce7f3; color: #1f2937; padding: 2px 4px; border-radius: 3px;">$1</span>')
                    .replace(/==purple\[(.*?)\]==/g, '<span style="background-color: #e9d5ff; color: #1f2937; padding: 2px 4px; border-radius: 3px;">$1</span>')
                    .replace(/^# (.*)$/gm, (match, text) => {
                      const id = generateHtmlId(text);
                      return `<h1 id="${id}">${text}</h1>`;
                    })
                    .replace(/^## (.*)$/gm, (match, text) => {
                      const id = generateHtmlId(text);
                      return `<h2 id="${id}">${text}</h2>`;
                    })
                    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/~~(.*?)~~/g, '<del>$1</del>')
                    .replace(/\n\n/g, '</p><p>');
                }
              })()
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
              currentUserVerified={user?.isVerified || false}
            />
            
            <CommentList 
              comments={storyComments} 
              currentUser={user}
              isLoggedIn={isLoggedIn}
              onEdit={handleCommentEdit}
              onDelete={handleCommentDelete}
              onReply={handleCommentReply}
            />
          </VStack>
            </VStack>
          </Box>

          {/* 오른쪽 사이드바 - 공유 및 북마크 */}
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
      </Box>

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
                    imageUrl={relatedStory.image_url}
                    tags={relatedStory.tags}
                    createdAt={relatedStory.created_at}
                    readTime={relatedStory.read_time}
                    author={relatedStory.author_name}
                  />
                ))}
              </SimpleGrid>
            </VStack>
          </Container>
        </Box>
      )}
      </Box>
    </>
  );
};

export default StoryDetail;