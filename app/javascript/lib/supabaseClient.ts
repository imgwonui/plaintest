import { createClient } from '@supabase/supabase-js'

// 환경 변수가 없을 때는 더미 값 사용 (API 연결 전까지)
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://dummy.supabase.co'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'dummy-key'

// API 연결 전까지는 에러를 발생시키지 않음
export const supabase = createClient(supabaseUrl, supabaseKey)