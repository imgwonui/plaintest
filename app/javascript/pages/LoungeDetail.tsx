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
import SEOHead from '../components/SEOHead';
import { QAPageJsonLd, BreadcrumbJsonLd } from '../components/JsonLd';
import { useAuth } from '../contexts/AuthContext';
import { sessionLoungeService, sessionCommentService, sessionScrapService, sessionLikeService, initializeData } from '../services/sessionDataService';
import { formatDate } from '../utils/format';
import { getTagById } from '../data/tags';

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

  // 세션 데이터 로드
  useEffect(() => {
    initializeData();
    const foundPost = sessionLoungeService.getById(postId);
    if (foundPost) {
      setPost(foundPost);
      setLikeCount(foundPost.likeCount || 0);
      setScrapCount(foundPost.scrapCount || 0);
      
      // 로그인된 사용자의 좋아요/북마크 상태 확인
      if (isLoggedIn && user) {
        // 좋아요 상태 확인
        const isUserLiked = sessionLikeService.isLiked(user.id, postId, 'lounge');
        setIsLiked(isUserLiked);
        
        // 북마크 상태 확인
        const isScraped = sessionScrapService.isScraped(user.id, postId, 'lounge');
        setIsBookmarked(isScraped);
      } else {
        setIsLiked(false);
        setIsBookmarked(false);
      }
      
      // 댓글 로드 (계층구조)
      const comments = sessionCommentService.getByPostHierarchical(postId, 'lounge');
      setPostComments(comments);
    }
  }, [postId, isLoggedIn, user]);

  const handleLike = () => {
    if (!isLoggedIn || !user) {
      toast({
        title: "로그인이 필요해요",
        description: "로그인한 사용자만 좋아요를 누를 수 있어요",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (isLiked) {
      // 좋아요 해제
      const success = sessionLikeService.remove(user.id, postId, 'lounge');
      if (success) {
        setIsLiked(false);
        setLikeCount(likeCount - 1);
        toast({
          title: "좋아요를 취소했습니다",
          status: "success",
          duration: 2000,
        });
      }
    } else {
      // 좋아요 추가
      const success = sessionLikeService.add(user.id, postId, 'lounge');
      if (success) {
        setIsLiked(true);
        setLikeCount(likeCount + 1);
        toast({
          title: "좋아요를 눌렀습니다",
          status: "success",
          duration: 2000,
        });
      }
    }
  };

  const handleBookmark = () => {
    if (!isLoggedIn || !user) {
      toast({
        title: "로그인이 필요해요",
        description: "로그인한 사용자만 북마크를 사용할 수 있어요",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (isBookmarked) {
      // 북마크 해제
      const success = sessionScrapService.remove(user.id, postId, 'lounge');
      if (success) {
        setIsBookmarked(false);
        setScrapCount(scrapCount - 1);
        toast({
          title: "북마크를 해제했습니다",
          status: "success",
          duration: 2000,
        });
      }
    } else {
      // 북마크 추가
      const success = sessionScrapService.add(user.id, postId, 'lounge');
      if (success) {
        setIsBookmarked(true);
        setScrapCount(scrapCount + 1);
        toast({
          title: "북마크에 추가했습니다",
          status: "success",
          duration: 2000,
        });
      }
    }
  };

  const handleDelete = () => {
    if (window.confirm('정말로 이 글을 삭제하시겠습니까?\n삭제된 글은 복구할 수 없습니다.')) {
      try {
        const success = sessionLoungeService.delete(postId);
        if (success) {
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
      // 실제 댓글 생성 - 세션 데이터에 저장
      const newComment = sessionCommentService.create({
        postId,
        postType: 'lounge' as const,
        author: user ? user.name : (author || "익명"),
        content,
        isGuest: !user,
        guestPassword: password, // 실제로는 해시화해서 저장
        authorVerified: user?.isVerified || false
      });
      
      setPostComments([...postComments, newComment]);
      
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
      // 대댓글 생성 - 세션 데이터에 저장
      const newReply = sessionCommentService.create({
        postId,
        postType: 'lounge' as const,
        author: user ? user.name : (author || "익명"),
        content,
        isGuest: !user,
        guestPassword: password,
        authorVerified: user?.isVerified || false,
        parentId: parentId // 부모 댓글 ID
      });
      
      // 댓글 목록 새로고침 (계층구조)
      const updatedComments = sessionCommentService.getByPostHierarchical(postId, 'lounge');
      setPostComments(updatedComments);
      
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
      const updatedComment = sessionCommentService.update(commentId, newContent, password);
      
      // 댓글 목록 새로고침 (계층구조)
      const updatedComments = sessionCommentService.getByPostHierarchical(postId, 'lounge');
      setPostComments(updatedComments);
      
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
      sessionCommentService.delete(commentId, password);
      
      // 댓글 목록 새로고침 (계층구조)
      const updatedComments = sessionCommentService.getByPostHierarchical(postId, 'lounge');
      setPostComments(updatedComments);
      
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
      case 'question': return 'question';
      case 'experience': return 'experience';
      case 'help': return 'help';
      default: return 'story';
    }
  };

  const getBadgeText = (type?: string) => {
    switch (type) {
      case 'question': return '물어보고 싶어요';
      case 'experience': return '이런 일이 있었어요';
      case 'help': return '도움이 될 글이에요';
      default: return '';
    }
  };

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
        author={post.author}
        publishedTime={post.createdAt}
        tags={post.tags}
      />
      {post.type === 'question' && (
        <QAPageJsonLd
          title={post.title}
          question={post.title}
          answer={post.content?.substring(0, 500).replace(/[#*`]/g, '') + '...'}
          author={post.author}
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
            <Badge variant={getBadgeVariant(post.type)} size="md">
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
            <Heading as="h1" size="xl" lineHeight="1.4" color={colorMode === 'dark' ? 'gray.50' : 'gray.900'} flex="1">
              {post.title}
            </Heading>
            
            {/* 작성자/관리자 수정/삭제 버튼 */}
            {user && (isAdmin || post.author === user.name) && (
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
                  <Text fontWeight="500">{post.author}</Text>
                  {post.authorVerified && (
                    <Badge colorScheme="green" size="sm">인사담당자</Badge>
                  )}
                </HStack>
                <Text>·</Text>
                <Text>{formatDate(post.createdAt)}</Text>
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
                // 이미 HTML이면 그대로 사용 (형광펜 스타일 보정)
                return content
                  .replace(/background-color:\s*rgb\(254,\s*240,\s*138\)/g, 'background-color: #fef08a; color: #1f2937')
                  .replace(/background-color:\s*rgb\(187,\s*247,\s*208\)/g, 'background-color: #bbf7d0; color: #1f2937')
                  .replace(/background-color:\s*rgb\(191,\s*219,\s*254\)/g, 'background-color: #bfdbfe; color: #1f2937')
                  .replace(/background-color:\s*rgb\(252,\s*231,\s*243\)/g, 'background-color: #fce7f3; color: #1f2937')
                  .replace(/background-color:\s*rgb\(233,\s*213,\s*255\)/g, 'background-color: #e9d5ff; color: #1f2937');
              } else {
                // 마크다운이나 일반 텍스트면 변환
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