import React from 'react';
import { Box, Flex, Spinner, Center, VStack, Text, useColorMode } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../contexts/AuthContext';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const { colorMode } = useColorMode();
  const { isLoading } = useAuth();
  const hideHeaderPages = ['/login'];
  const shouldHideHeader = hideHeaderPages.includes(location.pathname);

  // 세션 복원 중 로딩 화면 표시
  if (isLoading) {
    return (
      <Flex direction="column" minH="100vh">
        <Center flex="1">
          <VStack spacing={4}>
            <Spinner 
              size="xl" 
              color="brand.500" 
              thickness="4px" 
            />
            <Text 
              fontSize="lg" 
              color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
              fontWeight="500"
            >
              Plain을 시작하는 중...
            </Text>
          </VStack>
        </Center>
      </Flex>
    );
  }

  return (
    <Flex direction="column" minH="100vh">
      {!shouldHideHeader && <Header />}
      <Box flex="1">
        {children}
      </Box>
      {!shouldHideHeader && <Footer />}
    </Flex>
  );
};

export default AppShell;