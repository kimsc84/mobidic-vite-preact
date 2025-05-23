// https://vite.dev/config/

import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import path from 'path' // path 모듈 임포트
import { resolve } from 'path';

// const base = process.env.NODE_ENV === 'production' ? '/mobidicfe/' : '/'; // 배포 경로 설정
// const base = '/mobidicfe/'; // 배포 경로 설정 (톰캣 하위 경로 배포 시 중요!)
const base = '/'; 

export default defineConfig({
  // 1. 배포될 기본 경로 설정 (톰캣 하위 경로 배포 시 중요!)
  // 예: '/mobidicfe/'
  base: base,

  // 2. 빌드 옵션
  build: {
    rollupOptions: {
      input: {
        // 메인 애플리케이션 진입점 (SPA의 경우 또는 기본 페이지)
        main: resolve(__dirname, 'index.html'),

        // 추가적인 HTML 페이지 진입점들 (MPA 구성)
        reportIframe: resolve(__dirname, 'src/pages/common/report-iframe/report-iframe.html'),
        noReportInfo: resolve(__dirname, 'src/pages/error/no-report-info/no-report-info.html'),

        // 다른 페이지가 있다면 여기에 계속 추가
        // 예: home: resolve(__dirname, 'src/pages/home/home.html'),
      },
    },
    // 빌드 결과물 폴더 (기본값: 'dist')
    // outDir: 'dist',
  },

  // 3. 경로 별칭 (Alias) 설정 - ../../../ 같은 지옥에서 탈출!
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@lib': resolve(__dirname, './src/lib'), // 또는 @js, @utils 등 네 스타일에 맞게!
      '@assets': resolve(__dirname, './src/assets'),
      '@pages': resolve(__dirname, './src/pages'),
      '@styles': resolve(__dirname, './src/styles'),
    },
  },

  // 4. 개발 서버 옵션 (필요에 따라 설정)
  server: {
    host: true, // 또는 '0.0.0.0' 로컬 네트워크의 모든 IP에서 접속 허용
    port: 3000, // 개발 서버 포트
    open: true, // 서버 시작 시 브라우저 자동 실행
    // proxy: { // API 프록시 설정 (CORS 문제 해결 등)
    //   '/api': {
    //     target: 'http://localhost:8080', // 실제 API 서버 주소
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, ''),
    //   },
    // },
  },

  // 5. 플러그인 (필요한 경우 추가)
  plugins: [preact()],
});