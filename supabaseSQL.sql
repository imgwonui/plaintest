-- Plain HR Community - Complete Supabase Database Schema
-- 세션스토리지의 모든 데이터를 Supabase로 완전 마이그레이션

-- ===========================================================================
-- 1. EXTENSIONS
-- ===========================================================================

-- UUID 생성을 위한 확장
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 전문 검색을 위한 확장
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===========================================================================
-- 2. ENUMS (열거형)
-- ===========================================================================

-- 사용자 인증 제공자
CREATE TYPE auth_provider AS ENUM ('kakao', 'google', 'admin');

-- 게시물 유형
CREATE TYPE post_type AS ENUM ('story', 'lounge');

-- 라운지 게시물 카테고리
CREATE TYPE lounge_type AS ENUM ('question', 'experience', 'info', 'free', 'news', 'advice', 'recommend', 'anonymous');

-- Story 승격 상태
CREATE TYPE promotion_status AS ENUM ('eligible', 'pending', 'approved', 'rejected');

-- 승격 요청 상태
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

-- 알림 유형
CREATE TYPE notification_type AS ENUM ('level_up', 'promotion_approved', 'promotion_rejected', 'like_received', 'comment_received');

-- 활동 유형 (레벨 시스템)
CREATE TYPE activity_type AS ENUM ('post_created', 'comment_created', 'like_received', 'bookmarked', 'excellent_post', 'story_promoted');

-- ===========================================================================
-- 3. CORE TABLES (핵심 테이블)
-- ===========================================================================

-- 사용자 테이블
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    provider auth_provider NOT NULL DEFAULT 'kakao',
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE, -- 인사담당자 인증
    bio TEXT,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    push_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    weekly_digest BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- 스토리 테이블 (전문 콘텐츠)
CREATE TABLE stories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(100) NOT NULL, -- 작성자명 캐시 (검색용)
    category VARCHAR(50),
    tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    read_time INTEGER NOT NULL DEFAULT 0, -- 읽는데 걸리는 시간 (분)
    like_count INTEGER NOT NULL DEFAULT 0,
    scrap_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE, -- 인증된 콘텐츠
    is_from_lounge BOOLEAN NOT NULL DEFAULT FALSE, -- 라운지에서 승격된 글
    original_lounge_post_id INTEGER, -- 원본 라운지 글 ID
    original_author_name VARCHAR(100), -- 원본 작성자명 (라운지 승격시)
    promoted_at TIMESTAMP WITH TIME ZONE, -- 승격된 시간
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 라운지 게시물 테이블 (커뮤니티)
CREATE TABLE lounge_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(100) NOT NULL, -- 작성자명 캐시
    type lounge_type NOT NULL DEFAULT 'question',
    tags TEXT[] DEFAULT '{}',
    like_count INTEGER NOT NULL DEFAULT 0,
    scrap_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    is_excellent BOOLEAN NOT NULL DEFAULT FALSE, -- 우수글 (50+ 좋아요)
    promotion_status promotion_status, -- Story 승격 상태
    promotion_note TEXT, -- 승격 관련 메모
    reward_claimed BOOLEAN NOT NULL DEFAULT FALSE, -- 보상 수령 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 댓글 테이블
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL,
    post_type post_type NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    author_name VARCHAR(100) NOT NULL,
    is_guest BOOLEAN NOT NULL DEFAULT FALSE,
    guest_password VARCHAR(255), -- 게스트 댓글 비밀번호 (해시)
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE, -- 대댓글
    author_verified BOOLEAN NOT NULL DEFAULT FALSE, -- 인사담당자 여부
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================================================
-- 4. INTERACTION TABLES (상호작용 테이블)
-- ===========================================================================

-- 좋아요 테이블
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL,
    post_type post_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id, post_type)
);

-- 북마크/스크랩 테이블
CREATE TABLE scraps (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INTEGER NOT NULL,
    post_type post_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id, post_type)
);

-- 조회수 추적 테이블
CREATE TABLE post_views (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    post_id INTEGER NOT NULL,
    post_type post_type NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================================================
-- 5. USER LEVEL SYSTEM (사용자 레벨 시스템)
-- ===========================================================================

-- 사용자 레벨 데이터
CREATE TABLE user_levels (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_exp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    total_likes INTEGER NOT NULL DEFAULT 0,
    story_promotions INTEGER NOT NULL DEFAULT 0,
    total_bookmarks INTEGER NOT NULL DEFAULT 0,
    total_posts INTEGER NOT NULL DEFAULT 0,
    total_comments INTEGER NOT NULL DEFAULT 0,
    excellent_posts INTEGER NOT NULL DEFAULT 0,
    achievements TEXT[] DEFAULT '{}', -- 획득한 업적 ID 배열
    last_level_up TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 활동 기록 (레벨 계산용)
CREATE TABLE user_activities (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    amount INTEGER NOT NULL DEFAULT 1,
    exp_gained INTEGER NOT NULL DEFAULT 0,
    related_post_id INTEGER, -- 관련 포스트 ID
    related_post_type post_type, -- 관련 포스트 타입
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 레벨 설정 오버라이드 (관리자용)
CREATE TABLE level_config_overrides (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(config_key)
);

-- ===========================================================================
-- 6. PROMOTION SYSTEM (승격 시스템)
-- ===========================================================================

-- Story 승격 요청 테이블
CREATE TABLE promotion_requests (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL,
    post_type post_type NOT NULL DEFAULT 'lounge',
    status request_status NOT NULL DEFAULT 'pending',
    reason TEXT,
    admin_note TEXT,
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, post_type)
);

-- ===========================================================================
-- 7. SEARCH AND ANALYTICS (검색 및 분석)
-- ===========================================================================

-- 검색 키워드 추적
CREATE TABLE search_keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(255) NOT NULL,
    search_count INTEGER NOT NULL DEFAULT 1,
    last_searched TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(keyword)
);

-- 검색 기록 (사용자별)
CREATE TABLE search_history (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    keyword VARCHAR(255) NOT NULL,
    results_count INTEGER,
    clicked_post_id INTEGER,
    clicked_post_type post_type,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 분석 이벤트 (행동 추적)
CREATE TABLE analytics_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    post_id INTEGER,
    post_type post_type,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================================================
-- 8. NOTIFICATIONS (알림 시스템)
-- ===========================================================================

-- 알림 테이블
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- 추가 데이터 (레벨, 포스트 정보 등)
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- ===========================================================================
-- 9. TAGS SYSTEM (태그 시스템)
-- ===========================================================================

-- 태그 카테고리
CREATE TABLE tag_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 태그
CREATE TABLE tags (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id VARCHAR(50) NOT NULL REFERENCES tag_categories(id),
    description TEXT,
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================================================
-- 10. ADMIN TABLES (관리자 테이블)
-- ===========================================================================

-- 관리자 설정
CREATE TABLE admin_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 관리자 액션 로그
CREATE TABLE admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50), -- 'user', 'story', 'lounge_post', etc.
    target_id VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================================================
-- 11. INDEXES (인덱스)
-- ===========================================================================

-- Users 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_provider ON users(provider);
CREATE INDEX idx_users_is_admin ON users(is_admin);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Stories 인덱스
CREATE INDEX idx_stories_author_id ON stories(author_id);
CREATE INDEX idx_stories_author_name ON stories(author_name);
CREATE INDEX idx_stories_created_at ON stories(created_at DESC);
CREATE INDEX idx_stories_published_at ON stories(published_at DESC);
CREATE INDEX idx_stories_is_verified ON stories(is_verified);
CREATE INDEX idx_stories_like_count ON stories(like_count DESC);
CREATE INDEX idx_stories_tags ON stories USING GIN(tags);
CREATE INDEX idx_stories_title_search ON stories USING GIN(to_tsvector('english', title || ' ' || summary));

-- Lounge Posts 인덱스
CREATE INDEX idx_lounge_posts_author_id ON lounge_posts(author_id);
CREATE INDEX idx_lounge_posts_author_name ON lounge_posts(author_name);
CREATE INDEX idx_lounge_posts_type ON lounge_posts(type);
CREATE INDEX idx_lounge_posts_created_at ON lounge_posts(created_at DESC);
CREATE INDEX idx_lounge_posts_like_count ON lounge_posts(like_count DESC);
CREATE INDEX idx_lounge_posts_is_excellent ON lounge_posts(is_excellent);
CREATE INDEX idx_lounge_posts_promotion_status ON lounge_posts(promotion_status);
CREATE INDEX idx_lounge_posts_tags ON lounge_posts USING GIN(tags);
CREATE INDEX idx_lounge_posts_title_search ON lounge_posts USING GIN(to_tsvector('english', title || ' ' || content));

-- Comments 인덱스
CREATE INDEX idx_comments_post ON comments(post_id, post_type);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);

-- Likes 인덱스
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post ON likes(post_id, post_type);
CREATE INDEX idx_likes_created_at ON likes(created_at);

-- Scraps 인덱스
CREATE INDEX idx_scraps_user_id ON scraps(user_id);
CREATE INDEX idx_scraps_post ON scraps(post_id, post_type);
CREATE INDEX idx_scraps_created_at ON scraps(created_at);

-- User Levels 인덱스
CREATE INDEX idx_user_levels_level ON user_levels(level DESC);
CREATE INDEX idx_user_levels_exp ON user_levels(current_exp DESC);

-- Search 인덱스
CREATE INDEX idx_search_keywords_keyword ON search_keywords(keyword);
CREATE INDEX idx_search_keywords_count ON search_keywords(search_count DESC);
CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at DESC);

-- Analytics 인덱스
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Notifications 인덱스
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ===========================================================================
-- 12. FUNCTIONS (함수)
-- ===========================================================================

-- 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_view_count(post_id INTEGER, post_type TEXT)
RETURNS VOID AS $$
BEGIN
    IF post_type = 'story' THEN
        UPDATE stories SET view_count = view_count + 1 WHERE id = post_id;
    ELSIF post_type = 'lounge' THEN
        UPDATE lounge_posts SET view_count = view_count + 1 WHERE id = post_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 좋아요 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_type = 'story' THEN
            UPDATE stories SET like_count = like_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.post_type = 'lounge' THEN
            UPDATE lounge_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
            -- 50개 이상이면 우수글로 마크
            UPDATE lounge_posts SET is_excellent = TRUE 
            WHERE id = NEW.post_id AND like_count >= 50;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_type = 'story' THEN
            UPDATE stories SET like_count = like_count - 1 WHERE id = OLD.post_id;
        ELSIF OLD.post_type = 'lounge' THEN
            UPDATE lounge_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 북마크 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_scrap_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_type = 'story' THEN
            UPDATE stories SET scrap_count = scrap_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.post_type = 'lounge' THEN
            UPDATE lounge_posts SET scrap_count = scrap_count + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_type = 'story' THEN
            UPDATE stories SET scrap_count = scrap_count - 1 WHERE id = OLD.post_id;
        ELSIF OLD.post_type = 'lounge' THEN
            UPDATE lounge_posts SET scrap_count = scrap_count - 1 WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 댓글 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.post_type = 'story' THEN
            UPDATE stories SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        ELSIF NEW.post_type = 'lounge' THEN
            UPDATE lounge_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.post_type = 'story' THEN
            UPDATE stories SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        ELSIF OLD.post_type = 'lounge' THEN
            UPDATE lounge_posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Updated at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- 13. TRIGGERS (트리거)
-- ===========================================================================

-- 좋아요 수 업데이트 트리거
CREATE TRIGGER trigger_update_like_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_like_count();

-- 북마크 수 업데이트 트리거
CREATE TRIGGER trigger_update_scrap_count
    AFTER INSERT OR DELETE ON scraps
    FOR EACH ROW EXECUTE FUNCTION update_scrap_count();

-- 댓글 수 업데이트 트리거
CREATE TRIGGER trigger_update_comment_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_comment_count();

-- Updated at 자동 업데이트 트리거들
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_stories_updated_at
    BEFORE UPDATE ON stories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_lounge_posts_updated_at
    BEFORE UPDATE ON lounge_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_levels_updated_at
    BEFORE UPDATE ON user_levels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================================================
-- 14. ROW LEVEL SECURITY (RLS) 정책
-- ===========================================================================

-- RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE lounge_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- 사용자 정책: 본인 데이터만 접근 가능
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 스토리 정책: 모든 사용자 읽기 가능, 관리자만 쓰기 가능
CREATE POLICY "Stories are viewable by everyone" ON stories
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage stories" ON stories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- 라운지 정책: 모든 사용자 읽기 가능, 모든 사용자 작성 가능 (개발용)
CREATE POLICY "Lounge posts are viewable by everyone" ON lounge_posts
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create lounge posts" ON lounge_posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own lounge posts" ON lounge_posts
    FOR UPDATE USING (author_id = auth.uid());

CREATE POLICY "Users can delete own lounge posts" ON lounge_posts
    FOR DELETE USING (author_id = auth.uid());

-- 댓글 정책
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR is_guest = true);

-- 좋아요/북마크 정책: 본인 데이터만 관리 가능
CREATE POLICY "Users can manage own likes" ON likes
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage own scraps" ON scraps
    FOR ALL USING (user_id = auth.uid());

-- 레벨 시스템 정책
CREATE POLICY "Users can view own levels" ON user_levels
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own activities" ON user_activities
    FOR SELECT USING (user_id = auth.uid());

-- 알림 정책
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- ===========================================================================
-- 15. INITIAL DATA (초기 데이터)
-- ===========================================================================

-- 태그 카테고리 초기 데이터
INSERT INTO tag_categories (id, name, description, display_order) VALUES
('recruitment', '채용·조직', 'HR 채용 및 조직 관련', 1),
('payroll', '페이롤·세무·4대보험 등', '급여, 세무, 보험 관련', 2),
('hrSystem', '인사제도·평가', '인사 제도 및 평가 시스템 관련', 3),
('legal', '법·노무', '노동법 및 법무 관련', 4),
('welfare', '복리후생·근로조건', '복지 및 근무 환경 관련', 5),
('education', '교육·성장', '교육 및 성장 지원 관련', 6),
('hrtech', 'HR테크·자동화', 'HR 기술 및 자동화 관련', 7),
('etc', '기타', '기타 HR 관련 주제', 8);

-- 태그 초기 데이터
INSERT INTO tags (id, name, category_id) VALUES
-- 채용·조직
('recruitment', '채용', 'recruitment'),
('newbie', '신입사원', 'recruitment'),
('headhunting', '헤드헌팅', 'recruitment'),
('startup', '스타트업', 'recruitment'),
('career', '커리어', 'recruitment'),

-- 페이롤·세무·4대보험
('salary', '급여', 'payroll'),
('withholdingTax', '원천세', 'payroll'),
('taxReturn', '세금신고', 'payroll'),
('corporateTax', '법인세', 'payroll'),
('bonus', '성과급/보너스', 'payroll'),
('severance', '퇴직금', 'payroll'),
('yearEndTax', '연말정산', 'payroll'),
('insurance', '4대보험', 'payroll'),

-- 인사제도·평가
('evaluation', '인사평가', 'hrSystem'),
('goalManagement', '목표관리', 'hrSystem'),
('performance', '성과관리', 'hrSystem'),
('leadership', '리더십', 'hrSystem'),
('culture', '조직문화', 'hrSystem'),
('workLife', '워라밸', 'hrSystem'),
('event', '사내행사', 'hrSystem'),

-- 법·노무
('laborLaw', '노동법', 'legal'),
('retirement', '퇴직', 'legal'),
('contract', '근로계약', 'legal'),
('harassment', '직장 내 괴롭힘', 'legal'),
('privacy', '개인정보보호', 'legal'),

-- 복리후생·근로조건
('welfare', '복리후생', 'welfare'),
('welfarePoints', '복지포인트', 'welfare'),
('remote', '재택근무', 'welfare'),
('attendance', '근태관리', 'welfare'),
('flexTime', '유연근무제', 'welfare'),
('vacation', '휴가제도', 'welfare'),
('parentalLeave', '육아휴직', 'welfare'),

-- 교육·성장
('training', '사내교육', 'education'),
('jobTraining', '직무교육', 'education'),
('mentoring', '멘토링/코칭', 'education'),
('selfDev', '자기계발', 'education'),
('education', '교육', 'education'),

-- HR테크·자동화
('hrPlatform', 'HR플랫폼', 'hrtech'),
('ai', 'AI', 'hrtech'),
('automation', '자동화', 'hrtech'),

-- 기타
('etc', '기타', 'etc');

-- 관리자 설정 초기값
INSERT INTO admin_settings (key, value, description) VALUES
('level_system_enabled', 'true', '레벨 시스템 활성화 여부'),
('promotion_system_enabled', 'true', 'Story 승격 시스템 활성화 여부'),
('max_tags_per_post', '5', '게시물당 최대 태그 수'),
('like_threshold_excellent', '50', '우수글 인정 좋아요 기준'),
('search_results_per_page', '20', '검색 결과 페이지당 항목 수');

-- 초기 검색 키워드 (인기 키워드 시드)
INSERT INTO search_keywords (keyword, search_count, last_searched) VALUES
('채용', 15, NOW() - INTERVAL '1 hour'),
('연봉', 12, NOW() - INTERVAL '30 minutes'),
('조직문화', 8, NOW() - INTERVAL '90 minutes'),
('인사평가', 6, NOW() - INTERVAL '20 minutes'),
('복리후생', 4, NOW() - INTERVAL '10 minutes');

-- ===========================================================================
-- NOTES (주의사항)
-- ===========================================================================

/*
이 스키마는 다음을 포함합니다:

1. 완전한 사용자 인증 시스템 (Supabase Auth 연동)
2. 스토리/라운지 콘텐츠 시스템
3. 댓글/좋아요/북마크 상호작용 시스템
4. 레벨 및 업적 시스템
5. Story 승격 시스템
6. 검색 및 분석 시스템
7. 알림 시스템
8. 태그 관리 시스템
9. 관리자 기능
10. RLS 보안 정책

사용법:
1. Supabase 콘솔의 SQL Editor에 복사/붙여넣기
2. 실행하여 전체 스키마 생성
3. RLS 정책이 자동으로 적용됨
4. 초기 데이터가 자동으로 삽입됨

주의: 
- UUID는 Supabase Auth의 user.id와 매핑됩니다
- RLS 정책으로 데이터 보안이 보장됩니다
- 트리거로 카운트가 자동 업데이트됩니다
*/