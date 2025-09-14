import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  useColorMode,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { getDynamicTagCategoriesAsync, TagCategory, Tag as TagType } from '../data/tags';

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  selectedTags,
  onTagsChange,
  maxTags = 10,
  placeholder = "태그를 선택해주세요"
}) => {
  const { colorMode } = useColorMode();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [tempSelectedTags, setTempSelectedTags] = useState<string[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);

  // 컴포넌트 마운트 시 태그 카테고리 로드
  useEffect(() => {
    const loadTagCategories = async () => {
      try {
        console.log('🏷️ TagSelector: 태그 카테고리 로드 중...');
        const categories = await getDynamicTagCategoriesAsync();
        setTagCategories(categories);
        console.log('✅ TagSelector: 태그 카테고리 로드 완료:', categories.length, '개 카테고리');
      } catch (error) {
        console.error('❌ TagSelector: 태그 카테고리 로드 실패:', error);
        setTagCategories([]);
      }
    };

    loadTagCategories();
  }, []);

  const handleModalOpen = () => {
    setTempSelectedTags([...selectedTags]); // 현재 선택된 태그들을 임시 상태로 복사
    onOpen();
  };

  const handleTagToggle = (tagId: string) => {
    if (tempSelectedTags.includes(tagId)) {
      setTempSelectedTags(tempSelectedTags.filter(id => id !== tagId));
    } else if (tempSelectedTags.length < maxTags) {
      setTempSelectedTags([...tempSelectedTags, tagId]);
    }
  };

  const handleConfirm = () => {
    onTagsChange(tempSelectedTags);
    onClose();
  };

  const handleCancel = () => {
    setTempSelectedTags([...selectedTags]); // 원래 상태로 복원
    onClose();
  };

  const handleTagRemove = (tagId: string) => {
    onTagsChange(selectedTags.filter(id => id !== tagId));
  };

  const getTagName = (tagId: string) => {
    const allTags = tagCategories.flatMap(cat => cat.tags);
    return allTags.find(tag => tag.id === tagId)?.name || tagId;
  };

  return (
    <VStack spacing={3} align="stretch">
      {/* 선택된 태그들과 추가 버튼 */}
      <HStack spacing={3} wrap="wrap">
        {selectedTags.map((tagId) => (
          <Tag
            key={tagId}
            size="md"
            variant="solid"
            colorScheme="brand"
          >
            <TagLabel>{getTagName(tagId)}</TagLabel>
            <TagCloseButton onClick={() => handleTagRemove(tagId)} />
          </Tag>
        ))}
        
        <Button
          size="sm"
          leftIcon={<AddIcon />}
          variant="outline"
          onClick={handleModalOpen}
          borderColor={colorMode === 'dark' ? '#626269' : '#9e9ea4'}
          color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
          _hover={{
            borderColor: 'brand.500',
            color: 'brand.500'
          }}
          isDisabled={selectedTags.length >= maxTags}
        >
          태그 추가 ({selectedTags.length}/{maxTags})
        </Button>
      </HStack>

      {/* 태그 선택 모달 */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>태그 선택</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                최대 {maxTags}개까지 선택할 수 있습니다.
              </Text>
              
              <Accordion 
                allowMultiple
              >
                {tagCategories.map((category) => (
                  <AccordionItem key={category.id}>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        <Text fontWeight="500">
                          {category.name}
                        </Text>
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                      <Wrap spacing={2}>
                        {category.tags.map((tag) => {
                          const isSelected = tempSelectedTags.includes(tag.id);
                          const isDisabled = !isSelected && tempSelectedTags.length >= maxTags;
                          
                          return (
                            <WrapItem key={tag.id}>
                              <Button
                                size="sm"
                                variant={isSelected ? "solid" : "outline"}
                                colorScheme={isSelected ? "brand" : "gray"}
                                onClick={() => handleTagToggle(tag.id)}
                                isDisabled={isDisabled}
                                opacity={isDisabled ? 0.5 : 1}
                              >
                                {tag.name}
                              </Button>
                            </WrapItem>
                          );
                        })}
                      </Wrap>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="outline" onClick={handleCancel}>
                취소
              </Button>
              <Button 
                colorScheme="brand" 
                onClick={handleConfirm}
                isDisabled={tempSelectedTags.length === 0}
              >
                추가하기 ({tempSelectedTags.length})
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default TagSelector;