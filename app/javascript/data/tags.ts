// HR 관련 태그 카테고리 정의

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

export const getAllTags = (): Tag[] => {
  return tagCategories.flatMap(category => category.tags);
};

export const getTagById = (id: string): Tag | undefined => {
  return getAllTags().find(tag => tag.id === id);
};

export const getTagsByCategory = (categoryId: string): Tag[] => {
  const category = tagCategories.find(cat => cat.id === categoryId);
  return category ? category.tags : [];
};