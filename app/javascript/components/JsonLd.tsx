import React from 'react';
import { Helmet } from 'react-helmet-async';

// Article 스키마 타입
interface ArticleSchema {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  keywords?: string[];
  url: string;
  readTime?: number;
}

// QAPage 스키마 타입  
interface QASchema {
  title: string;
  question: string;
  answer: string;
  author: string;
  datePublished: string;
  url: string;
  tags?: string[];
}

// Organization 스키마 타입
interface OrganizationSchema {
  name: string;
  description: string;
  url: string;
  logo?: string;
  sameAs?: string[];
}

// Article JSON-LD 컴포넌트
export const ArticleJsonLd: React.FC<ArticleSchema> = ({
  title,
  description,
  author,
  datePublished,
  dateModified,
  image,
  keywords,
  url,
  readTime
}) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    author: {
      '@type': 'Person',
      name: author
    },
    datePublished: datePublished,
    dateModified: dateModified || datePublished,
    publisher: {
      '@type': 'Organization',
      name: 'Plain',
      logo: {
        '@type': 'ImageObject',
        url: 'https://plain-hr.com/logo/plain.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://plain-hr.com${url}`
    },
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image,
        width: 800,
        height: 400
      }
    }),
    ...(keywords && {
      keywords: keywords.join(', ')
    }),
    ...(readTime && {
      timeRequired: `PT${readTime}M`
    }),
    inLanguage: 'ko-KR',
    audience: {
      '@type': 'Audience',
      audienceType: 'HR professionals, Human Resources managers'
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

// QAPage JSON-LD 컴포넌트
export const QAPageJsonLd: React.FC<QASchema> = ({
  title,
  question,
  answer,
  author,
  datePublished,
  url,
  tags
}) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: title,
      text: question,
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
        author: {
          '@type': 'Person',
          name: author
        },
        dateCreated: datePublished,
        upvoteCount: 0
      },
      author: {
        '@type': 'Person',
        name: author
      },
      dateCreated: datePublished
    },
    url: `https://plain-hr.com${url}`,
    ...(tags && {
      keywords: tags.join(', ')
    }),
    inLanguage: 'ko-KR',
    audience: {
      '@type': 'Audience',
      audienceType: 'HR professionals, Human Resources managers'
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

// Organization JSON-LD 컴포넌트
export const OrganizationJsonLd: React.FC<OrganizationSchema> = ({
  name,
  description,
  url,
  logo,
  sameAs
}) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: name,
    description: description,
    url: url,
    ...(logo && {
      logo: {
        '@type': 'ImageObject',
        url: logo
      }
    }),
    ...(sameAs && {
      sameAs: sameAs
    }),
    foundingDate: '2024',
    knowsAbout: [
      'Human Resources',
      'HR Management',
      '인사관리',
      '채용',
      '조직문화',
      '성과평가',
      '온보딩'
    ],
    areaServed: {
      '@type': 'Country',
      name: 'South Korea'
    },
    audience: {
      '@type': 'Audience',
      audienceType: 'HR professionals, Human Resources managers'
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

// WebSite JSON-LD 컴포넌트
export const WebSiteJsonLd: React.FC = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Plain',
    description: 'HR 전문가들의 실무 경험과 노하우를 공유하는 커뮤니티',
    url: 'https://plain-hr.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://plain-hr.com/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    },
    inLanguage: 'ko-KR',
    audience: {
      '@type': 'Audience',
      audienceType: 'HR professionals, Human Resources managers'
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};

// Breadcrumb JSON-LD 컴포넌트
interface BreadcrumbItem {
  name: string;
  url: string;
}

export const BreadcrumbJsonLd: React.FC<{ items: BreadcrumbItem[] }> = ({ items }) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://plain-hr.com${item.url}`
    }))
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};