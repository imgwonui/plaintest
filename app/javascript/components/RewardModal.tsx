import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  useColorMode,
  Box,
  Icon,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { StarIcon, CheckIcon } from '@chakra-ui/icons';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  postTitle: string;
  likeCount: number;
  rewardPoints: number;
}

const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  onClose,
  postTitle,
  likeCount,
  rewardPoints = 500
}) => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [isRequesting, setIsRequesting] = useState(false);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const handleClaimReward = () => {
    setRewardClaimed(true);
    toast({
      title: "🎉 보상을 받았습니다!",
      description: `${rewardPoints}P가 지급되었습니다`,
      status: "success",
      duration: 4000,
    });
  };

  const handleRequestStorySubmission = () => {
    setIsRequesting(true);
    
    setTimeout(() => {
      toast({
        title: "📝 Story 기고 요청이 전송되었습니다",
        description: "에디터 검토 후 연락드리겠습니다",
        status: "success",
        duration: 5000,
      });
      setIsRequesting(false);
      onClose();
    }, 1500);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent 
        bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
        border={colorMode === 'dark' ? '1px solid #4d4d59' : 'none'}
        boxShadow="xl"
        mx={4}
      >
        <ModalHeader 
          color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          textAlign="center"
          pb={2}
        >
          🎊 축하합니다!
        </ModalHeader>
        <ModalCloseButton color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* 축하 메시지 */}
            <Box 
              textAlign="center" 
              p={6} 
              bg={colorMode === 'dark' ? '#2c2c35' : '#f8f9fa'}
              borderRadius="xl"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <VStack spacing={4}>
                <HStack>
                  <Icon as={StarIcon} color="yellow.400" boxSize={6} />
                  <Text fontSize="xl" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                    좋아요 {likeCount}개 달성!
                  </Text>
                  <Icon as={StarIcon} color="yellow.400" boxSize={6} />
                </HStack>
                
                <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} textAlign="center">
                  <Text as="span" fontWeight="600" color="brand.500">"{postTitle}"</Text>
                  <br />
                  글이 좋아요 50개 이상을 받으셨어요!
                </Text>
              </VStack>
            </Box>

            <Divider />

            {/* 보상 섹션 */}
            <VStack spacing={4}>
              <Text fontSize="lg" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                🎁 보상 혜택
              </Text>
              
              <HStack 
                p={4} 
                bg={colorMode === 'dark' ? '#2c2c35' : '#f0fff4'}
                borderRadius="lg"
                border="1px solid"
                borderColor={colorMode === 'dark' ? '#4d4d59' : '#9AE6B4'}
                w="100%"
                justify="space-between"
              >
                <HStack>
                  <Text fontSize="2xl">💰</Text>
                  <VStack spacing={0} align="start">
                    <Text fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                      마일리지 보상
                    </Text>
                    <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                      우수글 작성 보상
                    </Text>
                  </VStack>
                </HStack>
                
                <VStack spacing={0} align="end">
                  <Badge colorScheme="green" fontSize="lg" px={3} py={1}>
                    +{rewardPoints}P
                  </Badge>
                </VStack>
              </HStack>

              {!rewardClaimed && (
                <Button
                  onClick={handleClaimReward}
                  colorScheme="green"
                  size="lg"
                  w="100%"
                  leftIcon={<CheckIcon />}
                >
                  보상 받기
                </Button>
              )}

              {rewardClaimed && (
                <Box 
                  p={3} 
                  bg={colorMode === 'dark' ? '#2d5016' : '#C6F6D5'}
                  borderRadius="lg"
                  w="100%"
                  textAlign="center"
                >
                  <HStack justify="center">
                    <CheckIcon color="green.500" />
                    <Text color={colorMode === 'dark' ? '#9AE6B4' : '#2F855A'} fontWeight="600">
                      보상을 받았습니다!
                    </Text>
                  </HStack>
                </Box>
              )}
            </VStack>

            <Divider />

            {/* Story 기고 요청 섹션 */}
            <VStack spacing={4}>
              <Text fontSize="lg" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                📚 Story 기고 기회
              </Text>
              
              <Box 
                p={4} 
                bg={colorMode === 'dark' ? '#2c2c35' : '#fff7ed'}
                borderRadius="lg"
                border="1px solid"
                borderColor={colorMode === 'dark' ? '#4d4d59' : '#FBD38D'}
                w="100%"
              >
                <VStack spacing={3}>
                  <Text textAlign="center" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                    우수한 글을 Story 섹션에 기고해보세요!
                  </Text>
                  <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} textAlign="center">
                    • 에디터가 검토 후 Story로 발행<br />
                    • 더 많은 독자에게 노출<br />
                    • 추가 마일리지 보상
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3} w="100%">
            <Button 
              variant="outline" 
              onClick={onClose}
              flex={1}
            >
              나중에
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleRequestStorySubmission}
              isLoading={isRequesting}
              loadingText="요청 중..."
              flex={2}
            >
              Story 기고 요청하기
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default RewardModal;