import React from 'react';
import {
  Box,
  Container,
  HStack,
  Text,
  Link,
  Divider,
  useColorMode,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  Button,
  useToast,
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleContactClick = () => {
    onOpen();
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('info@payday.co.kr').then(() => {
      toast({
        title: "이메일 주소가 복사되었습니다",
        description: "info@payday.co.kr",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    }).catch(() => {
      toast({
        title: "복사 실패",
        description: "이메일 주소 복사에 실패했습니다.",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top",
      });
    });
  };
  
  return (
    <Box bg={colorMode === 'dark' ? '#2c2c35' : '#e4e4e5'} mt="auto">
      <Container maxW="1200px" py={8}>
        <HStack spacing={6} justify="center" wrap="wrap">
          <Link 
            as={RouterLink} 
            to="/about" 
            fontSize="sm" 
            color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} 
            _hover={{ color: 'brand.500' }}
          >
            서비스 소개
          </Link>
          <Divider orientation="vertical" h={4} borderColor={colorMode === 'dark' ? '#4d4d59' : '#9e9ea4'} />
          <Link 
            as={RouterLink} 
            to="/terms" 
            fontSize="sm" 
            color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} 
            _hover={{ color: 'brand.500' }}
          >
            이용약관
          </Link>
          <Divider orientation="vertical" h={4} borderColor={colorMode === 'dark' ? '#4d4d59' : '#9e9ea4'} />
          <Link 
            as={RouterLink} 
            to="/privacy" 
            fontSize="sm" 
            color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} 
            _hover={{ color: 'brand.500' }}
          >
            개인정보처리방침
          </Link>
          <Divider orientation="vertical" h={4} borderColor={colorMode === 'dark' ? '#4d4d59' : '#9e9ea4'} />
          <Link 
            onClick={handleContactClick}
            fontSize="sm" 
            color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} 
            _hover={{ color: 'brand.500' }}
            cursor="pointer"
          >
            문의하기
          </Link>
        </HStack>
        <Text textAlign="center" fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#626269'} mt={4}>
          © 2024 Plain. All rights reserved.
        </Text>
      </Container>

      {/* 문의하기 모달 */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={colorMode === 'dark' ? '#3c3c47' : 'white'} mx={4}>
          <ModalHeader>
            <Text fontSize="lg" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              안녕하세요. Plain 개발자입니다.
            </Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Text 
                fontSize="md" 
                color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
                lineHeight="1.6"
              >
                <Text as="span" color="brand.500" fontWeight="600">info@payday.co.kr</Text>로 무엇이든 문의를 남겨주시면 답변 드릴게요.
              </Text>
              <Text 
                fontSize="md" 
                color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}
                lineHeight="1.6"
              >
                <Text as="span" color="brand.500" fontWeight="600">Plain</Text> 내에서 불편하셨던 이슈든, 추가로 개발되었으면 하는 의견이든 모두 좋아요.
              </Text>
              
              <Button
                leftIcon={<CopyIcon />}
                colorScheme="brand"
                variant="outline"
                onClick={() => {
                  handleCopyEmail();
                  onClose();
                }}
                size="md"
                mt={2}
              >
                이메일 주소 복사하기
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Footer;