-- 중복 사용자 문제 해결 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. 현재 사용자 상태 확인
SELECT id, name, email, provider, created_at
FROM users
WHERE name LIKE '%김흑흑%' OR email LIKE '%heukheuk%'
ORDER BY created_at DESC;

-- 2. 잘못된 중복 사용자 삭제 (가장 오래된 것만 남기고 삭제)
DELETE FROM users
WHERE id = 'fe68ca34-c806-48ae-b385-ac98eddc5320';

-- 3. 김흑흑 사용자 재생성/업데이트 (올바른 고정 ID로)
INSERT INTO users (
  id,
  email,
  name,
  provider,
  avatar_url,
  is_admin,
  is_verified,
  bio,
  created_at,
  updated_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440010',  -- 고정 ID
  'heukheuk@kakao.com',
  '김흑흑',
  'kakao',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=kimheukheuk',
  false,
  false,
  '카카오 로그인 테스트 사용자입니다.',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  provider = EXCLUDED.provider,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  updated_at = NOW();

-- 4. 사용자 레벨 데이터도 정리
DELETE FROM user_levels WHERE user_id = 'fe68ca34-c806-48ae-b385-ac98eddc5320';

INSERT INTO user_levels (
  user_id,
  current_exp,
  level,
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
  '550e8400-e29b-41d4-a716-446655440010',
  0,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  '{}',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- 5. 최종 확인
SELECT id, name, email, provider, avatar_url
FROM users
WHERE provider = 'kakao'
ORDER BY created_at DESC;