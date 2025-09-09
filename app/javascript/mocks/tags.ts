export interface Tag {
  id: number;
  name: string;
  category: 'general' | 'hr' | 'management' | 'culture' | 'system';
  count: number;
}

export const tags: Tag[] = [
  // HR 관련
  { id: 1, name: "온보딩", category: "hr", count: 23 },
  { id: 2, name: "신입사원", category: "hr", count: 18 },
  { id: 3, name: "채용", category: "hr", count: 45 },
  { id: 4, name: "면접", category: "hr", count: 32 },
  { id: 5, name: "성과평가", category: "hr", count: 28 },
  { id: 6, name: "인사평가", category: "hr", count: 25 },
  { id: 7, name: "급여협상", category: "hr", count: 15 },
  { id: 8, name: "연봉데이터", category: "hr", count: 12 },
  
  // 조직문화
  { id: 9, name: "조직문화", category: "culture", count: 38 },
  { id: 10, name: "워라밸", category: "culture", count: 34 },
  { id: 11, name: "사내소통", category: "culture", count: 29 },
  { id: 12, name: "소통개선", category: "culture", count: 21 },
  { id: 13, name: "팀워크", category: "culture", count: 26 },
  { id: 14, name: "직원만족", category: "culture", count: 31 },
  { id: 15, name: "MZ세대", category: "culture", count: 19 },
  
  // 관리
  { id: 16, name: "원격근무", category: "management", count: 42 },
  { id: 17, name: "하이브리드", category: "management", count: 16 },
  { id: 18, name: "팀관리", category: "management", count: 24 },
  { id: 19, name: "갈등해결", category: "management", count: 14 },
  { id: 20, name: "중재", category: "management", count: 8 },
  { id: 21, name: "리더십평가", category: "management", count: 11 },
  { id: 22, name: "승진심사", category: "management", count: 13 },
  
  // 시스템/프로세스
  { id: 23, name: "HR시스템", category: "system", count: 22 },
  { id: 24, name: "HR프로세스", category: "system", count: 27 },
  { id: 25, name: "휴가관리", category: "system", count: 17 },
  { id: 26, name: "업무자동화", category: "system", count: 19 },
  { id: 27, name: "솔루션추천", category: "system", count: 14 },
  { id: 28, name: "OKR", category: "system", count: 20 },
  
  // 일반
  { id: 29, name: "교육프로그램", category: "general", count: 25 },
  { id: 30, name: "멘토제도", category: "general", count: 18 },
  { id: 31, name: "인사결정", category: "general", count: 12 },
  { id: 32, name: "노쇼방지", category: "general", count: 7 },
  { id: 33, name: "지원자경험", category: "general", count: 9 },
  { id: 34, name: "시장조사", category: "general", count: 8 },
  { id: 35, name: "인재선발", category: "general", count: 16 },
];

export const getTagsByCategory = (category: Tag['category']) => 
  tags.filter(tag => tag.category === category);

export const getPopularTags = (limit: number = 10) => 
  [...tags].sort((a, b) => b.count - a.count).slice(0, limit);

export const searchTags = (query: string) => 
  tags.filter(tag => tag.name.toLowerCase().includes(query.toLowerCase()));