// 로딩 상태 최적화 컴포넌트
// 스켈레톤 UI, 지연 로딩, 프리로딩 등을 통해 사용자 체감 성능을 향상시킵니다.

import React, { useState, useEffect } from 'react';
import {
  Box,
  Skeleton,
  SkeletonText,
  VStack,
  HStack,
  Card,
  CardBody,
  useColorModeValue,
  keyframes,
  Spinner,
  Center,
  Text
} from '@chakra-ui/react';

// 스켈레톤 애니메이션
const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

// 스켈레톤 카드 컴포넌트
export const PostCardSkeleton: React.FC = () => {
  const shimmerBg = useColorModeValue(
    'linear-gradient(90deg, #f0f0f0 0px, #e0e0e0 40px, #f0f0f0 80px)',
    'linear-gradient(90deg, #2d3748 0px, #4a5568 40px, #2d3748 80px)'
  );

  return (
    <Card mb={6}>
      <CardBody>
        <VStack align="stretch" spacing={4}>
          {/* 제목 스켈레톤 */}
          <Box
            height="24px"
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="md"
          />
          
          {/* 요약 스켈레톤 */}
          <VStack align="stretch" spacing={2}>
            <Box
              height="16px"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="sm"
            />
            <Box
              height="16px"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="sm"
              width="80%"
            />
          </VStack>

          {/* 메타 정보 스켈레톤 */}
          <HStack spacing={4}>
            <Box
              height="14px"
              width="60px"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="sm"
            />
            <Box
              height="14px"
              width="80px"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="sm"
            />
            <Box
              height="14px"
              width="40px"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="sm"
            />
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

// 댓글 스켈레톤 컴포넌트
export const CommentSkeleton: React.FC = () => {
  const shimmerBg = useColorModeValue(
    'linear-gradient(90deg, #f0f0f0 0px, #e0e0e0 40px, #f0f0f0 80px)',
    'linear-gradient(90deg, #2d3748 0px, #4a5568 40px, #2d3748 80px)'
  );

  return (
    <HStack align="flex-start" spacing={3} w="full">
      {/* 아바타 스켈레톤 */}
      <Box
        width="32px"
        height="32px"
        bg={shimmerBg}
        backgroundSize="200px 100%"
        animation={`${shimmer} 1.5s infinite linear`}
        borderRadius="full"
        flexShrink={0}
      />
      
      {/* 댓글 내용 영역 */}
      <VStack align="stretch" flex={1} spacing={2} minW={0}>
        {/* 작성자 정보와 시간 */}
        <HStack justify="space-between" w="full">
          <HStack spacing={2}>
            {/* 작성자 이름 */}
            <Box
              height="14px"
              width="65px"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="sm"
            />
            {/* 레벨 뱃지 */}
            <Box
              height="16px"
              width="35px"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="sm"
            />
          </HStack>
          
          {/* 작성 시간 */}
          <Box
            height="12px"
            width="85px"
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="sm"
          />
        </HStack>

        {/* 댓글 텍스트 내용 */}
        <VStack align="stretch" spacing={2}>
          <Box
            height="16px"
            width="100%"
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="sm"
          />
          <Box
            height="16px"
            width="75%"
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="sm"
          />
          <Box
            height="16px"
            width="45%"
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="sm"
          />
        </VStack>

        {/* 답글 버튼 영역 */}
        <HStack mt={1}>
          <Box
            height="12px"
            width="25px"
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="sm"
          />
        </HStack>
      </VStack>
    </HStack>
  );
};

// 상세 페이지 스켈레톤 컴포넌트
export const PostDetailSkeleton: React.FC = () => {
  const shimmerBg = useColorModeValue(
    'linear-gradient(90deg, #f0f0f0 0px, #e0e0e0 40px, #f0f0f0 80px)',
    'linear-gradient(90deg, #2d3748 0px, #4a5568 40px, #2d3748 80px)'
  );

  return (
    <VStack spacing={8} align="stretch">
      {/* 헤더 영역 */}
      <VStack spacing={4} align="flex-start">
        {/* 타입/카테고리 뱃지 */}
        <Box
          height="24px"
          width="80px"
          bg={shimmerBg}
          backgroundSize="200px 100%"
          animation={`${shimmer} 1.5s infinite linear`}
          borderRadius="full"
        />
        
        {/* 제목 */}
        <VStack spacing={2} align="flex-start" w="100%">
          <Box
            height="32px"
            width="100%"
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="md"
          />
          <Box
            height="32px"
            width="70%"
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="md"
          />
        </VStack>
        
        {/* 메타 정보 */}
        <HStack spacing={6}>
          <Box
            height="16px"
            width="80px"
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="sm"
          />
          <Box
            height="16px"
            width="60px"
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="sm"
          />
          <Box
            height="16px"
            width="100px"
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="sm"
          />
        </HStack>
      </VStack>

      {/* 액션 버튼 영역 */}
      <HStack spacing={4}>
        <Box
          height="40px"
          width="80px"
          bg={shimmerBg}
          backgroundSize="200px 100%"
          animation={`${shimmer} 1.5s infinite linear`}
          borderRadius="md"
        />
        <Box
          height="40px"
          width="80px"
          bg={shimmerBg}
          backgroundSize="200px 100%"
          animation={`${shimmer} 1.5s infinite linear`}
          borderRadius="md"
        />
      </HStack>

      {/* 구분선 */}
      <Box
        height="1px"
        width="100%"
        bg={shimmerBg}
        backgroundSize="200px 100%"
        animation={`${shimmer} 1.5s infinite linear`}
      />

      {/* 콘텐츠 영역 */}
      <VStack spacing={3} align="flex-start">
        {Array.from({ length: 8 }, (_, index) => (
          <Box
            key={index}
            height="20px"
            width={index === 7 ? "60%" : index % 3 === 0 ? "95%" : "100%"}
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="sm"
          />
        ))}
      </VStack>

      {/* 태그 영역 */}
      <HStack spacing={2}>
        {Array.from({ length: 3 }, (_, index) => (
          <Box
            key={index}
            height="24px"
            width="60px"
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="full"
          />
        ))}
      </HStack>

      {/* 구분선 */}
      <Box
        height="1px"
        width="100%"
        bg={shimmerBg}
        backgroundSize="200px 100%"
        animation={`${shimmer} 1.5s infinite linear`}
      />

      {/* 댓글 섹션 헤더 */}
      <VStack spacing={4} align="flex-start">
        <Box
          height="24px"
          width="120px"
          bg={shimmerBg}
          backgroundSize="200px 100%"
          animation={`${shimmer} 1.5s infinite linear`}
          borderRadius="md"
        />
        
        {/* 댓글 스켈레톤 */}
        {Array.from({ length: 2 }, (_, index) => (
          <CommentSkeleton key={index} />
        ))}
      </VStack>
    </VStack>
  );
};

// 이 주의 토픽 스켈레톤 컴포넌트
export const WeeklyTopicSkeleton: React.FC = () => {
  const shimmerBg = useColorModeValue(
    'linear-gradient(90deg, #f0f0f0 0px, #e0e0e0 40px, #f0f0f0 80px)',
    'linear-gradient(90deg, #2d3748 0px, #4a5568 40px, #2d3748 80px)'
  );

  return (
    <Box py={4}>
      <HStack spacing={8} align="stretch" w="100%">
        {/* 이미지 스켈레톤 */}
        <Box
          w="750px"
          h="550px"
          flexShrink={0}
          bg={shimmerBg}
          backgroundSize="200px 100%"
          animation={`${shimmer} 1.5s infinite linear`}
          borderRadius="8px"
        />
        
        {/* 콘텐츠 스켈레톤 */}
        <VStack 
          flex="1" 
          spacing={4} 
          align="flex-start" 
          justify="center"
          minH="550px"
          py={12}
        >
          {/* "이 주의 토픽" 레이블 */}
          <Box
            height="24px"
            width="120px"
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="md"
          />
          
          {/* 제목 스켈레톤 */}
          <VStack spacing={2} align="flex-start" w="90%">
            <Box
              height="36px"
              width="100%"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="md"
            />
            <Box
              height="36px"
              width="80%"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="md"
            />
          </VStack>
          
          {/* 요약 스켈레톤 */}
          <VStack spacing={2} align="flex-start" w="90%" mt={4}>
            <Box
              height="18px"
              width="100%"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="sm"
            />
            <Box
              height="18px"
              width="85%"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="sm"
            />
            <Box
              height="18px"
              width="70%"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="sm"
            />
          </VStack>
          
          {/* 메타 정보 스켈레톤 */}
          <VStack spacing={3} align="flex-start" mt={4}>
            <HStack spacing={6}>
              <Box
                height="16px"
                width="60px"
                bg={shimmerBg}
                backgroundSize="200px 100%"
                animation={`${shimmer} 1.5s infinite linear`}
                borderRadius="sm"
              />
              <Box
                height="16px"
                width="60px"
                bg={shimmerBg}
                backgroundSize="200px 100%"
                animation={`${shimmer} 1.5s infinite linear`}
                borderRadius="sm"
              />
              <Box
                height="16px"
                width="60px"
                bg={shimmerBg}
                backgroundSize="200px 100%"
                animation={`${shimmer} 1.5s infinite linear`}
                borderRadius="sm"
              />
            </HStack>
            
            <Box
              height="16px"
              width="150px"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="sm"
            />
          </VStack>
        </VStack>
      </HStack>
    </Box>
  );
};

// 목록 스켈레톤 컴포넌트
interface ListSkeletonProps {
  count?: number;
  type?: 'post' | 'comment';
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ 
  count = 5, 
  type = 'post' 
}) => {
  return (
    <VStack spacing={4} w="full">
      {Array.from({ length: count }, (_, index) => (
        <Box key={index} w="full">
          {type === 'post' ? <PostCardSkeleton /> : <CommentSkeleton />}
        </Box>
      ))}
    </VStack>
  );
};

// 점진적 로딩 컴포넌트
interface ProgressiveLoadingProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number; // 밀리초
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  children,
  fallback = <PostCardSkeleton />,
  delay = 100
}) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!showContent) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// 지연 로딩 래퍼
interface LazyLoadProps {
  children: React.ReactNode;
  threshold?: number; // 0.0 ~ 1.0
  rootMargin?: string;
  placeholder?: React.ReactNode;
}

export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  threshold = 0.1,
  rootMargin = '50px',
  placeholder = <PostCardSkeleton />
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref);

    return () => observer.disconnect();
  }, [ref, threshold, rootMargin]);

  return (
    <Box ref={setRef}>
      {isVisible ? children : placeholder}
    </Box>
  );
};

// 미니멀 로딩 스피너
interface MinimalSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

export const MinimalSpinner: React.FC<MinimalSpinnerProps> = ({
  size = 'md',
  message = '로딩 중...'
}) => {
  const textColor = useColorModeValue('#626269', '#9e9ea4');
  
  return (
    <Center py={8}>
      <VStack spacing={3}>
        <Spinner
          size={size}
          color="brand.500"
          thickness="2px"
          speed="0.8s"
        />
        <Text
          fontSize="sm"
          color={textColor}
          fontWeight="500"
        >
          {message}
        </Text>
      </VStack>
    </Center>
  );
};

// 인라인 로딩 표시기
export const InlineLoading: React.FC = () => {
  return (
    <HStack spacing={2} justify="center" py={2}>
      <Spinner size="xs" color="brand.500" />
      <Text fontSize="xs" color="gray.500">
        불러오는 중...
      </Text>
    </HStack>
  );
};

// 빈 상태 플레이스홀더
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  const textColor = useColorModeValue('#626269', '#9e9ea4');
  
  return (
    <Center py={12}>
      <VStack spacing={4} textAlign="center">
        {icon && (
          <Box fontSize="3xl" color="gray.400">
            {icon}
          </Box>
        )}
        <VStack spacing={2}>
          <Text fontSize="lg" fontWeight="600" color={textColor}>
            {title}
          </Text>
          {description && (
            <Text fontSize="sm" color="gray.500" maxW="300px">
              {description}
            </Text>
          )}
        </VStack>
        {action}
      </VStack>
    </Center>
  );
};

// 데이터 로딩 상태 관리 훅
export const useLoadingState = (initialLoading = false) => {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const startLoading = () => {
    setIsLoading(true);
    setError(null);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const setLoadingError = (errorMessage: string) => {
    setIsLoading(false);
    setError(errorMessage);
  };

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError: setLoadingError
  };
};

// 페이지네이션 로딩 상태
export const usePaginationLoading = () => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const startLoadingMore = () => setIsLoadingMore(true);
  const stopLoadingMore = (hasMoreData = true) => {
    setIsLoadingMore(false);
    setHasMore(hasMoreData);
  };

  return {
    isLoadingMore,
    hasMore,
    startLoadingMore,
    stopLoadingMore
  };
};

export default {
  PostCardSkeleton,
  CommentSkeleton,
  PostDetailSkeleton,
  WeeklyTopicSkeleton,
  ListSkeleton,
  ProgressiveLoading,
  LazyLoad,
  MinimalSpinner,
  InlineLoading,
  EmptyState,
  useLoadingState,
  usePaginationLoading
};