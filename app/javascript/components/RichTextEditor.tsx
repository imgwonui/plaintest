import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  HStack,
  Button,
  Divider,
  useColorMode,
  Tooltip,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  SimpleGrid,
  Textarea,
  useToast,
  Image,
  VStack,
  Text,
} from '@chakra-ui/react';
import { LinkIcon, AttachmentIcon, DeleteIcon } from '@chakra-ui/icons';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  markdown: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "내용을 입력해주세요...",
  minHeight = "200px"
}) => {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const highlightColors = [
    { name: '기본 형광펜', code: '==' },
    { name: '노란색', code: '=노란=' },
    { name: '파란색', code: '=파란=' },
    { name: '분홍색', code: '=분홍=' },
    { name: '보라색', code: '=보라=' },
    { name: '주황색', code: '=주황=' },
  ];

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const insertHighlight = (code: string) => insertMarkdown(code, code);
  const insertBold = () => insertMarkdown('**', '**');
  const insertItalic = () => insertMarkdown('*', '*');
  const insertUnderline = () => insertMarkdown('<u>', '</u>');
  const insertStrike = () => insertMarkdown('~~', '~~');
  const insertQuote = () => insertMarkdown('\n> ', '');
  const insertCode = () => insertMarkdown('```\n', '\n```');
  const insertLink = () => insertMarkdown('[', '](URL)');
  const insertImage = () => fileInputRef.current?.click();
  
  // 이미지 업로드 처리
  const handleImageUpload = useCallback((files: FileList) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "이미지 파일만 업로드 가능합니다",
          status: "error",
          duration: 3000,
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "파일 크기는 5MB 이하여야 합니다",
          status: "error",
          duration: 3000,
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageId = Math.random().toString(36).substr(2, 9);
        const imageUrl = e.target?.result as string;
        const imageMarkdown = `![${file.name}](${imageId} "medium")`;  // 기본 크기 medium
        
        const newImage: UploadedImage = {
          id: imageId,
          file,
          url: imageUrl,
          markdown: imageMarkdown
        };
        
        setImages(prev => [...prev, newImage]);
        
        // 현재 커서 위치에 이미지 마크다운 삽입
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newValue = value.substring(0, start) + '\n' + imageMarkdown + '\n' + value.substring(end);
          onChange(newValue);
          
          setTimeout(() => {
            textarea.focus();
            const newPos = start + imageMarkdown.length + 2;
            textarea.setSelectionRange(newPos, newPos);
          }, 0);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [value, onChange, toast]);
  
  // 드래그 앤 드랍 이벤트
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files);
    }
  }, [handleImageUpload]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleImageUpload(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleImageUpload]);
  
  const removeImage = useCallback((imageId: string) => {
    setImages(prev => prev.filter(img => {
      if (img.id === imageId) {
        URL.revokeObjectURL(img.url);
        // 텍스트에서 이미지 마크다운 제거
        const updatedValue = value.replace(new RegExp(img.markdown.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
        onChange(updatedValue);
        return false;
      }
      return true;
    }));
  }, [value, onChange]);
  const insertList = () => insertMarkdown('\n- ', '');
  const insertOrderedList = () => insertMarkdown('\n1. ', '');
  const insertH1 = () => insertMarkdown('\n# ', '');
  const insertH2 = () => insertMarkdown('\n## ', '');
  const insertH3 = () => insertMarkdown('\n### ', '');

  const renderPreview = () => {
    let html = value
      .replace(/==(.*?)==/g, '<span style="background: rgba(63, 213, 153, 0.21); padding: 2px 4px; border-radius: 3px;">$1</span>')
      .replace(/=노란=(.*?)=노란=/g, '<span style="background: rgba(255, 235, 59, 0.3); padding: 2px 4px; border-radius: 3px;">$1</span>')
      .replace(/=파란=(.*?)=파란=/g, '<span style="background: rgba(33, 150, 243, 0.2); padding: 2px 4px; border-radius: 3px;">$1</span>')
      .replace(/=분홍=(.*?)=분홍=/g, '<span style="background: rgba(233, 30, 99, 0.2); padding: 2px 4px; border-radius: 3px;">$1</span>')
      .replace(/=보라=(.*?)=보라=/g, '<span style="background: rgba(156, 39, 176, 0.2); padding: 2px 4px; border-radius: 3px;">$1</span>')
      .replace(/=주황=(.*?)=주황=/g, '<span style="background: rgba(255, 152, 0, 0.25); padding: 2px 4px; border-radius: 3px;">$1</span>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      .replace(/```\n(.*?)\n```/gs, '<pre style="background: rgba(128,128,128,0.1); padding: 12px; border-radius: 4px;"><code>$1</code></pre>')
      .replace(/^> (.*)$/gm, '<blockquote style="border-left: 4px solid #3182ce; padding-left: 16px; margin: 16px 0; font-style: italic;">$1</blockquote>')
      .replace(/^# (.*)$/gm, '<h1 style="font-size: 24px; font-weight: bold; margin: 24px 0 16px 0;">$1</h1>')
      .replace(/^## (.*)$/gm, '<h2 style="font-size: 20px; font-weight: bold; margin: 20px 0 12px 0;">$1</h2>')
      .replace(/^### (.*)$/gm, '<h3 style="font-size: 18px; font-weight: bold; margin: 16px 0 8px 0;">$1</h3>')
      .replace(/^\- (.*)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.*)$/gm, '<li>$2</li>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #3182ce; text-decoration: underline;">$1</a>')
      .replace(/\n/g, '<br>');
    
    // 이미지 마크다운을 실제 이미지로 대체 (크기 옵션 처리)
    images.forEach(img => {
      const regex = new RegExp(`!\\[([^\\]]*)\\]\\(${img.id}(?:\\s+"([^"]*)"|\\s+(\\w+))?\\)`, 'g');
      html = html.replace(regex, (match, alt, size1, size2) => {
        const size = size1 || size2 || 'medium';
        let width = '100%';
        let maxWidth = '100%';
        
        switch(size.toLowerCase()) {
          case 'small':
          case 's':
            maxWidth = '300px';
            break;
          case 'medium':
          case 'm':
            maxWidth = '500px';
            break;
          case 'large':
          case 'l':
            maxWidth = '800px';
            break;
          case 'full':
          case 'f':
            maxWidth = '100%';
            break;
          default:
            maxWidth = '500px';
        }
        
        return `<img src="${img.url}" alt="${alt}" style="width: 100%; max-width: ${maxWidth}; height: auto; margin: 16px auto; display: block; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />`;
      });
    });

    return html || '<span style="color: #999; font-style: italic;">미리보기가 여기에 표시됩니다...</span>';
  };

  const darkMode = colorMode === 'dark';

  return (
    <Box
      border="1px solid"
      borderColor={darkMode ? 'gray.600' : 'gray.200'}
      borderRadius="md"
      overflow="hidden"
      bg={darkMode ? 'gray.700' : 'white'}
    >
      {/* 툴바 */}
      <Box
        p={2}
        borderBottom="1px solid"
        borderColor={darkMode ? 'gray.600' : 'gray.200'}
        bg={darkMode ? 'gray.800' : 'gray.50'}
      >
        <HStack spacing={1} flexWrap="wrap">
          <Tooltip label="굵게 **텍스트**">
            <Button
              size="sm"
              variant="ghost"
              onClick={insertBold}
              fontWeight="bold"
              minW="32px"
            >
              B
            </Button>
          </Tooltip>

          <Tooltip label="기울임 *텍스트*">
            <Button
              size="sm"
              variant="ghost"
              onClick={insertItalic}
              fontStyle="italic"
              minW="32px"
            >
              I
            </Button>
          </Tooltip>

          <Tooltip label="밑줄">
            <Button
              size="sm"
              variant="ghost"
              onClick={insertUnderline}
              textDecoration="underline"
              minW="32px"
            >
              U
            </Button>
          </Tooltip>

          <Tooltip label="취소선 ~~텍스트~~">
            <Button size="sm" variant="ghost" onClick={insertStrike}>
              <del>S</del>
            </Button>
          </Tooltip>

          <Divider orientation="vertical" h="20px" />

          <Popover>
            <PopoverTrigger>
              <Button
                size="sm"
                variant="ghost"
                bg="rgba(63, 213, 153, 0.21)"
                color="black"
              >
                형광펜
              </Button>
            </PopoverTrigger>
            <PopoverContent w="200px">
              <PopoverBody p={2}>
                <SimpleGrid columns={2} spacing={2}>
                  {highlightColors.map((item, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="ghost"
                      fontSize="xs"
                      onClick={() => insertHighlight(item.code)}
                    >
                      {item.name}
                    </Button>
                  ))}
                </SimpleGrid>
              </PopoverBody>
            </PopoverContent>
          </Popover>

          <Divider orientation="vertical" h="20px" />

          <Tooltip label="불릿 리스트">
            <Button
              size="sm"
              variant="ghost"
              onClick={insertList}
              minW="32px"
            >
              •
            </Button>
          </Tooltip>

          <Tooltip label="번호 리스트">
            <Button
              size="sm"
              variant="ghost"
              onClick={insertOrderedList}
              minW="32px"
            >
              1.
            </Button>
          </Tooltip>

          <Tooltip label="인용구">
            <Button
              size="sm"
              variant="ghost"
              onClick={insertQuote}
              minW="32px"
            >
              "
            </Button>
          </Tooltip>

          <Tooltip label="코드">
            <Button
              size="sm"
              variant="ghost"
              onClick={insertCode}
              fontFamily="monospace"
              minW="32px"
            >
              {"</>"}  
            </Button>
          </Tooltip>

          <Tooltip label="링크">
            <IconButton
              aria-label="Link"
              icon={<LinkIcon />}
              size="sm"
              variant="ghost"
              onClick={insertLink}
            />
          </Tooltip>
          
          <Tooltip label="이미지 업로드">
            <IconButton
              aria-label="Image"
              icon={<AttachmentIcon />}
              size="sm"
              variant="ghost"
              onClick={insertImage}
            />
          </Tooltip>

          <Divider orientation="vertical" h="20px" />

          <Button size="sm" variant="ghost" onClick={insertH1}>H1</Button>
          <Button size="sm" variant="ghost" onClick={insertH2}>H2</Button>
          <Button size="sm" variant="ghost" onClick={insertH3}>H3</Button>
          
          <Divider orientation="vertical" h="20px" />
          
          <Popover>
            <PopoverTrigger>
              <Button size="sm" variant="ghost">
                이미지 크기
              </Button>
            </PopoverTrigger>
            <PopoverContent w="200px">
              <PopoverBody p={2}>
                <VStack spacing={2} align="stretch">
                  <Text fontSize="xs" fontWeight="600" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                    이미진 마크다운 예시:
                  </Text>
                  <VStack spacing={1} align="stretch" fontSize="xs" fontFamily="monospace">
                    <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>![alt](id "small") - 작은 크기</Text>
                    <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>![alt](id "medium") - 보통 크기</Text>
                    <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>![alt](id "large") - 큰 크기</Text>
                    <Text color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>![alt](id "full") - 전체 크기</Text>
                  </VStack>
                  <Text fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#7e7e87'}>
                    이미지 뒤의 따옴표 안에 크기를 지정하세요
                  </Text>
                </VStack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </HStack>
      </Box>

      {/* 입력 영역과 미리보기 */}
      <HStack align="stretch" spacing={0}>
        <Box flex="1" position="relative">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isDragOver ? "이미지를 놓아주세요!" : placeholder}
            minH={minHeight}
            border="none"
            bg={isDragOver ? (colorMode === 'dark' ? 'rgba(63, 213, 153, 0.1)' : 'rgba(63, 213, 153, 0.05)') : 'transparent'}
            resize="none"
            fontSize="sm"
            fontFamily="monospace"
            _focus={{ outline: 'none', boxShadow: 'none' }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            _placeholder={{
              color: isDragOver ? 'brand.500' : (colorMode === 'dark' ? '#7e7e87' : '#9e9ea4')
            }}
          />
          
          {isDragOver && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              border="2px dashed"
              borderColor="brand.500"
              borderRadius="md"
              bg={colorMode === 'dark' ? 'rgba(63, 213, 153, 0.05)' : 'rgba(63, 213, 153, 0.02)'}
              display="flex"
              alignItems="center"
              justifyContent="center"
              pointerEvents="none"
            >
              <VStack>
                <AttachmentIcon boxSize={8} color="brand.500" />
                <Text color="brand.500" fontWeight="500">이미지를 놓아주세요!</Text>
              </VStack>
            </Box>
          )}
        </Box>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {/* 업로드된 이미지 목록 */}
        {images.length > 0 && (
          <Box 
            flex="1" 
            p={4} 
            borderLeft="1px solid"
            borderColor={colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'}
            bg={colorMode === 'dark' ? '#2c2c35' : '#f8f9fa'}
          >
            <VStack spacing={3} align="stretch">
              <Text fontSize="sm" fontWeight="500" color={colorMode === 'dark' ? '#c3c3c6' : '#4d4d59'}>
                업로드된 이미지 ({images.length})
              </Text>
              <VStack spacing={2} maxH="300px" overflowY="auto">
                {images.map((image) => (
                  <HStack 
                    key={image.id} 
                    spacing={2}
                    p={2}
                    bg={colorMode === 'dark' ? '#3c3c47' : 'white'}
                    borderRadius="md"
                    border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
                    w="100%"
                  >
                    <Image
                      src={image.url}
                      alt={image.file.name}
                      boxSize="40px"
                      objectFit="cover"
                      borderRadius="md"
                    />
                    <VStack align="start" flex="1" spacing={0}>
                      <Text 
                        fontSize="xs" 
                        fontWeight="500"
                        color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}
                        noOfLines={1}
                      >
                        {image.file.name}
                      </Text>
                      <Text 
                        fontSize="xs" 
                        color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}
                      >
                        {(image.file.size / 1024 / 1024).toFixed(2)}MB
                      </Text>
                    </VStack>
                    <IconButton
                      aria-label="이미지 삭제"
                      icon={<DeleteIcon />}
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => removeImage(image.id)}
                    />
                  </HStack>
                ))}
              </VStack>
              <Text fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#7e7e87'} textAlign="center">
                드래그하여 놓거나 이미지 버튼을 클릭하여 이미지를 추가하세요
              </Text>
            </VStack>
          </Box>
        )}

        <Divider orientation="vertical" />

        <Box 
          flex="1" 
          p={4}
          minH={minHeight}
          overflow="auto"
          fontSize="sm"
          lineHeight="1.6"
          dangerouslySetInnerHTML={{ __html: renderPreview() }}
        />
      </HStack>
    </Box>
  );
};

export default RichTextEditor;