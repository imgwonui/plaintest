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
import { compressImage, isImageFile, needsCompression } from '../utils/imageCompressor';

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
    position: relative !important;
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
    position: absolute;
    pointer-events: none;
    top: 0;
    left: 0;
    z-index: 1;
    padding: 16px;
    margin: 0;
    transform: none;
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

  /* 다크모드에서 형광펜 텍스트 색상 조정 */
  [data-theme='dark'] .ql-editor span[style*="background-color: rgb(254, 240, 138)"],
  [data-theme='dark'] .ql-editor span[style*="background-color: #fef08a"] {
    color: #1f2937 !important; /* 노란색 배경에는 어두운 텍스트가 더 잘 보임 */
  }
  
  [data-theme='dark'] .ql-editor span[style*="background-color: rgb(187, 247, 208)"],
  [data-theme='dark'] .ql-editor span[style*="background-color: #bbf7d0"] {
    color: #1f2937 !important; /* 초록색 배경에는 어두운 텍스트가 더 잘 보임 */
  }
  
  [data-theme='dark'] .ql-editor span[style*="background-color: rgb(191, 219, 254)"],
  [data-theme='dark'] .ql-editor span[style*="background-color: #bfdbfe"] {
    color: #1f2937 !important; /* 파란색 배경에는 어두운 텍스트가 더 잘 보임 */
  }
  
  [data-theme='dark'] .ql-editor span[style*="background-color: rgb(252, 231, 243)"],
  [data-theme='dark'] .ql-editor span[style*="background-color: #fce7f3"] {
    color: #1f2937 !important; /* 핑크색 배경에는 어두운 텍스트가 더 잘 보임 */
  }
  
  [data-theme='dark'] .ql-editor span[style*="background-color: rgb(233, 213, 255)"],
  [data-theme='dark'] .ql-editor span[style*="background-color: #e9d5ff"] {
    color: #1f2937 !important; /* 보라색 배경에는 어두운 텍스트가 더 잘 보임 */
  }

  /* Sticky 툴바 지원을 위한 스타일 */
  .wysiwyg-editor-container {
    position: relative;
    overflow: visible;
  }

  .wysiwyg-sticky-toolbar {
    position: sticky !important;
    top: 10px !important;
    z-index: 1000 !important;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    transition: all 0.2s ease;
    border-radius: 8px;
    margin-bottom: 8px;
    width: 100%;
    box-sizing: border-box;
  }

  [data-theme="dark"] .wysiwyg-sticky-toolbar {
    background: rgba(44, 44, 53, 0.95);
  }

  .wysiwyg-sticky-toolbar.scrolled {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    background: rgba(255, 255, 255, 0.98);
    transform: translateY(0);
  }

  [data-theme="dark"] .wysiwyg-sticky-toolbar.scrolled {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    background: rgba(44, 44, 53, 0.98);
  }

  /* 모바일에서 툴바 최적화 */
  @media (max-width: 768px) {
    .wysiwyg-sticky-toolbar {
      position: sticky !important;
      top: 5px !important;
      margin: 0 -16px 8px -16px;
      border-radius: 0;
      padding-left: 16px;
      padding-right: 16px;
    }
  }

  /* 데스크톱에서 더 나은 가시성 보장 */
  @media (min-width: 769px) {
    .wysiwyg-sticky-toolbar {
      position: sticky !important;
      top: 15px !important;
      z-index: 1000 !important;
    }
  }

  /* 긴 문서에서 에디터 성능 최적화 */
  .ql-editor {
    will-change: scroll-position;
    contain: layout style paint;
  }

  /* 유튜브 임베드 스타일 */
  .youtube-embed-container {
    position: relative;
    padding-bottom: 56.25%;
    height: 0;
    margin: 16px 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .youtube-embed-container iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
  }

  /* 다크모드에서 유튜브 임베드 */
  [data-theme="dark"] .youtube-embed-container {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  /* 링크 스타일 개선 */
  .ql-editor a {
    color: #7A5AF8;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: all 0.2s ease;
  }

  .ql-editor a:hover {
    border-bottom-color: #7A5AF8;
    color: #5A3CD8;
  }

  [data-theme="dark"] .ql-editor a {
    color: #A78BFA;
  }

  [data-theme="dark"] .ql-editor a:hover {
    border-bottom-color: #A78BFA;
    color: #C4B5FD;
  }

  /* Quill 클립보드 div 숨김/제거 */
  .ql-clipboard {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    position: absolute !important;
    left: -9999px !important;
    top: -9999px !important;
    width: 0 !important;
    height: 0 !important;
    pointer-events: none !important;
  }

  /* 링크 임베드 카드 스타일 */
  .link-embed-container {
    transition: all 0.2s ease;
    cursor: pointer !important;
    border-radius: 8px;
    overflow: hidden;
  }

  .link-embed-container:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(122, 90, 248, 0.15);
    border-color: #7A5AF8 !important;
  }

  [data-theme="dark"] .link-embed-container:hover {
    box-shadow: 0 4px 12px rgba(167, 139, 250, 0.15);
    border-color: #A78BFA !important;
  }

  /* 링크 카드 내부 텍스트 선택 방지 */
  .link-embed-container * {
    user-select: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  /* 링크 카드가 에디터에서 선택되지 않도록 */
  .link-embed-container {
    position: relative;
    z-index: 1;
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
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isToolbarScrolled, setIsToolbarScrolled] = useState(false);
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

  // 유튜브 링크 감지 함수
  const isYouTubeLink = (url: string): boolean => {
    if (!url) return false;
    const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/i;
    return youtubeRegex.test(url);
  };

  // 유튜브 비디오 ID 추출 함수 (개선된 버전)
  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      // youtu.be/VIDEO_ID
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      // youtube.com/watch?v=VIDEO_ID
      /(?:youtube\.com.*[?&]v=)([a-zA-Z0-9_-]{11})/,
      // youtube.com/embed/VIDEO_ID
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      // youtube.com/v/VIDEO_ID
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };


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

  // 형광펜 적용/토글
  const applyHighlight = (color: string) => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection();
      if (range && range.length > 0) {
        // 현재 선택된 영역의 서식 확인
        const format = editor.getFormat(range.index, range.length);
        const currentBackground = format.background;
        
        const colorMap: Record<string, string> = {
          yellow: '#fef08a',
          green: '#bbf7d0',
          blue: '#bfdbfe',
          pink: '#fce7f3',
          purple: '#e9d5ff'
        };
        
        const targetColor = colorMap[color];
        
        // 이미 같은 색상의 형광펜이 적용되어 있는지 확인
        if (currentBackground === targetColor) {
          // 형광펜 제거 (토글)
          editor.formatText(range.index, range.length, 'background', false);
          toast({
            title: "형광펜을 제거했습니다",
            status: "success",
            duration: 1500,
          });
        } else {
          // 형광펜 적용
          editor.formatText(range.index, range.length, 'background', targetColor);
          toast({
            title: "형광펜을 적용했습니다",
            status: "success",
            duration: 1500,
          });
        }
        
        focusEditor();
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


  // 유튜브 임베드 처리 (개선된 버전)
  const handleYouTubeEmbed = (url: string, insertIndex: number) => {
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      toast({
        title: "유튜브 동영상 ID를 찾을 수 없습니다",
        description: "올바른 유튜브 URL인지 확인해주세요",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      
      try {
        // 유튜브 임베드를 위한 Quill Delta 직접 생성
        const embedDelta = {
          ops: [
            { retain: insertIndex },
            { insert: '\n' },
            { 
              insert: { 
                'video': {
                  url: `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0`,
                  videoId: videoId
                }
              }
            },
            { insert: '\n\n' }
          ]
        };

        // 더 안전한 방법: HTML 문자열을 직접 DOM에 삽입
        const embedHtml = `
          <div class="youtube-embed-container" contenteditable="false" style="position: relative; padding-bottom: 56.25%; height: 0; margin: 16px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0" 
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              loading="lazy"
              frameborder="0">
            </iframe>
          </div>
        `;
        
        // Quill 에디터에 직접 HTML 삽입
        const range = editor.getSelection() || { index: insertIndex, length: 0 };
        editor.insertText(range.index, '\n\n', 'user');
        
        // DOM 직접 조작으로 임베드 삽입
        setTimeout(() => {
          const editorElement = editor.root;
          const paragraphs = editorElement.querySelectorAll('p');
          const targetP = paragraphs[Math.floor(range.index / 50)] || paragraphs[paragraphs.length - 1];
          
          if (targetP) {
            const embedContainer = document.createElement('div');
            embedContainer.innerHTML = embedHtml;
            targetP.parentNode?.insertBefore(embedContainer.firstElementChild!, targetP.nextSibling);
          }
        }, 100);
        
        // 커서를 임베드 뒤로 이동
        setTimeout(() => {
          const newLength = editor.getLength();
          editor.setSelection(newLength, 0);
        }, 100);
        
      } catch (error) {
        console.error('유튜브 임베드 실패:', error);
        toast({
          title: "유튜브 임베드 실패",
          description: "동영상 임베드 중 오류가 발생했습니다",
          status: "error",
          duration: 3000,
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

  // 일반 링크 임베드 처리 함수
  const handleGenericLinkEmbed = async (url: string, displayText: string, insertIndex: number) => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      
      try {
        // 링크 프리뷰 카드 HTML 생성
        const linkCardHtml = `
          <div class="link-embed-container" contenteditable="false" style="
            border: 2px solid ${colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'};
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            background-color: ${colorMode === 'dark' ? '#3c3c47' : '#f8f9fa'};
            transition: all 0.2s ease;
            cursor: pointer;
          " onclick="window.open('${url}', '_blank', 'noopener,noreferrer');">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <div style="
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #7A5AF8, #A78BFA);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
                font-size: 14px;
              ">
                🔗
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="
                  font-weight: 600;
                  color: ${colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'};
                  font-size: 16px;
                  line-height: 1.3;
                  margin-bottom: 4px;
                  word-break: break-word;
                ">
                  ${displayText}
                </div>
                <div style="
                  color: ${colorMode === 'dark' ? '#9e9ea4' : '#626269'};
                  font-size: 14px;
                  word-break: break-all;
                ">
                  ${url}
                </div>
              </div>
            </div>
            <div style="
              color: ${colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'};
              font-size: 12px;
              text-align: right;
            ">
              클릭하여 링크 열기 →
            </div>
          </div>
        `;
        
        // 현재 위치에 링크 카드 삽입
        const range = editor.getSelection() || { index: insertIndex, length: 0 };
        editor.insertText(range.index, '\n\n', 'user');
        
        // DOM 직접 조작으로 링크 카드 삽입
        setTimeout(() => {
          const editorElement = editor.root;
          const paragraphs = editorElement.querySelectorAll('p');
          const targetP = paragraphs[Math.floor(range.index / 50)] || paragraphs[paragraphs.length - 1];
          
          if (targetP) {
            const cardContainer = document.createElement('div');
            cardContainer.innerHTML = linkCardHtml;
            targetP.parentNode?.insertBefore(cardContainer.firstElementChild!, targetP.nextSibling);
          }
        }, 100);
        
        // 커서를 링크 카드 뒤로 이동
        setTimeout(() => {
          const newLength = editor.getLength();
          editor.setSelection(newLength, 0);
        }, 150);
        
      } catch (error) {
        console.error('일반 링크 임베드 실패:', error);
        toast({
          title: "링크 임베드 실패",
          description: "링크 카드 생성 중 오류가 발생했습니다",
          status: "error",
          duration: 3000,
        });
      }
    }
  };

  // 링크 삽입 (개선된 버전)
  const handleLinkInsert = async () => {
    if (!linkUrl.trim()) {
      toast({
        title: "URL을 입력해주세요",
        status: "warning",
        duration: 2000,
      });
      return;
    }

    // URL 형식 검증 및 정규화
    let validUrl = linkUrl.trim();
    try {
      // 프로토콜이 없는 경우 추가
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = 'https://' + validUrl;
      }
      
      // URL 유효성 검사
      new URL(validUrl);
    } catch (error) {
      toast({
        title: "올바른 URL 형식을 입력해주세요",
        description: "예: https://example.com",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection();
      
      if (range) {
        const displayText = linkText.trim() || validUrl;
        
        // 현재 위치에 링크 텍스트 삽입
        editor.insertText(range.index, displayText);
        editor.formatText(range.index, displayText.length, 'link', validUrl);
        
        // 커서를 링크 뒤로 이동
        const newPosition = range.index + displayText.length;
        editor.setSelection(newPosition, 0);
        
        // 유튜브 링크 감지 및 자동 임베드
        if (isYouTubeLink(validUrl)) {
          // 약간의 지연 후 유튜브 임베드 처리
          setTimeout(() => {
            handleYouTubeEmbed(validUrl, newPosition);
          }, 200);
          
          toast({
            title: "유튜브 동영상이 임베드되었습니다!",
            description: "링크 텍스트와 함께 동영상도 표시됩니다",
            status: "success",
            duration: 3000,
          });
        } else {
          // 일반 링크의 경우 링크 카드 임베드 처리
          setTimeout(() => {
            handleGenericLinkEmbed(validUrl, displayText, newPosition);
          }, 200);
          
          toast({
            title: "링크가 임베드되었습니다!",
            description: "클릭 가능한 링크 카드가 추가되었습니다",
            status: "success",
            duration: 3000,
          });
        }
      }
    }
    
    setLinkText('');
    setLinkUrl('');
    onLinkClose();
    focusEditor();
  };

  // 이미지 업로드 공통 함수 (압축 포함)
  const insertImage = async (file: File) => {
    // 이미지 파일 검증
    if (!isImageFile(file)) {
      toast({
        title: "이미지 파일만 업로드할 수 있습니다",
        status: "error",
        duration: 3000,
      });
      return;
    }

    try {
      let finalFile = file;

      // 5MB 이상인 경우 자동 압축 (사용자에게 알리지 않음)
      if (needsCompression(file, 5)) {
        const compressionResult = await compressImage(file, {
          maxSizeMB: 5,
          maxWidth: 1200, // 에디터용은 좀 더 작게
          maxHeight: 800,
          quality: 0.85
        });

        finalFile = compressionResult.compressedFile;
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

        // 이미지 삽입 완료 (조용히)
      };
      reader.readAsDataURL(finalFile);

    } catch (error) {
      console.error('이미지 처리 실패:', error);
      toast({
        title: "이미지 처리 실패",
        description: "이미지를 처리하는 중 오류가 발생했습니다.",
        status: "error",
        duration: 3000,
      });
    }
  };

  // 파일 입력을 통한 이미지 업로드
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await insertImage(file);
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => isImageFile(file));
    
    if (imageFiles.length === 0) {
      toast({
        title: "이미지 파일을 드래그해주세요",
        status: "warning",
        duration: 2000,
      });
      return;
    }
    
    // 첫 번째 이미지만 삽입
    await insertImage(imageFiles[0]);
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

  // 스크롤 감지 및 툴바 스타일 업데이트
  useEffect(() => {
    const handleScroll = () => {
      if (toolbarRef.current) {
        const rect = toolbarRef.current.getBoundingClientRect();
        const isStuck = rect.top <= 0;
        setIsToolbarScrolled(isStuck);
      }
    };

    const observeToolbar = () => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          // 툴바가 상단에서 10px 이상 벗어나면 스크롤된 상태로 간주
          const isStuck = entry.boundingClientRect.top <= 15;
          setIsToolbarScrolled(isStuck);
        },
        { 
          threshold: [0, 0.1, 0.9, 1], 
          rootMargin: '-15px 0px 0px 0px' 
        }
      );

      if (toolbarRef.current) {
        observer.observe(toolbarRef.current);
      }

      return () => {
        observer.disconnect();
      };
    };

    // Intersection Observer 사용 (더 정확함)
    const cleanup = observeToolbar();

    // 스크롤 이벤트도 백업으로 사용
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      cleanup();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <VStack spacing={3} align="stretch" w="100%" className="wysiwyg-editor-container">
      {/* 스타일 주입 */}
      <style dangerouslySetInnerHTML={{ __html: customQuillStyles }} />
      
      {/* 커스텀 툴바 */}
      <Box
        ref={toolbarRef}
        p={4}
        bg={isToolbarScrolled 
          ? (colorMode === 'dark' ? 'rgba(44, 44, 53, 0.98)' : 'rgba(248, 249, 250, 0.98)')
          : (colorMode === 'dark' ? '#2c2c35' : '#f8f9fa')
        }
        borderRadius="md"
        border={colorMode === 'dark' ? '1px solid #4d4d59' : '1px solid #e4e4e5'}
        position="sticky"
        top={{ base: "5px", md: "15px" }}
        zIndex={1000}
        backdropFilter="blur(10px)"
        boxShadow={isToolbarScrolled 
          ? (colorMode === 'dark' ? '0 2px 10px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.1)')
          : 'none'
        }
        transition="all 0.2s ease"
        className={`wysiwyg-sticky-toolbar ${isToolbarScrolled ? 'scrolled' : ''}`}
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
              <Box p={3} bg={colorMode === 'dark' ? '#2c2c35' : '#f0f4f8'} borderRadius="md" w="100%">
                <VStack spacing={2} align="start">
                  <Text fontSize="sm" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                    🎯 링크 임베드 기능
                  </Text>
                  <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                    • 유튜브 링크: 동영상 플레이어가 자동 임베드됩니다
                  </Text>
                  <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                    • 일반 링크: 클릭 가능한 예쁜 링크 카드가 생성됩니다
                  </Text>
                  <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                    • 링크 텍스트를 비우면 URL이 제목으로 사용됩니다
                  </Text>
                </VStack>
              </Box>
              <Input
                placeholder="링크 텍스트 (선택사항)"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
              <Input
                placeholder="URL (예: https://www.youtube.com/watch?v=... 또는 https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
              {linkUrl && (
                <Box p={3} bg={colorMode === 'dark' ? '#3c3c47' : '#f7fafc'} borderRadius="md" w="100%" border="1px solid" borderColor={isYouTubeLink(linkUrl) ? "red.300" : "purple.300"}>
                  <HStack spacing={3}>
                    <Box fontSize="lg">
                      {isYouTubeLink(linkUrl) ? '🎥' : '🔗'}
                    </Box>
                    <VStack spacing={1} align="start" flex="1">
                      <Text fontSize="sm" fontWeight="600" color={colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'}>
                        {isYouTubeLink(linkUrl) 
                          ? '유튜브 동영상이 임베드됩니다!' 
                          : '링크 카드가 생성됩니다!'
                        }
                      </Text>
                      <Text fontSize="xs" color={colorMode === 'dark' ? '#9e9ea4' : '#626269'}>
                        {isYouTubeLink(linkUrl)
                          ? '동영상 플레이어와 링크 텍스트가 모두 표시됩니다'
                          : '클릭 가능한 예쁜 카드 형태로 링크가 표시됩니다'
                        }
                      </Text>
                      <Text fontSize="xs" color={colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'} wordBreak="break-all">
                        📎 {linkUrl}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onLinkClose}>
              취소
            </Button>
            <Button 
              onClick={handleLinkInsert} 
              colorScheme={isYouTubeLink(linkUrl) ? 'red' : 'purple'}
              isDisabled={!linkUrl.trim()}
            >
              {isYouTubeLink(linkUrl) ? '🎥 동영상 임베드' : '🔗 링크 카드 생성'}
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