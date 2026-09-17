import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { computeBundleVersion } from './scripts/ota-version.mjs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
const bundleVersion = computeBundleVersion()

// OTA: 번들에 박힌 버전(__BUNDLE_VERSION__)과 같은 값을 dist/bundle-version.json 으로도 남긴다 (scripts/ota-bundle.mjs 가 읽음)
const emitBundleVersion = {
  name: 'emit-bundle-version',
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'bundle-version.json', source: JSON.stringify({ version: bundleVersion }) })
  },
}

export default defineConfig(({ mode }) => ({
  // My 탭 하단 앱 정보에 표시 (package.json version)
  // __BUNDLE_VERSION__: 앱(OTA)이 서버의 최신 번들과 비교하는 웹 번들 버전
  define: { __APP_VERSION__: JSON.stringify(pkg.version), __BUNDLE_VERSION__: JSON.stringify(bundleVersion) },
  plugins: [
    react(),
    emitBundleVersion,
    // 테스트(vitest)에서는 서비스워커 생성이 필요 없어 PWA 플러그인을 뺀다
    ...(mode === 'test' ? [] : [VitePWA({
      registerType: 'autoUpdate',
      // 등록은 src/main.jsx 에서 직접 (네이티브 앱에서는 건너뛰기 위해)
      injectRegister: null,
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: '스탬프여행',
        short_name: '스탬프여행',
        description: '여행 혜택 조회 · 코스 추천 · 방문 인증 스탬프를 한 번에 즐기는 스마트 여행 플랫폼',
        lang: 'ko',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#f97316',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    })]),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.js'],
    include: ['tests/**/*.test.{js,jsx,mjs}'],
    environmentMatchGlobs: [['tests/node/**', 'node']],
    restoreMocks: true,
    testTimeout: 15000,
  },
}))
