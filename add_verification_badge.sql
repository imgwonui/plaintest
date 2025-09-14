-- Add verification_badge column to stories table
ALTER TABLE stories 
ADD COLUMN verification_badge TEXT;

-- Add comment for clarity
COMMENT ON COLUMN stories.verification_badge IS 'Custom verification badge text set by administrators when creating stories';

-- Example: Update existing verified stories with default verification badge
-- UPDATE stories 
-- SET verification_badge = '페이롤 아웃소싱 전문회사인 월급날에서 검수한 글이에요.' 
-- WHERE is_verified = true AND verification_badge IS NULL;