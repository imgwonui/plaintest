import React, { useState, useEffect, useRef } from 'react';
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
import { getDatabaseUserLevel } from '../services/databaseUserLevelService';

// 게시글 작성자 실시간 레벨 표시 컴포넌트
const PostAuthorLevel: React.FC<{ authorId: string }> = ({ authorId }) => {
  const [authorLevel, setAuthorLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 초기 레벨 로드
  useEffect(() => {
    const loadLevel = async () => {
      try {
        setIsLoading(true);
        const levelData = await getDatabaseUserLevel(authorId);
        setAuthorLevel(levelData.level);
      } catch (error) {
        console.warn('게시글 작성자 레벨 로드 실패:', error);
        setAuthorLevel(1);
      } finally {
        setIsLoading(false);
      }
    };

    if (authorId) {
      loadLevel();
    }
  }, [authorId]);

  // 레벨업 이벤트 리스너
  useEffect(() => {
    const handleLevelUp = (event: CustomEvent) => {
      if (event.detail.userId === authorId) {
        console.log(`📈 게시글 작성자 레벨업 반영: ${authorId} LV${event.detail.oldLevel} → LV${event.detail.newLevel}`);
        setAuthorLevel(event.detail.newLevel);
      }
    };

    // 캐시 무효화 이벤트 리스너
    const handleCacheInvalidated = (event: CustomEvent) => {
      if (event.detail.userId === authorId) {
        console.log(`🔄 게시글 작성자 캐시 무효화됨, 레벨 새로고침: ${authorId}`);
        getDatabaseUserLevel(authorId).then(levelData => {
          setAuthorLevel(levelData.level);
        }).catch(error => {
          console.warn('게시글 작성자 캐시 무효화 후 레벨 로드 실패:', error);
        });
      }
    };

    if (typeof window !== 'undefined' && authorId) {
      window.addEventListener('userLevelUp', handleLevelUp as EventListener);
      window.addEventListener('userCacheInvalidated', handleCacheInvalidated as EventListener);
      return () => {
        window.removeEventListener('userLevelUp', handleLevelUp as EventListener);
        window.removeEventListener('userCacheInvalidated', handleCacheInvalidated as EventListener);
      };
    }
  }, [authorId]);

  if (isLoading) {
    return <LevelBadge level={1} size="xs" variant="subtle" showIcon={true} />;
  }

  return (
    <LevelBadge 
      level={authorLevel} 
      size="xs" 
      variant="subtle"
      showIcon={true}
    />
  );
};

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
  
  // 게시글 본문을 참조하는 ref
  const contentRef = useRef<HTMLDivElement>(null);

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
            authorId: comment.author_id,
            authorAvatarUrl: comment.author_avatar_url || comment.author_profile?.avatar_url,
            authorLevel: comment.authorLevel || comment.author_level?.level || 1,
            replies: comment.replies?.map((reply: any) => ({
              ...reply,
              author: reply.author_name,
              createdAt: reply.created_at,
              isGuest: reply.is_guest,
              guestPassword: reply.guest_password,
              authorVerified: reply.author_verified,
              parentId: reply.parent_id,
              authorId: reply.author_id,
              authorAvatarUrl: reply.author_avatar_url || reply.author_profile?.avatar_url,
              authorLevel: reply.authorLevel || reply.author_level?.level || 1
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

  // 게시글 본문 링크 클릭 이벤트 처리
  useEffect(() => {
    const setupLinkHandlers = () => {
      if (!contentRef.current || !post) return;

      const links = contentRef.current.querySelectorAll('a[href]');
      console.log(`🔗 게시글 내 링크 ${links.length}개 감지됨`);

      links.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href) return;

        // 기존 이벤트 리스너 제거 (중복 방지)
        link.removeEventListener('click', handleLinkClick);
        
        // 새 이벤트 리스너 추가
        link.addEventListener('click', handleLinkClick);
        
        // 링크 스타일 보장 (클릭 가능하다는 시각적 표시)
        link.style.cursor = 'pointer';
        link.style.textDecoration = 'underline';
        link.style.color = colorMode === 'dark' ? '#A78BFA' : '#7A5AF8';
        
        console.log(`✅ 링크 이벤트 등록: ${href}`);
      });
    };

    const handleLinkClick = (event: Event) => {
      event.preventDefault();
      const link = event.currentTarget as HTMLAnchorElement;
      const href = link.getAttribute('href');
      
      if (!href) return;

      console.log(`🖱️ 링크 클릭됨: ${href}`);

      try {
        // URL 유효성 검사
        const url = new URL(href.startsWith('http') ? href : `https://${href}`);
        
        // 외부 링크인 경우 새 창에서 열기
        if (url.hostname !== window.location.hostname) {
          console.log(`🌐 외부 링크 감지, 새 창에서 열기: ${url.href}`);
          window.open(url.href, '_blank', 'noopener,noreferrer');
          
          toast({
            title: "링크가 새 창에서 열립니다",
            status: "info",
            duration: 2000,
          });
        } else {
          // 내부 링크인 경우 React Router 사용
          console.log(`🏠 내부 링크 감지, React Router로 이동: ${url.pathname}`);
          navigate(url.pathname + url.search + url.hash);
        }
      } catch (error) {
        // URL이 유효하지 않은 경우 그냥 새 창에서 열기 시도
        console.warn(`⚠️ URL 파싱 실패, 그대로 새 창에서 열기 시도: ${href}`, error);
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    };

    // 게시글이 로드된 후 링크 핸들러 설정
    if (post && !isLoading) {
      // DOM 업데이트를 기다린 후 실행
      setTimeout(() => {
        setupLinkHandlers();
      }, 100);
    }

    // cleanup 함수
    return () => {
      if (contentRef.current) {
        const links = contentRef.current.querySelectorAll('a[href]');
        links.forEach((link) => {
          link.removeEventListener('click', handleLinkClick);
        });
      }
    };
  }, [post, isLoading, colorMode, navigate, toast]);

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
        console.log('🗑️ 라운지 포스트 삭제 시도 시작:', {
          postId,
          post: post,
          userId: user?.id,
          isAdmin: user?.isAdmin,
          canDelete: user && (user?.isAdmin || post?.author_id === user.id || post?.author_name === user.name)
        });
        
        // 권한 재확인
        if (!user || (!user.isAdmin && post?.author_id !== user.id && post?.author_name !== user.name)) {
          throw new Error('삭제 권한이 없습니다.');
        }
        
        console.log('🔑 삭제 권한 확인됨, loungeService.delete 호출 중...');
        const success = await loungeService.delete(postId);
        console.log('📊 loungeService.delete 결과:', success);
        
        if (success) {
          console.log('✅ 라운지 포스트 삭제 완료, 캐시 무효화 시작:', postId);
          
          // 관련 캐시 무효화 - 더 광범위하게
          cacheService.invalidatePost('lounge', postId);
          cacheService.deleteByPattern('lounge:*');
          cacheService.deleteByPattern('optimized_lounge:*');
          cacheService.deleteByPattern('home:*');
          
          // 사용자 프로필 캐시도 무효화
          if (user?.id) {
            cacheService.invalidateUser(user.id);
          }
          
          // sessionStorage와 localStorage도 정리
          try {
            const sessionKeys = [];
            for (let i = 0; i < sessionStorage.length; i++) {
              const key = sessionStorage.key(i);
              if (key && (key.includes('lounge') || key.includes('home'))) {
                sessionKeys.push(key);
              }
            }
            sessionKeys.forEach(key => sessionStorage.removeItem(key));
            
            const localKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.includes('lounge') || key.includes('home'))) {
                localKeys.push(key);
              }
            }
            localKeys.forEach(key => localStorage.removeItem(key));
            
            console.log('🧹 세션/로컬 스토리지 캐시 정리 완료');
          } catch (cleanupError) {
            console.warn('⚠️ 캐시 정리 중 오류:', cleanupError);
          }
          
          console.log('✅ 모든 캐시 무효화 완료');
          
          toast({
            title: '글이 삭제되었습니다',
            description: '라운지 목록으로 이동합니다.',
            status: 'success',
            duration: 3000,
          });
          
          // 삭제 완료 후 라운지로 이동 (강제 새로고침 신호 포함)
          navigate('/lounge', { 
            state: { 
              refresh: true, 
              deleted: true,
              deletedPostId: postId,
              timestamp: Date.now() 
            },
            replace: true 
          });
          
        } else {
          throw new Error('삭제 실패: 서버에서 false 반환');
        }
      } catch (error) {
        console.error('❌ 글 삭제 실패:', error);
        toast({
          title: '글 삭제 중 오류가 발생했습니다',
          description: error instanceof Error ? error.message : '알 수 없는 오류',
          status: 'error',
          duration: 5000,
        });
      }
    }
  };

  const handleCommentSubmit = async (content: string, author?: string, password?: string) => {
    setIsSubmittingComment(true);

    try {
      // 댓글 생성 - optimizedCommentService 사용으로 캐시 자동 무효화
      const newComment = await optimizedCommentService.create({
        post_id: postId,
        post_type: 'lounge' as const,
        content,
        author_name: user ? user.name : (author || "익명"),
        author_id: user?.id || null,
        is_guest: !user,
        guest_password: password,
        author_verified: user?.isVerified || false
      });

      console.log('📝 댓글 작성 완료, 댓글 목록 새로고침...');

      // 댓글 목록 새로고침 - forceRefresh로 캐시 무시하고 최신 데이터 가져오기
      const updatedComments = await optimizedCommentService.getByPost(postId, 'lounge', true);

      // 댓글 데이터를 컴포넌트 형식으로 변환
      if (updatedComments) {
        const transformedComments = updatedComments.map((comment: any) => ({
          ...comment,
          author: comment.author_name,
          createdAt: comment.created_at,
          isGuest: comment.is_guest,
          guestPassword: comment.guest_password,
          authorVerified: comment.author_verified,
          parentId: comment.parent_id,
          authorId: comment.author_id,
          authorAvatarUrl: comment.author_avatar_url || comment.author_profile?.avatar_url,
          authorLevel: comment.authorLevel || comment.author_level?.level || 1,
          replies: comment.replies?.map((reply: any) => ({
            ...reply,
            author: reply.author_name,
            createdAt: reply.created_at,
            isGuest: reply.is_guest,
            guestPassword: reply.guest_password,
            authorVerified: reply.author_verified,
            parentId: reply.parent_id,
            authorId: reply.author_id,
            authorAvatarUrl: reply.author_avatar_url || reply.author_profile?.avatar_url,
            authorLevel: reply.authorLevel || reply.author_level?.level || 1
          })) || []
        }));
        
        console.log('🔄 댓글 상태 업데이트:', transformedComments.length + '개');
        console.log('📋 변환된 댓글 목록:', transformedComments);
        
        setPostComments(transformedComments);
        
        // 5. 추가 검증: 새 댓글이 UI에 반영되었는지 확인
        setTimeout(() => {
          if (newComment?.id) {
            const uiComment = transformedComments.find(c => c.id === newComment.id);
            if (uiComment) {
              console.log('✅ UI 반영 확인됨: 새 댓글이 화면에 표시됨');
            } else {
              console.error('❌ UI 반영 실패: 새 댓글이 화면에 표시되지 않음');
            }
          }
        }, 500);
        
        toast({
          title: "댓글이 등록되었습니다",
          status: "success",
          duration: 2000,
        });
      } else {
        console.error('❌ 댓글 목록 업데이트 실패: updatedComments가 null');
        toast({
          title: "댓글은 등록되었지만 새로고침이 필요합니다",
          description: "페이지를 새로고침하면 댓글을 볼 수 있습니다",
          status: "warning", 
          duration: 4000,
        });
      }
      
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
      // 대댓글 생성 - optimizedCommentService 사용으로 캐시 자동 무효화
      const newReply = await optimizedCommentService.create({
        post_id: postId,
        post_type: 'lounge' as const,
        content,
        author_name: user ? user.name : (author || "익명"),
        author_id: user?.id || null,
        is_guest: !user,
        guest_password: password,
        author_verified: user?.isVerified || false,
        parent_id: parentId // 부모 댓글 ID
      });

      // 댓글 목록 새로고침 (forceRefresh로 최신 데이터 보장)
      const updatedComments = await optimizedCommentService.getByPost(postId, 'lounge', true);
      
      // 댓글 데이터를 컴포넌트 형식으로 변환
      const transformedComments = updatedComments?.map((comment: any) => ({
        ...comment,
        author: comment.author_name,
        createdAt: comment.created_at,
        isGuest: comment.is_guest,
        guestPassword: comment.guest_password,
        authorVerified: comment.author_verified,
        parentId: comment.parent_id,
        authorId: comment.author_id,
        authorAvatarUrl: comment.author_avatar_url,
        replies: comment.replies?.map((reply: any) => ({
          ...reply,
          author: reply.author_name,
          createdAt: reply.created_at,
          isGuest: reply.is_guest,
          guestPassword: reply.guest_password,
          authorVerified: reply.author_verified,
          parentId: reply.parent_id,
          authorId: reply.author_id,
          authorAvatarUrl: reply.author_avatar_url
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
      const updatedComments = await optimizedCommentService.getByPost(postId, 'lounge', true);
      
      // 댓글 데이터를 컴포넌트 형식으로 변환
      const transformedComments = updatedComments?.map((comment: any) => ({
        ...comment,
        author: comment.author_name,
        createdAt: comment.created_at,
        isGuest: comment.is_guest,
        guestPassword: comment.guest_password,
        authorVerified: comment.author_verified,
        parentId: comment.parent_id,
        authorId: comment.author_id,
        authorAvatarUrl: comment.author_avatar_url,
        replies: comment.replies?.map((reply: any) => ({
          ...reply,
          author: reply.author_name,
          createdAt: reply.created_at,
          isGuest: reply.is_guest,
          guestPassword: reply.guest_password,
          authorVerified: reply.author_verified,
          parentId: reply.parent_id,
          authorId: reply.author_id,
          authorAvatarUrl: reply.author_avatar_url
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
      const updatedComments = await optimizedCommentService.getByPost(postId, 'lounge', true);
      
      // 댓글 데이터를 컴포넌트 형식으로 변환
      const transformedComments = updatedComments?.map((comment: any) => ({
        ...comment,
        author: comment.author_name,
        createdAt: comment.created_at,
        isGuest: comment.is_guest,
        guestPassword: comment.guest_password,
        authorVerified: comment.author_verified,
        parentId: comment.parent_id,
        authorId: comment.author_id,
        authorAvatarUrl: comment.author_avatar_url,
        replies: comment.replies?.map((reply: any) => ({
          ...reply,
          author: reply.author_name,
          createdAt: reply.created_at,
          isGuest: reply.is_guest,
          guestPassword: reply.guest_password,
          authorVerified: reply.author_verified,
          parentId: reply.parent_id,
          authorId: reply.author_id,
          authorAvatarUrl: reply.author_avatar_url
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
                  {post.author_id && <PostAuthorLevel authorId={post.author_id} />}
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
          ref={contentRef}
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
            '& a': {
              color: colorMode === 'dark' ? '#A78BFA' : '#7A5AF8',
              textDecoration: 'underline',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: colorMode === 'dark' ? '#C4B5FD' : '#5A3CD8',
                textDecoration: 'underline',
              }
            },
          }}
          dangerouslySetInnerHTML={{
            __html: (() => {
              const content = post.content;
              console.log('🔍 게시글 콘텐츠 렌더링 시작:', { 
                contentLength: content?.length,
                containsYoutube: content?.includes('youtube'),
                containsEmbedContainer: content?.includes('embed-container'),
                firstChars: content?.substring(0, 200) 
              });
              
              // HTML 콘텐츠인지 확인 (WYSIWYG 에디터로 작성된 경우)
              const isHTML = content.includes('<p>') || content.includes('<h1>') || content.includes('<span style=') || content.includes('<div');
              
              if (isHTML) {
                console.log('✅ HTML 콘텐츠로 인식됨');
                
                // ⭐ 핵심 수정: 이미 임베드가 포함되어 있는지 확인
                const hasExistingEmbeds = content.includes('youtube-embed-container') || 
                                         content.includes('link-embed-container') ||
                                         content.includes('<iframe');
                
                if (hasExistingEmbeds) {
                  console.log('✅ 이미 임베드가 포함된 콘텐츠, 그대로 사용');
                  // 형광펜 스타일만 최적화하고 그대로 반환
                  return content
                    .replace(/background-color:\s*rgb\(254,\s*240,\s*138\)/g, 'background-color: #fef08a; color: #1f2937')
                    .replace(/background-color:\s*rgb\(187,\s*247,\s*208\)/g, 'background-color: #bbf7d0; color: #1f2937')
                    .replace(/background-color:\s*rgb\(191,\s*219,\s*254\)/g, 'background-color: #bfdbfe; color: #1f2937')
                    .replace(/background-color:\s*rgb\(252,\s*231,\s*243\)/g, 'background-color: #fce7f3; color: #1f2937')
                    .replace(/background-color:\s*rgb\(233,\s*213,\s*255\)/g, 'background-color: #e9d5ff; color: #1f2937');
                }
                
                console.log('🔄 임베드가 없는 콘텐츠, 임베드 처리 시작');
                
                // HTML 엔티티 디코딩 함수
                const decodeHtmlEntities = (str: string) => {
                  return str
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
                };
                
                // 이미 HTML이면 링크 임베드 및 유튜브 임베드 처리
                let processedContent = decodeHtmlEntities(content)
                  // 형광펜 스타일 최적화
                  .replace(/background-color:\s*rgb\(254,\s*240,\s*138\)/g, 'background-color: #fef08a; color: #1f2937')
                  .replace(/background-color:\s*rgb\(187,\s*247,\s*208\)/g, 'background-color: #bbf7d0; color: #1f2937')
                  .replace(/background-color:\s*rgb\(191,\s*219,\s*254\)/g, 'background-color: #bfdbfe; color: #1f2937')
                  .replace(/background-color:\s*rgb\(252,\s*231,\s*243\)/g, 'background-color: #fce7f3; color: #1f2937')
                  .replace(/background-color:\s*rgb\(233,\s*213,\s*255\)/g, 'background-color: #e9d5ff; color: #1f2937');
                
                // 유튜브 링크를 임베드로 변환 (iframe이 포함되지 않은 경우)
                if (processedContent.includes('youtube.com') || processedContent.includes('youtu.be')) {
                  console.log('🎥 라운지 유튜브 링크 감지됨, 임베드 변환 시도 중...');
                  
                  // 더 다양한 패턴의 유튜브 링크 매칭을 위한 개선된 정규식
                  const youtubePatterns = [
                    // 패턴 1: <p> 태그 내 평문 YouTube URL (가장 일반적인 케이스)
                    /(<p[^>]*>.*?)(https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)[^\s<]*)(.*?<\/p>)/g,
                    // 패턴 2: <a href="youtube링크">텍스트</a>
                    /<a[^>]*href=["'](https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+))[^"']*["'][^>]*>([^<]+)<\/a>/g,
                    // 패턴 3: 추가 링크 패턴들
                    /<a[^>]*href=["'](https?:\/\/(www\.)?youtube\.com\/watch\?v=([\w-]+)[^"']*)["'][^>]*>([^<]+)<\/a>/g,
                    /<a[^>]*href=["'](https?:\/\/youtu\.be\/([\w-]+)[^"']*)["'][^>]*>([^<]+)<\/a>/g
                  ];
                  
                  let matchFound = false;
                  youtubePatterns.forEach((pattern, index) => {
                    processedContent = processedContent.replace(pattern, (match, ...args) => {
                      let url, videoId, text, beforeContent = '', afterContent = '';
                      
                      if (index === 0) {
                        // 패턴 1: (<p[^>]*>.*?)(youtube URL)(.*?<\/p>)
                        [beforeContent, url, , , , , afterContent] = args;
                        text = url; // 평문 URL은 URL 자체가 텍스트
                      } else {
                        // 패턴 2-4: <a> 태그 패턴들
                        url = args[0];
                        text = args[args.length - 2]; // 텍스트는 마지막에서 두 번째
                      }
                      
                      // 비디오 ID 추출
                      if (url.includes('youtu.be/')) {
                        videoId = url.split('youtu.be/')[1].split('?')[0].split('&')[0];
                      } else if (url.includes('youtube.com/watch?v=')) {
                        videoId = url.split('v=')[1].split('&')[0];
                      } else if (url.includes('youtube.com/embed/')) {
                        videoId = url.split('embed/')[1].split('?')[0].split('&')[0];
                      }
                      
                      if (videoId && videoId.length >= 10) {
                        console.log(`🎥 라운지 패턴 ${index + 1}로 유튜브 링크 매칭 성공:`, { url, videoId, text, match });
                        matchFound = true;
                        
                        if (index === 0) {
                          // 패턴 1: <p> 태그 내 평문 URL 교체
                          return `${beforeContent}<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: ${colorMode === 'dark' ? '#A78BFA' : '#7A5AF8'}; text-decoration: underline;">${url}</a>${afterContent}
                            <div class="youtube-embed-container" style="position: relative; padding-bottom: 56.25%; height: 0; margin: 16px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, ${colorMode === 'dark' ? '0.3' : '0.1'});">
                              <iframe 
                                src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0" 
                                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen
                                loading="lazy"
                                frameborder="0">
                              </iframe>
                            </div>`;
                        } else {
                          // 패턴 2-4: <a> 태그 교체
                          return `
                            <p><a href="${url}" target="_blank" rel="noopener noreferrer" style="color: ${colorMode === 'dark' ? '#A78BFA' : '#7A5AF8'}; text-decoration: underline;">${text}</a></p>
                            <div class="youtube-embed-container" style="position: relative; padding-bottom: 56.25%; height: 0; margin: 16px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, ${colorMode === 'dark' ? '0.3' : '0.1'});">
                              <iframe 
                                src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0" 
                                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowfullscreen
                                loading="lazy"
                                frameborder="0">
                              </iframe>
                            </div>
                          `;
                        }
                      } else {
                        console.log(`❌ 라운지 패턴 ${index + 1} 매칭됐지만 비디오 ID 추출 실패:`, { url, videoId });
                        return match; // 원본 반환
                      }
                    });
                  });
                  
                  if (!matchFound) {
                    console.log('❌ 라운지 모든 유튜브 패턴 매칭 실패. 콘텐츠 샘플:', processedContent.substring(0, 500));
                  }
                }
                
                // 일반 링크를 링크 카드로 변환 (http로 시작하는 링크 중 유튜브가 아닌 것)
                processedContent = processedContent.replace(
                  /<a[^>]*href=["'](https?:\/\/(?!.*youtube\.com)(?!.*youtu\.be)[^"']+)["'][^>]*>([^<]+)<\/a>/g,
                  (match, url, text) => {
                    // 유튜브 링크는 제외
                    if (url.includes('youtube.com') || url.includes('youtu.be')) {
                      return match;
                    }
                    
                    console.log('🔗 일반 링크 카드 처리:', { url, text });
                    return `
                      <div class="link-embed-container" onclick="window.open('${url}', '_blank', 'noopener,noreferrer');" style="
                        border: 2px solid ${colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'};
                        border-radius: 8px;
                        padding: 16px;
                        margin: 16px 0;
                        background-color: ${colorMode === 'dark' ? '#3c3c47' : '#f8f9fa'};
                        transition: all 0.2s ease;
                        cursor: pointer;
                      ">
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                          <div style="
                            width: 32px;
                            height: 32px;
                            background: linear-gradient(135deg, #7A5AF8, #A78BFA);
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: 600;
                            font-size: 14px;
                          ">
                            🔗
                          </div>
                          <div style="flex: 1; min-width: 0;">
                            <div style="
                              font-weight: 600;
                              color: ${colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'};
                              font-size: 16px;
                              line-height: 1.3;
                              margin-bottom: 4px;
                              word-break: break-word;
                            ">
                              ${text}
                            </div>
                            <div style="
                              color: ${colorMode === 'dark' ? '#9e9ea4' : '#626269'};
                              font-size: 14px;
                              word-break: break-all;
                            ">
                              ${url}
                            </div>
                          </div>
                        </div>
                        <div style="
                          color: ${colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'};
                          font-size: 12px;
                          text-align: right;
                        ">
                          클릭하여 링크 열기 →
                        </div>
                      </div>
                    `;
                  }
                );
                
                console.log('✅ 임베드 처리 완료:', { 
                  originalLength: content.length,
                  processedLength: processedContent.length,
                  hasYoutubeEmbed: processedContent.includes('youtube-embed-container'),
                  hasLinkCard: processedContent.includes('link-embed-container')
                });
                
                return processedContent;
              } else {
                console.log('📝 마크다운/텍스트 콘텐츠로 인식됨');
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