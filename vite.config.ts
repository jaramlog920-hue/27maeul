/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// 구약 책 본문 청크(src/content/ot/<id>.json, 약 3.3MB)는 assets/ot/ 아래로 모은다 — PWA 사전 캐시에서 빼고 실행 중에 담기 위해
const isOtBookChunk = (id: string | null | undefined) => !!id && /\/src\/content\/ot\/[^/]+\.json$/.test(id.replaceAll('\\', '/'))

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: (chunk) => (isOtBookChunk(chunk.facadeModuleId) ? 'assets/ot/[name]-[hash].js' : 'assets/[name]-[hash].js'),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: '스물일곱 권의 마을',
        short_name: '스물일곱 권',
        description: '신약성경을 엮는 필사가의 도트 생활 시뮬레이션',
        lang: 'ko',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#edf0df',
        theme_color: '#edf0df',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        // 본문 JSON과 글꼴까지 캐시해 오프라인에서도 논다
        globPatterns: ['**/*.{js,css,html,png,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // 구약 책 청크는 첫 설치에 받지 않는다 — 책을 처음 펼칠 때 받아 실행 중 캐시에 담는다 (아래 runtimeCaching)
        globIgnores: ['**/assets/ot/**'],
        // 바깥 글꼴(Noto Serif KR)은 한 번 받으면 오프라인에서도 쓰도록 실행 중에 담아 둔다
        runtimeCaching: [
          {
            urlPattern: ({ url }: { url: URL }) => url.pathname.includes('/assets/ot/'),
            handler: 'CacheFirst',
            options: { cacheName: 'ot-books', expiration: { maxEntries: 60 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 12 } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
  },
})
