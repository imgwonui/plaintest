// HR 관련 태그 카테고리 정의
import { tagService } from '../services/supabaseDataService';

export interface Tag {
  id: string;
  name: string;
  category: string;
}

export interface TagCategory {
  id: string;
  name: string;
  tags: Tag[];
}

export const tagCategories: TagCategory[] = [
  {
    id: 'recruitment',
    name: '채용·조직',
    tags: [
      { id: 'recruitment', name: '채용', category: 'recruitment' },
      { id: 'newbie', name: '신입사원', category: 'recruitment' },
      { id: 'headhunting', name: '헤드헌팅', category: 'recruitment' },
      { id: 'startup', name: '스타트업', category: 'recruitment' },
      { id: 'career', name: '커리어', category: 'recruitment' },
    ]
  },
  {
    id: 'payroll',
    name: '페이롤·세무·4대보험 등',
    tags: [
      { id: 'salary', name: '급여', category: 'payroll' },
      { id: 'withholdingTax', name: '원천세', category: 'payroll' },
      { id: 'taxReturn', name: '세금신고', category: 'payroll' },
      { id: 'corporateTax', name: '법인세', category: 'payroll' },
      { id: 'bonus', name: '성과급/보너스', category: 'payroll' },
      { id: 'severance', name: '퇴직금', category: 'payroll' },
      { id: 'yearEndTax', name: '연말정산', category: 'payroll' },
      { id: 'insurance', name: '4대보험', category: 'payroll' },
    ]
  },
  {
    id: 'hrSystem',
    name: '인사제도·평가',
    tags: [
      { id: 'evaluation', name: '인사평가', category: 'hrSystem' },
      { id: 'goalManagement', name: '목표관리', category: 'hrSystem' },
      { id: 'performance', name: '성과관리', category: 'hrSystem' },
      { id: 'leadership', name: '리더십', category: 'hrSystem' },
      { id: 'culture', name: '조직문화', category: 'hrSystem' },
      { id: 'workLife', name: '워라밸', category: 'hrSystem' },
      { id: 'event', name: '사내행사', category: 'hrSystem' },
    ]
  },
  {
    id: 'legal',
    name: '법·노무',
    tags: [
      { id: 'laborLaw', name: '노동법', category: 'legal' },
      { id: 'retirement', name: '퇴직', category: 'legal' },
      { id: 'contract', name: '근로계약', category: 'legal' },
      { id: 'harassment', name: '직장 내 괴롭힘', category: 'legal' },
      { id: 'privacy', name: '개인정보보호', category: 'legal' },
    ]
  },
  {
    id: 'welfare',
    name: '복리후생·근로조건',
    tags: [
      { id: 'welfare', name: '복리후생', category: 'welfare' },
      { id: 'welfarePoints', name: '복지포인트', category: 'welfare' },
      { id: 'remote', name: '재택근무', category: 'welfare' },
      { id: 'attendance', name: '근태관리', category: 'welfare' },
      { id: 'flexTime', name: '유연근무제', category: 'welfare' },
      { id: 'vacation', name: '휴가제도', category: 'welfare' },
      { id: 'parentalLeave', name: '육아휴직', category: 'welfare' },
    ]
  },
  {
    id: 'education',
    name: '교육·성장',
    tags: [
      { id: 'training', name: '사내교육', category: 'education' },
      { id: 'jobTraining', name: '직무교육', category: 'education' },
      { id: 'mentoring', name: '멘토링/코칭', category: 'education' },
      { id: 'selfDev', name: '자기계발', category: 'education' },
      { id: 'education', name: '교육', category: 'education' },
    ]
  },
  {
    id: 'hrtech',
    name: 'HR테크·자동화',
    tags: [
      { id: 'hrPlatform', name: 'HR플랫폼', category: 'hrtech' },
      { id: 'ai', name: 'AI', category: 'hrtech' },
      { id: 'automation', name: '자동화', category: 'hrtech' },
    ]
  },
  {
    id: 'etc',
    name: '기타',
    tags: [
      { id: 'etc', name: '기타', category: 'etc' },
    ]
  }
];

// 런타임에서 태그를 동적으로 관리하기 위한 변수
let dynamicTagCategories = [...tagCategories];

// 데이터베이스에서 모든 태그를 가져오기 (동기 함수로 유지하되, 캐시 사용)
let tagCache: Tag[] = [];
let tagCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export const getAllTags = (): Tag[] => {
  // 캐시된 데이터가 있고 유효한 경우 반환
  if (tagCache.length > 0 && Date.now() - tagCacheTime < CACHE_DURATION) {
    return tagCache;
  }

  // 기본 태그 반환 (캐시가 없는 경우)
  return dynamicTagCategories.flatMap(category => category.tags);
};

// 비동기 방식으로 모든 태그 가져오기
export const getAllTagsAsync = async (): Promise<Tag[]> => {
  try {
    const dbTags = await tagService.getAllTags();
    
    // 데이터베이스 형식을 기존 Tag 인터페이스에 맞게 변환
    const convertedTags: Tag[] = dbTags.map((dbTag: any) => ({
      id: dbTag.id,
      name: dbTag.name,
      category: dbTag.category_id
    }));

    // 기본 태그와 데이터베이스 태그를 합치기
    const staticTags = dynamicTagCategories.flatMap(category => category.tags);
    const allTags = [...staticTags];

    // 데이터베이스 태그 중 중복되지 않는 것만 추가
    convertedTags.forEach(dbTag => {
      if (!allTags.some(tag => tag.id === dbTag.id)) {
        allTags.push(dbTag);
      }
    });

    // 캐시 업데이트
    tagCache = allTags;
    tagCacheTime = Date.now();
    
    console.log('📝 모든 태그 로드됨:', allTags.length, '개');
    return allTags;
  } catch (error) {
    console.error('getAllTagsAsync 에러:', error);
    return dynamicTagCategories.flatMap(category => category.tags);
  }
};

export const getTagById = (id: string): Tag | undefined => {
  return getAllTags().find(tag => tag.id === id);
};

// 비동기 방식으로 태그 ID로 조회
export const getTagByIdAsync = async (id: string): Promise<Tag | undefined> => {
  const allTags = await getAllTagsAsync();
  return allTags.find(tag => tag.id === id);
};

export const getTagsByCategory = (categoryId: string): Tag[] => {
  const allTags = getAllTags();
  return allTags.filter(tag => tag.category === categoryId);
};

// 비동기 방식으로 카테고리별 태그 조회
export const getTagsByCategoryAsync = async (categoryId: string): Promise<Tag[]> => {
  const allTags = await getAllTagsAsync();
  return allTags.filter(tag => tag.category === categoryId);
};

export const getDynamicTagCategories = (): TagCategory[] => {
  return dynamicTagCategories;
};

// 비동기 방식으로 동적 태그 카테고리 조회 (데이터베이스 포함)
export const getDynamicTagCategoriesAsync = async (): Promise<TagCategory[]> => {
  try {
    const allTags = await getAllTagsAsync();
    
    // 카테고리별로 태그 그룹화
    const categoryMap = new Map<string, TagCategory>();
    
    // 기본 카테고리 추가
    dynamicTagCategories.forEach(category => {
      categoryMap.set(category.id, {
        ...category,
        tags: []
      });
    });

    // 모든 태그를 카테고리별로 분류
    allTags.forEach(tag => {
      const category = categoryMap.get(tag.category);
      if (category) {
        category.tags.push(tag);
      }
    });

    return Array.from(categoryMap.values());
  } catch (error) {
    console.error('getDynamicTagCategoriesAsync 에러:', error);
    return dynamicTagCategories;
  }
};

// 태그 추가 함수 (Supabase 데이터베이스 사용)
export const addTag = async (newTag: Tag): Promise<boolean> => {
  try {
    console.log('🏷️ addTag 호출됨:', newTag);
    
    // 데이터베이스에 추가
    await tagService.addTag({
      id: newTag.id,
      name: newTag.name,
      category_id: newTag.category,
      description: undefined
    });
    
    // 캐시 무효화
    tagCache = [];
    tagCacheTime = 0;
    
    console.log('✅ 태그 추가 성공');
    return true;
  } catch (error) {
    console.error('❌ 태그 추가 실패:', error);
    return false;
  }
};

// 태그 수정 함수 (Supabase 데이터베이스 사용)
export const updateTag = async (tagId: string, newName: string): Promise<boolean> => {
  try {
    console.log('🏷️ updateTag 호출됨:', tagId, newName);
    
    // 데이터베이스에서 수정
    await tagService.updateTag(tagId, { name: newName });
    
    // 캐시 무효화
    tagCache = [];
    tagCacheTime = 0;
    
    console.log('✅ 태그 수정 성공');
    return true;
  } catch (error) {
    console.error('❌ 태그 수정 실패:', error);
    return false;
  }
};

// 태그 삭제 함수 (Supabase 데이터베이스 사용)
export const deleteTag = async (tagId: string): Promise<boolean> => {
  try {
    console.log('🏷️ deleteTag 호출됨:', tagId);
    
    // 데이터베이스에서 삭제 (소프트 삭제)
    await tagService.deleteTag(tagId);
    
    // 캐시 무효화
    tagCache = [];
    tagCacheTime = 0;
    
    console.log('✅ 태그 삭제 성공');
    return true;
  } catch (error) {
    console.error('❌ 태그 삭제 실패:', error);
    return false;
  }
};

// 하위 호환성을 위한 동기식 래퍼 함수들 (사용하지 않는 것을 권장)
export const addTagSync = (newTag: Tag): boolean => {
  console.warn('addTagSync는 더 이상 권장되지 않습니다. addTag를 사용하세요.');
  addTag(newTag);
  return true; // 비동기이므로 실제 결과를 알 수 없음
};

export const updateTagSync = (tagId: string, newName: string): boolean => {
  console.warn('updateTagSync는 더 이상 권장되지 않습니다. updateTag를 사용하세요.');
  updateTag(tagId, newName);
  return true; // 비동기이므로 실제 결과를 알 수 없음
};

export const deleteTagSync = (tagId: string): boolean => {
  console.warn('deleteTagSync는 더 이상 권장되지 않습니다. deleteTag를 사용하세요.');
  deleteTag(tagId);
  return true; // 비동기이므로 실제 결과를 알 수 없음
};

// 초기화 시 localStorage에서 커스텀 태그 로드
export const initializeTags = (): void => {
  try {
    const savedTags = localStorage.getItem('customTags');
    if (savedTags) {
      const parsedTags = JSON.parse(savedTags);
      // 기본 태그 구조 유지하면서 커스텀 태그 병합
      dynamicTagCategories = parsedTags;
    }
  } catch (error) {
    console.error('커스텀 태그 로드 실패:', error);
    // 에러 시 기본 태그로 복구
    dynamicTagCategories = [...tagCategories];
  }
};