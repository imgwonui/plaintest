const fs = require('fs');
const path = require('path');

// 데이터 파일들 import
const { stories } = require('../data/stories.js');
const { loungePosts } = require('../data/lounge.js');

// 사이트 기본 URL
const BASE_URL = 'https://plain-hr.com';

// 정적 페이지들
const staticPages = [
  {
    url: '/',
    changefreq: 'daily',
    priority: '1.0',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/story',
    changefreq: 'daily',
    priority: '0.9',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/lounge',
    changefreq: 'daily',
    priority: '0.9',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/about',
    changefreq: 'monthly',
    priority: '0.5',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/terms',
    changefreq: 'yearly',
    priority: '0.3',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/privacy',
    changefreq: 'yearly',
    priority: '0.3',
    lastmod: new Date().toISOString().split('T')[0]
  }
];

// Story 페이지들
const storyPages = stories.map(story => ({
  url: `/story/${story.id}`,
  changefreq: 'weekly',
  priority: '0.8',
  lastmod: new Date(story.createdAt).toISOString().split('T')[0]
}));

// Lounge 페이지들
const loungePages = loungePosts.map(post => ({
  url: `/lounge/${post.id}`,
  changefreq: 'weekly',
  priority: '0.7',
  lastmod: new Date(post.createdAt).toISOString().split('T')[0]
}));

// 모든 페이지 합치기
const allPages = [...staticPages, ...storyPages, ...loungePages];

// XML 사이트맵 생성
function generateSitemap() {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
  
  const xmlFooter = `</urlset>`;
  
  const urls = allPages.map(page => `
  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');
  
  return xmlHeader + urls + '\n' + xmlFooter;
}

// HTML 사이트맵 생성 (사용자용)
function generateHtmlSitemap() {
  const htmlHeader = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>사이트맵 - Plain</title>
  <style>
    body { 
      font-family: 'Pretendard Variable', Pretendard, -apple-system, sans-serif; 
      line-height: 1.6; 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 20px;
      color: #333;
    }
    h1 { color: #7A5AF8; }
    h2 { 
      color: #4a5568; 
      border-bottom: 2px solid #e2e8f0; 
      padding-bottom: 5px; 
      margin-top: 30px;
    }
    ul { list-style-type: none; padding: 0; }
    li { 
      margin: 8px 0; 
      padding: 8px;
      border-left: 3px solid #7A5AF8;
      background-color: #f7fafc;
    }
    a { 
      color: #7A5AF8; 
      text-decoration: none; 
      font-weight: 500;
    }
    a:hover { text-decoration: underline; }
    .meta { 
      font-size: 0.85em; 
      color: #718096; 
      margin-top: 4px; 
    }
    .count {
      background: #7A5AF8;
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      margin-left: 10px;
    }
  </style>
</head>
<body>
  <h1>Plain 사이트맵</h1>
  <p>Plain HR 커뮤니티의 모든 페이지를 한 눈에 확인하세요.</p>`;

  const htmlFooter = `
  <hr style="margin: 40px 0; border: none; border-top: 1px solid #e2e8f0;">
  <p style="text-align: center; color: #718096; font-size: 0.9em;">
    <strong>Plain</strong> - 인사담당자를 위한 이야기와 라운지<br>
    마지막 업데이트: ${new Date().toLocaleDateString('ko-KR')}
  </p>
</body>
</html>`;

  // 섹션별 그룹화
  const mainPages = staticPages.filter(p => ['/', '/story', '/lounge'].includes(p.url));
  const subPages = staticPages.filter(p => !['/'].includes(p.url) && !['/', '/story', '/lounge'].includes(p.url));
  
  let htmlContent = htmlHeader;
  
  // 메인 페이지들
  htmlContent += `
  <h2>메인 페이지</h2>
  <ul>`;
  mainPages.forEach(page => {
    const title = page.url === '/' ? '홈' : 
                  page.url === '/story' ? 'Story' : 
                  page.url === '/lounge' ? 'Lounge' : page.url;
    htmlContent += `
    <li>
      <a href="${BASE_URL}${page.url}">${title}</a>
      <div class="meta">우선순위: ${page.priority} | 업데이트: ${page.changefreq}</div>
    </li>`;
  });
  htmlContent += `</ul>`;

  // Story 아티클들
  htmlContent += `
  <h2>Story 아티클 <span class="count">${stories.length}개</span></h2>
  <ul>`;
  stories.forEach(story => {
    htmlContent += `
    <li>
      <a href="${BASE_URL}/story/${story.id}">${story.title}</a>
      <div class="meta">
        작성자: ${story.author} | 
        작성일: ${new Date(story.createdAt).toLocaleDateString('ko-KR')} | 
        태그: ${story.tags ? story.tags.join(', ') : '없음'}
      </div>
    </li>`;
  });
  htmlContent += `</ul>`;

  // Lounge 게시글들
  htmlContent += `
  <h2>Lounge 게시글 <span class="count">${loungePosts.length}개</span></h2>
  <ul>`;
  loungePosts.forEach(post => {
    const typeText = post.type === 'question' ? '질문' : 
                     post.type === 'experience' ? '경험담' : 
                     post.type === 'help' ? '도움' : '일반';
    htmlContent += `
    <li>
      <a href="${BASE_URL}/lounge/${post.id}">${post.title}</a>
      <div class="meta">
        유형: ${typeText} | 
        작성자: ${post.author} | 
        작성일: ${new Date(post.createdAt).toLocaleDateString('ko-KR')} |
        ${post.isExcellent ? '⭐ 우수글 | ' : ''}
        조회수: ${post.views || 0}회
      </div>
    </li>`;
  });
  htmlContent += `</ul>`;

  // 기타 페이지들
  if (subPages.length > 0) {
    htmlContent += `
    <h2>기타 페이지</h2>
    <ul>`;
    subPages.forEach(page => {
      const title = page.url === '/about' ? '소개' : 
                    page.url === '/terms' ? '이용약관' : 
                    page.url === '/privacy' ? '개인정보처리방침' : page.url;
      htmlContent += `
      <li>
        <a href="${BASE_URL}${page.url}">${title}</a>
        <div class="meta">우선순위: ${page.priority} | 업데이트: ${page.changefreq}</div>
      </li>`;
    });
    htmlContent += `</ul>`;
  }
  
  return htmlContent + htmlFooter;
}

// 사이트맵 통계 생성
function generateSitemapStats() {
  const stats = {
    총_페이지수: allPages.length,
    정적_페이지: staticPages.length,
    Story_아티클: stories.length,
    Lounge_게시글: loungePosts.length,
    생성일시: new Date().toISOString(),
    최근_컨텐츠_날짜: Math.max(
      ...stories.map(s => new Date(s.createdAt).getTime()),
      ...loungePosts.map(p => new Date(p.createdAt).getTime())
    )
  };
  
  return JSON.stringify(stats, null, 2);
}

// 파일 저장
function saveSitemaps() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // public 디렉토리가 없으면 생성
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  // XML 사이트맵 저장
  const xmlSitemap = generateSitemap();
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xmlSitemap);
  
  // HTML 사이트맵 저장  
  const htmlSitemap = generateHtmlSitemap();
  fs.writeFileSync(path.join(publicDir, 'sitemap.html'), htmlSitemap);
  
  // 통계 저장
  const stats = generateSitemapStats();
  fs.writeFileSync(path.join(publicDir, 'sitemap-stats.json'), stats);
  
  console.log('✅ 사이트맵이 성공적으로 생성되었습니다!');
  console.log(`📊 총 ${allPages.length}개 페이지가 포함되었습니다:`);
  console.log(`   • 정적 페이지: ${staticPages.length}개`);
  console.log(`   • Story 아티클: ${stories.length}개`);
  console.log(`   • Lounge 게시글: ${loungePosts.length}개`);
  console.log(`📁 생성된 파일:`);
  console.log(`   • public/sitemap.xml (검색엔진용)`);
  console.log(`   • public/sitemap.html (사용자용)`);
  console.log(`   • public/sitemap-stats.json (통계)`);
}

// 스크립트 실행
if (require.main === module) {
  saveSitemaps();
}

module.exports = {
  generateSitemap,
  generateHtmlSitemap,
  generateSitemapStats,
  saveSitemaps
};