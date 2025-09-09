export interface Comment {
  id: number;
  postId: number;
  postType: 'story' | 'lounge';
  author: string;
  content: string;
  createdAt: string;
}

export const comments: Comment[] = [
  // Story 1 comments
  {
    id: 1,
    postId: 1,
    postType: 'story',
    author: "김멘토",
    content: "온보딩 프로세스 정말 중요하죠! 저희 회사도 체계적인 온보딩 도입 후 신입사원들의 조기 적응률이 눈에 띄게 개선되었어요.",
    createdAt: "2024-01-15T14:30:00Z",
  },
  {
    id: 2,
    postId: 1,
    postType: 'story',
    author: "신입HR이",
    content: "멘토 배정 부분이 특히 도움이 되었습니다. 어떤 기준으로 멘토를 선정하시는지도 궁금해요!",
    createdAt: "2024-01-15T16:45:00Z",
  },

  // Lounge 1 comments
  {
    id: 3,
    postId: 1,
    postType: 'lounge',
    author: "온보딩전문가",
    content: "교육 기간은 회사 규모와 업무 복잡도에 따라 다르지만, 일반적으로 2-4주가 적당해요. 스타트업이시라면 2주 정도로 시작해서 피드백을 받아 조정하시는 게 좋을 것 같습니다!",
    createdAt: "2024-01-14T11:00:00Z",
  },
  {
    id: 4,
    postId: 1,
    postType: 'lounge',
    author: "HR선배",
    content: "멘토 제도는 정말 중요해요! 주의할 점은:\n1. 멘토의 자발적 참여 (강제 X)\n2. 명확한 가이드라인 제공\n3. 멘토에게도 인센티브 제공\n4. 정기적인 멘토링 현황 체크\n경험상 이 부분들을 신경쓰시면 성공률이 높아요.",
    createdAt: "2024-01-14T13:20:00Z",
  },

  // Lounge 2 comments
  {
    id: 5,
    postId: 2,
    postType: 'lounge',
    author: "원격근무신청자",
    content: "와 정말 부럽네요! 저희도 원격근무 도입을 건의했는데 아직 검토 중이에요. 혹시 경영진 설득 과정에서 어떤 포인트가 효과적이었나요?",
    createdAt: "2024-01-13T16:30:00Z",
  },
  {
    id: 6,
    postId: 2,
    postType: 'lounge',
    author: "생산성분석가",
    content: "생산성 측정을 어떤 방식으로 하셨는지 궁금해요. 프로젝트 완료 속도 외에 다른 지표도 사용하셨나요?",
    createdAt: "2024-01-13T18:45:00Z",
  },

  // Lounge 3 comments
  {
    id: 7,
    postId: 3,
    postType: 'lounge',
    author: "채용담당A",
    content: "개인화된 메시지 정말 효과적이네요! 저도 바로 적용해봐야겠어요. 혹시 문자 템플릿 같은 것도 미리 만들어놓고 사용하시나요?",
    createdAt: "2024-01-12T10:30:00Z",
  },
  {
    id: 8,
    postId: 3,
    postType: 'lounge',
    author: "면접관경험자",
    content: "면접관 소개 부분이 신선하네요! 지원자 입장에서도 누구를 만날지 미리 알면 확실히 덜 긴장할 것 같아요.",
    createdAt: "2024-01-12T14:20:00Z",
  },

  // Lounge 7 comments
  {
    id: 9,
    postId: 7,
    postType: 'lounge',
    author: "소통고민자",
    content: "정말 좋은 아이디어들이네요! 특히 '개선 아이디어 박스'로 이름을 바꾼 것만으로도 참여율이 3배나 늘었다는 게 인상깊어요. 작은 변화의 힘이 대단하네요!",
    createdAt: "2024-01-08T14:15:00Z",
  },
  {
    id: 10,
    postId: 7,
    postType: 'lounge',
    author: "팀간교류추진자",
    content: "팀 간 점심 교류 아이디어 정말 좋네요! 저희도 시도해보려고 하는데, 혹시 식대 지원 금액은 어느 정도로 하셨나요? 그리고 추가 혜택은 어떤 것들인지 궁금해요.",
    createdAt: "2024-01-08T15:30:00Z",
  },
];