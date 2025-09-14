-- search_keywords 테이블 RLS 정책 추가
-- 검색 키워드는 모든 사용자가 읽기/쓰기 가능해야 함

-- RLS 비활성화 (검색 키워드는 공개 데이터)
ALTER TABLE search_keywords DISABLE ROW LEVEL SECURITY;

-- 또는 모든 사용자 접근 허용하는 정책 추가하기
-- ALTER TABLE search_keywords ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "search_keywords_select_all" ON search_keywords
--     FOR SELECT USING (true);

-- CREATE POLICY "search_keywords_insert_all" ON search_keywords  
--     FOR INSERT WITH CHECK (true);

-- CREATE POLICY "search_keywords_update_all" ON search_keywords
--     FOR UPDATE USING (true);