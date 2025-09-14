-- Supabase 테스트 데이터 삽입 스크립트
-- SQL Editor에서 실행하세요

-- 1. 테스트 사용자 생성
INSERT INTO users (id, email, name, provider, is_admin, is_verified, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'test1@plain.com', '김인사', 'kakao', false, false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'test2@plain.com', '이담당', 'google', false, true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'admin@plain.com', '관리자', 'admin', true, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. 사용자 레벨 초기화
INSERT INTO user_levels (user_id, current_exp, level, total_likes, story_promotions, total_bookmarks, total_posts, total_comments, excellent_posts, achievements, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 0, 1, 0, 0, 0, 0, 0, 0, '{}', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 15, 2, 3, 0, 1, 2, 5, 0, '{}', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 50, 5, 10, 2, 5, 8, 12, 2, '{}', NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- 3. 테스트 라운지 포스트 생성
INSERT INTO lounge_posts (title, content, author_id, author_name, type, tags, like_count, scrap_count, comment_count, view_count, is_excellent, created_at, updated_at) VALUES
('React 훅 사용법 질문드려요', '<p>useEffect와 useState를 함께 사용할 때 무한루프가 발생하는데 어떻게 해결하나요?</p><p>코드는 다음과 같습니다...</p>', '550e8400-e29b-41d4-a716-446655440001', '김인사', 'question', '{"recruitment","hrtech"}', 15, 3, 8, 42, false, NOW() - INTERVAL '2 hours', NOW()),

('인사담당자 면접 경험담', '<p>5년차 인사담당자로서 면접관 경험을 공유해보려고 합니다.</p><p>면접에서 중요하게 보는 포인트들과 지원자분들이 자주 하시는 실수들을 정리해봤어요.</p>', '550e8400-e29b-41d4-a716-446655440002', '이담당', 'experience', '{"recruitment","interview"}', 73, 12, 24, 156, true, NOW() - INTERVAL '1 day', NOW()),

('급여 계산 자동화 툴 추천', '<p>매월 급여 계산하는데 시간이 너무 많이 걸려서 자동화 툴을 찾고 있습니다.</p><p>사용해보신 툴 중에 추천해주실 만한 게 있나요?</p>', '550e8400-e29b-41d4-a716-446655440001', '김인사', 'recommend', '{"payroll","automation"}', 28, 7, 15, 89, false, NOW() - INTERVAL '6 hours', NOW()),

('원격근무 정책 도입 후기', '<p>우리 회사가 작년부터 원격근무를 도입했는데, 1년 사용해본 솔직한 후기를 남겨봅니다.</p><p>장점과 단점, 그리고 도입 시 고려사항들을 정리했어요.</p>', '550e8400-e29b-41d4-a716-446655440003', '관리자', 'info', '{"remote","welfare","policy"}', 45, 18, 31, 203, false, NOW() - INTERVAL '12 hours', NOW()),

('신입사원 온보딩 프로세스 공유', '<p>우리 회사의 신입사원 온보딩 프로세스를 공유해봅니다.</p><p>첫 2주 동안의 일정과 체크리스트를 함께 올려드려요.</p>', '550e8400-e29b-41d4-a716-446655440002', '이담당', 'info', '{"newbie","onboarding","process"}', 67, 25, 19, 178, true, NOW() - INTERVAL '8 hours', NOW()),

('익명) 상사와 갈등 상황...', '<p>팀장님과 업무 방식에서 계속 의견이 맞지 않아 스트레스가 심합니다.</p><p>어떻게 접근하는 게 좋을까요? 조언 부탁드립니다.</p>', '550e8400-e29b-41d4-a716-446655440001', '익명', 'anonymous', '{"advice","conflict"}', 32, 5, 27, 134, false, NOW() - INTERVAL '4 hours', NOW());

-- 4. 테스트 댓글 생성
INSERT INTO comments (post_id, post_type, content, author_id, author_name, is_guest, author_verified, created_at, updated_at) VALUES
(1, 'lounge', '의존성 배열을 확인해보세요! useEffect의 두 번째 인자에 빈 배열을 넣으면 컴포넌트 마운트 시에만 실행됩니다.', '550e8400-e29b-41d4-a716-446655440002', '이담당', false, true, NOW() - INTERVAL '1 hour', NOW()),
(1, 'lounge', '감사합니다! 해결되었어요', '550e8400-e29b-41d4-a716-446655440001', '김인사', false, false, NOW() - INTERVAL '30 minutes', NOW()),
(2, 'lounge', '정말 유용한 정보네요. 면접관 관점에서의 조언이라니 감사합니다!', '550e8400-e29b-41d4-a716-446655440001', '김인사', false, false, NOW() - INTERVAL '2 hours', NOW()),
(3, 'lounge', '저희 회사는 OO 툴을 사용하고 있는데, 꽤 괜찮더라구요', '550e8400-e29b-41d4-a716-446655440003', '관리자', false, false, NOW() - INTERVAL '3 hours', NOW());

-- 5. 테스트 좋아요 생성  
INSERT INTO likes (user_id, post_id, post_type, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 2, 'lounge', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440002', 2, 'lounge', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440003', 2, 'lounge', NOW() - INTERVAL '20 hours'),
('550e8400-e29b-41d4-a716-446655440001', 4, 'lounge', NOW() - INTERVAL '10 hours'),
('550e8400-e29b-41d4-a716-446655440002', 4, 'lounge', NOW() - INTERVAL '8 hours'),
('550e8400-e29b-41d4-a716-446655440001', 5, 'lounge', NOW() - INTERVAL '6 hours'),
('550e8400-e29b-41d4-a716-446655440003', 5, 'lounge', NOW() - INTERVAL '4 hours');

-- 6. 테스트 북마크 생성
INSERT INTO scraps (user_id, post_id, post_type, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 2, 'lounge', NOW() - INTERVAL '1 day'),
('550e8400-e29b-41d4-a716-446655440002', 4, 'lounge', NOW() - INTERVAL '8 hours'),
('550e8400-e29b-41d4-a716-446655440001', 5, 'lounge', NOW() - INTERVAL '4 hours');

-- 7. 검색 키워드 업데이트
INSERT INTO search_keywords (keyword, search_count, last_searched, created_at) VALUES
('React', 25, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 week'),
('면접', 18, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '5 days'),
('급여계산', 12, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 days'),
('원격근무', 31, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '1 week'),
('온보딩', 14, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '2 days')
ON CONFLICT (keyword) DO UPDATE SET 
  search_count = search_keywords.search_count + 1,
  last_searched = NOW();

-- 확인 쿼리 (선택사항)
SELECT 
  'lounge_posts' as table_name,
  COUNT(*) as count
FROM lounge_posts
UNION ALL
SELECT 
  'comments' as table_name,
  COUNT(*) as count  
FROM comments
UNION ALL
SELECT 
  'likes' as table_name,
  COUNT(*) as count
FROM likes
UNION ALL
SELECT 
  'scraps' as table_name, 
  COUNT(*) as count
FROM scraps;