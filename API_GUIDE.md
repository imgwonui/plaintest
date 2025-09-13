# API 연결 가이드

Plain 프로젝트는 API 연결을 위한 모든 준비가 완료되었습니다. 이 문서는 백엔드 API와 연결하기 위한 가이드를 제공합니다.

## 🎯 현재 상태

### ✅ 완료된 작업
- 모든 목업 데이터 제거
- 세션 스토리지 기반 임시 데이터 관리
- 완전한 API 서비스 레이어 구축
- TypeScript 타입 정의 완료
- Supabase 클라이언트 설정

### 📁 주요 파일들

```
app/javascript/
├── services/
│   ├── apiService.ts        # 완전한 API 서비스 레이어
│   ├── supabaseService.ts   # Supabase 클라이언트 설정
│   └── sessionDataService.ts # 임시 세션 스토리지 (API 연결 후 제거 예정)
├── types/
│   └── api.ts              # 모든 API 타입 정의
```

## 🔌 API 연결 방법

### 1. 환경 변수 설정

`.env` 파일 생성:
```env
REACT_APP_API_URL=https://your-api-domain.com/api
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. 컴포넌트에서 API 사용

기존 세션 데이터 서비스를 API 서비스로 교체:

**Before (현재):**
```typescript
import { sessionStoryService } from '../services/sessionDataService';

// 컴포넌트 내에서
useEffect(() => {
  const stories = sessionStoryService.getAll();
  setStories(stories);
}, []);
```

**After (API 연결 후):**
```typescript
import { getStories } from '../services/apiService';

// 컴포넌트 내에서
useEffect(() => {
  const fetchStories = async () => {
    try {
      const response = await getStories();
      setStories(response.data);
    } catch (error) {
      console.error('Stories 로드 실패:', error);
    }
  };
  fetchStories();
}, []);
```

### 3. 필요한 API 엔드포인트

`apiService.ts`에 정의된 모든 메서드에 대응하는 백엔드 엔드포인트가 필요합니다:

#### Stories API
- `GET /api/stories` - 스토리 목록 조회
- `GET /api/stories/:id` - 특정 스토리 조회  
- `POST /api/stories` - 스토리 생성
- `PUT /api/stories/:id` - 스토리 수정
- `DELETE /api/stories/:id` - 스토리 삭제
- `POST /api/stories/:id/view` - 조회수 증가

#### Lounge API
- `GET /api/lounge` - 라운지 포스트 목록
- `GET /api/lounge/:id` - 특정 포스트 조회
- `POST /api/lounge` - 포스트 생성
- `PUT /api/lounge/:id` - 포스트 수정
- `DELETE /api/lounge/:id` - 포스트 삭제
- `GET /api/lounge/popular` - 인기 포스트

#### Comments API
- `GET /api/comments?postId=:id&postType=:type` - 댓글 조회
- `POST /api/comments` - 댓글 생성
- `DELETE /api/comments/:id` - 댓글 삭제

#### Interactions API
- `POST /api/interactions/like` - 좋아요/취소
- `POST /api/interactions/scrap` - 스크랩/해제
- `GET /api/user/scraps` - 사용자 스크랩 목록

#### Search API
- `GET /api/search?query=:query&tags=:tags&type=:type` - 통합 검색

#### Tags API
- `GET /api/tags` - 전체 태그
- `GET /api/tags/popular?limit=:limit` - 인기 태그

#### Admin API
- `GET /api/admin/stats` - 관리자 통계
- `POST /api/admin/promote-to-story` - 라운지 글 스토리 승격
- `POST /api/admin/stories/:id/verify` - 스토리 검증
- `POST /api/admin/lounge/:id/excellent` - 우수 글 지정

#### File Upload API
- `POST /api/upload/image` - 이미지 업로드

## 📊 데이터베이스 스키마 참고

`app/javascript/types/api.ts`에 정의된 인터페이스를 참고하여 데이터베이스 테이블을 생성하세요:

### 주요 테이블
- `users` - 사용자 정보
- `stories` - 스토리 콘텐츠
- `lounge_posts` - 라운지 포스트
- `comments` - 댓글
- `tags` - 태그
- `user_likes` - 좋아요 관계
- `user_scraps` - 스크랩 관계

## 🔄 마이그레이션 단계

### 1단계: API 엔드포인트 구현
백엔드에서 위의 모든 엔드포인트를 구현합니다.

### 2단계: 점진적 교체  
페이지별로 `sessionDataService`를 `apiService`로 교체:

1. Home 페이지
2. Story 관련 페이지들
3. Lounge 관련 페이지들
4. Admin 페이지들

### 3단계: 세션 스토리지 제거
모든 API 연결이 완료되면 `sessionDataService.ts` 파일을 제거합니다.

### 4단계: 에러 처리 및 로딩 상태
각 컴포넌트에 적절한 에러 처리와 로딩 상태를 추가합니다.

## 🧪 테스트

### API 연결 테스트
```typescript
// 브라우저 콘솔에서 테스트
import { apiService } from './services/apiService';

// 스토리 목록 조회 테스트
apiService.getStories().then(console.log);

// 라운지 포스트 생성 테스트
apiService.createLoungePost({
  title: "테스트 포스트",
  content: "테스트 내용",
  type: "question",
  tags: ["테스트"]
}).then(console.log);
```

## 📝 주의사항

1. **세션 스토리지 데이터**: API 연결 전까지 임시로 사용되는 데이터입니다.
2. **타입 안정성**: 모든 API 응답은 TypeScript 타입으로 정의되어 있습니다.
3. **인증**: Supabase Auth를 사용한 인증 시스템이 준비되어 있습니다.
4. **에러 처리**: API 서비스에 기본적인 에러 처리가 포함되어 있습니다.

## 🎉 결론

Plain 프로젝트는 API 연결을 위한 모든 인프라가 완성되어 있습니다. 백엔드 API만 구현하면 즉시 연결하여 실제 데이터로 동작할 수 있습니다.

더 자세한 구현 사항은 `app/javascript/services/apiService.ts`와 `app/javascript/types/api.ts` 파일을 참고하세요.