// Z-Index 레이어 관리 시스템
// UI 컴포넌트들의 레이어 순서를 체계적으로 관리

export const Z_INDEX_LAYERS = {
  // 기본 레이어 (1-99)
  BASE: 1,
  CONTENT: 10,
  
  // 내비게이션 레이어 (100-299)
  HEADER: 200,
  SIDEBAR: 250,
  
  // 고정 요소 레이어 (1000-1499) 
  STICKY_TOOLBAR: 1000,          // WYSIWYGEditor 툴바
  STICKY_HEADER: 1100,           // 고정 헤더
  
  // 드롭다운/팝오버 레이어 (1500-1999)
  DROPDOWN: 1500,                // CustomSelect, 일반 드롭다운
  POPOVER: 1600,                 // Chakra UI Popover
  TOOLTIP: 1700,                 // 툴팁
  
  // 모달 레이어 (2000-2999)
  MODAL_BACKDROP: 2000,          // 모달 배경
  MODAL_CONTENT: 2100,           // 모달 내용
  MODAL_NESTED: 2200,            // 중첩된 모달
  
  // 최상위 레이어 (3000+)
  TOAST: 3000,                   // 토스트 알림
  LOADING_OVERLAY: 3100,         // 전체 화면 로딩
  DEBUG_OVERLAY: 3200,           // 디버그 오버레이
} as const;

// 타입 안전성을 위한 타입 정의
export type ZIndexLayer = typeof Z_INDEX_LAYERS[keyof typeof Z_INDEX_LAYERS];

// 레이어 검증 함수
export const validateZIndex = (componentName: string, zIndex: number): boolean => {
  const layers = Object.values(Z_INDEX_LAYERS);
  if (!layers.includes(zIndex)) {
    console.warn(`⚠️ ${componentName}: 비표준 z-index ${zIndex} 사용됨. Z_INDEX_LAYERS 상수를 사용하세요.`);
    return false;
  }
  return true;
};

// 컴포넌트별 추천 레이어
export const COMPONENT_LAYERS = {
  // 드롭다운 계열
  'CustomSelect': Z_INDEX_LAYERS.DROPDOWN,
  'MultiSelect': Z_INDEX_LAYERS.DROPDOWN,
  'DatePicker': Z_INDEX_LAYERS.DROPDOWN,
  
  // 텍스트 에디터
  'WYSIWYGEditor.toolbar': Z_INDEX_LAYERS.STICKY_TOOLBAR,
  'WYSIWYGEditor.modal': Z_INDEX_LAYERS.MODAL_CONTENT,
  
  // 모달 계열
  'TagSelector': Z_INDEX_LAYERS.MODAL_CONTENT,
  'RewardModal': Z_INDEX_LAYERS.MODAL_CONTENT,
  'SearchModal': Z_INDEX_LAYERS.MODAL_CONTENT,
  
  // 고정 요소
  'Header': Z_INDEX_LAYERS.HEADER,
  'Sidebar': Z_INDEX_LAYERS.SIDEBAR,
  
  // 알림 계열
  'Toast': Z_INDEX_LAYERS.TOAST,
  'ConnectionStatusIndicator': Z_INDEX_LAYERS.DROPDOWN,
} as const;

// 개발 도구: z-index 충돌 감지
export const detectZIndexConflicts = (): void => {
  if (typeof window === 'undefined') return;
  
  const elements = Array.from(document.querySelectorAll('*'))
    .filter(el => {
      const style = window.getComputedStyle(el);
      return style.zIndex !== 'auto' && style.zIndex !== '0';
    })
    .map(el => ({
      element: el,
      zIndex: parseInt(window.getComputedStyle(el).zIndex),
      className: el.className,
      tagName: el.tagName,
    }))
    .sort((a, b) => a.zIndex - b.zIndex);
  
  console.group('🔍 Z-Index 사용 현황');
  elements.forEach(({ element, zIndex, className, tagName }) => {
    const isStandard = Object.values(Z_INDEX_LAYERS).includes(zIndex);
    console.log(
      `${isStandard ? '✅' : '⚠️'} ${tagName}.${className}: ${zIndex}`,
      isStandard ? '' : '(비표준)'
    );
  });
  console.groupEnd();
  
  // 충돌 가능성 검사
  const conflicts = elements.filter(item => 
    elements.some(other => 
      other !== item && 
      Math.abs(other.zIndex - item.zIndex) < 10 && 
      other.zIndex >= 1000 // 고정/드롭다운 레이어에서만 체크
    )
  );
  
  if (conflicts.length > 0) {
    console.warn('⚠️ Z-Index 충돌 가능성:', conflicts);
  }
};

// 개발 도구
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).PlainZIndex = {
    layers: Z_INDEX_LAYERS,
    components: COMPONENT_LAYERS,
    detect: detectZIndexConflicts,
    validate: validateZIndex,
    
    info: () => console.log(`
🎭 Plain Z-Index 레이어 시스템

레이어 구조:
📱 기본 (1-99): 일반 콘텐츠
🧭 내비게이션 (100-299): 헤더, 사이드바
📌 고정 요소 (1000-1499): sticky 툴바, 헤더
📋 드롭다운 (1500-1999): 셀렉트, 팝오버, 툴팁
🏠 모달 (2000-2999): 모달, 다이얼로그
🚨 최상위 (3000+): 토스트, 로딩, 디버그

사용법:
import { Z_INDEX_LAYERS } from '../utils/zIndexLayers';
zIndex={Z_INDEX_LAYERS.DROPDOWN}

디버깅:
- PlainZIndex.detect() : 현재 페이지 z-index 분석
- PlainZIndex.validate() : 레이어 검증
    `)
  };
  
  console.log('🎭 Plain Z-Index 레이어 시스템 활성화! PlainZIndex.info() 입력으로 도움말 확인');
}

export default Z_INDEX_LAYERS;