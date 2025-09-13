import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Heading,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Divider,
  useColorMode,
  useToast,
  Avatar,
  Badge,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Select,
  Textarea,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowBackIcon } from '@chakra-ui/icons';

const Settings: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, isLoggedIn, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // 설정 상태
  const [settings, setSettings] = useState({
    displayName: '',
    email: '',
    bio: '',
    avatar: '',
    emailNotifications: true,
    pushNotifications: false,
    weeklyDigest: true,
    darkMode: colorMode === 'dark',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
    }
  }, [isLoggedIn, navigate]);

  // 사용자 정보로 설정 초기화
  useEffect(() => {
    if (user) {
      setSettings(prevSettings => ({
        ...prevSettings,
        displayName: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
        emailNotifications: user.emailNotifications ?? true,
        pushNotifications: user.pushNotifications ?? false,
        weeklyDigest: user.weeklyDigest ?? true,
        darkMode: colorMode === 'dark',
      }));
    }
  }, [user, colorMode]);

  const handleSaveSettings = () => {
    // 사용자 정보 업데이트
    const updates: any = {
      name: settings.displayName.trim() || user?.name,
      email: settings.email.trim() || user?.email,
      bio: settings.bio,
      emailNotifications: settings.emailNotifications,
      pushNotifications: settings.pushNotifications,
      weeklyDigest: settings.weeklyDigest,
    };

    // 기존 아바타 유지 (새 파일이 없다면)
    if (!avatarFile && user?.avatar) {
      updates.avatar = user.avatar;
    }

    // 아바타 변경이 있다면 포함
    if (avatarFile) {
      // 실제로는 서버에 업로드해야 함. 여기서는 데모용으로 FileReader 사용
      const reader = new FileReader();
      reader.onload = (e) => {
        updates.avatar = e.target?.result as string;
        updateUser(updates);
        setAvatarFile(null);
        // 설정 상태도 업데이트
        setSettings(prev => ({ ...prev, avatar: e.target?.result as string }));
        toast({
          title: "설정이 저장되었습니다",
          status: "success", 
          duration: 3000,
        });
      };
      reader.readAsDataURL(avatarFile);
    } else {
      updateUser(updates);
      toast({
        title: "설정이 저장되었습니다",
        status: "success",
        duration: 3000,
      });
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "파일 크기가 너무 큽니다",
          description: "2MB 이하의 이미지를 선택해주세요",
          status: "error",
          duration: 3000,
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "이미지 파일만 업로드할 수 있습니다",
          status: "error",
          duration: 3000,
        });
        return;
      }

      setAvatarFile(file);
      // 미리보기를 위해 임시로 settings에 반영
      const reader = new FileReader();
      reader.onload = (e) => {
        setSettings(prev => ({ ...prev, avatar: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = () => {
    // 실제로는 여기서 계정 삭제 API를 호출해야 함
    toast({
      title: "계정이 삭제되었습니다",
      description: "그동안 이용해주셔서 감사합니다",
      status: "warning",
      duration: 5000,
    });
    
    // 로그아웃 처리
    logout();
    navigate('/');
    onDeleteClose();
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'kakao':
        return <Badge colorScheme="yellow" size="sm">카카오</Badge>;
      case 'google':
        return <Badge colorScheme="red" size="sm">구글</Badge>;
      default:
        return <Badge colorScheme="gray" size="sm">{provider}</Badge>;
    }
  };

  if (!isLoggedIn || !user) {
    return null;
  }

  return (
    <Container maxW="800px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <HStack spacing={4}>
          <Button
            leftIcon={<ArrowBackIcon />}
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
          >
            프로필로
          </Button>
        </HStack>

        <Heading as="h1" size="xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
          설정
        </Heading>

        {/* 계정 정보 */}
        <Card 
          bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
          border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
        >
          <CardHeader>
            <Heading as="h3" size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              계정 정보
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={6} align="stretch">
              <HStack spacing={4}>
                <VStack spacing={3}>
                  <Avatar size="lg" name={user.name} src={settings.avatar} />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    사진 변경
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                </VStack>
                <VStack spacing={2} align="start">
                  <HStack>
                    <Text fontSize="lg" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                      {user.name}
                    </Text>
                    {getProviderBadge(user.provider || 'kakao')}
                    {user.isAdmin && (
                      <Badge colorScheme="purple" size="sm">관리자</Badge>
                    )}
                    {user.isVerified && (
                      <Badge colorScheme="green" size="sm">인사담당자</Badge>
                    )}
                  </HStack>
                  <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                    {user.email}
                  </Text>
                </VStack>
              </HStack>

              <Divider />

              <FormControl>
                <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                  표시 이름
                </FormLabel>
                <Input
                  value={settings.displayName}
                  onChange={(e) => setSettings(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="표시할 이름을 입력하세요"
                  bg={colorMode === 'dark' ? '#2c2c35' : 'white'}
                  border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                  color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                  이메일
                </FormLabel>
                <Input
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="이메일 주소"
                  type="email"
                  bg={colorMode === 'dark' ? '#2c2c35' : 'white'}
                  border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                  color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                  자기소개
                </FormLabel>
                <Textarea
                  value={settings.bio}
                  onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="간단한 자기소개를 작성해보세요"
                  rows={3}
                  bg={colorMode === 'dark' ? '#2c2c35' : 'white'}
                  border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                  color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                  maxLength={200}
                />
                <Text fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'} mt={1}>
                  {settings.bio.length}/200자
                </Text>
              </FormControl>
            </VStack>
          </CardBody>
        </Card>


        {/* 테마 설정 */}
        <Card 
          bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
          border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
        >
          <CardHeader>
            <Heading as="h3" size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
              화면 설정
            </Heading>
          </CardHeader>
          <CardBody>
            <HStack justify="space-between">
              <VStack spacing={1} align="start">
                <Text fontWeight="500" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  다크 모드
                </Text>
                <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                  어두운 테마를 사용합니다
                </Text>
              </VStack>
              <Switch
                isChecked={colorMode === 'dark'}
                onChange={() => {
                  toggleColorMode();
                  setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
                }}
                colorScheme="brand"
              />
            </HStack>
          </CardBody>
        </Card>

        {/* 저장 버튼 */}
        <HStack justify="flex-end">
          <Button
            colorScheme="brand"
            onClick={handleSaveSettings}
            size="lg"
          >
            설정 저장
          </Button>
        </HStack>

        <Divider />

        {/* 위험한 작업 */}
        <Card 
          bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
          border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
        >
          <CardHeader>
            <Heading as="h3" size="md" color="red.500">
              위험한 작업
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <VStack spacing={2} align="start">
                <Text fontWeight="500" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  계정 삭제
                </Text>
                <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                  계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                  작성한 글, 댓글, 좋아요, 북마크 등 모든 활동 기록이 사라집니다.
                </Text>
              </VStack>
              
              <HStack justify="flex-start">
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={onDeleteOpen}
                  size="sm"
                >
                  계정 삭제하기
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* 계정 삭제 확인 다이얼로그 */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent bg={colorMode === 'dark' ? '#3c3c47' : 'white'}>
              <AlertDialogHeader fontSize="lg" fontWeight="bold" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                계정 삭제 확인
              </AlertDialogHeader>
              <AlertDialogBody color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                정말로 계정을 삭제하시겠습니까?
                <br /><br />
                <Text color="red.500" fontWeight="600">
                  이 작업은 되돌릴 수 없으며, 모든 데이터가 영구적으로 삭제됩니다:
                </Text>
                <br />
                • 작성한 모든 Story와 Lounge 글<br />
                • 모든 댓글과 답글<br />
                • 좋아요와 북마크 기록<br />
                • 프로필 정보와 설정<br />
                • 활동 통계와 기록
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  취소
                </Button>
                <Button colorScheme="red" onClick={handleDeleteAccount} ml={3}>
                  삭제하기
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Container>
  );
};

export default Settings;