import React from 'react';
import { HStack, Text, Badge as ChakraBadge, useColorMode } from '@chakra-ui/react';
import UserLevelIcon from './UserLevelIcon';
import { LevelUtils } from '../../data/levelConfig';

interface LevelBadgeProps {
  level: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'subtle';
  showIcon?: boolean;
  showTierName?: boolean;
}

const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  size = 'sm',
  variant = 'subtle',
  showIcon = true,
  showTierName = false
}) => {
  const { colorMode } = useColorMode();
  const tier = LevelUtils.getLevelTier(level);
  
  // 사이즈별 설정
  const sizeConfig = {
    xs: {
      badgeSize: 'xs' as const,
      iconSize: 'sm' as const,
      fontSize: '10px',
      px: 1,
      py: 0.5,
      gap: 1
    },
    sm: {
      badgeSize: 'sm' as const,
      iconSize: 'sm' as const,
      fontSize: '11px',
      px: 2,
      py: 1,
      gap: 1
    },
    md: {
      badgeSize: 'md' as const,
      iconSize: 'md' as const,
      fontSize: '12px',
      px: 2,
      py: 1,
      gap: 2
    },
    lg: {
      badgeSize: 'lg' as const,
      iconSize: 'lg' as const,
      fontSize: '14px',
      px: 3,
      py: 1.5,
      gap: 2
    }
  };

  const config = sizeConfig[size] || sizeConfig.sm;
  
  // 티어 색상을 Chakra UI 색상 스킴으로 변환
  const getColorScheme = () => {
    if (!tier) return 'gray';
    
    const colorMap: Record<string, string> = {
      '#68D391': 'green',    // seedling
      '#4FD1C7': 'teal',     // leaf  
      '#63B3ED': 'blue',     // tree
      '#9F7AEA': 'purple',   // mountain
      '#F6AD55': 'orange',   // star
      '#EC407A': 'pink',     // diamond
      '#FFD700': 'yellow'    // crown
    };
    
    return colorMap[tier.color] || 'gray';
  };

  // 레전드 레벨 (90+)에 대한 특수 스타일
  const isLegend = level >= 90;
  const colorScheme = getColorScheme();

  return (
    <ChakraBadge
      size={config.badgeSize}
      variant={variant}
      colorScheme={colorScheme}
      px={config.px}
      py={config.py}
      borderRadius="full"
      fontWeight="600"
      position="relative"
      overflow="visible"
      // 레전드 레벨 특수 효과
      background={
        isLegend && variant === 'solid' 
          ? `linear-gradient(45deg, ${tier?.color || '#FFD700'}, gold, ${tier?.color || '#FFD700'})`
          : undefined
      }
      boxShadow={
        isLegend 
          ? `0 0 8px ${tier?.color || '#FFD700'}40`
          : undefined
      }
    >
      <HStack spacing={config.gap} align="center">
        {showIcon && (
          <UserLevelIcon 
            level={level} 
            size={config.iconSize}
            showAnimation={isLegend}
          />
        )}
        
        <Text 
          fontSize={config.fontSize}
          lineHeight="1"
          fontWeight="bold"
          color={
            variant === 'outline' || variant === 'subtle'
              ? tier?.color || colorMode === 'dark' ? 'white' : 'black'
              : undefined
          }
        >
          LV{level}
        </Text>
        
        {showTierName && tier && (
          <Text 
            fontSize="9px"
            lineHeight="1"
            opacity={0.8}
            whiteSpace="nowrap"
          >
            {tier.name}
          </Text>
        )}
      </HStack>
      
      {/* 레전드 레벨 추가 효과 */}
      {isLegend && (
        <Text
          position="absolute"
          top="-2px"
          right="-2px"
          fontSize="8px"
          color="gold"
          fontWeight="bold"
          textShadow="0 0 3px rgba(255, 215, 0, 0.8)"
        >
          ★
        </Text>
      )}
    </ChakraBadge>
  );
};

export default LevelBadge;