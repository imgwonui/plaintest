import React from 'react';
import {
  Box,
  Spinner,
  VStack,
  Text,
  Skeleton,
  SkeletonText,
  Card,
  CardBody,
  HStack,
} from '@chakra-ui/react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'lg', 
  text = '로딩 중...' 
}) => {
  return (
    <Box textAlign="center" py={16}>
      <VStack spacing={4}>
        <Spinner size={size} color="brand.500" thickness="3px" />
        <Text fontSize="sm" color="gray.600">
          {text}
        </Text>
      </VStack>
    </Box>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <Card>
      <CardBody>
        <VStack align="stretch" spacing={3}>
          <Skeleton height="150px" borderRadius="md" />
          <VStack align="stretch" spacing={2}>
            <HStack spacing={2}>
              <Skeleton height="20px" width="60px" borderRadius="md" />
              <Skeleton height="20px" width="40px" borderRadius="md" />
            </HStack>
            <Skeleton height="24px" />
            <Skeleton height="20px" width="80%" />
            <SkeletonText mt={2} noOfLines={2} spacing="2" />
          </VStack>
          <HStack spacing={2}>
            <Skeleton height="20px" width="50px" borderRadius="full" />
            <Skeleton height="20px" width="40px" borderRadius="full" />
            <Skeleton height="20px" width="60px" borderRadius="full" />
          </HStack>
          <HStack justify="space-between">
            <Skeleton height="16px" width="80px" />
            <Skeleton height="16px" width="60px" />
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

interface CardSkeletonGridProps {
  count?: number;
}

export const CardSkeletonGrid: React.FC<CardSkeletonGridProps> = ({ count = 6 }) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </>
  );
};

export default LoadingSpinner;