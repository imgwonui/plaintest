-- OAuth 로그인 시스템 수정용 테스트 데이터
-- Supabase SQL Editor에서 실행하세요

-- 1. 김흑흑 사용자 추가/업데이트 (카카오 로그인 테스트)
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
  'https://api.dicebear.com/7.x/avataaars/svg?seed=kimheukheuk',  -- 프로필 이미지
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

-- 2. 김인사 사용자 업데이트 (기존 사용자에 avatar_url 추가)
UPDATE users
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=kiminsa',
    updated_at = NOW()
WHERE id = '550e8400-e29b-41d4-a716-446655440001';

-- 3. 이담당 사용자 업데이트 (구글 로그인 테스트용 avatar_url 추가)
UPDATE users
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=leedamdang',
    updated_at = NOW()
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

-- 4. 김구글 사용자 추가 (구글 로그인 추가 테스트)
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
  '550e8400-e29b-41d4-a716-446655440012',  -- 고정 ID
  'kimgoogle@gmail.com',
  '김구글',
  'google',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=kimgoogle',
  false,
  true,
  '구글 로그인 테스트 사용자입니다.',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  provider = EXCLUDED.provider,
  avatar_url = EXCLUDED.avatar_url,
  bio = EXCLUDED.bio,
  is_verified = EXCLUDED.is_verified,
  updated_at = NOW();

-- 5. 사용자 레벨 초기화 (새로 추가된 사용자들)
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
) VALUES
  ('550e8400-e29b-41d4-a716-446655440010', 0, 1, 0, 0, 0, 0, 0, 0, '{}', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440012', 5, 1, 0, 0, 0, 0, 0, 0, '{}', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- 6. 김흑흑이 작성한 테스트 댓글 (avatar_url 테스트용)
INSERT INTO comments (
  post_id,
  post_type,
  content,
  author_id,
  author_name,
  is_guest,
  author_verified,
  created_at,
  updated_at
) VALUES (
  1,  -- 첫 번째 라운지 포스트
  'lounge',
  '김흑흑입니다. 프로필 사진이 잘 보이나요?',
  '550e8400-e29b-41d4-a716-446655440010',
  '김흑흑',
  false,
  false,
  NOW(),
  NOW()
);

-- 확인 쿼리
SELECT
  id,
  name,
  email,
  provider,
  avatar_url,
  bio
FROM users
WHERE provider IN ('kakao', 'google')
ORDER BY created_at DESC;

-- 댓글과 작성자 프로필 정보 확인
SELECT
  c.id,
  c.content,
  c.author_name,
  c.author_id,
  u.avatar_url as author_avatar_url,
  u.provider
FROM comments c
LEFT JOIN users u ON c.author_id = u.id
WHERE c.post_type = 'lounge'
  AND c.post_id = 1
ORDER BY c.created_at DESC
LIMIT 10;