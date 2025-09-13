import React from 'react';
import { Box, keyframes } from '@chakra-ui/react';
import { LevelUtils } from '../../data/levelConfig';

interface UserLevelIconProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showAnimation?: boolean;
}

// 고레벨 특수 효과 애니메이션
const sparkle = keyframes`
  0%, 100% { 
    opacity: 1; 
    transform: scale(1) rotate(0deg);
  }
  50% { 
    opacity: 0.7; 
    transform: scale(1.1) rotate(180deg);
  }
`;

const glow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 5px currentColor;
  }
  50% { 
    box-shadow: 0 0 15px currentColor, 0 0 25px currentColor;
  }
`;

const UserLevelIcon: React.FC<UserLevelIconProps> = ({ 
  level, 
  size = 'sm', 
  showAnimation = true 
}) => {
  const tier = LevelUtils.getLevelTier(level);
  
  const sizeMap = {
    sm: '16px',
    md: '20px', 
    lg: '24px'
  };

  const iconSize = sizeMap[size];
  const color = tier?.color || '#68D391';
  const isSpecial = tier?.special && level >= 90;

  // 레벨 티어별 아이콘 SVG
  const getIconSVG = () => {
    const iconType = tier?.iconType || 'seedling';
    
    switch (iconType) {
      case 'seedling': // LV1-10
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );

      case 'leaf': // LV11-20
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.30C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 4.25 4.5S9 19.25 11 19.25s3.25-.25 4.75-1.25 2.25-2.25 2.25-4.25S17 8 17 8z"/>
          </svg>
        );

      case 'tree': // LV21-30
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2L14,7H19L15.5,10.5L17,15.5L12,12.5L7,15.5L8.5,10.5L5,7H10L12,2M12,6.5L11,9H8.5L10.5,11L9.5,13.5L12,12L14.5,13.5L13.5,11L15.5,9H13L12,6.5Z"/>
          </svg>
        );

      case 'mountain': // LV31-50
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M14,6L10.25,11L13.1,14.8L11.5,16C9.81,13.75 7,10 7,10L1,20H23L14,6Z"/>
          </svg>
        );

      case 'star': // LV51-70
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
          </svg>
        );

      case 'diamond': // LV71-89
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6,2L2,8L12,22L22,8L18,2H6M6.5,4H8.5L7,6L6.5,4M9.5,4H11.5L12,6L10,6L9.5,4M12.5,4H14.5L14,6L13,6L12.5,4M15.5,4H17.5L17,6L16,6L15.5,4M5.27,6H7.73L8.46,7.5L5.27,6M8.54,7.5L7.73,6H10.27L9.5,7.5H8.54M10.5,7.5L11.27,6H12.73L12,7.5H10.5M12.5,7.5L12.73,6H15.27L14.5,7.5H12.5M15.46,7.5L16.27,6H18.73L15.46,7.5Z"/>
          </svg>
        );

      case 'crown': // LV90-99 (레전드)
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M5,16L3,5L8.5,10L12,4L15.5,10L21,5L19,16H5M19,19A1,1 0 0,1 18,20H6A1,1 0 0,1 5,19V18H19V19Z"/>
          </svg>
        );

      default:
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10"/>
          </svg>
        );
    }
  };

  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      width={iconSize}
      height={iconSize}
      color={color}
      position="relative"
      animation={
        isSpecial && showAnimation 
          ? `${sparkle} 2s ease-in-out infinite, ${glow} 3s ease-in-out infinite`
          : undefined
      }
      _before={
        isSpecial ? {
          content: '""',
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          right: '-2px', 
          bottom: '-2px',
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${color}, #FFD700, ${color})`,
          opacity: 0.3,
          zIndex: -1,
          animation: showAnimation ? `${sparkle} 2s ease-in-out infinite reverse` : undefined
        } : undefined
      }
    >
      {getIconSVG()}
      
      {/* 고레벨 특수 효과 - 추가 반짝임 */}
      {isSpecial && showAnimation && (
        <>
          <Box
            position="absolute"
            top="0"
            right="0"
            width="4px"
            height="4px"
            borderRadius="50%"
            backgroundColor="rgba(255, 215, 0, 0.8)"
            animation={`${sparkle} 1s ease-in-out infinite 0.5s`}
          />
          <Box
            position="absolute"
            bottom="0"
            left="0"
            width="3px"
            height="3px"
            borderRadius="50%"
            backgroundColor="rgba(255, 255, 255, 0.6)"
            animation={`${sparkle} 1.5s ease-in-out infinite 1s`}
          />
        </>
      )}
    </Box>
  );
};

export default UserLevelIcon;