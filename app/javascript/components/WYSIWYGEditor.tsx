import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  ButtonGroup,
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
  Flex,
} from '@chakra-ui/react';
import ReactQuill, { Quill } from 'react-quill';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Image,
  List,
  ListOrdered,
  Quote,
  Type,
  Palette,
} from 'lucide-react';

// Quill 에디터 커스텀 스타일 (기본 CSS 포함)
const customQuillStyles = `
  /* Quill Snow 테마 기본 스타일 */
  .ql-snow .ql-editor blockquote {
    border-left: 4px solid #ccc;
    margin-bottom: 5px;
    margin-top: 5px;
    padding-left: 16px;
  }
  .ql-snow .ql-editor h1 {
    font-size: 2em;
  }
  .ql-snow .ql-editor h2 {
    font-size: 1.5em;
  }
  .ql-snow .ql-editor h3 {
    font-size: 1.17em;
  }
  .ql-snow .ql-editor h4 {
    font-size: 1em;
  }
  .ql-snow .ql-editor h5 {
    font-size: 0.83em;
  }
  .ql-snow .ql-editor h6 {
    font-size: 0.67em;
  }
  .ql-snow .ql-editor ol,
  .ql-snow .ql-editor ul {
    padding-left: 1.5em;
  }
  .ql-snow .ql-editor ol li,
  .ql-snow .ql-editor ul li {
    list-style-type: initial;
  }
  .ql-snow .ql-editor ul li {
    list-style-type: disc;
  }
  .ql-snow .ql-editor ol li {
    list-style-type: decimal;
  }
  .ql-snow .ql-editor img {
    max-width: 100%;
  }

  /* 커스텀 스타일 */
  .ql-editor {
    min-height: 400px;
    font-size: 16px;
    line-height: 1.6;
    font-family: system-ui, -apple-system, sans-serif;
    background-color: transparent !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    padding: 16px !important;
  }
  
  /* 에디터 컨테이너 완전 초기화 */
  .ql-container {
    background-color: transparent !important;
    border: none !important;
    box-shadow: none !important;
    width: 100% !important;
  }
  
  .ql-snow {
    background-color: transparent !important;
    border: none !important;
    width: 100% !important;
  }
  
  .ql-snow .ql-container {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  
  .ql-snow .ql-editor {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    width: 100% !important;
  }
  
  /* 포커스 상태에서도 테두리 제거 */
  .ql-editor:focus,
  .ql-editor:focus-visible,
  .ql-container:focus,
  .ql-container:focus-visible {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  
  /* 이미지 스타일링 */
  .ql-editor img {
    max-width: 100%;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease;
    display: block;
    margin: 10px auto;
    border-radius: 4px;
    position: relative;
  }
  
  .ql-editor img:hover {
    border-color: #8B5CF6;
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
  }
  
  /* 이미지 선택 상태 */
  .ql-editor img.selected {
    border-color: #8B5CF6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
  }
  
  /* 드래그 중 상태 */
  .ql-editor img.dragging {
    opacity: 0.7;
    cursor: grabbing;
    z-index: 1000;
  }
  
  /* 이미지 리사이즈 핸들 */
  .image-resize-handles {
    position: absolute;
    pointer-events: none;
  }
  
  .image-resize-handle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: #8B5CF6;
    border: 2px solid white;
    border-radius: 50%;
    pointer-events: all;
    z-index: 1001;
  }
  
  .image-resize-handle.nw { top: -4px; left: -4px; cursor: nw-resize; }
  .image-resize-handle.ne { top: -4px; right: -4px; cursor: ne-resize; }
  .image-resize-handle.sw { bottom: -4px; left: -4px; cursor: sw-resize; }
  .image-resize-handle.se { bottom: -4px; right: -4px; cursor: se-resize; }
  .image-resize-handle.n { top: -4px; left: 50%; transform: translateX(-50%); cursor: n-resize; }
  .image-resize-handle.s { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
  .image-resize-handle.w { top: 50%; left: -4px; transform: translateY(-50%); cursor: w-resize; }
  .image-resize-handle.e { top: 50%; right: -4px; transform: translateY(-50%); cursor: e-resize; }
  
  .ql-toolbar {
    border: none;
    padding: 0;
  }
  
  .ql-container {
    border: none;
  }
  
  .ql-editor.ql-blank::before {
    font-style: normal;
    color: #9e9ea4;
  }
  
  /* 다크모드 호환성 */
  .ql-editor {
    color: inherit;
  }
  
  .ql-editor strong {
    font-weight: 600;
  }
  
  .ql-editor em {
    font-style: italic;
  }
  
  .ql-editor u {
    text-decoration: underline;
  }
  
  .ql-editor s {
    text-decoration: line-through;
  }
  
  /* 형광펜 스타일 - 다크모드/라이트모드 호환 */
  .ql-editor span[style*="background-color: rgb(254, 240, 138)"] {
    background-color: #fef08a !important;
    color: #1f2937 !important;
  }
  
  .ql-editor span[style*="background-color: rgb(187, 247, 208)"] {
    background-color: #bbf7d0 !important;
    color: #1f2937 !important;
  }
  
  .ql-editor span[style*="background-color: rgb(191, 219, 254)"] {
    background-color: #bfdbfe !important;
    color: #1f2937 !important;
  }
  
  .ql-editor span[style*="background-color: rgb(252, 231, 243)"] {
    background-color: #fce7f3 !important;
    color: #1f2937 !important;
  }
  
  .ql-editor span[style*="background-color: rgb(233, 213, 255)"] {
    background-color: #e9d5ff !important;
    color: #1f2937 !important;
  }
`;

interface WYSIWYGEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const WYSIWYGEditor: React.FC<WYSIWYGEditorProps> = ({
  value,
  onChange,
  placeholder = "내용을 입력하세요...",
  minHeight = "400px"
}) => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const quillRef = useRef<ReactQuill>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOpen: isLinkOpen, onOpen: onLinkOpen, onClose: onLinkClose } = useDisclosure();
  const { isOpen: isColorOpen, onOpen: onColorOpen, onClose: onColorClose } = useDisclosure();
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // Quill 모듈 설정
  const modules = useMemo(() => ({
    toolbar: false, // 커스텀 툴바 사용을 위해 기본 툴바 비활성화
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image',
    'color', 'background', 'align',
    'code', 'code-block'
  ];

  // 에디터 포커스
  const focusEditor = () => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      editor.focus();
    }
  };

  // 서식 적용 함수들
  const applyFormat = (format: string, value?: any) => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection();
      if (range) {
        editor.formatText(range.index, range.length, format, value);
      }
      focusEditor();
    }
  };

  // 형광펜 적용
  const applyHighlight = (color: string) => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection();
      if (range && range.length > 0) {
        const className = `highlight-${color}`;
        editor.formatText(range.index, range.length, 'background', false);
        
        // CSS 클래스 적용을 위한 커스텀 처리
        setTimeout(() => {
          const selectedText = editor.getText(range.index, range.length);
          const colorMap: Record<string, string> = {
            yellow: '#fef08a',
            green: '#bbf7d0',
            blue: '#bfdbfe',
            pink: '#fce7f3',
            purple: '#e9d5ff'
          };
          
          editor.formatText(range.index, range.length, 'background', colorMap[color]);
          focusEditor();
        }, 0);
      } else {
        toast({
          title: "텍스트를 선택해주세요",
          description: "형광펜을 적용할 텍스트를 먼저 선택해주세요",
          status: "info",
          duration: 2000,
        });
      }
    }
  };

  // 글자 색상 적용
  const applyTextColor = (color: string) => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection();
      if (range && range.length > 0) {
        editor.formatText(range.index, range.length, 'color', color);
        focusEditor();
        onColorClose();
      } else {
        toast({
          title: "텍스트를 선택해주세요",
          description: "색상을 적용할 텍스트를 먼저 선택해주세요",
          status: "info",
          duration: 2000,
        });
      }
    }
  };

  // 블록 레벨 서식
  const applyBlockFormat = (format: string, value?: any) => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection();
      if (range) {
        editor.formatLine(range.index, range.length, format, value);
      }
      focusEditor();
    }
  };

  // 링크 삽입
  const handleLinkInsert = () => {
    if (!linkText.trim() || !linkUrl.trim()) {
      toast({
        title: "링크 정보를 모두 입력해주세요",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection();
      if (range) {
        editor.insertText(range.index, linkText, 'link', linkUrl);
      }
    }
    
    setLinkText('');
    setLinkUrl('');
    onLinkClose();
    focusEditor();
  };

  // 이미지 업로드 공통 함수
  const insertImage = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
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

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection() || { index: 0, length: 0 };
        editor.insertEmbed(range.index, 'image', imageUrl);
        
        // 커서를 이미지 다음 위치로 이동
        editor.setSelection(range.index + 1);
      }

      toast({
        title: "이미지가 삽입되었습니다",
        status: "success",
        duration: 2000,
      });
    };
    reader.readAsDataURL(file);
  };

  // 파일 입력을 통한 이미지 업로드
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    insertImage(file);
    event.target.value = '';
  };

  // 드래그앤드롭 이벤트 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast({
        title: "이미지 파일을 드래그해주세요",
        status: "warning",
        duration: 2000,
      });
      return;
    }
    
    // 첫 번째 이미지만 삽입
    insertImage(imageFiles[0]);
  };

  // 안전한 이미지 이벤트 핸들링
  useEffect(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    let selectedImage: HTMLImageElement | null = null;
    let isResizing = false;
    let startX = 0;
    let startY = 0;
    let startWidth = 0;

    // 이미지 클릭으로 선택
    const handleImageClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();
        
        // 다른 이미지 선택 해제
        const allImages = editor.container.querySelectorAll('img');
        allImages.forEach(img => img.classList.remove('selected'));
        
        // 현재 이미지 선택
        target.classList.add('selected');
        selectedImage = target as HTMLImageElement;
        
        toast({
          title: "이미지 선택됨",
          description: "더블클릭하면 크기를 조절할 수 있습니다",
          status: "info",
          duration: 2000,
        });
      }
    };

    // 이미지 더블클릭으로 크기 조절 모드
    const handleImageDoubleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG') {
        e.preventDefault();
        e.stopPropagation();
        
        if (!isResizing) {
          isResizing = true;
          startX = (e as MouseEvent).clientX;
          startWidth = target.offsetWidth;
          selectedImage = target as HTMLImageElement;
          
          toast({
            title: "크기 조절 모드",
            description: "마우스를 좌우로 움직여서 크기를 조절하세요. 클릭하면 완료됩니다.",
            status: "info",
            duration: 3000,
          });
        }
      }
    };

    // 마우스 이동으로 크기 조절
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing && selectedImage) {
        e.preventDefault();
        const deltaX = e.clientX - startX;
        const newWidth = Math.max(100, Math.min(800, startWidth + deltaX));
        selectedImage.style.width = `${newWidth}px`;
        selectedImage.style.height = 'auto';
      }
    };

    // 클릭으로 크기 조절 완료
    const handleClick = (e: MouseEvent) => {
      if (isResizing) {
        e.preventDefault();
        isResizing = false;
        toast({
          title: "크기 조절 완료",
          status: "success",
          duration: 1500,
        });
      }
    };

    // 에디터 다른 곳 클릭시 선택 해제
    const handleEditorClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'IMG') {
        const allImages = editor.container.querySelectorAll('img');
        allImages.forEach(img => img.classList.remove('selected'));
        selectedImage = null;
        if (isResizing) {
          isResizing = false;
        }
      }
    };

    // 이미지 드래그 가능하게 설정
    const setupImageDragging = () => {
      try {
        const images = editor.container.querySelectorAll('img');
        images.forEach((img) => {
          const imageElement = img as HTMLImageElement;
          imageElement.draggable = true;
          imageElement.style.cursor = 'pointer';
        });
      } catch (error) {
        // 에러 무시
      }
    };

    // 에디터 변경 감지 (안전하게)
    const handleTextChange = () => {
      setTimeout(() => {
        setupImageDragging();
      }, 100);
    };

    // 이벤트 리스너 등록
    try {
      editor.container.addEventListener('click', handleImageClick, { passive: false });
      editor.container.addEventListener('dblclick', handleImageDoubleClick, { passive: false });
      editor.container.addEventListener('click', handleEditorClick, { passive: true });
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('click', handleClick, { passive: false });

      // 에디터 변경 감지
      editor.on('text-change', handleTextChange);
      
      // 초기 설정
      setupImageDragging();
    } catch (error) {
      console.warn('이미지 이벤트 설정 중 오류:', error);
    }

    return () => {
      try {
        editor.container.removeEventListener('click', handleImageClick);
        editor.container.removeEventListener('dblclick', handleImageDoubleClick);
        editor.container.removeEventListener('click', handleEditorClick);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleClick);
        editor.off('text-change', handleTextChange);
      } catch (error) {
        // 정리 중 오류 무시
      }
    };
  }, [toast]);

  return (
    <VStack spacing={3} align="stretch" w="100%">
      {/* 스타일 주입 */}
      <style dangerouslySetInnerHTML={{ __html: customQuillStyles }} />
      
      {/* 커스텀 툴바 */}
      <Box
        p={4}
        bg={colorMode === 'dark' ? '#2c2c35' : '#f8f9fa'}
        borderRadius="md"
        border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
      >
        <VStack spacing={3}>
          {/* 첫 번째 줄: 기본 서식 */}
          <Flex wrap="wrap" gap={2} w="100%">
            <ButtonGroup size="sm" isAttached variant="outline">
              <Tooltip label="굵게 (Ctrl+B)">
                <IconButton
                  aria-label="굵게"
                  onClick={() => applyFormat('bold', true)}
                >
                  <Bold size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip label="기울임 (Ctrl+I)">
                <IconButton
                  aria-label="기울임"
                  onClick={() => applyFormat('italic', true)}
                >
                  <Italic size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip label="밑줄">
                <IconButton
                  aria-label="밑줄"
                  onClick={() => applyFormat('underline', true)}
                >
                  <Underline size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip label="취소선">
                <IconButton
                  aria-label="취소선"
                  onClick={() => applyFormat('strike', true)}
                >
                  <Strikethrough size={16} />
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            <Divider orientation="vertical" h="32px" />

            <ButtonGroup size="sm" variant="outline">
              <Tooltip label="제목 1">
                <Button onClick={() => applyBlockFormat('header', 1)}>H1</Button>
              </Tooltip>
              <Tooltip label="제목 2">
                <Button onClick={() => applyBlockFormat('header', 2)}>H2</Button>
              </Tooltip>
              <Tooltip label="제목 3">
                <Button onClick={() => applyBlockFormat('header', 3)}>H3</Button>
              </Tooltip>
            </ButtonGroup>

            <Divider orientation="vertical" h="32px" />

            <ButtonGroup size="sm" isAttached variant="outline">
              <Tooltip label="인용문">
                <IconButton
                  aria-label="인용문"
                  onClick={() => applyBlockFormat('blockquote', true)}
                >
                  <Quote size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip label="목록">
                <IconButton
                  aria-label="목록"
                  onClick={() => applyBlockFormat('list', 'bullet')}
                >
                  <List size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip label="번호 목록">
                <IconButton
                  aria-label="번호 목록"
                  onClick={() => applyBlockFormat('list', 'ordered')}
                >
                  <ListOrdered size={16} />
                </IconButton>
              </Tooltip>
            </ButtonGroup>

            <Divider orientation="vertical" h="32px" />

            <ButtonGroup size="sm" variant="outline">
              <Tooltip label="글자 색상">
                <IconButton 
                  aria-label="글자 색상" 
                  onClick={onColorOpen}
                  colorScheme="purple"
                >
                  <Palette size={16} />
                </IconButton>
              </Tooltip>
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
                  <Image size={16} />
                </IconButton>
              </Tooltip>
            </ButtonGroup>
          </Flex>

          {/* 두 번째 줄: 형광펜 */}
          <Flex wrap="wrap" gap={2} w="100%">
            <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} alignSelf="center">
              형광펜:
            </Text>
            <ButtonGroup size="sm" variant="outline">
              <Tooltip label="노란색 형광펜">
                <Button
                  onClick={() => applyHighlight('yellow')}
                  bg="yellow.200"
                  color="black"
                  _hover={{ bg: "yellow.300" }}
                >
                  노랑
                </Button>
              </Tooltip>
              <Tooltip label="초록색 형광펜">
                <Button
                  onClick={() => applyHighlight('green')}
                  bg="green.200"
                  color="black"
                  _hover={{ bg: "green.300" }}
                >
                  초록
                </Button>
              </Tooltip>
              <Tooltip label="파란색 형광펜">
                <Button
                  onClick={() => applyHighlight('blue')}
                  bg="blue.200"
                  color="black"
                  _hover={{ bg: "blue.300" }}
                >
                  파랑
                </Button>
              </Tooltip>
              <Tooltip label="분홍색 형광펜">
                <Button
                  onClick={() => applyHighlight('pink')}
                  bg="pink.200"
                  color="black"
                  _hover={{ bg: "pink.300" }}
                >
                  분홍
                </Button>
              </Tooltip>
              <Tooltip label="보라색 형광펜">
                <Button
                  onClick={() => applyHighlight('purple')}
                  bg="purple.200"
                  color="black"
                  _hover={{ bg: "purple.300" }}
                >
                  보라
                </Button>
              </Tooltip>
            </ButtonGroup>
          </Flex>
        </VStack>
      </Box>

      {/* WYSIWYG 에디터 */}
      <Box
        border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
        borderRadius="md"
        bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
        _focusWithin={{
          borderColor: 'brand.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)'
        }}
        minH={minHeight}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        position="relative"
        w="100%"
        maxW="none"
      >
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
          style={{
            height: '100%',
            width: '100%',
            color: colorMode === 'dark' ? '#e4e4e5' : '#2c2c35',
          }}
        />
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

      {/* 개선된 글자 색상 선택 모달 */}
      <Modal isOpen={isColorOpen} onClose={onColorClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>글자 색상 선택</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={6}>
              <Text fontSize="sm" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'} textAlign="center">
                텍스트를 선택한 후 원하는 색상을 클릭하세요
              </Text>
              
              {/* 자주 사용하는 색상 */}
              <VStack spacing={3} w="100%">
                <Text fontSize="md" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  자주 사용하는 색상
                </Text>
                <Flex wrap="wrap" gap={3} justify="center">
                  {[
                    { name: '기본색', color: 'inherit', bg: colorMode === 'dark' ? '#e4e4e5' : '#2c2c35' },
                    { name: '강조 빨강', color: '#E53E3E', bg: '#E53E3E' },
                    { name: '강조 파랑', color: '#3182CE', bg: '#3182CE' },
                    { name: '강조 보라', color: '#8B5CF6', bg: '#8B5CF6' },
                    { name: '강조 초록', color: '#38A169', bg: '#38A169' },
                    { name: '강조 주황', color: '#DD6B20', bg: '#DD6B20' }
                  ].map((colorItem) => (
                    <Button
                      key={colorItem.color}
                      size="md"
                      bg={colorItem.bg}
                      color="white"
                      _hover={{ 
                        transform: 'scale(1.05)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
                      }}
                      onClick={() => applyTextColor(colorItem.color)}
                      minW="80px"
                      borderRadius="lg"
                      transition="all 0.2s"
                    >
                      {colorItem.name}
                    </Button>
                  ))}
                </Flex>
              </VStack>
              
              {/* 기본 색상 팔레트 */}
              <VStack spacing={3} w="100%">
                <Text fontSize="md" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  기본 색상
                </Text>
                <Flex wrap="wrap" gap={2} justify="center">
                  {[
                    { name: '검정', color: '#1A202C' },
                    { name: '회색', color: '#718096' },
                    { name: '빨강', color: '#E53E3E' },
                    { name: '주황', color: '#DD6B20' },
                    { name: '노랑', color: '#D69E2E' },
                    { name: '초록', color: '#38A169' },
                    { name: '청록', color: '#319795' },
                    { name: '파랑', color: '#3182CE' },
                    { name: '보라', color: '#805AD5' },
                    { name: '분홍', color: '#D53F8C' }
                  ].map((colorItem) => (
                    <Tooltip key={colorItem.color} label={colorItem.name} placement="top">
                      <Box
                        as="button"
                        w="32px"
                        h="32px"
                        bg={colorItem.color}
                        borderRadius="md"
                        cursor="pointer"
                        border="2px solid transparent"
                        _hover={{ 
                          borderColor: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          transform: 'scale(1.1)'
                        }}
                        transition="all 0.2s"
                        onClick={() => applyTextColor(colorItem.color)}
                      />
                    </Tooltip>
                  ))}
                </Flex>
              </VStack>
              
              {/* 연한 색상 팔레트 */}
              <VStack spacing={3} w="100%">
                <Text fontSize="md" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                  연한 색상
                </Text>
                <Flex wrap="wrap" gap={2} justify="center">
                  {[
                    { name: '연한 회색', color: '#A0AEC0' },
                    { name: '연한 빨강', color: '#FC8181' },
                    { name: '연한 주황', color: '#F6AD55' },
                    { name: '연한 노랑', color: '#F6E05E' },
                    { name: '연한 초록', color: '#68D391' },
                    { name: '연한 청록', color: '#4FD1C7' },
                    { name: '연한 파랑', color: '#63B3ED' },
                    { name: '연한 보라', color: '#B794F6' },
                    { name: '연한 분홍', color: '#F687B3' },
                    { name: '연한 갈색', color: '#D69E2E' }
                  ].map((colorItem) => (
                    <Tooltip key={colorItem.color} label={colorItem.name} placement="top">
                      <Box
                        as="button"
                        w="32px"
                        h="32px"
                        bg={colorItem.color}
                        borderRadius="md"
                        cursor="pointer"
                        border="2px solid transparent"
                        _hover={{ 
                          borderColor: 'white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          transform: 'scale(1.1)'
                        }}
                        transition="all 0.2s"
                        onClick={() => applyTextColor(colorItem.color)}
                      />
                    </Tooltip>
                  ))}
                </Flex>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              onClick={onColorClose}
              mr={3}
            >
              닫기
            </Button>
            <Button 
              onClick={() => applyTextColor('inherit')} 
              colorScheme="gray"
            >
              기본색으로 복원
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default WYSIWYGEditor;