# 🚀 Supabase 성능 최적화 완벽 가이드

## 1. 💾 연결 풀(Connection Pool) 설정

### Supabase 대시보드에서 설정하는 방법:

1. **Dashboard 접속**: https://supabase.com/dashboard
2. **프로젝트 선택**: `tbmlxkbdugppyxpzpatx`
3. **Settings** → **Database** → **Connection pooling** 메뉴 이동

### 🔧 권장 설정:

```yaml
Connection Pooler 설정:
  Mode: Transaction (권장)  # Session 모드보다 효율적
  Pool Size: 15             # 동시 연결 수 (Free tier: 최대 60개)
  Default Pool Size: 20     # 기본 풀 크기
  
Supavisor 설정 (최신 권장):
  Enable Supavisor: ON      # PgBouncer보다 성능 우수
  Port: 5432 (Transaction)  # 트랜잭션 모드 포트
```

### 📱 설정 화면 찾는 방법:
1. Dashboard → 프로젝트 선택
2. Settings (⚙️ 아이콘) 클릭
3. Database 메뉴 선택
4. "Connection pooling" 섹션 찾기
5. **Pool Mode**: Transaction 선택
6. **Pool Size**: 15로 설정
7. **Save** 클릭

---

## 2. 📈 데이터베이스 성능 최적화

### 🔍 인덱스 추가 (중요!)

Supabase SQL Editor에서 다음 쿼리 실행:

```sql
-- 1. 사용자 조회 성능 개선
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. 스토리 조회 성능 개선  
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_published ON stories(created_at DESC) WHERE is_verified = true;

-- 3. 라운지 글 조회 성능 개선
CREATE INDEX IF NOT EXISTS idx_lounge_posts_created_at ON lounge_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lounge_posts_user_id ON lounge_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_lounge_posts_type ON lounge_posts(type, created_at DESC);

-- 4. 좋아요 시스템 성능 개선
CREATE INDEX IF NOT EXISTS idx_likes_post_id_type ON likes(post_id, post_type);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_composite ON likes(post_id, post_type, user_id);

-- 5. 북마크 시스템 성능 개선
CREATE INDEX IF NOT EXISTS idx_scraps_user_id ON scraps(user_id);
CREATE INDEX IF NOT EXISTS idx_scraps_post_composite ON scraps(post_id, post_type);

-- 6. 사용자 레벨 시스템 성능 개선
CREATE INDEX IF NOT EXISTS idx_user_levels_user_id ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_level ON user_levels(level DESC);

-- 7. 댓글 시스템 성능 개선 (있다면)
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id, post_type);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
```

### 📊 슬로우 쿼리 모니터링 설정

1. **Dashboard** → **Reports** → **Database**
2. "Slow queries" 섹션에서 느린 쿼리 확인
3. 1초 이상 걸리는 쿼리들을 찾아서 인덱스 추가

---

## 3. 🔐 RLS (Row Level Security) 최적화

### 현재 정책 확인 및 최적화:

```sql
-- 1. 현재 RLS 정책 확인
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- 2. 성능이 중요한 테이블의 RLS 최적화
-- stories 테이블 RLS 최적화 예시
DROP POLICY IF EXISTS "stories_select_policy" ON stories;
CREATE POLICY "stories_select_optimized" ON stories
  FOR SELECT USING (
    is_verified = true OR 
    user_id = auth.uid()::text
  );

-- 3. RLS 성능 테스트
EXPLAIN ANALYZE SELECT * FROM stories WHERE is_verified = true ORDER BY created_at DESC LIMIT 20;
```

### 🚨 RLS 성능 문제 해결:

만약 RLS가 너무 느리다면:
1. **SECURITY DEFINER 함수** 생성:

```sql
-- RLS 우회용 함수 (성능 최적화)
CREATE OR REPLACE FUNCTION get_published_stories(page_limit int DEFAULT 20, page_offset int DEFAULT 0)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  author_name text,
  like_count int,
  created_at timestamp with time zone
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.title, s.content, s.author_name, s.like_count, s.created_at
  FROM stories s
  WHERE s.is_verified = true
  ORDER BY s.created_at DESC
  LIMIT page_limit OFFSET page_offset;
END;
$$;

-- 함수 권한 설정
GRANT EXECUTE ON FUNCTION get_published_stories TO anon, authenticated;
```

---

## 4. 🔄 Realtime 최적화

### Dashboard 설정:

1. **Database** → **Replication** → **Tables**
2. 필요한 테이블만 Realtime 활성화:

```yaml
Realtime 활성화 권장 테이블:
  ✅ likes          # 실시간 좋아요 수 업데이트  
  ❌ stories        # 너무 많은 트래픽, 비활성화 권장
  ❌ lounge_posts   # 너무 많은 트래픽, 비활성화 권장
  ✅ comments       # 실시간 댓글 (있다면)
  ❌ users          # 불필요, 비활성화
```

### 코드에서 Realtime 최적화:

프론트엔드에서 필요한 경우에만 구독:

```javascript
// 좋은 예: 특정 글의 좋아요만 구독
const subscription = supabase
  .channel(`likes:${postId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'likes',
    filter: `post_id=eq.${postId}`
  }, (payload) => {
    // 좋아요 수 업데이트
  })
  .subscribe();

// 나쁜 예: 모든 좋아요 구독 (트래픽 폭증)
// const subscription = supabase.channel('likes').on(...)
```

---

## 5. 📊 모니터링 및 로그 설정

### 1. Log Drains 설정 (프로덕션에서 권장):

1. **Settings** → **Logs** → **Log Drains**
2. 외부 로그 서비스 연동 (예: Logflare, DataDog)

### 2. 모니터링 알람 설정:

1. **Reports** → **Database** 
2. 다음 지표 모니터링 설정:
   - Connection count > 50
   - Query duration > 1초
   - Error rate > 5%

---

## 6. 💰 리소스 모니터링

### Dashboard에서 확인할 지표:

1. **Database** → **Reports**에서 확인:
   - **Connection count**: 50개 미만 유지
   - **CPU usage**: 80% 미만 유지  
   - **Memory usage**: 80% 미만 유지
   - **Storage usage**: Free tier 500MB 한도 확인

### 2. API 요청 제한 확인:

1. **Settings** → **API**에서 현재 사용량 확인
2. Free tier 한도:
   - Database operations: 50,000/월
   - API requests: 500,000/월
   - Realtime connections: 200개 동시

---

## 7. 🔧 프로덕션 배포 시 추가 설정

### 1. 환경 변수 추가:

`.env` 파일에 추가:

```bash
# 연결 최적화
REACT_APP_SUPABASE_CONNECTION_POOL_SIZE=15
REACT_APP_SUPABASE_QUERY_TIMEOUT=10000
REACT_APP_SUPABASE_CACHE_TTL=300000

# 성능 모니터링
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true
REACT_APP_ENABLE_QUERY_CACHE=true
```

### 2. CDN 설정 (권장):

1. **Storage** → **Settings** → **CDN**
2. 이미지/정적 파일 CDN 활성화
3. Cache-Control 헤더 설정: `max-age=31536000`

---

## 8. 📱 클라이언트 최적화 체크리스트

### 이미 구현된 최적화:

✅ **싱글톤 클라이언트**: 연결 재사용  
✅ **쿼리 캐싱**: 5분 TTL  
✅ **배치 처리**: 여러 쿼리 그룹화  
✅ **연결 모니터링**: 1분마다 상태 확인  
✅ **타임아웃 설정**: 10초 제한  
✅ **에러 핸들링**: 자동 재시도  

### 추가 권장 사항:

```javascript
// 1. 페이지네이션 사용 (무한 스크롤 대신)
const stories = await optimizedQueries.getStories(page, 20);

// 2. 필요한 컬럼만 선택
const users = await supabase
  .from('users')
  .select('id, name, email')  // 모든 컬럼 대신
  .limit(20);

// 3. 조건부 쿼리 실행
if (userId) {
  const userData = await optimizedQueries.getUser(userId);
}
```

---

## 9. 🚨 트러블슈팅

### 자주 발생하는 문제들:

#### 문제 1: "Too many connections" 에러
```
해결 방법:
1. Dashboard → Settings → Database → Connection pooling
2. Pool Size를 10-15로 줄임
3. 클라이언트에서 연결 재사용 확인
4. 브라우저 탭 여러 개 동시 사용 금지
```

#### 문제 2: 쿼리가 너무 느림 (>2초)
```
해결 방법:
1. Dashboard → Reports → Database → Slow queries 확인
2. 해당 쿼리에 인덱스 추가
3. RLS 정책 단순화 고려
4. 필요한 컬럼만 SELECT
```

#### 문제 3: RLS 권한 에러
```
해결 방법:
1. SQL Editor에서 현재 사용자 확인: SELECT auth.uid();
2. RLS 정책에서 해당 사용자 ID 허용 확인
3. SECURITY DEFINER 함수 사용 고려
```

---

## 10. 📈 성능 측정 및 개선

### 성능 측정 명령어:

브라우저 콘솔에서:

```javascript
// 1. 캐시 통계 확인
Plain.optimized.getCacheStats();

// 2. 성능 리포트 확인  
Plain.optimized.getPerformanceReport();

// 3. 특정 쿼리 성능 확인
Plain.optimized.getAverageQueryTime('getUser');

// 4. 캐시 효과 테스트
console.time('cached');
await Plain.optimized.getStories(1, 20, true);  // 캐시 사용
console.timeEnd('cached');

console.time('nocache');
await Plain.optimized.getStories(1, 20, false); // 캐시 미사용
console.timeEnd('nocache');
```

### 목표 성능 지표:

```yaml
쿼리 성능 목표:
  사용자 조회: < 200ms
  게시글 목록: < 500ms  
  좋아요 처리: < 300ms
  
캐시 성능:
  캐시 히트율: > 70%
  캐시 크기: < 500개 엔트리
  
연결 성능:
  동시 연결 수: < 30개
  연결 대기 시간: < 100ms
```

---

## 🎯 결론 및 우선순위

### 즉시 설정해야 할 것 (High Priority):

1. **연결 풀 설정**: Transaction 모드, Pool Size 15
2. **핵심 인덱스 추가**: created_at, user_id 인덱스
3. **Realtime 범위 축소**: likes 테이블만 활성화

### 중간 우선순위 (Medium Priority):

4. **슬로우 쿼리 모니터링**: 대시보드에서 1주일 관찰
5. **RLS 정책 최적화**: 복잡한 정책 단순화
6. **Log Drains 설정**: 에러 추적을 위해

### 장기 개선 (Low Priority):

7. **CDN 설정**: 이미지 로딩 속도 개선
8. **외부 모니터링**: DataDog, Sentry 연동
9. **프로덕션 최적화**: 환경별 설정 분리

이 가이드를 따라 설정하면 **Supabase 응답 속도가 50-70% 개선**될 것으로 예상됩니다! 🚀