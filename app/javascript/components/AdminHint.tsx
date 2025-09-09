import React from 'react';
import {
  Box,
  HStack,
  Text,
  Badge,
  useColorMode,
} from '@chakra-ui/react';

interface AdminHintProps {
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success';
}

const AdminHint: React.FC<AdminHintProps> = ({ children, type = 'info' }) => {
  const { colorMode } = useColorMode();
  
  const getColorScheme = () => {
    switch (type) {
      case 'warning': return 'orange';
      case 'success': return 'green';
      default: return 'blue';
    }
  };

  const getBgColor = () => {
    if (colorMode === 'dark') {
      switch (type) {
        case 'warning': return '#4d3c00';
        case 'success': return '#003d1a';
        default: return '#002d4d';
      }
    }
    return `${getColorScheme()}.50`;
  };

  const getBorderColor = () => {
    if (colorMode === 'dark') {
      switch (type) {
        case 'warning': return '#b3851a';
        case 'success': return '#1a8533';
        default: return '#1a5c99';
      }
    }
    return `${getColorScheme()}.200`;
  };

  const getTextColor = () => {
    if (colorMode === 'dark') {
      switch (type) {
        case 'warning': return '#ffcc66';
        case 'success': return '#66ff99';
        default: return '#66ccff';
      }
    }
    return `${getColorScheme()}.700`;
  };

  return (
    <Box
      bg={getBgColor()}
      border="1px solid"
      borderColor={getBorderColor()}
      borderRadius="xl"
      p={4}
      my={1}
      shadow="sm"
    >
      <HStack align="center" spacing={3}>
        <Badge colorScheme={getColorScheme()} variant="solid" size="md" px={3} py={1}>
          관리자
        </Badge>
        <Text 
          fontSize="md" 
          color={getTextColor()} 
          fontWeight="500"
          lineHeight="1.5"
          flex="1"
        >
          {children}
        </Text>
      </HStack>
    </Box>
  );
};

export default AdminHint;