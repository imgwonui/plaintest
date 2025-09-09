import React, { useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useBreakpointValue,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  useDisclosure,
  Image,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { SearchIcon, HamburgerIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useColorMode } from '@chakra-ui/react';
import PlainLogo from '../logo/plain.png';
import SearchModal from './SearchModal';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const isMobile = useBreakpointValue({ base: true, md: false });

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  const NavLink: React.FC<{ to: string; children: React.ReactNode; onClick?: () => void }> = ({ 
    to, 
    children, 
    onClick 
  }) => (
    <Button
      as={Link}
      to={to}
      variant="ghost"
      size="sm"
      fontWeight={isActive(to) ? '600' : '500'}
      color={isActive(to) ? 'brand.500' : (colorMode === 'dark' ? 'gray.200' : 'gray.700')}
      _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.50' }}
      onClick={onClick}
    >
      {children}
    </Button>
  );

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      console.log('Search:', searchQuery);
    }
  };

  const MobileMenu = () => (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent bg={colorMode === 'dark' ? 'gray.700' : 'white'}>
        <DrawerCloseButton />
        <DrawerBody pt={16}>
          <VStack spacing={4} align="stretch">
            <NavLink to="/story" onClick={onClose}>Story</NavLink>
            <NavLink to="/lounge" onClick={onClose}>Lounge</NavLink>
            {isLoggedIn ? (
              <Menu>
                <MenuButton as={Button} variant="ghost" size="sm" justifyContent="flex-start">
                  <HStack>
                    <Avatar size="xs" name={user?.name} />
                    <Text>{user?.name}</Text>
                  </HStack>
                </MenuButton>
                <MenuList bg={colorMode === 'dark' ? 'gray.600' : 'white'}>
                  <MenuItem _hover={{ bg: colorMode === 'dark' ? 'gray.500' : 'gray.50' }}>
                    프로필
                  </MenuItem>
                  <MenuItem 
                    as={Link}
                    to="/scrap"
                    _hover={{ bg: colorMode === 'dark' ? 'gray.500' : 'gray.50' }}
                  >
                    스크랩
                  </MenuItem>
                  {isAdmin && (
                    <MenuItem
                      as={Link}
                      to="/admin"
                      _hover={{ bg: colorMode === 'dark' ? 'gray.500' : 'gray.50' }}
                      color="orange.500"
                      fontWeight="600"
                    >
                      🛠️ 관리자
                    </MenuItem>
                  )}
                  <MenuItem _hover={{ bg: colorMode === 'dark' ? 'gray.500' : 'gray.50' }}>
                    설정
                  </MenuItem>
                  <MenuItem 
                    color="red.500" 
                    _hover={{ bg: colorMode === 'dark' ? 'gray.500' : 'gray.50' }}
                    onClick={logout}
                  >
                    로그아웃
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <Button
                as={Link}
                to="/login"
                variant="outline"
                size="sm"
                borderColor="brand.500"
                color="brand.500"
                _hover={{
                  bg: 'brand.50',
                  borderColor: 'brand.600'
                }}
                borderWidth={1}
              >
                로그인
              </Button>
            )}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );

  return (
    <Box bg={colorMode === 'dark' ? 'gray.800' : 'white'} position="sticky" top={0} zIndex={100}>
      <Flex
        maxW="1200px"
        mx="auto"
        px={{ base: 4, md: 6 }}
        py={6}
        align="center"
        justify="space-between"
      >
        <HStack spacing={8}>
          <Box as={Link} to="/" _hover={{ textDecoration: 'none' }}>
            <Image 
              src={PlainLogo} 
              alt="Plain Logo" 
              height="32px"
              objectFit="contain"
            />
          </Box>
          
          {!isMobile && (
            <HStack spacing={1}>
              <NavLink to="/story">Story</NavLink>
              <NavLink to="/lounge">Lounge</NavLink>
            </HStack>
          )}
        </HStack>

        <HStack spacing={4}>
          {!isMobile && (
            <>
              <IconButton
                aria-label="검색"
                icon={<SearchIcon />}
                variant="ghost"
                size="sm"
                onClick={onSearchOpen}
              />
              
              <IconButton
                aria-label="다크모드 토글"
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                variant="ghost"
                size="sm"
                onClick={toggleColorMode}
              />
              
              {isLoggedIn ? (
                <Menu>
                  <MenuButton as={Button} variant="ghost" size="sm" p={0}>
                    <Avatar size="sm" name={user?.name} />
                  </MenuButton>
                  <MenuList bg={colorMode === 'dark' ? 'gray.600' : 'white'}>
                    <MenuItem _hover={{ bg: colorMode === 'dark' ? 'gray.500' : 'gray.50' }}>
                      프로필
                    </MenuItem>
                    <MenuItem 
                      as={Link}
                      to="/scrap"
                      _hover={{ bg: colorMode === 'dark' ? 'gray.500' : 'gray.50' }}
                    >
                      스크랩
                    </MenuItem>
                    {isAdmin && (
                      <MenuItem
                        as={Link}
                        to="/admin"
                        _hover={{ bg: colorMode === 'dark' ? 'gray.500' : 'gray.50' }}
                        color="orange.500"
                        fontWeight="600"
                      >
                        🛠️ 관리자
                      </MenuItem>
                    )}
                    <MenuItem _hover={{ bg: colorMode === 'dark' ? 'gray.500' : 'gray.50' }}>
                      설정
                    </MenuItem>
                    <MenuItem 
                      color="red.500" 
                      _hover={{ bg: colorMode === 'dark' ? 'gray.500' : 'gray.50' }}
                      onClick={logout}
                    >
                      로그아웃
                    </MenuItem>
                  </MenuList>
                </Menu>
              ) : (
                <Button
                  as={Link}
                  to="/login"
                  variant="outline"
                  size="sm"
                  borderColor="brand.500"
                  color="brand.500"
                  _hover={{
                    bg: 'brand.50',
                    borderColor: 'brand.600'
                  }}
                  borderWidth={1}
                >
                  로그인
                </Button>
              )}
            </>
          )}
          
          {isMobile && (
            <HStack spacing={2}>
              <IconButton
                aria-label="검색"
                icon={<SearchIcon />}
                variant="ghost"
                size="sm"
                onClick={onSearchOpen}
              />
              <IconButton
                aria-label="다크모드 토글"
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                variant="ghost"
                size="sm"
                onClick={toggleColorMode}
              />
              <IconButton
                aria-label="메뉴 열기"
                icon={<HamburgerIcon />}
                variant="ghost"
                size="sm"
                onClick={onOpen}
              />
            </HStack>
          )}
        </HStack>
      </Flex>
      
      <MobileMenu />
      
      {/* 검색 모달 */}
      <SearchModal isOpen={isSearchOpen} onClose={onSearchClose} />
    </Box>
  );
};

export default Header;