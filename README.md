# Plain - 인사담당자를 위한 이야기와 라운지

Plain은 인사담당자들을 위한 정보 공유와 커뮤니티 플랫폼입니다. 전문가가 엄선한 Story 콘텐츠와 실무진들이 참여하는 Lounge 커뮤니티로 구성되어 있습니다.

## 🎯 주요 기능

### Story
- 전문가가 검수하고 발행하는 인사 관련 콘텐츠
- 마크다운 지원으로 풍부한 서식 표현
- 태그 기반 분류 및 검색
- 라운지의 우수 글을 재구성한 콘텐츠 포함

### Lounge  
- 인사담당자들의 실무 경험 공유 공간
- 3가지 글 유형: 질문, 경험담, 도움글
- 좋아요 50개 이상 시 우수 배지 및 Story 승격 후보
- 댓글과 북마크 기능

### 관리자 기능
- Story 발행 관리
- Lounge 글의 Story 승격 처리
- 통계 대시보드

## 🛠 기술 스택

- **Frontend**: React 18, TypeScript
- **UI Framework**: Chakra UI v2.8.2
- **Router**: React Router Dom v6
- **Build Tool**: Webpack 5
- **Backend**: Supabase (준비 완료)
- **State Management**: Session Storage (API 연결 전 임시)
- **Data**: 목업 데이터 제거 완료, API 연결 준비 완료

## 🎨 디자인 시스템

- **브랜드 컬러**: #7A5AF8
- **폰트**: Pretendard (전역 적용)
- **반응형**: 모바일 우선 설계
- **스타일**: Chakra UI 컴포넌트 기반 (커스텀 CSS 사용 안 함)

## 📁 프로젝트 구조

```
app/javascript/
├── components/          # 재사용 가능한 UI 컴포넌트
│   ├── AppShell.tsx    # 메인 레이아웃
│   ├── Header.tsx      # 헤더 컴포넌트
│   ├── Footer.tsx      # 푸터 컴포넌트
│   ├── Card.tsx        # 게시글 카드
│   └── ...
├── pages/              # 페이지 컴포넌트
│   ├── Home.tsx        # 랜딩 페이지
│   ├── StoryList.tsx   # Story 목록
│   ├── LoungeList.tsx  # Lounge 목록
│   └── ...
├── services/           # API 서비스 및 데이터 관리
├── types/              # TypeScript 타입 정의
├── theme/              # Chakra UI 테마 설정
├── utils/              # 유틸리티 함수
└── main.jsx           # 앱 진입점
```

## 🚀 시작하기

### 개발 환경 설정

1. 의존성 설치
```bash
npm install
```

2. 개발 서버 실행
```bash
npm run dev
```

3. 브라우저에서 http://localhost:3000 접속

### 빌드

```bash
npm run build
```

## 📝 개발 규칙

1. **컴포넌트화**: 반복되는 UI 요소는 반드시 컴포넌트로 분리
2. **파일 크기 제한**: 파일당 2000줄 이하 유지
3. **스타일링**: Chakra UI만 사용, 커스텀 CSS 파일 금지
4. **폰트**: Pretendard 전역 적용
5. **브랜드 컬러**: #7A5AF8 일관성 있게 사용

## 🎭 사용자 페르소나

- **주 대상**: 30대 여성 인사담당자
- **관심사**: 실무 노하우, 동료들과의 경험 공유, 최신 HR 트렌드
- **선호 스타일**: 깔끔하고 편안한 감성 (Medium, Toss Feed 스타일)

## 📱 주요 페이지

- `/` - 랜딩 페이지 (Hero + 최신 콘텐츠)
- `/story` - Story 목록 및 상세
- `/lounge` - Lounge 목록, 상세, 글쓰기
- `/admin` - 관리자 대시보드

## 🔧 개발 현황

### ✅ 완료된 작업
- [x] 목업 데이터 완전 제거
- [x] 세션 스토리지 기반 데이터 관리
- [x] API 서비스 레이어 구축
- [x] TypeScript 타입 정의 완료
- [x] Supabase 클라이언트 설정
- [x] 모든 CRUD 기능 (글작성, 댓글, 좋아요, 스크랩)
- [x] 리치 텍스트 에디터 (이미지 드래그 앤 드롭)
- [x] 반응형 디자인 및 다크모드

### 🚀 다음 단계 (API 연결 준비 완료)
- [ ] 실제 데이터베이스 스키마 생성
- [ ] API 엔드포인트 구현 
- [ ] 사용자 인증 시스템 연결
- [ ] 실시간 알림 기능
- [ ] 파일 업로드 시스템
- [ ] 검색 기능 고도화
- [ ] PWA 지원

## 📄 라이선스

MIT License