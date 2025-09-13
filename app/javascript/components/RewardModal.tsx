import React, { useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  useColorMode,
  keyframes,
  useToast,
} from '@chakra-ui/react';

interface RewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  postTitle: string;
  likeCount: number;
}

// 애니메이션 키프레임
const slideInUp = keyframes`
  0% { 
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  100% { 
    opacity: 1;
    transform: translate(-50%, -50%);
  }
`;

const RewardModal: React.FC<RewardModalProps> = ({
  isOpen,
  onClose,
  postTitle,
  likeCount
}) => {
  const { colorMode } = useColorMode();
  const toast = useToast();

  // 3초 후 자동으로 닫기
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* 오버레이 */}
      <Box
        position="fixed"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bg="blackAlpha.400"
        zIndex={1000}
        onClick={onClose}
      />
      
      {/* 축하 팝업 */}
      <Box
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        zIndex={1001}
        animation={`${slideInUp} 0.3s ease-out`}
        maxW="400px"
        w="90%"
        mx={4}
      >
        <Box
          bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
          border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
          borderRadius="xl"
          boxShadow="2xl"
          p={6}
          textAlign="center"
        >
          <VStack spacing={4}>
            {/* 축하 이모지 */}
            <Text fontSize="4xl" role="img" aria-label="축하">
              🎉
            </Text>
            
            {/* 축하 메시지 */}
            <VStack spacing={2}>
              <Text
                fontSize="xl"
                fontWeight="bold"
                color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
              >
                축하해요!
              </Text>
              
              <Text
                fontSize="md"
                color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
                textAlign="center"
                lineHeight="1.6"
              >
                글이 <Text as="span" color="brand.500" fontWeight="600">{likeCount}개 이상의 좋아요</Text>를 받아,<br />
                <Text as="span" color="orange.500" fontWeight="600">Story에 기고될 수 있게</Text> 됐어요.
              </Text>
            </VStack>
            
            {/* 글 제목 */}
            <Box
              bg={colorMode === 'dark' ? '#2c2c35' : '#f8f9fa'}
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              borderRadius="lg"
              p={3}
              w="100%"
            >
              <Text
                fontSize="sm"
                color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                noOfLines={2}
              >
                "{postTitle}"
              </Text>
            </Box>
            
            {/* 자동 닫힘 안내 */}
            <Text
              fontSize="xs"
              color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}
            >
              잠시 후 자동으로 닫힙니다
            </Text>
          </VStack>
        </Box>
      </Box>
    </>
  );
};

export default RewardModal;