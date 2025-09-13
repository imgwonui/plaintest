import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  ButtonGroup,
  Textarea,
  useColorMode,
  useToast,
  IconButton,
  Tooltip,
  Divider,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  useDisclosure,
  Text,
} from '@chakra-ui/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Paperclip,
} from 'lucide-react';

interface AdvancedTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const AdvancedTextEditor: React.FC<AdvancedTextEditorProps> = ({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
  minHeight = "400px"
}) => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOpen: isLinkOpen, onOpen: onLinkOpen, onClose: onLinkClose } = useDisclosure();
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const insertText = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newValue = value.substring(0, start) + before + textToInsert + after + value.substring(end);
    onChange(newValue);

    // 커서 위치 조정
    setTimeout(() => {
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  }, [value, onChange]);

  const handleBold = () => insertText('**', '**', '굵은 텍스트');
  const handleItalic = () => insertText('*', '*', '기울임 텍스트');
  const handleUnderline = () => insertText('<u>', '</u>', '밑줄 텍스트');
  const handleStrikethrough = () => insertText('~~', '~~', '취소선 텍스트');
  const handleCode = () => insertText('`', '`', '코드');
  const handleCodeBlock = () => insertText('```\n', '\n```', '코드 블록');
  
  // 형광펜 기능들
  const handleHighlightYellow = () => insertText('==[', ']==', '노란색 형광펜');
  const handleHighlightGreen = () => insertText('==green[', ']==', '초록색 형광펜');
  const handleHighlightBlue = () => insertText('==blue[', ']==', '파란색 형광펜');
  const handleHighlightPink = () => insertText('==pink[', ']==', '분홍색 형광펜');
  const handleHighlightPurple = () => insertText('==purple[', ']==', '보라색 형광펜');

  const handleHeading = (level: number) => {
    const prefix = '#'.repeat(level) + ' ';
    insertText('\n' + prefix, '', `제목 ${level}`);
  };

  const handleQuote = () => insertText('\n> ', '', '인용문');
  const handleList = () => insertText('\n- ', '', '목록 항목');
  const handleNumberedList = () => insertText('\n1. ', '', '번호 목록 항목');

  const handleLinkInsert = () => {
    if (!linkText.trim() || !linkUrl.trim()) {
      toast({
        title: "링크 정보를 모두 입력해주세요",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    insertText(`[${linkText}](${linkUrl})`, '');
    setLinkText('');
    setLinkUrl('');
    onLinkClose();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB 제한
      toast({
        title: "파일 크기가 너무 큽니다",
        description: "10MB 이하의 이미지를 선택해주세요",
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

    // 이미지를 base64로 변환하여 삽입 (실제로는 서버에 업로드해야 함)
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const imageMarkdown = `\n![${file.name}](${imageUrl})\n`;
      
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const newValue = value.substring(0, start) + imageMarkdown + value.substring(start);
      onChange(newValue);

      toast({
        title: "이미지가 삽입되었습니다",
        status: "success",
        duration: 2000,
      });
    };
    reader.readAsDataURL(file);

    // input 초기화
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      const fakeEvent = {
        target: {
          files: [imageFile]
        }
      } as any;
      handleImageUpload(fakeEvent);
    }
  };

  return (
    <VStack spacing={3} align="stretch" w="100%">
      {/* 툴바 */}
      <Box
        p={3}
        bg={colorMode === 'dark' ? '#2c2c35' : '#f8f9fa'}
        borderRadius="md"
        border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
      >
        <VStack spacing={3}>
          {/* 첫 번째 줄: 기본 서식 */}
          <HStack spacing={2} wrap="wrap">
            <ButtonGroup size="sm" isAttached variant="outline">
              <Tooltip label="굵게 (Ctrl+B)">
                <IconButton aria-label="굵게" onClick={handleBold}>
                  <Bold size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip label="기울임 (Ctrl+I)">
                <IconButton aria-label="기울임" onClick={handleItalic}>
                  <Italic size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip label="밑줄">
                <IconButton aria-label="밑줄" onClick={handleUnderline}>
                  <Underline size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip label="취소선">
                <IconButton aria-label="취소선" onClick={handleStrikethrough}>
                  <Strikethrough size={16} />
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            <Divider orientation="vertical" h="32px" />

            <ButtonGroup size="sm" isAttached variant="outline">
              <Tooltip label="인라인 코드">
                <IconButton aria-label="코드" onClick={handleCode}>
                  <Code size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip label="코드 블록">
                <Button onClick={handleCodeBlock}>{ "{ }" }</Button>
              </Tooltip>
            </ButtonGroup>

            <Divider orientation="vertical" h="32px" />

            <ButtonGroup size="sm" variant="outline">
              <Button onClick={() => handleHeading(1)}>H1</Button>
              <Button onClick={() => handleHeading(2)}>H2</Button>
              <Button onClick={() => handleHeading(3)}>H3</Button>
            </ButtonGroup>

            <Divider orientation="vertical" h="32px" />

            <ButtonGroup size="sm" isAttached variant="outline">
              <Tooltip label="인용문">
                <Button onClick={handleQuote}>" "</Button>
              </Tooltip>
              <Tooltip label="목록">
                <Button onClick={handleList}>• </Button>
              </Tooltip>
              <Tooltip label="번호 목록">
                <Button onClick={handleNumberedList}>1. </Button>
              </Tooltip>
            </ButtonGroup>

            <Divider orientation="vertical" h="32px" />

            <ButtonGroup size="sm" isAttached variant="outline">
              <Tooltip label="링크 삽입">
                <IconButton aria-label="링크" onClick={onLinkOpen}>
                  <Link size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip label="이미지 업로드">
                <IconButton 
                  aria-label="이미지" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip size={16} />
                </IconButton>
              </Tooltip>
            </ButtonGroup>
          </HStack>

          {/* 두 번째 줄: 형광펜 */}
          <HStack spacing={2} wrap="wrap">
            <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
              형광펜:
            </Text>
            <ButtonGroup size="sm" variant="outline">
              <Tooltip label="노란색 형광펜">
                <Button 
                  onClick={handleHighlightYellow}
                  bg="yellow.200"
                  color="black"
                  _hover={{ bg: "yellow.300" }}
                >
                  노랑
                </Button>
              </Tooltip>
              <Tooltip label="초록색 형광펜">
                <Button 
                  onClick={handleHighlightGreen}
                  bg="green.200"
                  color="black"
                  _hover={{ bg: "green.300" }}
                >
                  초록
                </Button>
              </Tooltip>
              <Tooltip label="파란색 형광펜">
                <Button 
                  onClick={handleHighlightBlue}
                  bg="blue.200"
                  color="black"
                  _hover={{ bg: "blue.300" }}
                >
                  파랑
                </Button>
              </Tooltip>
              <Tooltip label="분홍색 형광펜">
                <Button 
                  onClick={handleHighlightPink}
                  bg="pink.200"
                  color="black"
                  _hover={{ bg: "pink.300" }}
                >
                  분홍
                </Button>
              </Tooltip>
              <Tooltip label="보라색 형광펜">
                <Button 
                  onClick={handleHighlightPurple}
                  bg="purple.200"
                  color="black"
                  _hover={{ bg: "purple.300" }}
                >
                  보라
                </Button>
              </Tooltip>
            </ButtonGroup>
          </HStack>
        </VStack>
      </Box>

      {/* 텍스트 에디터 */}
      <Box position="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          minH={minHeight}
          resize="vertical"
          bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
          border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
          color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
          _placeholder={{ color: colorMode === 'dark' ? '#7e7e87' : '#9e9ea4' }}
          _focus={{ 
            bg: colorMode === 'dark' ? '#3c3c47' : 'white',
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
          }}
          _hover={{ borderColor: colorMode === 'dark' ? '#626269' : '#7e7e87' }}
          fontSize="md"
          lineHeight="1.6"
          fontFamily="system-ui, -apple-system, sans-serif"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
        
        <Text
          position="absolute"
          bottom="8px"
          right="12px"
          fontSize="xs"
          color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'}
          pointerEvents="none"
        >
          이미지를 드래그하여 삽입할 수 있습니다
        </Text>
      </Box>

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />

      {/* 링크 삽입 모달 */}
      <Modal isOpen={isLinkOpen} onClose={onLinkClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>링크 삽입</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input
                placeholder="링크 텍스트"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
              <Input
                placeholder="URL (https://...)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onLinkClose}>
              취소
            </Button>
            <Button onClick={handleLinkInsert}>
              삽입
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default AdvancedTextEditor;