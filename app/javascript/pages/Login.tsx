import React from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  Image,
  Flex,
  useColorMode,
  Divider,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PlainLogo from '../logo/plain.png';

const Login: React.FC = () => {
  const { colorMode } = useColorMode();
  const { login, adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (provider: 'kakao' | 'google') => {
    login(provider);
    navigate('/'); // 로그인 후 홈으로 리다이렉트
  };

  const handleAdminLogin = () => {
    adminLogin();
    navigate('/admin'); // 관리자 로그인 후 관리자 페이지로 리다이렉트
  };

  return (
    <Box minH="100vh" bg={colorMode === 'dark' ? '#2c2c35' : '#f8f9fa'}>
      <Flex minH="100vh">
        {/* 좌측 - 로그인 영역 */}
        <Box 
          flex="1" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
        >
          <Container maxW="400px">
            <VStack spacing={8} align="stretch">
              <VStack spacing={4} textAlign="center">
                <Image 
                  src={PlainLogo} 
                  alt="Plain Logo" 
                  height="40px"
                  objectFit="contain"
                  mb={2}
                />
                <Text 
                  color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                  fontSize="md"
                  lineHeight="1.6"
                >
                  원하는 정보를 저장하고 공유해보세요.<br />
                  인사 담당자들과 소중한 경험을 나누어요.
                </Text>
              </VStack>

              <VStack spacing={4}>
                {/* 카카오 로그인 */}
                <Button
                  onClick={() => handleLogin('kakao')}
                  bg="#FEE500"
                  color="black"
                  size="lg"
                  width="100%"
                  _hover={{
                    bg: "#FDD835",
                    transform: 'translateY(-1px)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  leftIcon={
                    <Box
                      w="20px"
                      h="20px"
                      bg="black"
                      borderRadius="4px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="12px"
                      color="white"
                      fontWeight="bold"
                    >
                      K
                    </Box>
                  }
                  fontWeight="500"
                  transition="all 0.2s"
                >
                  카카오로 계속하기
                </Button>

                <HStack w="100%" align="center">
                  <Divider borderColor={colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'} />
                  <Text 
                    color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'} 
                    fontSize="sm"
                    whiteSpace="nowrap"
                  >
                    또는
                  </Text>
                  <Divider borderColor={colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'} />
                </HStack>

                {/* 구글 로그인 */}
                <Button
                  onClick={() => handleLogin('google')}
                  bg="white"
                  color="#3c4043"
                  border="1px solid"
                  borderColor="#dadce0"
                  size="lg"
                  width="100%"
                  _hover={{
                    bg: "#f8f9fa",
                    borderColor: "#c1c5c9",
                    transform: 'translateY(-1px)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  leftIcon={
                    <Box
                      w="18px"
                      h="18px"
                      borderRadius="2px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text fontSize="14px" fontWeight="bold" color="#4285f4">
                        G
                      </Text>
                    </Box>
                  }
                  fontWeight="500"
                  transition="all 0.2s"
                >
                  Google로 계속하기
                </Button>
              </VStack>

              {/* 관리자 로그인 */}
              <Box textAlign="center" pt={4}>
                <Button
                  variant="link"
                  color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}
                  fontSize="sm"
                  onClick={handleAdminLogin}
                  _hover={{
                    color: colorMode === 'dark' ? '#9e9ea4' : '#626269',
                    textDecoration: 'underline'
                  }}
                >
                  관리자로 로그인
                </Button>
              </Box>
            </VStack>
          </Container>
        </Box>

        {/* 우측 - 브랜드 영역 */}
        <Box 
          flex="1" 
          bg="brand.500"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {/* 친근한 일러스트 이미지 영역 */}
          <Box>
            <Image
              src="https://cdni.iconscout.com/illustration/premium/thumb/user-login-4268415-3551762.png"
              alt="Login illustration"
              maxW="350px"
              maxH="350px"
              objectFit="contain"
            />
          </Box>
        </Box>
      </Flex>

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes pulse {
            0%, 100% { 
              opacity: 0.3; 
              transform: scale(1); 
            }
            50% { 
              opacity: 0.6; 
              transform: scale(1.1); 
            }
          }
        `}
      </style>
    </Box>
  );
};

export default Login;