-- 태그 카테고리와 기본 태그 초기화
-- 기존 태그 데이터 삭제 후 새로 삽입

-- 기존 데이터 삭제
DELETE FROM tags;
DELETE FROM tag_categories;

-- 태그 카테고리 삽입
INSERT INTO tag_categories (id, name, description, display_order) VALUES
('recruitment', '채용·조직', 'HR 채용 및 조직 관련 태그', 1),
('payroll', '페이롤·세무·4대보험 등', '급여, 세무, 보험 관련 태그', 2),
('hrSystem', '인사제도·평가', '인사평가 및 제도 관련 태그', 3),
('legal', '법·노무', '노동법 및 법적 이슈 관련 태그', 4),
('welfare', '복리후생·근로조건', '복리후생 및 근로환경 관련 태그', 5),
('education', '교육·성장', '직원 교육 및 성장 관련 태그', 6),
('hrtech', 'HR테크·자동화', 'HR 기술 및 자동화 관련 태그', 7),
('etc', '기타', '기타 HR 관련 태그', 8);

-- 기본 태그 삽입
INSERT INTO tags (id, name, category_id, description) VALUES
-- 채용·조직
('recruitment', '채용', 'recruitment', '인재 채용 관련'),
('newbie', '신입사원', 'recruitment', '신입사원 관련'),
('headhunting', '헤드헌팅', 'recruitment', '헤드헌팅 및 스카우트'),
('startup', '스타트업', 'recruitment', '스타트업 HR'),
('career', '커리어', 'recruitment', '커리어 개발 및 관리'),

-- 페이롤·세무·4대보험 등
('salary', '급여', 'payroll', '급여 및 임금 관련'),
('withholdingTax', '원천세', 'payroll', '원천세 및 세금 관련'),
('taxReturn', '세금신고', 'payroll', '세금신고 관련'),
('corporateTax', '법인세', 'payroll', '법인세 관련'),
('bonus', '성과급/보너스', 'payroll', '성과급 및 보너스'),
('severance', '퇴직금', 'payroll', '퇴직금 관련'),
('yearEndTax', '연말정산', 'payroll', '연말정산 관련'),
('insurance', '4대보험', 'payroll', '국민연금, 건강보험, 고용보험, 산재보험'),

-- 인사제도·평가
('evaluation', '인사평가', 'hrSystem', '인사평가 시스템'),
('goalManagement', '목표관리', 'hrSystem', '목표 설정 및 관리'),
('performance', '성과관리', 'hrSystem', '성과 측정 및 관리'),
('leadership', '리더십', 'hrSystem', '리더십 개발'),
('culture', '조직문화', 'hrSystem', '조직문화 구축'),
('workLife', '워라밸', 'hrSystem', '일과 삶의 균형'),
('event', '사내행사', 'hrSystem', '사내 이벤트 및 행사'),

-- 법·노무
('laborLaw', '노동법', 'legal', '노동 관련 법률'),
('retirement', '퇴직', 'legal', '퇴직 관련 법적 이슈'),
('contract', '근로계약', 'legal', '근로계약서 작성'),
('harassment', '직장 내 괴롭힘', 'legal', '직장 내 괴롭힘 방지'),
('privacy', '개인정보보호', 'legal', '개인정보보호 관련'),

-- 복리후생·근로조건
('welfare', '복리후생', 'welfare', '직원 복리후생'),
('welfarePoints', '복지포인트', 'welfare', '복지포인트 제도'),
('remote', '재택근무', 'welfare', '재택근무 관련'),
('attendance', '근태관리', 'welfare', '출근 및 근태 관리'),
('flexTime', '유연근무제', 'welfare', '유연한 근무시간'),
('vacation', '휴가제도', 'welfare', '휴가 및 휴직 제도'),
('parentalLeave', '육아휴직', 'welfare', '육아휴직 관련'),

-- 교육·성장
('training', '사내교육', 'education', '사내 교육 프로그램'),
('jobTraining', '직무교육', 'education', '직무별 전문 교육'),
('mentoring', '멘토링/코칭', 'education', '멘토링 및 코칭'),
('selfDev', '자기계발', 'education', '자기계발 지원'),
('education', '교육', 'education', '일반적인 교육'),

-- HR테크·자동화
('hrPlatform', 'HR플랫폼', 'hrtech', 'HR 관리 플랫폼'),
('ai', 'AI', 'hrtech', 'AI 활용 HR'),
('automation', '자동화', 'hrtech', 'HR 업무 자동화'),

-- 기타
('communication', '소통', 'etc', '조직 내 소통'),
('diversity', '다양성', 'etc', '다양성 및 포용'),
('innovation', '혁신', 'etc', 'HR 혁신'),
('data', '데이터', 'etc', 'HR 데이터 분석');

-- 확인용 쿼리
SELECT 
    tc.name as category_name,
    COUNT(t.id) as tag_count
FROM tag_categories tc
LEFT JOIN tags t ON tc.id = t.category_id
GROUP BY tc.id, tc.name, tc.display_order
ORDER BY tc.display_order;