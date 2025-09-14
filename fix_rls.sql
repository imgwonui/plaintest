-- RLS 정책 수정 (개발용)
-- Supabase SQL Editor에서 실행하세요

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Logged users can create lounge posts" ON lounge_posts;

-- 새로운 정책 생성 (모든 사용자가 작성 가능)
CREATE POLICY "Anyone can create lounge posts" ON lounge_posts
    FOR INSERT WITH CHECK (true);

-- 댓글 정책도 수정
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
CREATE POLICY "Anyone can create comments" ON comments
    FOR INSERT WITH CHECK (true);

-- 사용자 테이블 정책 수정 (개발용)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Anyone can view users" ON users
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update users" ON users
    FOR UPDATE USING (true);

-- 좋아요/북마크 정책도 수정
DROP POLICY IF EXISTS "Users can manage own likes" ON likes;
CREATE POLICY "Anyone can manage likes" ON likes
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can manage own scraps" ON scraps;
CREATE POLICY "Anyone can manage scraps" ON scraps
    FOR ALL USING (true);
