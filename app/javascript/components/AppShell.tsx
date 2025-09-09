import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const location = useLocation();
  const hideHeaderPages = ['/login'];
  const shouldHideHeader = hideHeaderPages.includes(location.pathname);

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