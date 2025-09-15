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
    <Box p={4} borderRadius="md" border="1px solid" borderColor="gray.200">
      <VStack align="stretch" spacing={3}>
        {/* 작성자 정보 */}
        <HStack>
          <Box
            width="40px"
            height="40px"
            bg={shimmerBg}
            backgroundSize="200px 100%"
            animation={`${shimmer} 1.5s infinite linear`}
            borderRadius="full"
          />
          <VStack align="start" spacing={1}>
            <Box
              height="14px"
              width="80px"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="sm"
            />
            <Box
              height="12px"
              width="60px"
              bg={shimmerBg}
              backgroundSize="200px 100%"
              animation={`${shimmer} 1.5s infinite linear`}
              borderRadius="sm"
            />
          </VStack>
        </HStack>

        {/* 댓글 내용 */}
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
            width="70%"
          />
        </VStack>
      </VStack>
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
  ListSkeleton,
  ProgressiveLoading,
  LazyLoad,
  MinimalSpinner,
  InlineLoading,
  EmptyState,
  useLoadingState,
  usePaginationLoading
};