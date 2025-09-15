# 🔧 UUID 형식 문제 해결 가이드

## 📝 문제 상황
- Supabase 데이터베이스에서 `users` 테이블의 `id` 컬럼이 UUID 타입으로 설정되어 있음
- 기존 코드에서 `"admin-fixed-id-2024"` 같은 문자열을 UUID로 사용하려 해서 오류 발생
- `invalid input syntax for type uuid: "admin-fixed-id-2024"` 에러 발생

## ✅ 해결 완료 사항
1. **AuthContext.tsx**: 관리자 ID를 유효한 UUID 형식(`00000000-0000-4000-8000-000000000001`)으로 변경
2. **main.jsx**: 개발 도구에서도 올바른 UUID v4 형식 생성하도록 수정
3. **UUID 생성 함수**: 이미 올바른 형식으로 구현되어 있음

## 🛠️ Supabase 데이터베이스 정리 (필수!)

### 1. 잘못된 데이터 확인
Supabase SQL Editor에서 실행:

```sql
-- 1. 현재 users 테이블의 잘못된 데이터 확인
SELECT id, name, email, provider 
FROM users 
WHERE id NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- 2. user_levels 테이블의 연관 데이터 확인
SELECT ul.user_id, u.name 
FROM user_levels ul
LEFT JOIN users u ON ul.user_id = u.id
WHERE ul.user_id NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
```

### 2. 잘못된 데이터 삭제
```sql
-- 1. user_levels에서 잘못된 user_id 삭제 (Foreign Key 제약으로 먼저 삭제)
DELETE FROM user_levels 
WHERE user_id NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- 2. users에서 잘못된 ID 삭제
DELETE FROM users 
WHERE id NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

-- 3. 다른 테이블에서도 잘못된 user_id 참조 삭제
DELETE FROM likes 
WHERE user_id NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

DELETE FROM scraps 
WHERE user_id NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

DELETE FROM stories 
WHERE user_id NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

DELETE FROM lounge_posts 
WHERE user_id NOT SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
```

### 3. 올바른 관리자 계정 생성
```sql
-- 새로운 관리자 계정 생성
INSERT INTO users (
    id, 
    name, 
    email, 
    provider, 
    is_admin, 
    is_verified,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-4000-8000-000000000001',
    '관리자',
    'admin@plain.com',
    'admin',
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    provider = EXCLUDED.provider,
    is_admin = EXCLUDED.is_admin,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();

-- 관리자용 레벨 데이터 생성
INSERT INTO user_levels (
    user_id,
    level,
    current_exp,
    total_likes,
    story_promotions,
    total_bookmarks,
    total_posts,
    total_comments,
    excellent_posts,
    achievements,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-4000-8000-000000000001',
    10,
    999999,
    0,
    0,
    0,
    0,
    0,
    0,
    '[]'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO UPDATE SET
    level = EXCLUDED.level,
    current_exp = EXCLUDED.current_exp,
    updated_at = NOW();
```

## 🧪 테스트 방법

### 1. 브라우저 콘솔에서 테스트
```javascript
// 1. 기존 잘못된 세션 데이터 정리
localStorage.clear();
sessionStorage.clear();

// 2. 새로운 관리자 로그인 테스트
Plain.login("admin");

// 3. 사용자 생성 테스트
Plain.testLoungeCreate();

// 4. 올바른 UUID 확인
const user = JSON.parse(localStorage.getItem('plain_user'));
console.log('사용자 ID:', user.id);
console.log('UUID 유효성:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id));
```

### 2. 데이터베이스 확인
```sql
-- 올바른 형식의 사용자만 확인
SELECT id, name, email, provider, is_admin, created_at
FROM users 
WHERE id SIMILAR TO '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
ORDER BY created_at DESC;
```

## 🔍 UUID 형식 검증 함수

JavaScript에서 UUID 유효성 검사:

```javascript
// UUID v4 형식 검증 함수
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

// UUID 생성 함수 (RFC 4122 v4 준수)
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// 테스트
console.log(isValidUUID('00000000-0000-4000-8000-000000000001')); // true
console.log(isValidUUID('admin-fixed-id-2024'));                // false
console.log(generateUUID()); // 유효한 UUID v4 생성
```

## 🚨 주의사항

1. **데이터 백업**: 삭제 작업 전에 반드시 데이터를 백업하세요
2. **Foreign Key 순서**: user_levels → users 순서로 삭제해야 Foreign Key 제약조건 위반을 피할 수 있습니다
3. **기존 데이터 영향**: 기존에 작성된 글이나 데이터가 있다면 사전에 확인 후 작업하세요
4. **브라우저 캐시**: 변경 후 브라우저의 localStorage, sessionStorage를 정리해야 합니다

## ✅ 완료 체크리스트

- [ ] Supabase SQL Editor에서 잘못된 데이터 확인
- [ ] 잘못된 데이터 삭제 (user_levels → users 순서)
- [ ] 올바른 관리자 계정 생성
- [ ] 브라우저에서 localStorage/sessionStorage 정리
- [ ] Plain.login("admin") 테스트
- [ ] 라운지 글 작성 테스트 (Plain.testLoungeCreate())
- [ ] UUID 형식 검증 통과 확인

이 과정을 완료하면 **UUID 형식 오류가 완전히 해결**되고, 관리자 계정으로 정상적으로 글을 작성할 수 있습니다! 🚀