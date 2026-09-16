import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { isNativeApp } from './native/platform'

// 네이티브 앱의 오리진(iOS capacitor://localhost, Android https://localhost)은 카카오 개발자 콘솔의
// 웹 도메인으로 등록할 수 없다(커스텀 스킴 불가). 카카오맵 SDK 는 Referer 가 없으면 도메인 검사를 하지
// 않으므로(dapi.kakao.com 응답으로 확인) 앱 안에서는 Referer 를 보내지 않는다. 브라우저·PWA 는 그대로.
if (isNativeApp) {
  const meta = document.createElement('meta')
  meta.name = 'referrer'
  meta.content = 'no-referrer'
  document.head.prepend(meta)
}

// PWA 서비스워커는 브라우저에서만. 네이티브 앱(Capacitor)은 번들을 앱 안에 갖고 있어 필요 없다
if (!isNativeApp && import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
