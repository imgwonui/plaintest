import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Heading,
  Divider,
  useColorMode,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Select,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { AddIcon, EditIcon, DeleteIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  tagCategories, 
  TagCategory, 
  Tag as TagType, 
  getAllTags, 
  getAllTagsAsync,
  getDynamicTagCategories,
  addTag,
  updateTag,
  deleteTag,
  initializeTags
} from '../data/tags';
import { storyService, loungeService } from '../services/supabaseDataService';

const AdminTags: React.FC = () => {
  const { colorMode } = useColorMode();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const [newTagName, setNewTagName] = useState('');
  const [newTagId, setNewTagId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('recruitment');
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [deletingTag, setDeletingTag] = useState<TagType | null>(null);
  const [tags, setTags] = useState<TagType[]>([]);
  const [tagUsageStats, setTagUsageStats] = useState<Record<string, number>>({});
  const [lastDeleteAttempt, setLastDeleteAttempt] = useState<string | null>(null);
  
  // 관리자가 아니면 홈으로 리다이렉트
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    
    // 태그 데이터 로드 및 실제 사용량 계산
    loadTagsData();
  }, [isAdmin, navigate]);

  const loadTagsData = async () => {
    try {
      // localStorage에서 커스텀 태그 초기화
      initializeTags();
      
      // 태그 목록 로드 (데이터베이스 포함, 비동기)
      const allTags = await getAllTagsAsync();
      setTags(allTags);
      console.log('📝 태그 목록 로드됨:', allTags.length, '개');
      
      // 실제 사용량 계산을 위해 Supabase 데이터 로드
      const [storiesResult, loungeResult] = await Promise.all([
        storyService.getAll(1, 1000),
        loungeService.getAll(1, 1000)
      ]);
      
      const stories = storiesResult.stories || [];
      const loungePosts = loungeResult.posts || [];
      
      // 태그 사용량 계산
      const usage: Record<string, number> = {};
      
      [...stories, ...loungePosts].forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach((tagId: string) => {
            usage[tagId] = (usage[tagId] || 0) + 1;
          });
        }
      });
      
      setTagUsageStats(usage);
      console.log('✅ 태그 사용량 통계 로드 완료:', usage);
      
    } catch (error) {
      console.error('❌ 태그 데이터 로드 실패:', error);
      setTags(getAllTags()); // 기본 태그라도 표시
      setTagUsageStats({});
    }
  };

  const handleAddTag = async () => {
    if (!newTagName.trim() || !newTagId.trim()) {
      toast({
        title: "태그 이름과 ID를 모두 입력해주세요",
        status: "error",
        duration: 3000,
      });
      return;
    }

    // ID 중복 체크
    if (tags.some(tag => tag.id === newTagId)) {
      toast({
        title: "이미 존재하는 태그 ID입니다",
        status: "error",
        duration: 3000,
      });
      return;
    }

    try {
      const newTag: TagType = {
        id: newTagId,
        name: newTagName,
        category: selectedCategory
      };

      // 실제로 태그 추가 (비동기)
      const success = await addTag(newTag);
      
      if (success) {
        // 상태 업데이트 (비동기로 최신 태그 목록 가져오기)
        const updatedTags = await getAllTagsAsync();
        setTags(updatedTags);
        
        // 새로 추가된 태그의 사용량을 0으로 설정
        setTagUsageStats(prev => ({
          ...prev,
          [newTagId]: 0
        }));
        
        console.log('🏷️ 새 태그 추가 후 사용량 통계 업데이트:', {
          tagId: newTagId,
          usageCount: 0,
          allStats: { ...tagUsageStats, [newTagId]: 0 }
        });
        
        toast({
          title: "태그가 추가되었습니다",
          description: `"${newTagName}" 태그가 성공적으로 추가되었습니다.`,
          status: "success",
          duration: 3000,
        });
        
        setNewTagName('');
        setNewTagId('');
        onAddClose();
      } else {
        toast({
          title: "태그 추가 실패",
          description: "태그 추가 중 오류가 발생했습니다.",
          status: "error",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('태그 추가 에러:', error);
      toast({
        title: "태그 추가 실패", 
        description: "태그 추가 중 오류가 발생했습니다.",
        status: "error",
        duration: 3000,
      });
    }
  };

  const handleEditTag = (tag: TagType) => {
    setEditingTag(tag);
    setEditTagName(tag.name);
    onEditOpen();
  };

  const handleUpdateTag = async () => {
    if (!editTagName.trim()) {
      toast({
        title: "태그 이름을 입력해주세요",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (editingTag) {
      try {
        // 실제로 태그 수정 (비동기)
        const success = await updateTag(editingTag.id, editTagName);
        
        if (success) {
          // 상태 업데이트 (비동기로 최신 태그 목록 가져오기)
          const updatedTags = await getAllTagsAsync();
          setTags(updatedTags);
          
          toast({
            title: "태그가 수정되었습니다",
            description: `"${editingTag.name}" → "${editTagName}"으로 변경되었습니다.`,
            status: "success",
            duration: 3000,
          });
          
          setEditingTag(null);
          setEditTagName('');
          onEditClose();
        } else {
          toast({
            title: "태그 수정 실패",
            description: "태그 수정 중 오류가 발생했습니다.",
            status: "error",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('태그 수정 에러:', error);
        toast({
          title: "태그 수정 실패",
          description: "태그 수정 중 오류가 발생했습니다.",
          status: "error",
          duration: 3000,
        });
      }
    }
  };

  const handleDeleteTag = (tag: TagType) => {
    setDeletingTag(tag);
    onDeleteOpen();
  };

  const confirmDeleteTag = async () => {
    if (deletingTag) {
      // 사용 중인 태그인지 체크
      const usageCount = tagUsageStats[deletingTag.id] || 0;
      if (usageCount > 0) {
        toast({
          title: "삭제할 수 없습니다",
          description: `"${deletingTag.name}" 태그는 현재 ${usageCount}개의 글에서 사용 중입니다. 강제 삭제하려면 다시 한번 삭제를 눌러주세요.`,
          status: "warning",
          duration: 5000,
        });
        
        // 강제 삭제를 위한 플래그 추가 (두 번 클릭하면 삭제)
        if (deletingTag.id === lastDeleteAttempt) {
          console.log('🗑️ 강제 삭제 실행:', deletingTag.name);
          // 강제 삭제 진행
        } else {
          setLastDeleteAttempt(deletingTag.id);
          setDeletingTag(null);
          onDeleteClose();
          return;
        }
      }
      
      try {
        // 실제로 태그 삭제 (비동기)
        const success = await deleteTag(deletingTag.id);
        
        if (success) {
          // 상태 업데이트 (비동기로 최신 태그 목록 가져오기)
          const updatedTags = await getAllTagsAsync();
          setTags(updatedTags);
          
          toast({
            title: "태그가 삭제되었습니다",
            description: `"${deletingTag.name}" 태그가 삭제되었습니다.`,
            status: "success",
            duration: 3000,
          });
        } else {
          toast({
            title: "태그 삭제 실패",
            description: "태그 삭제 중 오류가 발생했습니다.",
            status: "error",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('태그 삭제 에러:', error);
        toast({
          title: "태그 삭제 실패",
          description: "태그 삭제 중 오류가 발생했습니다.",
          status: "error",
          duration: 3000,
        });
      }
      
      setDeletingTag(null);
      onDeleteClose();
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = getDynamicTagCategories().find(cat => cat.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getTagsByCategoryLocal = (categoryId: string) => {
    return tags.filter(tag => tag.category === categoryId);
  };

  const cancelRef = React.useRef<HTMLButtonElement>(null);

  if (!isAdmin) {
    return null;
  }

  return (
    <Container maxW="1200px" py={8}>
      <VStack spacing={8} align="stretch">
        {/* 헤더 */}
        <VStack spacing={4} align="flex-start">
          <Heading as="h1" size="xl" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            🏷️ 태그 관리
          </Heading>
          <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} fontSize="lg">
            시스템에서 사용되는 태그를 관리할 수 있습니다
          </Text>
        </VStack>

        <Divider />

        {/* 통계 */}
        <Box>
          <Heading as="h2" size="lg" mb={6} color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            📊 태그 현황
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
            <Stat 
              p={6} 
              bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
              borderRadius="lg"
              border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
            >
              <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>전체 태그</StatLabel>
              <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>{tags.length}</StatNumber>
              <StatHelpText color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                {tagCategories.length}개 카테고리
              </StatHelpText>
            </Stat>

            {getDynamicTagCategories().slice(0, 3).map(category => (
              <Stat 
                key={category.id}
                p={6} 
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'} 
                borderRadius="lg"
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              >
                <StatLabel color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>{category.name}</StatLabel>
                <StatNumber color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  {getTagsByCategoryLocal(category.id).length}
                </StatNumber>
                <StatHelpText color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                  개 태그
                </StatHelpText>
              </Stat>
            ))}
          </SimpleGrid>
        </Box>

        {/* 액션 버튼 */}
        <HStack justify="space-between" wrap="wrap">
          <Heading as="h2" size="lg" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
            🏷️ 태그 목록
          </Heading>
          <Button 
            leftIcon={<AddIcon />}
            onClick={onAddOpen}
            size="lg"
          >
            새 태그 추가
          </Button>
        </HStack>

        {/* 카테고리별 태그 목록 */}
        <VStack spacing={6} align="stretch">
          {getDynamicTagCategories().map(category => {
            const categoryTags = getTagsByCategoryLocal(category.id);
            return (
              <Card 
                key={category.id}
                bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
              >
                <CardHeader>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Heading size="md" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                        {category.name}
                      </Heading>
                      <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                        {categoryTags.length}개의 태그
                      </Text>
                    </VStack>
                    <Badge colorScheme="blue" variant="subtle">
                      {category.id}
                    </Badge>
                  </HStack>
                </CardHeader>
                <CardBody pt={0}>
                  {categoryTags.length > 0 ? (
                    <Box overflow="auto">
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>ID</Th>
                            <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>이름</Th>
                            <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>사용량</Th>
                            <Th color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} width="100px">액션</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {categoryTags.map(tag => (
                            <Tr key={tag.id}>
                              <Td>
                                <Badge variant="outline" colorScheme="gray">
                                  {tag.id}
                                </Badge>
                              </Td>
                              <Td color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                                {tag.name}
                              </Td>
                              <Td>
                                <Badge 
                                  colorScheme={(tagUsageStats[tag.id] || 0) > 10 ? 'green' : (tagUsageStats[tag.id] || 0) > 5 ? 'blue' : 'gray'}
                                  size="sm"
                                >
                                  {tagUsageStats[tag.id] || 0}회 사용
                                  {tagUsageStats[tag.id] === undefined && ' (undefined)'}
                                </Badge>
                              </Td>
                              <Td>
                                <HStack spacing={2}>
                                  <IconButton
                                    aria-label="태그 수정"
                                    icon={<EditIcon />}
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEditTag(tag)}
                                  />
                                  <IconButton
                                    aria-label="태그 삭제"
                                    icon={<DeleteIcon />}
                                    size="sm"
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => {
                                      console.log('🔍 삭제 버튼 클릭:', {
                                        tagId: tag.id,
                                        tagName: tag.name,
                                        usageCount: tagUsageStats[tag.id],
                                        tagUsageStats: tagUsageStats
                                      });
                                      handleDeleteTag(tag);
                                    }}
                                    isDisabled={false}
                                  />
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  ) : (
                    <Text 
                      textAlign="center" 
                      py={4} 
                      color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                    >
                      이 카테고리에는 아직 태그가 없습니다.
                    </Text>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </VStack>

        {/* 태그 추가 모달 */}
        <Modal isOpen={isAddOpen} onClose={onAddClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>새 태그 추가</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>카테고리</FormLabel>
                  <Select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {tagCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>태그 ID</FormLabel>
                  <Input
                    value={newTagId}
                    onChange={(e) => setNewTagId(e.target.value)}
                    placeholder="예: newTag"
                  />
                  <FormHelperText>
                    영문, 숫자, 언더스코어만 사용 가능합니다.
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>태그 이름</FormLabel>
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="예: 새로운 태그"
                  />
                  <FormHelperText>
                    사용자에게 표시될 한글 이름입니다.
                  </FormHelperText>
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onAddClose}>
                취소
              </Button>
              <Button colorScheme="blue" onClick={handleAddTag}>
                추가
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 태그 수정 모달 */}
        <Modal isOpen={isEditOpen} onClose={onEditClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>태그 수정</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>태그 ID</FormLabel>
                  <Input
                    value={editingTag?.id || ''}
                    isReadOnly
                    bg={colorMode === 'dark' ? '#2c2c35' : 'gray.100'}
                  />
                  <FormHelperText>
                    태그 ID는 수정할 수 없습니다.
                  </FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>태그 이름</FormLabel>
                  <Input
                    value={editTagName}
                    onChange={(e) => setEditTagName(e.target.value)}
                    placeholder="태그 이름을 입력하세요"
                  />
                </FormControl>
              </VStack>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onEditClose}>
                취소
              </Button>
              <Button colorScheme="blue" onClick={handleUpdateTag}>
                수정
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* 태그 삭제 확인 다이얼로그 */}
        <AlertDialog
          isOpen={isDeleteOpen}
          leastDestructiveRef={cancelRef}
          onClose={onDeleteClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                태그 삭제
              </AlertDialogHeader>

              <AlertDialogBody>
                <Text>
                  <strong>"{deletingTag?.name}"</strong> 태그를 삭제하시겠습니까?
                </Text>
                <Text mt={2} color="red.500" fontSize="sm">
                  ⚠️ 이 태그를 사용하는 모든 글에서 태그가 제거됩니다. 이 작업은 되돌릴 수 없습니다.
                </Text>
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onDeleteClose}>
                  취소
                </Button>
                <Button colorScheme="red" onClick={confirmDeleteTag} ml={3}>
                  삭제
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Container>
  );
};

export default AdminTags;