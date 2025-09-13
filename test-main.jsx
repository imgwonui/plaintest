import React from 'react';
import { createRoot } from 'react-dom/client';

const TestApp = () => {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1 style={{ color: '#7A5AF8', fontSize: '48px', marginBottom: '20px' }}>
        🎉 Plain이 정상 작동중입니다!
      </h1>
      <p style={{ fontSize: '18px', color: '#666' }}>
        React 앱이 성공적으로 로드되었습니다.
      </p>
      <button 
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#7A5AF8', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          fontSize: '16px',
          marginTop: '20px',
          cursor: 'pointer'
        }}
        onClick={() => alert('버튼이 작동합니다!')}
      >
        테스트 버튼
      </button>
    </div>
  );
};

// DOM에 React 앱 마운트
const container = document.getElementById('root');
console.log('Root container found:', container);

if (container) {
  const root = createRoot(container);
  root.render(<TestApp />);
  console.log('✅ React 앱이 마운트되었습니다!');
} else {
  console.error('❌ root 엘리먼트를 찾을 수 없습니다!');
}