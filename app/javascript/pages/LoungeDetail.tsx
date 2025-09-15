import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Tag,
  TagLabel,
  Divider,
  Badge,
  IconButton,
  useToast,
  Heading,
  useColorMode,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { StarIcon, AttachmentIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { CommentList, CommentForm } from '../components/Comment';
import EmptyState from '../components/EmptyState';
import AdminHint from '../components/AdminHint';
import { PostDetailSkeleton } from '../components/LoadingOptimizer';
import SEOHead from '../components/SEOHead';
import { QAPageJsonLd, BreadcrumbJsonLd } from '../components/JsonLd';
import { useAuth } from '../contexts/AuthContext';
import { loungeService, commentService, interactionService } from '../services/supabaseDataService';
import { optimizedLoungeService, optimizedCommentService, optimizedInteractionService } from '../services/optimizedDataService';
import { cacheService } from '../services/cacheService';
import { formatDate } from '../utils/format';
import { getTagById } from '../data/tags';
import LevelBadge from '../components/UserLevel/LevelBadge';
import { getUserDisplayLevel } from '../services/userLevelService';

const LoungeDetail: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user, isLoggedIn, isAdmin } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const postId = parseInt(id || '0');
  const toast = useToast();
  
  const [post, setPost] = useState<any>(null);
  const [postComments, setPostComments] = useState<any[]>([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [scrapCount, setScrapCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false); // 좋아요 처리 중 상태
  const [isBookmarking, setIsBookmarking] = useState(false); // 북마크 처리 중 상태
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태

  // Supabase 데이터 로드
  useEffect(() => {
    const loadPost = async () => {
      try {
        setIsLoading(true);
        // 일정 시간 동안 로딩 상태 유지 (최소 500ms)
        const startTime = Date.now();
        const foundPost = await optimizedLoungeService.getById(postId, true); // 프리로딩 활성화
        
        // 최소 로딩 시간 보장하여 스켈레톤 UI가 보이도록
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 500; // 최소 500ms 로딩
        
        if (elapsedTime < minLoadingTime) {
          await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
        }
        
        if (foundPost) {
          setPost(foundPost);
          setLikeCount(foundPost.like_count || 0);
          setScrapCount(foundPost.scrap_count || 0);
          
          // 로그인된 사용자의 좋아요/북마크 상태 확인
          if (isLoggedIn && user) {
            console.log('🔍 사용자 좋아요/북마크 상태 확인 중:', { userId: user.id, postId });
            
            // 좋아요 상태 확인
            const isUserLiked = await interactionService.isLiked(user.id, postId, 'lounge');
            console.log('✅ 좋아요 상태 로드됨:', isUserLiked);
            setIsLiked(isUserLiked);
            
            // 실제 좋아요 개수 확인 및 동기화
            console.log('🔍 실제 좋아요 개수 확인 중...');
            const actualLikeCount = await interactionService.getLikeCount(postId, 'lounge');
            console.log('✅ 실제 좋아요 개수:', actualLikeCount);
            setLikeCount(actualLikeCount);
            
            // 데이터베이스의 like_count 필드도 동기화
            try {
              await interactionService.syncLikeCount(postId, 'lounge');
              console.log('✅ 데이터베이스 like_count 필드 동기화 완료');
            } catch (error) {
              console.error('❌ like_count 필드 동기화 실패:', error);
            }
            
            // 북마크 상태 확인
            const isScraped = await interactionService.isBookmarked(user.id, postId, 'lounge');
            console.log('✅ 북마크 상태 로드됨:', isScraped);
            setIsBookmarked(isScraped);
            
            // 실제 북마크 개수 확인 및 동기화
            console.log('🔍 실제 북마크 개수 확인 중...');
            const actualScrapCount = await interactionService.getScrapCount(postId, 'lounge');
            console.log('✅ 실제 북마크 개수:', actualScrapCount);
            setScrapCount(actualScrapCount);
            
            // 데이터베이스의 scrap_count 필드도 동기화
            try {
              await interactionService.syncScrapCount(postId, 'lounge');
              console.log('✅ 데이터베이스 scrap_count 필드 동기화 완료');
            } catch (error) {
              console.error('❌ scrap_count 필드 동기화 실패:', error);
            }
          } else {
            console.log('❌ 로그인되지 않음, 좋아요/북마크 상태 초기화');
            setIsLiked(false);
            setIsBookmarked(false);
          }
          
          // 댓글 로드 (계층구조)
          const comments = await optimizedCommentService.getByPost(postId, 'lounge');
          
          // 댓글 데이터를 컴포넌트 형식으로 변환
          const transformedComments = comments?.map((comment: any) => ({
            ...comment,
            author: comment.author_name,
            createdAt: comment.created_at,
            isGuest: comment.is_guest,
            guestPassword: comment.guest_password,
            authorVerified: comment.author_verified,
            parentId: comment.parent_id,
            replies: comment.replies?.map((reply: any) => ({
              ...reply,
              author: reply.author_name,
              createdAt: reply.created_at,
              isGuest: reply.is_guest,
              guestPassword: reply.guest_password,
              authorVerified: reply.author_verified,
              parentId: reply.parent_id
            })) || []
          })) || [];
          
          setPostComments(transformedComments);
        }
      } catch (error) {
        console.error('라운지 포스트 로드 실패:', error);
        toast({
          title: "글을 불러오는 중 오류가 발생했습니다",
          status: "error",
          duration: 5000,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPost();
  }, [postId, isLoggedIn, user, toast]);

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

    // 이미 처리 중이면 무시
    if (isLiking) {
      console.log('좋아요 처리 중이므로 요청 무시');
      return;
    }

    try {
      setIsLiking(true);
      console.log('🔄 좋아요 처리 시작, 현재 상태:', { isLiked, likeCount });
      
      const result = await interactionService.toggleLike(user.id, postId, 'lounge');
      console.log('✅ 좋아요 처리 결과:', result);
      
      if (result.action === 'added') {
        console.log('➕ 좋아요 추가됨, UI 상태 업데이트');
        setIsLiked(true);
        setLikeCount(prev => {
          console.log('➕ 좋아요 개수 증가:', prev, '→', prev + 1);
          return prev + 1;
        });
        toast({
          title: "좋아요를 눌렀습니다",
          status: "success",
          duration: 2000,
        });
      } else {
        console.log('❌ 좋아요 제거됨, UI 상태 업데이트');
        setIsLiked(false);
        setLikeCount(prev => {
          console.log('➖ 좋아요 개수 감소:', prev, '→', Math.max(0, prev - 1));
          return Math.max(0, prev - 1); // 음수 방지
        });
        toast({
          title: "좋아요를 취소했습니다",
          status: "success",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('❌ 좋아요 처리 실패:', error);
      toast({
        title: "좋아요 처리 중 오류가 발생했습니다",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsLiking(false);
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

    // 이미 처리 중이면 무시
    if (isBookmarking) {
      console.log('북마크 처리 중이므로 요청 무시');
      return;
    }

    try {
      setIsBookmarking(true);
      console.log('🔄 북마크 처리 시작, 현재 상태:', { isBookmarked, scrapCount });
      
      const result = await interactionService.toggleScrap(user.id, postId, 'lounge');
      console.log('✅ 북마크 처리 결과:', result);
      
      if (result.action === 'added') {
        console.log('➕ 북마크 추가됨, UI 상태 업데이트');
        setIsBookmarked(true);
        setScrapCount(prev => {
          console.log('➕ 북마크 개수 증가:', prev, '→', prev + 1);
          return prev + 1;
        });
        toast({
          title: "북마크에 추가했습니다",
          status: "success",
          duration: 2000,
        });
      } else {
        console.log('❌ 북마크 제거됨, UI 상태 업데이트');
        setIsBookmarked(false);
        setScrapCount(prev => {
          console.log('➖ 북마크 개수 감소:', prev, '→', Math.max(0, prev - 1));
          return Math.max(0, prev - 1); // 음수 방지
        });
        toast({
          title: "북마크를 해제했습니다",
          status: "success",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('❌ 북마크 처리 실패:', error);
      toast({
        title: "북마크 처리 중 오류가 발생했습니다",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsBookmarking(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('정말로 이 글을 삭제하시겠습니까?\n삭제된 글은 복구할 수 없습니다.')) {
      try {
        const success = await loungeService.delete(postId);
        if (success) {
          console.log('🗑️ 라운지 포스트 삭제 완료, 캐시 무효화 시작:', postId);
          
          // 관련 캐시 무효화
          cacheService.invalidatePost('lounge', postId);
          
          // 추가적으로 전체 라운지 목록 캐시도 무효화
          cacheService.deleteByPattern('lounge:*');
          
          // 사용자 프로필 캐시도 무효화
          if (user?.id) {
            cacheService.invalidateUser(user.id);
          }
          
          // 홈 페이지 캐시도 무효화
          cacheService.deleteByPattern('home:*');
          
          console.log('✅ 캐시 무효화 완료');
          
          toast({
            title: '글이 삭제되었습니다',
            status: 'success',
            duration: 3000,
          });
          navigate('/lounge');
        } else {
          throw new Error('삭제 실패');
        }
      } catch (error) {
        console.error('글 삭제 실패:', error);
        toast({
          title: '글 삭제 중 오류가 발생했습니다',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  const handleCommentSubmit = async (content: string, author?: string, password?: string) => {
    setIsSubmittingComment(true);
    
    try {
      // 실제 댓글 생성 - Supabase에 저장
      const newComment = await commentService.create({
        post_id: postId,
        post_type: 'lounge' as const,
        content,
        author_name: user ? user.name : (author || "익명"),
        is_guest: !user,
        guest_password: password // 실제로는 해시화해서 저장
      });
      
      // 댓글 목록 새로고침
      const updatedComments = await optimizedCommentService.getByPost(postId, 'lounge');
      
      // 댓글 데이터를 컴포넌트 형식으로 변환
      const transformedComments = updatedComments?.map((comment: any) => ({
        ...comment,
        author: comment.author_name,
        createdAt: comment.created_at,
        isGuest: comment.is_guest,
        guestPassword: comment.guest_password,
        authorVerified: comment.author_verified,
        parentId: comment.parent_id,
        replies: comment.replies?.map((reply: any) => ({
          ...reply,
          author: reply.author_name,
          createdAt: reply.created_at,
          isGuest: reply.is_guest,
          guestPassword: reply.guest_password,
          authorVerified: reply.author_verified,
          parentId: reply.parent_id
        })) || []
      })) || [];
      
      setPostComments(transformedComments);
      
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
        post_id: postId,
        post_type: 'lounge' as const,
        content,
        author_name: user ? user.name : (author || "익명"),
        is_guest: !user,
        guest_password: password,
        parent_id: parentId // 부모 댓글 ID
      });
      
      // 댓글 목록 새로고침
      const updatedComments = await optimizedCommentService.getByPost(postId, 'lounge');
      
      // 댓글 데이터를 컴포넌트 형식으로 변환
      const transformedComments = updatedComments?.map((comment: any) => ({
        ...comment,
        author: comment.author_name,
        createdAt: comment.created_at,
        isGuest: comment.is_guest,
        guestPassword: comment.guest_password,
        authorVerified: comment.author_verified,
        parentId: comment.parent_id,
        replies: comment.replies?.map((reply: any) => ({
          ...reply,
          author: reply.author_name,
          createdAt: reply.created_at,
          isGuest: reply.is_guest,
          guestPassword: reply.guest_password,
          authorVerified: reply.author_verified,
          parentId: reply.parent_id
        })) || []
      })) || [];
      
      setPostComments(transformedComments);
      
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
      const updatedComment = await commentService.update(commentId, newContent, password);
      
      // 댓글 목록 새로고침
      const updatedComments = await optimizedCommentService.getByPost(postId, 'lounge');
      
      // 댓글 데이터를 컴포넌트 형식으로 변환
      const transformedComments = updatedComments?.map((comment: any) => ({
        ...comment,
        author: comment.author_name,
        createdAt: comment.created_at,
        isGuest: comment.is_guest,
        guestPassword: comment.guest_password,
        authorVerified: comment.author_verified,
        parentId: comment.parent_id,
        replies: comment.replies?.map((reply: any) => ({
          ...reply,
          author: reply.author_name,
          createdAt: reply.created_at,
          isGuest: reply.is_guest,
          guestPassword: reply.guest_password,
          authorVerified: reply.author_verified,
          parentId: reply.parent_id
        })) || []
      })) || [];
      
      setPostComments(transformedComments);
      
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
      const updatedComments = await optimizedCommentService.getByPost(postId, 'lounge');
      
      // 댓글 데이터를 컴포넌트 형식으로 변환
      const transformedComments = updatedComments?.map((comment: any) => ({
        ...comment,
        author: comment.author_name,
        createdAt: comment.created_at,
        isGuest: comment.is_guest,
        guestPassword: comment.guest_password,
        authorVerified: comment.author_verified,
        parentId: comment.parent_id,
        replies: comment.replies?.map((reply: any) => ({
          ...reply,
          author: reply.author_name,
          createdAt: reply.created_at,
          isGuest: reply.is_guest,
          guestPassword: reply.guest_password,
          authorVerified: reply.author_verified,
          parentId: reply.parent_id
        })) || []
      })) || [];
      
      setPostComments(transformedComments);
      
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

  const getBadgeVariant = (type?: string) => {
    switch (type) {
      case 'question': return 'blue';
      case 'experience': return 'green';
      case 'info': return 'purple';
      case 'free': return 'gray';
      case 'news': return 'orange';
      case 'advice': return 'teal';
      case 'recommend': return 'pink';
      case 'anonymous': return 'red';
      default: return 'gray';
    }
  };

  const getBadgeText = (type?: string) => {
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

  // 로딩 중일 때 스켈레톤 UI 표시
  if (isLoading) {
    return (
      <Container maxW="800px" py={8}>
        <PostDetailSkeleton />
      </Container>
    );
  }

  // 게시글을 찾을 수 없을 때
  if (!post) {
    return (
      <Container maxW="800px" py={8}>
        <EmptyState
          title="글을 찾을 수 없어요"
          description="요청하신 글이 존재하지 않거나 삭제되었습니다"
          actionText="라운지로 돌아가기"
          onAction={() => window.location.href = '/lounge'}
        />
      </Container>
    );
  }

  return (
    <>
      <SEOHead
        title={post.title}
        description={post.summary || post.content?.substring(0, 150).replace(/[#*`]/g, '') + '...'}
        keywords={`HR, 인사, 커뮤니티, ${post.tags?.join(', ')}, ${post.type === 'question' ? '질문, Q&A' : post.type === 'experience' ? '경험담, 사례' : '팁, 노하우'}`}
        url={`/lounge/${post.id}`}
        type="article"
        author={post.author_name}
        publishedTime={post.createdAt}
        tags={post.tags}
      />
      {post.type === 'question' && (
        <QAPageJsonLd
          title={post.title}
          question={post.title}
          answer={post.content?.substring(0, 500).replace(/[#*`]/g, '') + '...'}
          author={post.author_name}
          datePublished={post.createdAt}
          url={`/lounge/${post.id}`}
          tags={post.tags}
        />
      )}
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Lounge', url: '/lounge' },
          { name: post.title, url: `/lounge/${post.id}` }
        ]}
      />
      <Container maxW="800px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 글 헤더 */}
        <VStack spacing={6} align="stretch">
          <HStack spacing={3} align="center">
            <Badge colorScheme={getBadgeVariant(post.type)} size="md">
              {getBadgeText(post.type)}
            </Badge>
            
            {post.isExcellent && (
              <Badge variant="excellent" size="md">
                우수
              </Badge>
            )}
          </HStack>

          {/* 우수 글 승격 힌트 */}
          {post.isExcellent && (
            <AdminHint type="success">
              이 글은 좋아요 50개 이상을 받아 우수 글로 선정되었습니다. Story 승격 후보입니다.
            </AdminHint>
          )}

          <HStack justify="space-between" align="flex-start">
            <Heading 
              as="h1" 
              size="xl" 
              lineHeight="1.4" 
              color={colorMode === 'dark' ? 'gray.50' : 'gray.900'} 
              flex="1"
              wordBreak="break-word"
              whiteSpace="pre-wrap"
              overflowWrap="break-word"
            >
              {post.title}
            </Heading>
            
            {/* 작성자/관리자 수정/삭제 버튼 */}
            {user && (isAdmin || post.author_id === user.id || post.author_name === user.name) && (
              <HStack spacing={3} flexShrink={0} ml={6}>
                <Button
                  leftIcon={<EditIcon />}
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/lounge/${postId}/edit`)}
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

          <HStack justify="space-between" align="flex-start">
            <VStack align="flex-start" spacing={2}>
              <HStack spacing={4} fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                <HStack spacing={2}>
                  <Text fontWeight="500">{post.author_name}</Text>
                  {post.author_id && (
                    <LevelBadge 
                      level={getUserDisplayLevel(post.author_id).level} 
                      size="xs" 
                      variant="subtle"
                      showIcon={true}
                    />
                  )}
                  {post.author_verified && (
                    <Badge colorScheme="green" size="sm">인사담당자</Badge>
                  )}
                </HStack>
                <Text>·</Text>
                <Text>{new Date(post.created_at).toLocaleString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit', 
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</Text>
              </HStack>
              
              <HStack spacing={2} flexWrap="wrap">
                {post.tags.map((tag, index) => {
                  const tagData = getTagById(tag);
                  return (
                    <Tag key={index} size="sm" variant="subtle">
                      <TagLabel>{tagData ? tagData.name : tag}</TagLabel>
                    </Tag>
                  );
                })}
              </HStack>
            </VStack>

          </HStack>
        </VStack>

        <Divider />

        {/* 글 본문 */}
        <Box
          fontSize="lg"
          lineHeight="1.8"
          color={colorMode === 'dark' ? 'gray.200' : 'gray.800'}
          overflowY="auto"
          sx={{
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              fontWeight: '600',
              color: colorMode === 'dark' ? 'gray.50' : 'gray.900',
              mt: 6,
              mb: 3,
            },
            '& h1': { fontSize: 'xl' },
            '& h2': { fontSize: 'lg' },
            '& h3': { fontSize: 'md' },
            '& p': {
              mb: 3,
            },
          }}
          dangerouslySetInnerHTML={{
            __html: (() => {
              const content = post.content;
              
              // HTML 콘텐츠인지 확인 (WYSIWYG 에디터로 작성된 경우)
              const isHTML = content.includes('<p>') || content.includes('<h1>') || content.includes('<span style=');
              
              if (isHTML) {
                // 이미 HTML이면 그대로 사용 (형광펜 스타일 최적화)
                // 형광펜 배경색이 밝기 때문에 어두운 텍스트가 더 잘 보임
                return content
                  .replace(/background-color:\s*rgb\(254,\s*240,\s*138\)/g, 'background-color: #fef08a; color: #1f2937')
                  .replace(/background-color:\s*rgb\(187,\s*247,\s*208\)/g, 'background-color: #bbf7d0; color: #1f2937')
                  .replace(/background-color:\s*rgb\(191,\s*219,\s*254\)/g, 'background-color: #bfdbfe; color: #1f2937')
                  .replace(/background-color:\s*rgb\(252,\s*231,\s*243\)/g, 'background-color: #fce7f3; color: #1f2937')
                  .replace(/background-color:\s*rgb\(233,\s*213,\s*255\)/g, 'background-color: #e9d5ff; color: #1f2937');
              } else {
                // 마크다운이나 일반 텍스트면 변환 (형광펜 최적화)
                // 형광펜 배경색이 밝기 때문에 어두운 텍스트가 더 잘 보임
                return content
                  .replace(/==(.*?)==/g, '<span style="background-color: #fef08a; color: #1f2937; padding: 2px 4px; border-radius: 3px;">$1</span>')
                  .replace(/==green\[(.*?)\]==/g, '<span style="background-color: #bbf7d0; color: #1f2937; padding: 2px 4px; border-radius: 3px;">$1</span>')
                  .replace(/==blue\[(.*?)\]==/g, '<span style="background-color: #bfdbfe; color: #1f2937; padding: 2px 4px; border-radius: 3px;">$1</span>')
                  .replace(/==pink\[(.*?)\]==/g, '<span style="background-color: #fce7f3; color: #1f2937; padding: 2px 4px; border-radius: 3px;">$1</span>')
                  .replace(/==purple\[(.*?)\]==/g, '<span style="background-color: #e9d5ff; color: #1f2937; padding: 2px 4px; border-radius: 3px;">$1</span>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/~~(.*?)~~/g, '<del>$1</del>')
                  .replace(/\n/g, '<br>');
              }
            })()
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
            isLoading={isLiking}
            loadingText={isLiked ? "취소 중..." : "좋아요 중..."}
            disabled={isLiking || isBookmarking}
          >
            좋아요 {likeCount}
          </Button>
          
          <Button
            leftIcon={<AttachmentIcon />}
            variant={isBookmarked ? "solid" : "outline"}
            colorScheme={isBookmarked ? "yellow" : "gray"}
            size="md"
            onClick={handleBookmark}
            isLoading={isBookmarking}
            loadingText={isBookmarked ? "해제 중..." : "북마크 중..."}
            disabled={isBookmarking || isLiking}
          >
            북마크 {scrapCount}
          </Button>
        </HStack>

        <Divider />

        {/* 댓글 섹션 */}
        <VStack spacing={6} align="stretch">
          <HStack justify="space-between" align="center">
            <Heading as="h3" size="md" color={colorMode === 'dark' ? 'gray.50' : 'gray.900'}>
              댓글 {postComments.length}개
            </Heading>
            
            <Text fontSize="sm" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
              실전 사례일수록 더 좋아요. 민감정보는 가려주세요.
            </Text>
          </HStack>
          
          <CommentForm 
            onSubmit={handleCommentSubmit}
            isSubmitting={isSubmittingComment}
            isLoggedIn={!!user}
            currentUserName={user?.name || ''}
            currentUserVerified={user?.isVerified || false}
          />
          
          <CommentList 
            comments={postComments} 
            currentUser={user}
            isLoggedIn={isLoggedIn}
            onEdit={handleCommentEdit}
            onDelete={handleCommentDelete}
            onReply={handleCommentReply}
          />
        </VStack>
      </VStack>
      </Container>
    </>
  );
};

export default LoungeDetail;