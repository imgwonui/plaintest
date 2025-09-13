import React from 'react';
import { Helmet } from 'react-helmet-async';

// Google Analytics 4 (GA4) 설정
interface GoogleAnalyticsProps {
  measurementId?: string;
}

export const GoogleAnalytics: React.FC<GoogleAnalyticsProps> = ({ 
  measurementId = 'G-XXXXXXXXXX' // 실제 측정 ID로 교체 필요
}) => {
  // 개발 환경에서는 분석 도구 비활성화
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  return (
    <Helmet>
      {/* Google Analytics 4 스크립트 */}
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_title: document.title,
            page_location: window.location.href,
            content_group1: 'HR Community',
            custom_map: {
              'dimension1': 'user_type',
              'dimension2': 'content_category'
            }
          });
          
          // 사용자 정의 이벤트 함수
          window.gtag_report_conversion = function(value) {
            gtag('event', 'conversion', {
              'send_to': '${measurementId}',
              'value': value,
              'currency': 'KRW'
            });
          };
          
          // HR 관련 사용자 정의 이벤트
          window.track_story_view = function(story_id, story_title, category) {
            gtag('event', 'story_view', {
              'story_id': story_id,
              'story_title': story_title,
              'content_category': category,
              'engagement_time_msec': 100
            });
          };
          
          window.track_lounge_interaction = function(post_id, interaction_type) {
            gtag('event', 'lounge_interaction', {
              'post_id': post_id,
              'interaction_type': interaction_type,
              'content_category': 'community'
            });
          };
          
          console.log('📊 Google Analytics 4가 초기화되었습니다: ${measurementId}');
        `}
      </script>
    </Helmet>
  );
};

// Google Search Console 인증
interface SearchConsoleProps {
  verificationCode?: string;
}

export const GoogleSearchConsole: React.FC<SearchConsoleProps> = ({
  verificationCode = 'your-verification-code-here' // 실제 인증 코드로 교체 필요
}) => {
  return (
    <Helmet>
      <meta name="google-site-verification" content={verificationCode} />
    </Helmet>
  );
};

// 네이버 서치어드바이저
interface NaverSearchAdvisorProps {
  verificationCode?: string;
}

export const NaverSearchAdvisor: React.FC<NaverSearchAdvisorProps> = ({
  verificationCode = 'your-naver-verification-code' // 실제 인증 코드로 교체 필요
}) => {
  return (
    <Helmet>
      <meta name="naver-site-verification" content={verificationCode} />
    </Helmet>
  );
};

// Microsoft Bing 웹마스터 도구
interface BingWebmasterProps {
  verificationCode?: string;
}

export const BingWebmaster: React.FC<BingWebmasterProps> = ({
  verificationCode = 'your-bing-verification-code' // 실제 인증 코드로 교체 필요
}) => {
  return (
    <Helmet>
      <meta name="msvalidate.01" content={verificationCode} />
    </Helmet>
  );
};

// 통합 분석 컴포넌트
export const WebAnalytics: React.FC = () => {
  return (
    <>
      <GoogleAnalytics />
      <GoogleSearchConsole />
      <NaverSearchAdvisor />
      <BingWebmaster />
    </>
  );
};

// 페이지뷰 추적 헬퍼 함수
export const trackPageView = (path: string, title: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-XXXXXXXXXX', {
      page_path: path,
      page_title: title,
    });
  }
};

// 이벤트 추적 헬퍼 함수
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// HR 커뮤니티 전용 추적 함수들
export const trackStoryView = (storyId: number, title: string, tags: string[]) => {
  if (typeof window !== 'undefined' && window.track_story_view) {
    window.track_story_view(storyId, title, tags.join(','));
  }
};

export const trackLoungeInteraction = (postId: number, type: 'like' | 'comment' | 'share' | 'bookmark') => {
  if (typeof window !== 'undefined' && window.track_lounge_interaction) {
    window.track_lounge_interaction(postId, type);
  }
};

export const trackSearch = (query: string, results: number) => {
  trackEvent('search', 'engagement', query, results);
};

export const trackDownload = (fileName: string) => {
  trackEvent('download', 'content', fileName);
};

// 타입 선언 확장
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    gtag_report_conversion: (value: number) => void;
    track_story_view: (id: number, title: string, category: string) => void;
    track_lounge_interaction: (id: number, type: string) => void;
  }
}