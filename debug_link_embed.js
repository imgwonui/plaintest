// 링크 임베드 디버깅 스크립트
console.log('🔍 링크 임베드 디버깅 시작');

// 1. WYSIWYG 에디터에서 생성되는 HTML 테스트 콘텐츠
const testContentWithLinks = `
<p>안녕하세요, 이 글에서는 링크 임베드를 테스트합니다.</p>
<p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer">테스트 유튜브 비디오</a></p>
<p><a href="https://www.google.com" target="_blank" rel="noopener noreferrer">구글 홈페이지</a></p>
<p>일반 텍스트입니다.</p>
`;

console.log('📝 테스트 콘텐츠:');
console.log(testContentWithLinks);

// 2. LoungeDetail.tsx의 임베드 처리 로직 시뮬레이션
function processContentForEmbeds(content, colorMode = 'light') {
  console.log('\n🔄 임베드 처리 시작...');
  console.log('입력 콘텐츠 길이:', content.length);
  
  // HTML 콘텐츠인지 확인
  const isHTML = content.includes('<p>') || content.includes('<h1>') || content.includes('<span style=') || content.includes('<div');
  console.log('HTML 콘텐츠 여부:', isHTML);
  
  if (isHTML) {
    let processedContent = content;
    
    // 유튜브 링크를 임베드로 변환
    if (processedContent.includes('youtube.com') || processedContent.includes('youtu.be')) {
      console.log('🎥 유튜브 링크 감지됨');
      processedContent = processedContent.replace(
        /<a[^>]*href=["'](https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+))[^"']*["'][^>]*>([^<]+)<\/a>/g,
        (match, url, www, domain, videoId, text) => {
          console.log('🎥 유튜브 링크 변환:', { url, videoId, text });
          return `
            <p><a href="${url}" target="_blank" rel="noopener noreferrer" style="color: ${colorMode === 'dark' ? '#A78BFA' : '#7A5AF8'}; text-decoration: underline;">${text}</a></p>
            <div class="youtube-embed-container" style="position: relative; padding-bottom: 56.25%; height: 0; margin: 16px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, ${colorMode === 'dark' ? '0.3' : '0.1'});">
              <iframe 
                src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&showinfo=0" 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                loading="lazy"
                frameborder="0">
              </iframe>
            </div>
          `;
        }
      );
    }
    
    // 일반 링크를 링크 카드로 변환
    processedContent = processedContent.replace(
      /<a[^>]*href=["'](https?:\/\/(?!.*youtube\.com)(?!.*youtu\.be)[^"']+)["'][^>]*>([^<]+)<\/a>/g,
      (match, url, text) => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          return match;
        }
        
        console.log('🔗 일반 링크 변환:', { url, text });
        return `
          <div class="link-embed-container" onclick="window.open('${url}', '_blank', 'noopener,noreferrer');" style="
            border: 2px solid ${colorMode === 'dark' ? '#4d4d59' : '#e4e4e5'};
            border-radius: 8px;
            padding: 16px;
            margin: 16px 0;
            background-color: ${colorMode === 'dark' ? '#3c3c47' : '#f8f9fa'};
            transition: all 0.2s ease;
            cursor: pointer;
          ">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
              <div style="
                width: 32px;
                height: 32px;
                background: linear-gradient(135deg, #7A5AF8, #A78BFA);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
                font-size: 14px;
              ">
                🔗
              </div>
              <div style="flex: 1; min-width: 0;">
                <div style="
                  font-weight: 600;
                  color: ${colorMode === 'dark' ? '#e4e4e5' : '#2c2c35'};
                  font-size: 16px;
                  line-height: 1.3;
                  margin-bottom: 4px;
                  word-break: break-word;
                ">
                  ${text}
                </div>
                <div style="
                  color: ${colorMode === 'dark' ? '#9e9ea4' : '#626269'};
                  font-size: 14px;
                  word-break: break-all;
                ">
                  ${url}
                </div>
              </div>
            </div>
            <div style="
              color: ${colorMode === 'dark' ? '#7e7e87' : '#9e9ea4'};
              font-size: 12px;
              text-align: right;
            ">
              클릭하여 링크 열기 →
            </div>
          </div>
        `;
      }
    );
    
    console.log('✅ 임베드 처리 완료');
    console.log('처리된 콘텐츠 길이:', processedContent.length);
    console.log('유튜브 임베드 포함 여부:', processedContent.includes('youtube-embed-container'));
    console.log('링크 카드 포함 여부:', processedContent.includes('link-embed-container'));
    
    return processedContent;
  } else {
    console.log('📝 마크다운/텍스트 콘텐츠로 인식됨');
    return content;
  }
}

// 테스트 실행
console.log('\n=== 라이트 모드 테스트 ===');
const lightModeResult = processContentForEmbeds(testContentWithLinks, 'light');
console.log('\n처리된 결과:');
console.log(lightModeResult);

console.log('\n=== 다크 모드 테스트 ===');
const darkModeResult = processContentForEmbeds(testContentWithLinks, 'dark');

// 3. 실제 파일로 저장하여 브라우저에서 테스트 가능하도록
const testHtmlContent = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>링크 임베드 테스트</title>
    <style>
        body { font-family: -apple-system, sans-serif; margin: 40px; line-height: 1.6; }
        .test-section { margin: 40px 0; padding: 20px; border: 1px solid #ccc; border-radius: 8px; }
        .original { background: #f0f8ff; }
        .processed { background: #f0fff0; }
    </style>
</head>
<body>
    <h1>🔍 링크 임베드 처리 테스트</h1>
    
    <div class="test-section original">
        <h2>📝 원본 콘텐츠 (WYSIWYG 에디터 출력)</h2>
        <div>${testContentWithLinks}</div>
    </div>
    
    <div class="test-section processed">
        <h2>✨ 처리된 콘텐츠 (임베드 적용 후)</h2>
        <div>${lightModeResult}</div>
    </div>
    
    <script>
        console.log('🔍 브라우저에서 링크 임베드 테스트');
        console.log('원본 콘텐츠:', ${JSON.stringify(testContentWithLinks)});
        console.log('처리된 콘텐츠:', ${JSON.stringify(lightModeResult)});
        
        // 링크 카드 클릭 테스트
        document.addEventListener('click', function(e) {
            if (e.target.closest('.link-embed-container')) {
                console.log('링크 카드 클릭됨:', e.target.closest('.link-embed-container'));
            }
        });
    </script>
</body>
</html>
`;

require('fs').writeFileSync('link_embed_test.html', testHtmlContent);
console.log('\n✅ 테스트 HTML 파일 생성됨: link_embed_test.html');
console.log('브라우저에서 이 파일을 열어 실제 임베드 결과를 확인할 수 있습니다.');