import React from 'react';
import {
  Box,
  Container,
  HStack,
  Text,
  Link,
  Divider,
  useColorMode,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

const Footer: React.FC = () => {
  const { colorMode } = useColorMode();
  
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
            href="mailto:contact@plain.kr" 
            fontSize="sm" 
            color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} 
            _hover={{ color: 'brand.500' }}
          >
            문의하기
          </Link>
        </HStack>
        <Text textAlign="center" fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#626269'} mt={4}>
          © 2024 Plain. All rights reserved.
        </Text>
      </Container>
    </Box>
  );
};

export default Footer;