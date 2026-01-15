import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// root 엘리먼트 확인 및 렌더링
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('root 엘리먼트를 찾을 수 없습니다.')
}

const root = ReactDOM.createRoot(rootElement)

// 에러 발생 시에도 화면이 보이도록 에러 바운더리 추가
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

