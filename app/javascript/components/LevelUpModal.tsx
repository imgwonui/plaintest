import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  useColorMode,
  keyframes,
  Box,
  Heading,
  Badge,
  Flex,
  SimpleGrid,
} from '@chakra-ui/react';
import { CheckCircleIcon, StarIcon } from '@chakra-ui/icons';
import UserLevelIcon from './UserLevel/UserLevelIcon';
import LevelBadge from './UserLevel/LevelBadge';
import { LevelUtils } from '../data/levelConfig';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  previousLevel: number;
  newLevel: number;
  newExp: number;
  earnedExp: number;
  activityType: string;
}

// 축하 애니메이션 키프레임
const celebrationPulse = keyframes`
  0% { transform: scale(1) rotate(0deg); opacity: 1; }
  25% { transform: scale(1.05) rotate(-2deg); opacity: 0.9; }
  50% { transform: scale(1.1) rotate(2deg); opacity: 1; }
  75% { transform: scale(1.05) rotate(-1deg); opacity: 0.95; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
`;

const sparkleFloat = keyframes`
  0% { transform: translateY(0px) rotate(0deg); opacity: 0; }
  10% { opacity: 1; }
  50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(-40px) rotate(360deg); opacity: 0; }
`;

const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  previousLevel,
  newLevel,
  newExp,
  earnedExp,
  activityType
}) => {
  const { colorMode } = useColorMode();
  const [showRewards, setShowRewards] = useState(false);
  
  const newTier = LevelUtils.getLevelTier(newLevel);
  const previousTier = LevelUtils.getLevelTier(previousLevel);
  const isNewTier = newTier?.name !== previousTier?.name;
  const isLegendLevel = newLevel >= 90;

  // 활동 타입별 메시지
  const getActivityMessage = (type: string) => {
    switch (type) {
      case 'likeReceived': return '좋아요를 받아서';
      case 'storyPromoted': return 'Story로 승격되어서';
      case 'bookmarked': return '북마크를 받아서';
      case 'postCreated': return '글을 작성해서';
      case 'commentCreated': return '댓글을 작성해서';
      case 'excellentPost': return '우수 글로 선정되어서';
      default: return '활동을 통해';
    }
  };

  // 티어별 보상 메시지
  const getTierRewards = (level: number) => {
    if (level >= 90) {
      return [
        '🌟 레전드 타이틀 획득',
        '✨ 특별 애니메이션 효과',
        '👑 골든 아이콘',
        '🎯 최고 레벨 달성자 명예'
      ];
    } else if (level >= 71) {
      return [
        '💎 다이아몬드 티어 진입',
        '🔥 특별 뱃지 효과',
        '⭐ 고급 사용자 권한'
      ];
    } else if (level >= 51) {
      return [
        '⭐ 스타 티어 진입',
        '🎨 새로운 아이콘 잠금 해제',
        '📈 향상된 활동 권한'
      ];
    } else if (level >= 31) {
      return [
        '🏔️ 마운틴 티어 진입',
        '🚀 중급 사용자 혜택'
      ];
    } else if (level >= 21) {
      return [
        '🌳 트리 티어 진입',
        '🌱 성장하는 커뮤니티 멤버'
      ];
    } else if (level >= 11) {
      return [
        '🍃 리프 티어 진입',
        '📚 더 많은 기능 이용 가능'
      ];
    } else {
      return [
        '🌱 새싹 티어에서 성장 중',
        '🎯 꾸준한 활동으로 성장'
      ];
    }
  };

  // 모달이 열리면 0.5초 후 보상 표시
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowRewards(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowRewards(false);
    }
  }, [isOpen]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size="lg" 
      isCentered
      closeOnOverlayClick={false}
      motionPreset="slideInBottom"
    >
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(10px)" />
      <ModalContent
        bg={colorMode === 'dark' ? '#2c2c35' : 'white'}
        border={colorMode === 'dark' ? '2px solid #4d4d59' : '2px solid #e4e4e5'}
        borderRadius="2xl"
        overflow="hidden"
        position="relative"
        boxShadow={isLegendLevel ? `0 0 40px ${newTier?.color || '#FFD700'}60` : 'xl'}
      >
        {/* 배경 효과 */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bgGradient={
            isLegendLevel 
              ? `linear(45deg, ${newTier?.color || '#FFD700'}10, transparent, ${newTier?.color || '#FFD700'}10)`
              : `linear(135deg, ${newTier?.color || '#68D391'}08, transparent)`
          }
          opacity={0.3}
        />

        {/* 반짝이는 파티클 효과 */}
        {isLegendLevel && (
          <Box position="absolute" top="0" left="0" right="0" bottom="0" pointerEvents="none">
            {[...Array(6)].map((_, i) => (
              <Box
                key={i}
                position="absolute"
                top={`${20 + i * 15}%`}
                left={`${10 + i * 15}%`}
                w="4px"
                h="4px"
                borderRadius="50%"
                bg="gold"
                animation={`${sparkleFloat} 3s ease-in-out ${i * 0.5}s infinite`}
              />
            ))}
          </Box>
        )}

        <ModalCloseButton 
          color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
          _hover={{ bg: colorMode === 'dark' ? '#4d4d59' : '#f0f0f0' }}
        />
        
        <ModalBody p={0}>
          <VStack spacing={0} align="center">
            {/* 메인 축하 섹션 */}
            <Box
              w="100%"
              bg={colorMode === 'dark' ? '#3c3c47' : '#f8f9fa'}
              py={12}
              px={8}
              textAlign="center"
              position="relative"
              overflow="hidden"
            >
              <VStack spacing={6}>
                {/* 레벨업 아이콘과 메시지 */}
                <VStack spacing={4}>
                  <Box
                    animation={`${celebrationPulse} 2s ease-in-out infinite`}
                    position="relative"
                  >
                    <UserLevelIcon 
                      level={newLevel} 
                      size="lg"
                      showAnimation={isLegendLevel}
                    />
                    {isLegendLevel && (
                      <Box
                        position="absolute"
                        top="-10px"
                        right="-10px"
                        fontSize="16px"
                        animation={`${celebrationPulse} 1.5s ease-in-out infinite`}
                      >
                        ✨
                      </Box>
                    )}
                  </Box>
                  
                  <VStack spacing={2}>
                    <Heading 
                      as="h2" 
                      size="lg" 
                      color={newTier?.color || (colorMode === 'dark' ? '#e4e4e5' : '#2c2c35')}
                      textAlign="center"
                    >
                      🎉 레벨업! 🎉
                    </Heading>
                    
                    <HStack spacing={4} align="center">
                      <LevelBadge level={previousLevel} size="md" variant="outline" showIcon={false} />
                      <Text fontSize="xl" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>→</Text>
                      <LevelBadge level={newLevel} size="md" variant="solid" showIcon={true} />
                    </HStack>
                  </VStack>
                </VStack>

                {/* 티어 승급 알림 */}
                {isNewTier && newTier && (
                  <VStack spacing={2}>
                    <Badge 
                      colorScheme={newLevel >= 90 ? 'yellow' : 'green'} 
                      size="lg" 
                      px={4} 
                      py={2} 
                      borderRadius="full"
                      fontSize="sm"
                      fontWeight="bold"
                    >
                      🏆 {newTier.name} 티어 진입!
                    </Badge>
                    <Text 
                      fontSize="sm" 
                      color={newTier.color}
                      fontWeight="600"
                      textAlign="center"
                    >
                      {newTier.description}
                    </Text>
                  </VStack>
                )}

                {/* 활동 정보 */}
                <Text 
                  fontSize="sm" 
                  color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
                  textAlign="center"
                  maxW="300px"
                >
                  {getActivityMessage(activityType)} <strong>{earnedExp}EXP</strong>를 획득하여
                  <br />
                  <strong>LV{newLevel}</strong>에 도달했어요!
                </Text>
              </VStack>
            </Box>

            {/* 보상 및 혜택 섹션 */}
            <Box w="100%" p={8}>
              <VStack spacing={6} align="stretch">
                {/* 경험치 정보 */}
                <VStack spacing={3} align="center">
                  <Text 
                    fontSize="lg" 
                    fontWeight="600" 
                    color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                  >
                    현재 경험치
                  </Text>
                  
                  <HStack spacing={4} align="center">
                    <VStack spacing={1}>
                      <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                        총 경험치
                      </Text>
                      <Text fontSize="xl" fontWeight="bold" color={newTier?.color || 'brand.500'}>
                        {newExp.toLocaleString()} EXP
                      </Text>
                    </VStack>
                    
                    <Box w="2px" h="40px" bg={colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'} />
                    
                    <VStack spacing={1}>
                      <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                        획득한 경험치
                      </Text>
                      <Text fontSize="xl" fontWeight="bold" color="green.500">
                        +{earnedExp} EXP
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>

                {/* 티어 혜택 (새 티어 진입 시에만) */}
                {showRewards && (isNewTier || newLevel % 10 === 0) && (
                  <VStack spacing={4} align="stretch">
                    <Text 
                      fontSize="md" 
                      fontWeight="600" 
                      color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                      textAlign="center"
                    >
                      🎁 잠금 해제된 혜택
                    </Text>
                    
                    <SimpleGrid columns={1} spacing={2}>
                      {getTierRewards(newLevel).map((reward, index) => (
                        <HStack
                          key={index}
                          spacing={3}
                          align="center"
                          p={3}
                          bg={colorMode === 'dark' ? '#3c3c47' : '#f8f9fa'}
                          borderRadius="md"
                          borderLeft="4px solid"
                          borderColor={newTier?.color || 'brand.500'}
                          opacity={0}
                          animation={`fadeInUp 0.5s ease-out ${index * 0.1}s forwards`}
                        >
                          <CheckCircleIcon color="green.500" />
                          <Text 
                            fontSize="sm" 
                            color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                          >
                            {reward}
                          </Text>
                        </HStack>
                      ))}
                    </SimpleGrid>
                  </VStack>
                )}

                {/* 액션 버튼 */}
                <Flex justify="center" pt={4}>
                  <Button
                    size="lg"
                    px={12}
                    bg={newTier?.color || 'brand.500'}
                    color="white"
                    _hover={{
                      bg: newTier?.color || 'brand.600',
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg'
                    }}
                    onClick={onClose}
                    fontWeight="600"
                  >
                    계속하기
                  </Button>
                </Flex>

                {/* 레전드 레벨 특별 메시지 */}
                {isLegendLevel && (
                  <VStack spacing={2} pt={4} borderTop="1px solid" borderColor={colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'}>
                    <StarIcon color="gold" boxSize="5" />
                    <Text 
                      fontSize="sm" 
                      color="gold"
                      fontWeight="bold"
                      textAlign="center"
                    >
                      축하합니다! 레전드 레벨에 도달했습니다!
                    </Text>
                    <Text 
                      fontSize="xs" 
                      color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                      textAlign="center"
                    >
                      이제 커뮤니티의 최고 레벨 달성자입니다
                    </Text>
                  </VStack>
                )}
              </VStack>
            </Box>
          </VStack>
        </ModalBody>
        
        <style>
          {`
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}
        </style>
      </ModalContent>
    </Modal>
  );
};

export default LevelUpModal;