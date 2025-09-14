-- search_keywords 테이블의 더미 데이터 삭제
-- 실제 검색어 추가 기능이 제대로 작동하는지 확인하기 위함

-- 기존 검색 키워드 데이터 모두 삭제
DELETE FROM search_keywords;

-- 테이블 초기화 확인
SELECT COUNT(*) as remaining_count FROM search_keywords;