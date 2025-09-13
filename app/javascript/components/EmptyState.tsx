import React from 'react';
import {
  Box,
  VStack,
  Text,
  Button,
  useColorMode,
} from '@chakra-ui/react';

interface EmptyStateProps {
  title: string;
  description?: string | React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
}) => {
  const { colorMode } = useColorMode();
  
  return (
    <Box textAlign="center" py={16}>
      <VStack spacing={4}>
        <Text 
          fontSize="lg" 
          fontWeight="500" 
          color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
        >
          {title}
        </Text>
        
        {description && (
          typeof description === 'string' ? (
            <Text 
              fontSize="md" 
              color={colorMode === 'dark' ? '#c3c3c6' : '#626269'} 
              maxW="400px"
            >
              {description}
            </Text>
          ) : (
            <Box maxW="400px">
              {description}
            </Box>
          )
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