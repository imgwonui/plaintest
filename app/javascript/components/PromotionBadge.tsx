import React from 'react';
import {
  Badge,
  HStack,
  Text,
  Tooltip,
  useColorMode,
} from '@chakra-ui/react';

interface PromotionBadgeProps {
  status: 'eligible' | 'pending' | 'approved' | 'rejected' | null;
  note?: string;
  size?: 'sm' | 'md' | 'lg';
}

const PromotionBadge: React.FC<PromotionBadgeProps> = ({
  status,
  note = '',
  size = 'md'
}) => {
  const { colorMode } = useColorMode();

  if (!status) return null;

  const getBadgeConfig = () => {
    switch (status) {
      case 'eligible':
        return {
          text: '승격 자격 달성',
          colorScheme: 'green',
          icon: '✨',
          description: '50개 이상의 좋아요를 받아 Story 승격 자격을 얻었습니다!'
        };
      case 'pending':
        return {
          text: 'Story 승격 심사 중',
          colorScheme: 'orange',
          icon: '📝',
          description: '관리자가 Story 승격을 검토하고 있습니다.'
        };
      case 'approved':
        return {
          text: '승격 예정',
          colorScheme: 'blue',
          icon: '🚀',
          description: '관리자가 Story로 재구성하고 있어요.'
        };
      case 'rejected':
        return {
          text: '승격 실패',
          colorScheme: 'red',
          icon: '❌',
          description: note || '승격 요건을 충족하지 않습니다.'
        };
      default:
        return null;
    }
  };

  const config = getBadgeConfig();
  if (!config) return null;

  const badge = (
    <Badge
      colorScheme={config.colorScheme}
      variant={colorMode === 'dark' ? 'solid' : 'subtle'}
      fontSize={size === 'sm' ? 'xs' : size === 'lg' ? 'md' : 'sm'}
      px={size === 'sm' ? 2 : size === 'lg' ? 4 : 3}
      py={size === 'sm' ? 1 : 2}
      borderRadius="full"
      fontWeight="600"
    >
      <HStack spacing={1}>
        <Text>{config.icon}</Text>
        <Text>{config.text}</Text>
      </HStack>
    </Badge>
  );

  // 툴팁과 함께 표시
  return (
    <Tooltip 
      label={note || config.description} 
      placement="top"
      hasArrow
      bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
      color={colorMode === 'dark' ? 'white' : 'gray.800'}
      borderRadius="md"
      px={3}
      py={2}
    >
      {badge}
    </Tooltip>
  );
};

export default PromotionBadge;