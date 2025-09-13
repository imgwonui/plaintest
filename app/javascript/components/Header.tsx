import React, { useState, useEffect } from 'react';
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
  Divider,
  Badge,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { SearchIcon, HamburgerIcon, MoonIcon, SunIcon, StarIcon, SettingsIcon } from '@chakra-ui/icons';
import { useColorMode } from '@chakra-ui/react';
// Plain 로고
import PlainLogo from '../logo/plain.png';
import SearchModal from './SearchModal';
import { useAuth } from '../contexts/AuthContext';
import { sessionSearchService } from '../services/sessionDataService';

const Header: React.FC = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // 스크롤 위치 감지
  useEffect(() => {
    const handleScroll = () => {
      // 스토리 디테일 페이지에서만 동작
      if (location.pathname.includes('/story/') && !location.pathname.includes('/story/new') && !location.pathname.includes('/edit')) {
        const scrollTop = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercentage = (scrollTop / documentHeight) * 100;
        
        setIsScrolled(scrollTop > 750); // 썸네일 높이(800px) 근처에서 변경
        setScrollProgress(Math.min(scrollPercentage, 100));
      } else {
        setIsScrolled(false);
        setScrollProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // 초기 실행

    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

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
      // 검색어를 세션 스토리지에 추가
      sessionSearchService.addSearchKeyword(searchQuery.trim());
      console.log('Search:', searchQuery);
      // TODO: 실제 검색 페이지로 이동하는 로직 추가
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
                    <Avatar size="xs" name={user?.name} src={user?.avatar} />
                    <Text>{user?.name}</Text>
                  </HStack>
                </MenuButton>
                <MenuList bg={colorMode === 'dark' ? 'gray.700' : 'white'}>
                  <MenuItem 
                    as={Link}
                    to="/profile"
                    _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.50' }}
                  >
                    <VStack align="flex-start" spacing={0}>
                      <Text fontWeight="500" fontSize="sm">프로필</Text>
                      <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                        계정 정보 및 설정
                      </Text>
                    </VStack>
                  </MenuItem>

                  <MenuItem 
                    as={Link}
                    to="/scrap"
                    _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.50' }}
                  >
                    <VStack align="flex-start" spacing={0}>
                      <Text fontWeight="500" fontSize="sm">북마크</Text>
                      <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                        저장한 글 모아보기
                      </Text>
                    </VStack>
                  </MenuItem>

                  {isAdmin && (
                    <MenuItem
                      as={Link}
                      to="/admin"
                      _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.50' }}
                    >
                      <VStack align="flex-start" spacing={0}>
                        <HStack>
                          <Text fontWeight="500" fontSize="sm" color="orange.500">관리자</Text>
                          <Badge colorScheme="orange" size="sm">ADMIN</Badge>
                        </HStack>
                        <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                          시스템 관리
                        </Text>
                      </VStack>
                    </MenuItem>
                  )}

                  <MenuItem 
                    color="red.500" 
                    _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.50' }}
                    onClick={logout}
                  >
                    <Text fontWeight="500" fontSize="sm">로그아웃</Text>
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
                  bg: 'brand.500',
                  color: 'white',
                  borderColor: 'brand.500'
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

  // 스토리 디테일 페이지인지 확인
  const isStoryDetailPage = location.pathname.includes('/story/') && !location.pathname.includes('/story/new') && !location.pathname.includes('/edit');

  return (
    <>
      <Box 
        bg={isStoryDetailPage && !isScrolled ? "transparent" : (colorMode === 'dark' ? 'gray.800' : 'white')} 
        position="sticky" 
        top={0} 
        zIndex={200}
        transition="background 0.3s ease"
      >
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
            {PlainLogo ? (
              <Image 
                src={PlainLogo} 
                alt="Plain Logo" 
                height="32px"
                objectFit="contain"
              />
            ) : (
              <Text
                fontSize="xl"
                fontWeight="700"
                color="brand.500"
                _hover={{ textDecoration: "none" }}
              >
                Plain
              </Text>
            )}
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
                    <Avatar size="sm" name={user?.name} src={user?.avatar} />
                  </MenuButton>
                  <MenuList bg={colorMode === 'dark' ? 'gray.700' : 'white'}>
                    <MenuItem 
                      as={Link}
                      to="/profile"
                      _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.50' }}
                    >
                      <VStack align="flex-start" spacing={0}>
                        <Text fontWeight="500" fontSize="sm">프로필</Text>
                        <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                          계정 정보 및 설정
                        </Text>
                      </VStack>
                    </MenuItem>

                    <MenuItem 
                      as={Link}
                      to="/scrap"
                      _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.50' }}
                    >
                      <VStack align="flex-start" spacing={0}>
                        <Text fontWeight="500" fontSize="sm">북마크</Text>
                        <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                          저장한 글 모아보기
                        </Text>
                      </VStack>
                    </MenuItem>

                    {isAdmin && (
                      <MenuItem
                        as={Link}
                        to="/admin"
                        _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.50' }}
                      >
                        <VStack align="flex-start" spacing={0}>
                          <HStack>
                            <Text fontWeight="500" fontSize="sm" color="orange.500">관리자</Text>
                            <Badge colorScheme="orange" size="sm">ADMIN</Badge>
                          </HStack>
                          <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
                            시스템 관리
                          </Text>
                        </VStack>
                      </MenuItem>
                    )}

                    <MenuItem 
                      color="red.500" 
                      _hover={{ bg: colorMode === 'dark' ? 'gray.600' : 'gray.50' }}
                      onClick={logout}
                    >
                      <Text fontWeight="500" fontSize="sm">로그아웃</Text>
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
                    bg: 'brand.500',
                    color: 'white',
                    borderColor: 'brand.500'
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
      
      {/* 스토리 읽기 진행도 바 */}
      {isStoryDetailPage && (
        <Box
          position="absolute"
          bottom="0"
          left="0"
          height="3px"
          bg="brand.500"
          width={`${scrollProgress}%`}
          transition="width 0.1s ease-out"
        />
      )}
      </Box>
      
      <MobileMenu />
      
      {/* 검색 모달 */}
      <SearchModal isOpen={isSearchOpen} onClose={onSearchClose} />
    </>
  );
};

export default Header;