import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Textarea,
  Button,
  Divider,
  useColorMode,
  Input,
  FormControl,
  FormLabel,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Badge,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
import dayjs from 'dayjs';
import LevelBadge from './UserLevel/LevelBadge';
import { getDatabaseUserLevel, databaseUserLevelService } from '../services/databaseUserLevelService';
import { useAuth } from '../contexts/AuthContext';

interface CommentData {
  id: number;
  author: string;
  content: string;
  createdAt: string;
  isGuest?: boolean;
  guestPassword?: string;
  authorVerified?: boolean;
  parentId?: number;
  authorId?: string;
  replies?: CommentData[];
}

interface CommentProps {
  comment: CommentData;
  currentUser?: { id: string; name: string; isAdmin?: boolean };
  isLoggedIn?: boolean;
  onEdit?: (commentId: number, newContent: string, password?: string) => void;
  onDelete?: (commentId: number, password?: string) => void;
  onReply?: (parentId: number, content: string, author?: string, password?: string) => void;
  depth?: number;
}

const Comment: React.FC<CommentProps> = ({ 
  comment, 
  currentUser, 
  isLoggedIn, 
  onEdit, 
  onDelete,
  onReply,
  depth = 0
}) => {
  const { colorMode } = useColorMode();
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [editContent, setEditContent] = useState(comment.content);
  const [deletePassword, setDeletePassword] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyGuestName, setReplyGuestName] = useState('');
  const [replyGuestPassword, setReplyGuestPassword] = useState('');
  
  // 실시간 레벨 상태 관리
  const [authorLevel, setAuthorLevel] = useState(1);
  const [isLoadingLevel, setIsLoadingLevel] = useState(false);

  // 댓글 작성자의 레벨 정보 로드
  useEffect(() => {
    const loadAuthorLevel = async () => {
      console.log(`🔍 댓글 레벨 로드 체크 (ID: ${comment.id}):`, {
        author: comment.author,
        authorId: comment.authorId,
        isGuest: comment.isGuest,
        hasAuthorId: !!comment.authorId,
        parentId: comment.parentId,
        commentType: comment.parentId ? '대댓글' : '댓글'
      });

      if (!comment.isGuest && comment.authorId) {
        try {
          setIsLoadingLevel(true);
          console.log(`📊 ${comment.parentId ? '대댓글' : '댓글'} 작성자 레벨 로드 시작: ${comment.author} (${comment.authorId})`);
          const levelData = await getDatabaseUserLevel(comment.authorId);
          console.log(`✅ ${comment.parentId ? '대댓글' : '댓글'} 작성자 레벨 로드 완료: ${comment.author} LV${levelData.level}`);
          setAuthorLevel(levelData.level);
        } catch (error) {
          console.error(`❌ ${comment.parentId ? '대댓글' : '댓글'} 작성자 레벨 로드 실패:`, comment.author, error);
          setAuthorLevel(1); // 기본값
        } finally {
          setIsLoadingLevel(false);
        }
      } else {
        console.log(`⏭️ 게스트 ${comment.parentId ? '대댓글' : '댓글'}이거나 authorId 누락: ${comment.author}`, {
          isGuest: comment.isGuest,
          authorId: comment.authorId
        });
        setIsLoadingLevel(false);
        setAuthorLevel(1);
      }
    };

    loadAuthorLevel();
  }, [comment.authorId, comment.isGuest, comment.author, comment.id, comment.parentId]);

  // 레벨업 이벤트 리스너
  useEffect(() => {
    const handleLevelUp = (event: CustomEvent) => {
      if (event.detail.userId === comment.authorId) {
        console.log(`💫 댓글 작성자 레벨업 반영: ${comment.author} LV${event.detail.oldLevel} → LV${event.detail.newLevel}`);
        setAuthorLevel(event.detail.newLevel);
      }
    };

    // 캐시 무효화 이벤트 리스너
    const handleCacheInvalidated = (event: CustomEvent) => {
      if (event.detail.userId === comment.authorId) {
        console.log(`🔄 댓글 작성자 캐시 무효화됨, 레벨 새로고침: ${comment.author}`);
        getDatabaseUserLevel(comment.authorId).then(levelData => {
          setAuthorLevel(levelData.level);
        }).catch(error => {
          console.warn('댓글 작성자 캐시 무효화 후 레벨 로드 실패:', error);
        });
      }
    };

    if (typeof window !== 'undefined' && !comment.isGuest && comment.authorId) {
      window.addEventListener('userLevelUp', handleLevelUp as EventListener);
      window.addEventListener('userCacheInvalidated', handleCacheInvalidated as EventListener);
      return () => {
        window.removeEventListener('userLevelUp', handleLevelUp as EventListener);
        window.removeEventListener('userCacheInvalidated', handleCacheInvalidated as EventListener);
      };
    }
  }, [comment.authorId, comment.author, comment.isGuest]);

  // 현재 사용자가 이 댓글을 수정/삭제할 수 있는지 확인
  const canEditDelete = () => {
    // 게스트 댓글: 항상 비밀번호로 수정/삭제 가능
    if (comment.isGuest) {
      return true;
    }
    
    // 로그인 댓글: 로그인 상태이고 작성자 ID가 같거나 관리자인 경우
    if (isLoggedIn && currentUser) {
      return comment.authorId === currentUser.id || currentUser.isAdmin;
    }
    
    // 로그인하지 않은 상태에서는 로그인 댓글 수정/삭제 불가
    return false;
  };

  const handleEdit = () => {
    if (!onEdit) return;
    
    if (!editContent.trim()) {
      toast({
        title: "내용을 입력해주세요",
        status: "error",
        duration: 2000,
      });
      return;
    }

    if (comment.isGuest) {
      if (!editPassword.trim()) {
        toast({
          title: "비밀번호를 입력해주세요",
          status: "error",
          duration: 2000,
        });
        return;
      }
      onEdit(comment.id, editContent.trim(), editPassword);
    } else {
      onEdit(comment.id, editContent.trim());
    }
    
    onEditClose();
    setEditPassword('');
  };

  const handleDelete = () => {
    if (!onDelete) return;
    
    if (comment.isGuest) {
      if (!deletePassword.trim()) {
        toast({
          title: "비밀번호를 입력해주세요",
          status: "error",
          duration: 2000,
        });
        return;
      }
      onDelete(comment.id, deletePassword);
    } else {
      onDelete(comment.id);
    }
    
    onDeleteClose();
    setDeletePassword('');
  };

  const handleReply = () => {
    if (!onReply) return;
    
    if (!replyContent.trim()) {
      toast({
        title: "내용을 입력해주세요",
        status: "error",
        duration: 2000,
      });
      return;
    }

    if (!isLoggedIn) {
      if (!replyGuestName.trim() || !replyGuestPassword.trim()) {
        toast({
          title: "닉네임과 비밀번호를 입력해주세요",
          status: "error",
          duration: 2000,
        });
        return;
      }
      onReply(comment.id, replyContent.trim(), replyGuestName.trim(), replyGuestPassword.trim());
    } else {
      onReply(comment.id, replyContent.trim());
    }
    
    // 입력 필드 초기화
    setReplyContent('');
    setReplyGuestName('');
    setReplyGuestPassword('');
    setIsReplying(false);
  };

  return (
    <>
      <HStack align="flex-start" spacing={3} w="full" pl={depth > 0 ? 8 : 0}>
        <Avatar 
          size="sm" 
          name={comment.author} 
          // 게스트가 아닌 모든 사용자에게 기본 아바타 표시 (이름 기반 색상 아바타)
          // src는 현재 로그인한 사용자가 자신의 댓글을 볼 때만 실제 아바타 이미지 표시
          src={
            comment.isGuest ? undefined : (
              user && user.name === comment.author ? user?.avatar : undefined
            )
          } 
        />
        <VStack align="stretch" flex={1} spacing={2}>
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Text fontSize="sm" fontWeight="500" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                {comment.author}
                {comment.isGuest && (
                  <Text as="span" fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'} ml={1}>
                    (게스트)
                  </Text>
                )}
              </Text>
              {!comment.isGuest && comment.authorId && (
                <>
                  {/* 댓글 작성자가 관리자이고 본인 댓글인 경우에만 관리자 뱃지 */}
                  {currentUser?.isAdmin && comment.authorId === currentUser.id && (
                    <Badge colorScheme="purple" size="sm">관리자</Badge>
                  )}
                  
                  {/* 관리자 뱃지가 표시되지 않는 모든 경우에 레벨 표시 */}
                  {!(currentUser?.isAdmin && comment.authorId === currentUser.id) && (
                    isLoadingLevel ? (
                      <Badge colorScheme="gray" size="sm" variant="subtle">로딩중...</Badge>
                    ) : (
                      <LevelBadge 
                        level={authorLevel} 
                        size="xs" 
                        variant="subtle"
                        showIcon={true}
                      />
                    )
                  )}
                </>
              )}
              {comment.authorVerified && !comment.isGuest && (
                <Badge colorScheme="green" size="sm">인사담당자</Badge>
              )}
            </HStack>
            <HStack spacing={2}>
              <Text fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}>
                {dayjs(comment.createdAt).format('YYYY.MM.DD HH:mm')}
              </Text>
              {canEditDelete() && onEdit && (
                <IconButton
                  aria-label="댓글 수정"
                  icon={<EditIcon />}
                  size="xs"
                  variant="ghost"
                  color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}
                  _hover={{ color: 'brand.500' }}
                  onClick={onEditOpen}
                />
              )}
              {canEditDelete() && onDelete && (
                <IconButton
                  aria-label="댓글 삭제"
                  icon={<DeleteIcon />}
                  size="xs"
                  variant="ghost"
                  color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}
                  _hover={{ color: 'red.500' }}
                  onClick={onDeleteOpen}
                />
              )}
            </HStack>
          </HStack>
          <Text 
            fontSize="sm" 
            color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'} 
            lineHeight="1.6"
            wordBreak="break-word"
            whiteSpace="pre-wrap"
            maxW="100%"
            overflowWrap="break-word"
          >
            {comment.content}
          </Text>
          
          {/* 답글 버튼 (최상위 댓글에만) */}
          {depth === 0 && onReply && (
            <HStack>
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setIsReplying(!isReplying)}
                color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                _hover={{ color: 'brand.500' }}
              >
                답글
              </Button>
            </HStack>
          )}
        </VStack>
      </HStack>
      
      {/* 답글 작성 폼 */}
      {isReplying && (
        <VStack spacing={3} align="stretch" pl={depth > 0 ? 11 : 3} mt={2}>
          {!isLoggedIn && (
            <HStack spacing={2}>
              <Input
                placeholder="닉네임"
                value={replyGuestName}
                onChange={(e) => setReplyGuestName(e.target.value)}
                size="sm"
                maxLength={20}
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
              />
              <Input
                type="password"
                placeholder="비밀번호"
                value={replyGuestPassword}
                onChange={(e) => setReplyGuestPassword(e.target.value)}
                size="sm"
                maxLength={20}
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
              />
            </HStack>
          )}
          
          <VStack align="stretch" spacing={2}>
            <Textarea
              placeholder={isLoggedIn ? "답글을 입력하세요..." : "답글을 입력하세요..."}
              value={replyContent}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setReplyContent(e.target.value);
                }
              }}
              size="sm"
              rows={2}
              maxLength={500}
              bg={colorMode === 'dark' ? '#3c3c47' : '#e4e4e5'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #9e9ea4'}
              color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
              _placeholder={{
                color: colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'
              }}
              _focus={{ 
                bg: colorMode === 'dark' ? '#3c3c47' : 'white',
                borderColor: 'brand.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
              }}
              wordBreak="break-word"
              whiteSpace="pre-wrap"
            />
            <Text 
              fontSize="xs" 
              color={replyContent.length > 450 ? 'red.500' : colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}
              textAlign="right"
            >
              {replyContent.length}/500자
            </Text>
          </VStack>
          
          <HStack justify="flex-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsReplying(false);
                setReplyContent('');
                setReplyGuestName('');
                setReplyGuestPassword('');
              }}
            >
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleReply}
              disabled={!replyContent.trim() || (!isLoggedIn && (!replyGuestName.trim() || !replyGuestPassword.trim()))}
            >
              답글 등록
            </Button>
          </HStack>
        </VStack>
      )}
      
      {/* 대댓글 표시 */}
      {comment.replies && comment.replies.length > 0 && (
        <VStack spacing={3} align="stretch" mt={3}>
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              isLoggedIn={isLoggedIn}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </VStack>
      )}

      {/* 수정 모달 */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>댓글 수정</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>내용</FormLabel>
                <VStack align="stretch" spacing={2}>
                  <Textarea
                    value={editContent}
                    onChange={(e) => {
                      if (e.target.value.length <= 1000) {
                        setEditContent(e.target.value);
                      }
                    }}
                    placeholder="수정할 내용을 입력하세요"
                    rows={4}
                    maxLength={1000}
                    wordBreak="break-word"
                    whiteSpace="pre-wrap"
                  />
                  <Text 
                    fontSize="xs" 
                    color={editContent.length > 900 ? 'red.500' : 'gray.500'}
                    textAlign="right"
                  >
                    {editContent.length}/1000자
                  </Text>
                </VStack>
              </FormControl>
              {comment.isGuest && (
                <FormControl>
                  <FormLabel>비밀번호</FormLabel>
                  <Input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="댓글 작성 시 입력한 비밀번호"
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              취소
            </Button>
            <Button onClick={handleEdit}>
              수정
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 삭제 모달 */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>댓글 삭제</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>정말로 이 댓글을 삭제하시겠습니까?</Text>
              {comment.isGuest && (
                <FormControl>
                  <FormLabel>비밀번호</FormLabel>
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="댓글 작성 시 입력한 비밀번호"
                  />
                </FormControl>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              취소
            </Button>
            <Button colorScheme="red" onClick={handleDelete}>
              삭제
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

interface CommentListProps {
  comments: CommentData[];
  currentUser?: { id: string; name: string; isAdmin?: boolean };
  isLoggedIn?: boolean;
  onEdit?: (commentId: number, newContent: string, password?: string) => void;
  onDelete?: (commentId: number, password?: string) => void;
  onReply?: (parentId: number, content: string, author?: string, password?: string) => void;
}

export const CommentList: React.FC<CommentListProps> = ({ 
  comments, 
  currentUser, 
  isLoggedIn, 
  onEdit, 
  onDelete,
  onReply
}) => {
  const { colorMode } = useColorMode();
  
  if (comments.length === 0) {
    return (
      <Box textAlign="center" py={8} color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}>
        <Text>아직 댓글이 없어요. 첫 번째 댓글을 남겨보세요!</Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      {comments.map((comment, index) => (
        <Box key={comment.id}>
          <Comment 
            comment={comment} 
            currentUser={currentUser}
            isLoggedIn={isLoggedIn}
            onEdit={onEdit}
            onDelete={onDelete}
            onReply={onReply}
          />
          {index < comments.length - 1 && <Divider mt={4} />}
        </Box>
      ))}
    </VStack>
  );
};

interface CommentFormProps {
  onSubmit: (content: string, author?: string, password?: string) => void;
  isSubmitting?: boolean;
  isLoggedIn?: boolean;
  currentUserName?: string;
  currentUserVerified?: boolean;
}

// 실시간 사용자 레벨 표시 컴포넌트
const UserLevelDisplay: React.FC<{ user: any }> = ({ user }) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLoadingLevel, setIsLoadingLevel] = useState(false);

  // 초기 레벨 로드
  useEffect(() => {
    const loadUserLevel = async () => {
      if (user?.id && !user.isAdmin) {
        try {
          setIsLoadingLevel(true);
          const levelData = await getDatabaseUserLevel(user.id);
          setCurrentLevel(levelData.level);
        } catch (error) {
          console.warn('사용자 레벨 로드 실패:', error);
          setCurrentLevel(1);
        } finally {
          setIsLoadingLevel(false);
        }
      }
    };

    loadUserLevel();
  }, [user?.id, user?.isAdmin]);

  // 레벨업 이벤트 리스너
  useEffect(() => {
    const handleLevelUp = (event: CustomEvent) => {
      if (event.detail.userId === user?.id) {
        console.log(`🎉 실시간 레벨업 반영: ${user.name} LV${event.detail.oldLevel} → LV${event.detail.newLevel}`);
        setCurrentLevel(event.detail.newLevel);
      }
    };

    // 캐시 무효화 이벤트 리스너
    const handleCacheInvalidated = (event: CustomEvent) => {
      if (event.detail.userId === user?.id) {
        console.log(`🔄 댓글 폼 사용자 캐시 무효화됨, 레벨 새로고침: ${user.name}`);
        getDatabaseUserLevel(user.id).then(levelData => {
          setCurrentLevel(levelData.level);
        }).catch(error => {
          console.warn('캐시 무효화 후 레벨 로드 실패:', error);
        });
      }
    };

    if (typeof window !== 'undefined' && user?.id && !user.isAdmin) {
      window.addEventListener('userLevelUp', handleLevelUp as EventListener);
      window.addEventListener('userCacheInvalidated', handleCacheInvalidated as EventListener);
      return () => {
        window.removeEventListener('userLevelUp', handleLevelUp as EventListener);
        window.removeEventListener('userCacheInvalidated', handleCacheInvalidated as EventListener);
      };
    }
  }, [user?.id, user?.name, user?.isAdmin]);

  if (user?.isAdmin) {
    return <Badge colorScheme="purple" size="sm">관리자</Badge>;
  }

  if (isLoadingLevel) {
    return <Badge colorScheme="gray" size="sm">LV--</Badge>;
  }

  return (
    <LevelBadge 
      level={currentLevel} 
      size="xs" 
      variant="subtle"
      showIcon={true}
    />
  );
};

export const CommentForm: React.FC<CommentFormProps> = ({ 
  onSubmit, 
  isSubmitting = false,
  isLoggedIn = false,
  currentUserName = '',
  currentUserVerified = false
}) => {
  const { colorMode } = useColorMode();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPassword, setGuestPassword] = useState('');

  // 댓글 등록 후 레벨 업데이트 트리거
  const handleSubmit = async () => {
    if (content.trim()) {
      try {
        if (isLoggedIn) {
          onSubmit(content.trim());
          
          // 댓글 등록 후 사용자 레벨 업데이트 트리거 (로그인 사용자만)
          if (user?.id && !user.isAdmin) {
            console.log('📝 댓글 등록 완료, 레벨 업데이트 트리거 중...');
            setTimeout(async () => {
              try {
                await databaseUserLevelService.updateUserActivity(user.id, true);
                console.log('✅ 댓글 등록 후 레벨 업데이트 완료');
              } catch (error) {
                console.warn('⚠️ 댓글 등록 후 레벨 업데이트 실패:', error);
              }
            }, 500); // 댓글 등록 후 0.5초 후 레벨 업데이트
          }
        } else {
          if (guestName.trim() && guestPassword.trim()) {
            onSubmit(content.trim(), guestName.trim(), guestPassword.trim());
            setGuestName('');
            setGuestPassword('');
          }
        }
        setContent('');
      } catch (error) {
        console.error('댓글 등록 실패:', error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const isFormValid = content.trim() && (isLoggedIn || (guestName.trim() && guestPassword.trim()));

  return (
    <VStack align="stretch" spacing={4}>
      {isLoggedIn && (
        <HStack spacing={2} align="center">
          <Avatar size="xs" name={user?.name} src={user?.avatar} />
          <Text fontSize="sm" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
            {currentUserName}님으로 댓글 작성
          </Text>
          {user && (
            <UserLevelDisplay user={user} />
          )}
          {currentUserVerified && (
            <Badge colorScheme="green" size="sm">인사담당자</Badge>
          )}
        </HStack>
      )}
      
      {!isLoggedIn && (
        <HStack spacing={3}>
          <FormControl>
            <FormLabel fontSize="sm" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              닉네임
            </FormLabel>
            <Input
              placeholder="닉네임을 입력하세요"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              size="sm"
              maxLength={20}
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
              _placeholder={{
                color: colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'
              }}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
              }}
            />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
              비밀번호
            </FormLabel>
            <Input
              type="password"
              placeholder="비밀번호 (수정/삭제용)"
              value={guestPassword}
              onChange={(e) => setGuestPassword(e.target.value)}
              size="sm"
              maxLength={20}
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
              _placeholder={{
                color: colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'
              }}
              _focus={{
                borderColor: 'brand.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
              }}
            />
          </FormControl>
        </HStack>
      )}
      
      <VStack align="stretch" spacing={2}>
        <Textarea
          placeholder={isLoggedIn ? `${currentUserName}님, 댓글을 입력하세요. (Ctrl+Enter로 빠른 등록)` : "댓글을 입력하세요. (Ctrl+Enter로 빠른 등록)"}
          value={content}
          onChange={(e) => {
            if (e.target.value.length <= 1000) {
              setContent(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          minH="100px"
          maxH="300px"
          resize="vertical"
          maxLength={1000}
          bg={colorMode === 'dark' ? '#3c3c47' : '#e4e4e5'}
          border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #9e9ea4'}
          color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          _placeholder={{
            color: colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'
          }}
          _focus={{ 
            bg: colorMode === 'dark' ? '#3c3c47' : 'white',
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
          }}
          _hover={{
            borderColor: colorMode === 'dark' ? '#626269' : '#7e7e87'
          }}
          wordBreak="break-word"
          whiteSpace="pre-wrap"
        />
        <HStack justify="space-between">
          <Text 
            fontSize="xs" 
            color={content.length > 900 ? 'red.500' : colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}
          >
            {content.length}/1000자
          </Text>
          <Text fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}>
            Ctrl+Enter로 빠른 등록
          </Text>
        </HStack>
      </VStack>
      <HStack justify="flex-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setContent('')}
          disabled={!content.trim() || isSubmitting}
        >
          취소
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!isFormValid}
          isLoading={isSubmitting}
          loadingText="등록 중"
        >
          댓글 등록
        </Button>
      </HStack>
    </VStack>
  );
};

export default Comment;