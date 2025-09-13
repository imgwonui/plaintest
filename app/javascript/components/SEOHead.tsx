import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  tags?: string[];
}

const SEOHead: React.FC<SEOProps> = ({
  title = 'Plain - 인사담당자를 위한 이야기와 라운지',
  description = 'HR 전문가들의 실무 경험과 노하우를 공유하는 커뮤니티. 채용, 교육, 평가, 조직문화 등 인사업무의 모든 것을 함께 나눕니다.',
  keywords = 'HR, 인사, 인사담당자, 채용, 면접, 온보딩, 성과평가, 조직문화, 인사관리, 커뮤니티',
  image = '/logo/plain.png',
  url = 'https://plain-hr.com',
  type = 'website',
  author,
  publishedTime,
  tags = []
}) => {
  const fullTitle = title.includes('Plain') ? title : `${title} | Plain`;
  const fullUrl = url.startsWith('http') ? url : `https://plain-hr.com${url}`;
  const fullImage = image.startsWith('http') ? image : `https://plain-hr.com${image}`;

  return (
    <Helmet>
      {/* 기본 메타태그 */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author || 'Plain HR Community'} />
      
      {/* Open Graph 태그 */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content="Plain" />
      <meta property="og:locale" content="ko_KR" />
      
      {/* Twitter 카드 */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Article 전용 메타태그 */}
      {type === 'article' && (
        <>
          <meta property="article:author" content={author} />
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* 추가 SEO 메타태그 */}
      <meta name="robots" content="index,follow" />
      <meta name="googlebot" content="index,follow" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#7A5AF8" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Language alternatives */}
      <link rel="alternate" hrefLang="ko" href={fullUrl} />
      
      {/* Preconnect to improve performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://images.unsplash.com" />
    </Helmet>
  );
};

export default SEOHead;