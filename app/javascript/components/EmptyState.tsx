import React from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
} from '@chakra-ui/react';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <Box textAlign="center" py={16}>
      <VStack spacing={4}>
        <Text fontSize="lg" fontWeight="500" color="gray.900">
          {title}
        </Text>
        
        {description && (
          <Text fontSize="md" color="gray.600" maxW="400px">
            {description}
          </Text>
        )}
        
        {actionText && onAction && (
          <Button onClick={onAction} mt={2}>
            {actionText}
          </Button>
        )}
      </VStack>
    </Box>
  );
};

export default EmptyState;