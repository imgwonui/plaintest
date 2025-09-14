import { createClient } from '@supabase/supabase-js'

// Supabase 연결 설정
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://tbmlxkbdugppyxpzpatx.supabase.co'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRibWx4a2JkdWdwcHl4cHpwYXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczODgyNjcsImV4cCI6MjA3Mjk2NDI2N30.cpO3YykJ0RV4bbsAy_zvBn9zaM54R-qtTfaoR1Nymtg'

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseKey)