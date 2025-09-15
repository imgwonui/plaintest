// 게시글 콘텐츠 디버깅 - 저장과 불러오기 과정에서 무엇이 일어나는지 확인

console.log('🔍 게시글 저장/불러오기 과정 디버깅');

// 1. WYSIWYG 에디터에서 생성되는 실제 콘텐츠 시뮬레이션
const editorContentWithEmbeds = `<p>이 글에서는 링크 테스트를 합니다.</p>
<p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer">유튜브 테스트</a></p>
<div class="youtube-embed-container" style="position: relative; padding-bottom: 56.25%; height: 0; margin: 16px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
  <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&showinfo=0" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" frameborder="0"></iframe>
</div>
<p><a href="https://www.google.com" target="_blank" rel="noopener noreferrer">구글 링크</a></p>
<div class="link-embed-container" onclick="window.open('https://www.google.com', '_blank', 'noopener,noreferrer');" style="border: 2px solid #e4e4e5; border-radius: 8px; padding: 16px; margin: 16px 0; background-color: #f8f9fa; transition: all 0.2s ease; cursor: pointer;">
  <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
    <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #7A5AF8, #A78BFA); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 14px;">🔗</div>
    <div style="flex: 1; min-width: 0;">
      <div style="font-weight: 600; color: #2c2c35; font-size: 16px; line-height: 1.3; margin-bottom: 4px; word-break: break-word;">구글 홈페이지</div>
      <div style="color: #626269; font-size: 14px; word-break: break-all;">https://www.google.com</div>
    </div>
  </div>
  <div style="color: #9e9ea4; font-size: 12px; text-align: right;">클릭하여 링크 열기 →</div>
</div>
<p>끝입니다.</p>`;

console.log('📝 에디터에서 생성된 콘텐츠 (임베드 포함):');
console.log(`길이: ${editorContentWithEmbeds.length} 글자`);
console.log('유튜브 임베드:', editorContentWithEmbeds.includes('youtube-embed-container'));
console.log('링크 카드:', editorContentWithEmbeds.includes('link-embed-container'));
console.log('첫 500 글자:', editorContentWithEmbeds.substring(0, 500));

// 2. 데이터베이스 저장 시뮬레이션 (JSON 직렬화)
console.log('\n🗄️ 데이터베이스 저장 시뮬레이션...');
const serializedContent = JSON.stringify(editorContentWithEmbeds);
console.log(`JSON 직렬화 후 길이: ${serializedContent.length} 글자`);

// 3. 데이터베이스에서 불러오기 시뮬레이션 
console.log('\n📤 데이터베이스에서 불러오기 시뮬레이션...');
const deserializedContent = JSON.parse(serializedContent);
console.log(`JSON 파싱 후 길이: ${deserializedContent.length} 글자`);
console.log('유튜브 임베드 유지:', deserializedContent.includes('youtube-embed-container'));
console.log('링크 카드 유지:', deserializedContent.includes('link-embed-container'));

// 4. React dangerouslySetInnerHTML 시뮬레이션
console.log('\n⚛️ React dangerouslySetInnerHTML 시뮬레이션...');
function simulateReactRender(htmlContent) {
  // React의 dangerouslySetInnerHTML이 하는 일을 시뮬레이션
  console.log('HTML이 DOM에 설정될 때의 콘텐츠:');
  console.log(`길이: ${htmlContent.length} 글자`);
  
  // DOM 파싱 시뮬레이션 (DOMParser 사용)
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html');
    const parsedHTML = doc.body.firstChild.innerHTML;
    
    console.log('DOM 파싱 후:', parsedHTML.length);
    console.log('유튜브 iframe 유지:', parsedHTML.includes('<iframe'));
    console.log('링크 카드 div 유지:', parsedHTML.includes('link-embed-container'));
    
    return parsedHTML;
  } catch (error) {
    console.log('❌ DOM 파싱 실패 (Node.js 환경에서는 DOMParser가 없음)');
    return htmlContent;
  }
}

const renderedContent = simulateReactRender(deserializedContent);

// 5. 실제 Detail 페이지의 임베드 처리 시뮬레이션
console.log('\n🎯 Detail 페이지 임베드 처리 시뮬레이션...');

function simulateDetailPageProcessing(content, colorMode = 'light') {
  console.log('Detail 페이지에서의 처리 시작...');
  
  // HTML 콘텐츠인지 확인
  const isHTML = content.includes('<p>') || content.includes('<h1>') || content.includes('<span style=') || content.includes('<div');
  console.log('HTML 콘텐츠 인식:', isHTML);
  
  if (!isHTML) {
    console.log('❌ HTML로 인식되지 않아 임베드 처리되지 않음!');
    return content;
  }
  
  // 이미 임베드가 포함되어 있는지 확인
  const hasExistingEmbeds = content.includes('youtube-embed-container') || content.includes('link-embed-container');
  console.log('기존 임베드 존재:', hasExistingEmbeds);
  
  if (hasExistingEmbeds) {
    console.log('✅ 이미 임베드가 포함되어 있음 - 추가 처리 안 함');
    return content;
  }
  
  console.log('🔄 임베드 처리 시작...');
  
  let processedContent = content;
  
  // 유튜브 링크 처리
  if (processedContent.includes('youtube.com') || processedContent.includes('youtu.be')) {
    console.log('🎥 유튜브 링크 처리 중...');
    processedContent = processedContent.replace(
      /<a[^>]*href=["'](https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+))[^"']*["'][^>]*>([^<]+)<\/a>/g,
      (match, url, www, domain, videoId, text) => {
        console.log('🎥 유튜브 변환:', videoId);
        return `${match}
        <div class="youtube-embed-container">
          <iframe src="https://www.youtube.com/embed/${videoId}?rel=0"></iframe>
        </div>`;
      }
    );
  }
  
  // 일반 링크 처리
  processedContent = processedContent.replace(
    /<a[^>]*href=["'](https?:\/\/(?!.*youtube\.com)(?!.*youtu\.be)[^"']+)["'][^>]*>([^<]+)<\/a>/g,
    (match, url, text) => {
      console.log('🔗 일반 링크 변환:', url);
      return `${match}
      <div class="link-embed-container" onclick="window.open('${url}', '_blank')">
        <div>🔗 ${text}</div>
        <div>${url}</div>
      </div>`;
    }
  );
  
  const hasNewEmbeds = processedContent.includes('youtube-embed-container') || processedContent.includes('link-embed-container');
  console.log('새 임베드 생성됨:', hasNewEmbeds);
  
  return processedContent;
}

const finalContent = simulateDetailPageProcessing(deserializedContent);

// 6. 종합 분석
console.log('\n📊 종합 분석');
console.log('====================');
console.log('1. 에디터에서 임베드 생성:', editorContentWithEmbeds.includes('embed-container'));
console.log('2. DB 저장 후 임베드 유지:', deserializedContent.includes('embed-container'));
console.log('3. Detail 페이지 처리 후:', finalContent.includes('embed-container'));

console.log('\n🤔 문제 가능성 분석:');
console.log('- WYSIWYG 에디터에서 임베드를 올바르게 생성하는가?');
console.log('- 데이터베이스 저장 시 HTML이 손상되는가?');
console.log('- Detail 페이지에서 HTML 인식이 실패하는가?');
console.log('- 중복 처리로 인한 문제가 있는가?');

// 7. 브라우저 테스트를 위한 HTML 파일 생성
const testHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>게시글 콘텐츠 디버깅</title>
    <style>
        body { font-family: system-ui; margin: 20px; }
        .section { margin: 20px 0; padding: 20px; border: 1px solid #ccc; }
        .youtube-embed-container { position: relative; padding-bottom: 56.25%; height: 0; margin: 16px 0; }
        .youtube-embed-container iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        .link-embed-container { border: 2px solid #e4e4e5; border-radius: 8px; padding: 16px; margin: 16px 0; cursor: pointer; }
        .link-embed-container:hover { background: #f0f0f0; }
    </style>
</head>
<body>
    <h1>게시글 콘텐츠 디버깅</h1>
    
    <div class="section">
        <h2>1. 에디터에서 생성된 원본</h2>
        ${editorContentWithEmbeds}
    </div>
    
    <div class="section">
        <h2>2. DB 저장 후 불러온 내용</h2>
        ${deserializedContent}
    </div>
    
    <div class="section">
        <h2>3. Detail 페이지 처리 후</h2>
        ${finalContent}
    </div>
    
    <script>
        console.log('브라우저에서 테스트 실행됨');
        console.log('에디터 원본 임베드:', ${JSON.stringify(editorContentWithEmbeds.includes('embed-container'))});
        console.log('DB 후 임베드:', ${JSON.stringify(deserializedContent.includes('embed-container'))});
        console.log('처리 후 임베드:', ${JSON.stringify(finalContent.includes('embed-container'))});
        
        // 링크 카드 클릭 이벤트 테스트
        document.addEventListener('click', (e) => {
            if (e.target.closest('.link-embed-container')) {
                console.log('링크 카드 클릭 감지됨');
            }
        });
    </script>
</body>
</html>
`;

require('fs').writeFileSync('test_post_content_debug.html', testHTML);
console.log('\n✅ 브라우저 테스트 HTML 파일 생성: test_post_content_debug.html');