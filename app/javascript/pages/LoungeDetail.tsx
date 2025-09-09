import React, { useState } from 'react';
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
import { useParams } from 'react-router-dom';
import { StarIcon, AttachmentIcon } from '@chakra-ui/icons';
import { CommentList, CommentForm } from '../components/Comment';
import EmptyState from '../components/EmptyState';
import AdminHint from '../components/AdminHint';
import { useAuth } from '../contexts/AuthContext';
import { loungePosts } from '../mocks/lounge';
import { comments } from '../mocks/comments';
import { formatDate } from '../utils/format';

const LoungeDetail: React.FC = () => {
  const { colorMode } = useColorMode();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const postId = parseInt(id || '0');
  const toast = useToast();
  
  const [post, setPost] = useState(
    loungePosts.find(p => p.id === postId)
  );
  const [postComments, setPostComments] = useState(
    comments.filter(c => c.postId === postId && c.postType === 'lounge')
  );
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [scrapCount, setScrapCount] = useState(post?.scrapCount || 0);

  const handleLike = () => {
    if (!post) return;
    
    const newLikeCount = isLiked ? post.likeCount - 1 : post.likeCount + 1;
    setPost({ ...post, likeCount: newLikeCount });
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

  const handleCommentSubmit = async (content: string, author?: string, password?: string) => {
    setIsSubmittingComment(true);
    
    // 실제 구현에서는 API 호출
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newComment = {
      id: Date.now(),
      postId,
      postType: 'lounge' as const,
      author: user ? user.name : (author || "익명"),
      content,
      createdAt: new Date().toISOString(),
      isGuest: !user,
      guestPassword: password // 실제로는 해시화해서 저장
    };
    
    setPostComments([...postComments, newComment]);
    
    // 댓글 수 증가
    if (post) {
      setPost({ ...post, commentCount: post.commentCount + 1 });
    }
    
    setIsSubmittingComment(false);
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

          <Heading as="h1" size="xl" lineHeight="1.4" color={colorMode === 'dark' ? 'gray.50' : 'gray.900'}>
            {post.title}
          </Heading>

          <HStack justify="space-between" align="flex-start">
            <VStack align="flex-start" spacing={2}>
              <HStack spacing={4} fontSize="sm" color={colorMode === 'dark' ? 'gray.300' : 'gray.600'}>
                <Text fontWeight="500">{post.author}</Text>
                <Text>·</Text>
                <Text>{formatDate(post.createdAt)}</Text>
              </HStack>
              
              <HStack spacing={2} flexWrap="wrap">
                {post.tags.map((tag, index) => (
                  <Tag key={index} size="sm" variant="subtle">
                    <TagLabel>{tag}</TagLabel>
                  </Tag>
                ))}
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
          whiteSpace="pre-wrap"
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
          }}
        >
          {post.content}
        </Box>

        {/* 좋아요 및 북마크 버튼 */}
        <HStack justify="center" spacing={4} py={4}>
          <Button
            leftIcon={<StarIcon />}
            variant={isLiked ? "solid" : "outline"}
            colorScheme={isLiked ? "red" : "gray"}
            size="md"
            onClick={handleLike}
          >
            좋아요 {post.likeCount}
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
              댓글 {post.commentCount}개
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
          />
          
          <CommentList comments={postComments} />
        </VStack>
      </VStack>
    </Container>
  );
};

export default LoungeDetail;