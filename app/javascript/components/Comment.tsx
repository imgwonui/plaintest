import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import dayjs from 'dayjs';

interface CommentData {
  id: number;
  author: string;
  content: string;
  createdAt: string;
}

interface CommentProps {
  comment: CommentData;
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
  const { colorMode } = useColorMode();
  
  return (
    <HStack align="flex-start" spacing={3} w="full">
      <Avatar size="sm" name={comment.author} />
      <VStack align="stretch" flex={1} spacing={2}>
        <HStack justify="space-between">
          <Text fontSize="sm" fontWeight="500" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            {comment.author}
          </Text>
          <Text fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}>
            {dayjs(comment.createdAt).format('YYYY.MM.DD HH:mm')}
          </Text>
        </HStack>
        <Text fontSize="sm" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'} lineHeight="1.6">
          {comment.content}
        </Text>
      </VStack>
    </HStack>
  );
};

interface CommentListProps {
  comments: CommentData[];
}

export const CommentList: React.FC<CommentListProps> = ({ comments }) => {
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
          <Comment comment={comment} />
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
}

export const CommentForm: React.FC<CommentFormProps> = ({ 
  onSubmit, 
  isSubmitting = false,
  isLoggedIn = false,
  currentUserName = ''
}) => {
  const { colorMode } = useColorMode();
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPassword, setGuestPassword] = useState('');

  const handleSubmit = () => {
    if (content.trim()) {
      if (isLoggedIn) {
        onSubmit(content.trim());
      } else {
        if (guestName.trim() && guestPassword.trim()) {
          onSubmit(content.trim(), guestName.trim(), guestPassword.trim());
          setGuestName('');
          setGuestPassword('');
        }
      }
      setContent('');
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
      
      <Textarea
        placeholder={isLoggedIn ? `${currentUserName}님, 댓글을 입력하세요. (Ctrl+Enter로 빠른 등록)` : "댓글을 입력하세요. (Ctrl+Enter로 빠른 등록)"}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        minH="100px"
        resize="vertical"
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
      />
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