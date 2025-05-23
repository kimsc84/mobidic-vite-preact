import { render } from 'preact'
import '@/styles/global.css'
import { App } from '@/components/App/App.jsx'
// @main.js - 애플리케이션 진입점 및 주요 로직

import { initializeSidebar } from './components/sidebar/sidebar.js'; // initializeSidebar 임포트
import Router from './router/router.js'; // Router 임포트

/** @constant {number} SIMULATED_LOADING_TIME - 로딩 화면 표시를 위한 최소 시뮬레이션 시간 (밀리초 단위). */
const SIMULATED_LOADING_TIME = 1000; // 로딩 시뮬레이션 시간 (ms)


/**
 * @description 지정 URL 리소스 비동기적 fetch. 기본 로깅 및 HTTP 오류 처리 수행함.
 * @async
 * @param {string} url - 가져올 리소스의 URL.
 * @param {string} [resourceName='리소스'] - 로깅을 위한 리소스 이름.
 * @returns {Promise<string>} fetch 응답의 텍스트 본문.
 */
async function fetchResource(url, resourceName = '리소스') {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText} (${url})`);
    }
    const data = await response.text();
    // console.debug(`[리소스 로드] ${resourceName} 완료: ${url}`);
    return data;
  } catch (error) {
    console.error(`[리소스 로드 실패] ${resourceName} (${url}): ${error.message}`);
    throw error;
  }
}

/**
 * @description 지정 시간(ms)만큼 실행 중지하는 Promise 반환.
 * @async
 * @param {number} ms - 딜레이 시간 (밀리초).
 * @returns {Promise<void>} 지정된 시간 후 resolve되는 Promise.
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * @description SVG 스프라이트 파일 비동기 로드 후 문서 `<body>`에 주입. `<use>` 태그로 아이콘 재사용 가능케 함.
 * @async
 */
async function loadAndInjectSprite() {
  const spritePath = '/src/assets/icons/sprite.svg'; // Vite는 /src 경로 직접 사용 가능
  try {
    const spriteText = await fetchResource(spritePath, 'SVG 스프라이트');
    if (!spriteText || spriteText.trim() === '') {
      console.warn(`[SVG 스프라이트] 파일 비어있거나 내용 없음: ${spritePath}`);
      return;
    }
    const spriteContainer = document.createElement('div');
    spriteContainer.innerHTML = spriteText;
    const svgElement = spriteContainer.querySelector('svg');
    if (svgElement) {
      // SVG 스프라이트는 보통 CSS나 파일 자체에서 display:none으로 숨겨짐
      document.body.insertAdjacentElement('afterbegin', svgElement);
      console.info('[SVG 스프라이트] 주입 완료.');
    } else {
      console.warn(`[SVG 스프라이트] 유효한 <svg> 요소 없음: ${spritePath}`);
    }
  } catch (error) {
    console.error(`[SVG 스프라이트] 처리 중 오류 발생 (${spritePath}):`, error);
  }
}

/**
 * @description 지정 레이아웃 조각 HTML 로드 및 필요시 연관 JS 모듈 동적 로드/초기화. HTML 내 인라인 `<script>`는 제거됨.
 * @async
 * @param {string} containerId - 레이아웃 HTML을 삽입할 DOM 요소의 ID.
 * @param {string} htmlPath - 로드할 레이아웃 HTML 파일 경로.
 * @param {string} [jsModulePath=null] - 로드할 레이아웃 JS 모듈 경로 (선택 사항).
 * @param {string} [initializeFunctionName=null] - 레이아웃 JS 모듈 내 실행할 초기화 함수명 (선택 사항).
 */
async function loadLayoutPart(containerId, htmlPath, jsModulePath = null, initializeFunctionName = null) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`[레이아웃] 컨테이너 ID '${containerId}' 없음.`);
    return;
  }
  try {
    const htmlData = await fetchResource(htmlPath, `${containerId} HTML`);
    const template = document.createElement('template');
    template.innerHTML = htmlData;
    // 인라인 <script> 태그만 제거 (보안 및 중복 실행 방지). <script src="...">는 유지.
    template.content.querySelectorAll('script:not([src])').forEach(script => script.remove());

    container.innerHTML = ''; // 이전 내용 지우기 (appendChild 전에 실행)
    // 모든 레이아웃 조각은 template.content를 복제하여 컨테이너에 추가
    container.appendChild(template.content.cloneNode(true));

    // JS 모듈 로드 및 초기화 로직은 아래 애플리케이션 초기화 부분에서 각 컴포넌트에 맞게 호출됨
    if (jsModulePath && initializeFunctionName) {
      await new Promise(resolveRAF => {
        requestAnimationFrame(async () => {
          try {
            const layoutModule = await import(jsModulePath /* @vite-ignore */); // Vite는 동적 import 경로를 분석하려고 하므로, 변수 사용 시 주의. 필요시 /* @vite-ignore */ 사용.
            if (layoutModule && typeof layoutModule[initializeFunctionName] === 'function') {
              // console.debug(`[레이아웃] ${containerId} JS 모듈(${jsModulePath}) 초기화 함수 호출.`);
              layoutModule[initializeFunctionName](container);
            } else {
              console.error(`[레이아웃] JS 모듈 오류 (RAF): ${jsModulePath}에서 ${initializeFunctionName} 함수 없음 또는 함수 아님.`);
            }
          } catch (moduleError) {
            console.error(`[레이아웃] JS 모듈 로드 오류 (RAF): ${jsModulePath} 로드 실패:`, moduleError);
          } finally {
            resolveRAF();
          }
        });
      });
    }
  } catch (error) {
    console.error(`[레이아웃] '${containerId}' 로드 오류: ${error.message}`);
    container.innerHTML = `<p>${containerId} 로딩 실패. 콘솔 확인.</p>`;
    throw error;
  }
}

/**
 * @description 지정 페이지 HTML/JS 모듈 동적 로드 후 메인 콘텐츠 영역 표시/초기화. HTML 내 `<link rel="stylesheet">`, `<style>`은 메인 문서 `<head>`로 이동.
 * @async
 * @param {string} [pageName='code-group'] - 로드할 페이지명.
 * @param {string} [subDirectory='admin'] - 페이지 경로 (./src/pages/{subDirectory}/{pageName}).
 * @param {string} [initializeFunctionName='initializePage'] - 페이지 JS 모듈 내 초기화 함수명.
 */
async function includeHTML(pageName = 'code-group', subDirectory = 'admin', initializeFunctionName = 'initializePage') {
  const basePath = "/src/pages"; // 슬래시로 시작하는 Vite의 public 디렉토리 기준 절대 경로

  // pageName과 subDirectory 정리 (앞뒤 슬래시 제거)
  const cleanedPageName = pageName.replace(/^\/+|\/+$/g, '');
  const cleanedSubDir = subDirectory.replace(/^\/+|\/+$/g, '');

  let pageFolder; // 예: "admin/code-group" 또는 "home" (루트 페이지의 경우)
  if (cleanedSubDir) {
    pageFolder = `${cleanedSubDir}/${cleanedPageName}`;
  } else {
    // 하위 디렉토리가 없는 페이지 (예: 'home')는 해당 페이지 이름의 폴더에 있다고 가정
    // 파일 경로: /src/pages/home/home.html
    pageFolder = cleanedPageName;
  }

  // 최종 파일 경로 구성
  // 예: /src/pages/admin/code-group/code-group.html
  // 예: /src/pages/home/home.html
  const pageHtmlPath = `${basePath}/${pageFolder}/${cleanedPageName}.html`;
  const pageModulePath = `${basePath}/${pageFolder}/${cleanedPageName}.js`;

  console.info(`[페이지 로드] 요청: HTML='${pageHtmlPath}', Module='${pageModulePath}'`);

  let mainContainer = document.getElementById("content-container");
  try {
    const htmlData = await fetchResource(pageHtmlPath, `${cleanedPageName} HTML`); // ✨ actualPageName 대신 cleanedPageName 사용
    mainContainer.innerHTML = '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlData, 'text/html');

    // <link rel="stylesheet"> 및 <style> 태그들을 메인 문서 <head>로 이동
    const fragmentHead = doc.head;
    if (fragmentHead) {
      fragmentHead.querySelectorAll('link[rel="stylesheet"]').forEach(linkNode => {
        const href = linkNode.getAttribute('href');
        if (href && !document.head.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
          const newLinkTag = document.createElement('link');
          newLinkTag.rel =linkNode.rel; // rel="stylesheet" 외 다른 것도 있을 수 있으므로 원본 사용
          newLinkTag.href = href;
          if (linkNode.type) newLinkTag.type = linkNode.type;
          document.head.appendChild(newLinkTag);
        }
      });
      fragmentHead.querySelectorAll('style').forEach(styleNode => {
        const pageStyleId = `page-style-${cleanedSubDir}-${cleanedPageName}`; // 정리된 이름 사용
        if (!document.head.querySelector(`#${pageStyleId}`)) {
          const newStyleTag = document.createElement('style');
          newStyleTag.id = pageStyleId;
          newStyleTag.textContent = styleNode.textContent;
          document.head.appendChild(newStyleTag);
        }
      });
    }

    // <body> 내용만 mainContainer에 삽입
    mainContainer.innerHTML = doc.body.innerHTML;

    /**
     * @description DOM 업데이트 후 페이지별 JS 모듈 실행 전,
     * 이는 브라우저가 DOM 변경사항을 완전히 렌더링하고 반영할 시간을 확보하여,
     * 간헐적으로 발생할 수 있는 JS 초기화 로직에서의 DOM 요소 접근 타이밍 이슈를 완화하기 위함입니다.
     * @see https://developer.mozilla.org/ko/docs/Web/API/Window/requestAnimationFrame requestAnimationFrame과의 관계 고려
     */
    // 1. mainContainer에 자식 요소가 생길 때까지 대기 (기본 DOM 구조 반영 확인)
    await new Promise(resolve => {
        const checkDomReady = () => {
            const container = document.getElementById('content-container'); // mainContainer 변수 사용 가능하면 그것으로 대체
            if (container && container.children.length > 0) {
                // console.debug(`[페이지 로드] DOM 체크 완료: ${pageModulePath}의 mainContainer 자식 요소 확인됨.`);
                resolve();
            } else {
                // console.debug(`[페이지 로드] DOM 체크 중: mainContainer 자식 없음. 대기.`);
                requestAnimationFrame(checkDomReady);
            }
        };
        checkDomReady();
    });

    // 2. 추가적인 DOM 안정화 시간 확보 (더블 RAF + setTimeout)
    // checkDomReady가 resolve된 후에도, 브라우저가 내부적으로 DOM을 완전히 구성하고
    // querySelector 등으로 즉시 접근 가능하게 만드는 데 시간이 더 필요할 수 있습니다.
    await new Promise(resolve => requestAnimationFrame(() => setTimeout(() => requestAnimationFrame(() => setTimeout(resolve, 0)), 0)));
    // console.debug(`[DOM 안정화 완료] ${pageModulePath} 초기화 시도.`);
    // 3. 페이지별 JS 모듈 직접 import 및 초기화 함수 실행
    try {
      const pageModule = await import(pageModulePath /* @vite-ignore */);
      if (pageModule && typeof pageModule[initializeFunctionName] === 'function') {
        console.info(`[페이지 초기화] ${pageModulePath} 모듈의 ${initializeFunctionName} 함수 실행.`);
        // code-group.js의 initializePage는 async 함수이므로 await으로 호출
        await pageModule[initializeFunctionName](); 
      } else {
        console.error(`[페이지 초기화] JS 모듈 오류: ${pageModulePath}에서 ${initializeFunctionName} 함수 없음 또는 함수 아님.`);
      }
    } catch (moduleError) {
      console.error(`[페이지 초기화] JS 모듈 import/실행 오류: ${pageModulePath} 처리 실패:`, moduleError);
    }

  } catch (error) {
    console.error(`[페이지 로드] '${cleanedPageName}' (경로: ${pageHtmlPath}) 오류: ${error.message}`);
    if (error.message && error.message.includes('HTTP 404')) {
      await loadErrorPageContent('404');
    } else if (error.message && error.message.startsWith('HTTP 5')) {
      await loadErrorPageContent('500');
      // TODO: 400, 401, 403 등 다른 HTTP 에러 코드에 대한 처리도 여기에 추가 가능
    } else if (error.message && error.message.includes('HTTP 400')) {
      await loadErrorPageContent('400');
    } else if (error.message && error.message.includes('HTTP 401')) {
      await loadErrorPageContent('401');
    } else if (error.message && error.message.includes('HTTP 403')) {
      await loadErrorPageContent('403');
    } else if (!navigator.onLine) {
      await loadErrorPageContent('offline'); // 오프라인 에러 페이지
    } else { // 기타 로드 실패
      // 개발 모드 기본 개발 페이지 로드 실패 시 루트 리디렉션
      if (import.meta.env.DEV && cleanedSubDir === 'common' && cleanedPageName === 'dev') {
        console.warn(`[라우팅] 개발 기본 페이지 /common/dev 로드 실패. 루트('/')로 리디렉션합니다.`);
        window.location.replace('/');
        return;
      }
      mainContainer.innerHTML = "<p>콘텐츠를 불러오는 데 실패했습니다. 개발자 콘솔을 확인해주세요.</p>";
    }
    throw error;
  }
}

/**
 * @description 지정 에러 코드 해당 HTML 페이지 내용 메인 콘텐츠 컨테이너에 로드. 에러 페이지 `<style>`은 메인 문서 `<head>`로 이동.
 * @async
 * @param {string} errorCode - '404', '500', 'offline' 등 에러 코드.
 */
async function loadErrorPageContent(errorCode) {
  const errorPagePath = `/src/pages/error/${errorCode}.html`;
  let mainContainer = document.getElementById("content-container");
  try {
    const htmlData = await fetchResource(errorPagePath, `${errorCode} 에러 페이지`);
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlData, 'text/html');

    const fragmentHead = doc.head;
    if (fragmentHead) {
      fragmentHead.querySelectorAll('style').forEach(styleNode => {
        const errorPageStyleId = `error-page-style-${errorCode}`;
        if (!document.head.querySelector(`#${errorPageStyleId}`)) {
          const newStyleTag = document.createElement('style');
          newStyleTag.id = errorPageStyleId;
          newStyleTag.textContent = styleNode.textContent;
          document.head.appendChild(newStyleTag);
        }
      });
    }
    mainContainer.innerHTML = doc.body.innerHTML;
    document.title = `${errorCode} Error - 기술보증기금 (KIBO)`;
  } catch (loadError) {
    console.error(`[에러 페이지] 로드 실패 (코드: ${errorCode}):`, loadError);
    mainContainer.innerHTML = `<p style="text-align:center; padding:20px; color:red;">오류 페이지를 표시하는 중 문제가 발생했습니다. (오류 코드: ${errorCode})</p>`;
    document.title = `Error - 기술보증기금 (KIBO)`;
  }
}

// --- 애플리케이션 초기화 및 라우팅 ---
(async () => {
  const loadingIndicator = document.getElementById('loading-indicator');

  /**
   * @description 브레드크럼 컨테이너 표시 상태 설정.
   * @param {boolean} isVisible - 브레드크럼을 표시할지 여부.
   */
  function setBreadcrumbVisibility(isVisible) {
    const breadcrumbContainer = document.getElementById('breadcrumb-container');
    if (breadcrumbContainer) {
      // breadcrumb.css에서 display: none; 기본값. 보일 때 'block', 숨길 때 'none' 설정.
      breadcrumbContainer.style.display = isVisible ? 'block' : 'none';
      console.info(`[브레드크럼] 표시 상태 변경: ${isVisible ? '보임' : '숨김'}`);
    } else {
      console.warn('[브레드크럼] 컨테이너(breadcrumb-container) 없음. 표시 상태 변경 불가.');
    }
  }

  if (loadingIndicator) loadingIndicator.style.display = 'flex';

  let dialogManagerInstance = null; // DialogManager 인스턴스 변수 선언
  try {
    // DialogManager 초기화 및 인스턴스 저장
    try {
      const dialogManagerModule = await import('/src/components/dialog/dialogManager.js' /* @vite-ignore */); // 경로 변경!
      if (dialogManagerModule.default) {
        window.dialogManager = new dialogManagerModule.default();
        dialogManagerInstance = window.dialogManager; // ✨ DialogManager 인스턴스를 로컬 변수에도 할당!
        console.info('[초기화] DialogManager 전역 등록.');
      }
    } catch (dmError) {
      console.error('[초기화] DialogManager 초기화 실패:', dmError);
    }

    // Breadcrumb 초기화 (라우터 생성 전에 실행되어야 window.updateBreadcrumbState 사용 가능)
    await loadLayoutPart('breadcrumb-container', '/src/components/breadcrumb/breadcrumb.html', '/src/components/breadcrumb/breadcrumb.js', 'initializeBreadcrumb');
    console.info('[초기화] 브레드크럼 로드 및 초기화 완료.');

    // 사이드바 HTML 로드 및 JS 초기화 (라우터 생성 전에 실행되어야 window.updateSidebarActiveState 등 사용 가능)
    await loadLayoutPart('sidebar-container', '/src/components/sidebar/sidebar.html');
    console.info('[초기화] 사이드바 HTML 로드 완료.');

    let sidebarAPI = null; // 사이드바 API 저장 변수
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer && dialogManagerInstance) {
        // initializeSidebar 호출 시 dialogManagerInstance 전달 및 반환된 API 저장
        sidebarAPI = initializeSidebar(sidebarContainer, dialogManagerInstance);
        console.info('[초기화] 사이드바 JS 초기화 완료.');
    } else {
        if (!sidebarContainer) console.error('[초기화] 사이드바 컨테이너(sidebar-container) 없음 (JS 초기화 시점).');
        if (!dialogManagerInstance) console.error('[초기화] DialogManager 인스턴스 없음 (JS 초기화 시점).');
        console.error('[초기화] 사이드바 JS 초기화 실패.');
    }
    if (!sidebarAPI) {
        console.error('[초기화 치명적 오류] 사이드바 API를 가져오지 못했습니다. 라우터 초기화 불가.');
        // 로딩 인디케이터 숨기기 등 오류 처리 후 종료 또는 대체 로직
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        return; // 또는 throw new Error('Sidebar API 초기화 실패');
    }

    // 라우터 초기화 (필요한 의존성 전달)
    const router = new Router({
        includeHTML: includeHTML,
        loadErrorPageContent: loadErrorPageContent,
        // sidebarAPI에서 필요한 함수들을 직접 전달
        updateSidebarActiveState: sidebarAPI.updateSidebarActiveState,
        closeAllDrawers: sidebarAPI.closeAllDrawers,

        // TODO: breadcrumb.js 리팩토링 필요!
        // breadcrumb.js의 initializeBreadcrumb이 API 객체(예: { updateBreadcrumbState })를 반환하도록 수정하고,
        // 해당 API를 통해 updateBreadcrumbState 함수를 전달해야 합니다.
        // 예: updateBreadcrumbState: breadcrumbAPI.updateBreadcrumbState,
        updateBreadcrumbState: window.updateBreadcrumbState, // breadcrumb.js가 window에 등록

        setBreadcrumbVisibility: setBreadcrumbVisibility // main.js 내 함수
    });
    router.init(); // 라우터 이벤트 리스너 등록
    // window.navigateToPage 전역 할당 제거. 대신 'app:request-navigation' 이벤트를 사용합니다.
    // 다른 모듈(예: header.js, dev.js)에서 페이지 이동이 필요할 경우, 다음과 같이 이벤트를 발생시켜야 합니다:
    // document.dispatchEvent(new CustomEvent('app:request-navigation', { detail: { subdirOrFullPath: '...', pageNameOrNull: '...', stateData: {...} } }));
    console.info('[초기화] 라우터 초기화 완료. 페이지 이동은 "app:request-navigation" 이벤트 사용.');

    await loadAndInjectSprite();
    await sleep(SIMULATED_LOADING_TIME);

    // 초기 페이지 로드 로직
    const path = window.location.pathname;
    const segments = path.split('/').filter(segment => segment !== '' && segment !== 'index.html');
    let initialSubDir = 'common';
    let initialPageName = import.meta.env.DEV ? 'dev' : 'main'; // ✨ common/main 지웠으니까, 개발시는 dev, 아니면 main (main도 없다면 다른 걸로!)
    let initialPageTitle = import.meta.env.DEV ? '개발자 페이지' : '메인';
    let canonicalPath = `/${initialSubDir}/${initialPageName}`; // 기본 정식 경로

    if (segments.length === 1 && segments[0] !== 'common' && segments[0]) { // 예: /dashboard
      if(segments.length === 0) {
        initialSubDir = 'common';
      } else {
        initialSubDir = segments[0];
      }
      initialPageName = segments[0];
      initialPageTitle = segments[0];
      canonicalPath = `/${initialSubDir}/${initialPageName}`;
       console.info(`[초기화] 단일 세그먼트 경로 감지: ${segments[0]}. '${initialSubDir}/${initialPageName}' 로드 예정.`);
    } else if (segments.length >= 2) {
      initialSubDir = segments[0];
      initialPageName = segments[1];
      initialPageTitle = segments[1];
      canonicalPath = `/${initialSubDir}/${initialPageName}`;
    } else if (path === '/') {
      // initialSubDir, initialPageName은 이미 기본값(common/dev 또는 common/main)으로 설정됨
      // canonicalPath는 위에서 해당 기본값으로 이미 설정됨
    }

    console.info(`[초기화] 초기 페이지 로드 결정: ${initialSubDir}/${initialPageName}`);
    // ✨ 루트 경로('/') 접근 시, 정식 경로로 URL 변경 (페이지 리로드 없이)
    if (window.location.pathname === '/' && canonicalPath !== '/') {
        // console.debug(`[초기화] 루트 경로('/') 감지. 정식 경로 '${canonicalPath}'(으)로 URL 상태 교체 시도.`);
        history.replaceState({ 
            subdir: initialSubDir, 
            page: initialPageName, 
            initialLoad: true, 
            navigationSource: 'initialRootNormalization' 
        }, '', canonicalPath); // sidebarState 관련 정보 제거
        // console.debug(`[초기화] history.replaceState 직후. window.location.pathname: '${window.location.pathname}', canonicalPath: '${canonicalPath}'`);
    }

    document.title = `${initialPageTitle} - 기술보증기금 (KIBO)`;
    // 주요 UI 및 초기 페이지 로드 시작

    // 주요 UI 병렬 로드
    // 초기 페이지 로드는 라우터가 담당하도록 변경
    await Promise.all([
      loadLayoutPart('header-container', '/src/components/layout/header/header.html', '/src/components/layout/header/header.js', 'initializeHeader').then(() => console.info('[초기화] 헤더 로드 및 초기화 완료.')),
      // breadcrumb-container는 위에서 이미 로드 및 초기화됨
      loadLayoutPart( // Bottom Drawer 로드 및 초기화
        'bottom-drawer-container',
        '/src/components/bottom-drawer/bottom-drawer.html',
        '/src/components/bottom-drawer/bottom-drawer.js',
        'initializeBottomDrawer'
      ).then(() => console.info('[초기화] 하단 드로워 로드 및 초기화 완료.'))
    ]);

    // 라우터에게 초기 페이지 로딩을 위임
    if (router) {
        await router.handleInitialLoad(window.location.pathname);
    }
    console.info('[초기화] 주요 UI 및 초기 페이지 로드 완료.');

    // 전역 이벤트 로직 초기화 (eventLogics.js에서 통합된 내용)
    if (window.initializeGlobalLogics && typeof window.initializeGlobalLogics === 'function') {
      console.info('[초기화] 전역 이벤트 로직 초기화 시작.');
      window.initializeGlobalLogics(); // 전역으로 정의된 함수 호출
    } else {
      console.warn('[초기화] window.initializeGlobalLogics 함수 없음. (eventLogics.js 통합 확인 필요)');
    }
  } catch (appInitError) {
    console.error("💥[초기화] 애플리케이션 초기화 중 치명적 오류:", appInitError);
    if (loadingIndicator) loadingIndicator.style.display = 'none'; // 오류 시 로딩 숨김
    document.body.innerHTML = '<p style="color: red; text-align: center; padding: 20px; font-size: 1.2em;">페이지를 초기화하는 중 심각한 오류가 발생했습니다. 개발자 콘솔을 확인해주세요.</p>';
  } finally {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
  }
  
})(); // 즉시 실행 함수 종료

/**
 * @description 애플리케이션 전반 사용 글로벌 이벤트 리스너 및 로직 초기화. (예: 검색 모달 토글, 개발자 패널 토글 등)
 * `main.js` 주요 초기화 로직 마지막에 호출됨.
 */
function initializeGlobalLogics() {
  console.info('[전역 로직] 초기화 시작.');
  // =================================================================
  // 여기에 기존 eventLogics.js의 모든 내용을 넣어줘!
  // 예: 검색 모달 열기/닫기, 개발자 패널 토글 등의 로직
  // =================================================================
  console.info('[전역 로직] 초기화 완료. (구현 내용 확인 필요)'); // TODO: 실제 로직 추가 후 이 로그 수정
}
// 전역에서 접근 가능하도록 window 객체에 할당
window.initializeGlobalLogics = initializeGlobalLogics;
console.info('🚀 main.js 로드 완료. 애플리케이션 초기화 시작됨.');
