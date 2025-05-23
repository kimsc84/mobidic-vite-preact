/**
 * @file router.js
 * @description 애플리케이션의 클라이언트 측 라우팅을 관리합니다.
 * URL 변경, 페이지 컴포넌트 로딩, history API 관리를 담당합니다.
 */

/**
 * 라우트 패턴과 현재 경로를 비교하고 파라미터를 추출합니다.
 * @param {string} pattern - 라우트 패턴 (예: '/admin/user/:id')
 * @param {string} path - 현재 경로 (예: '/admin/user/123')
 * @returns {object|null} 매칭된 파라미터 객체 또는 null
 */
function matchRoutePattern(pattern, path) {
  const paramNames = [];
  const regexPath = pattern.replace(/:([^/]+)/g, (_, paramName) => {
    paramNames.push(paramName);
    return '([^/]+)';
  });
  const regex = new RegExp(`^${regexPath}$`);
  const match = path.match(regex);

  if (!match) return null;

  const params = {};
  paramNames.forEach((name, idx) => {
    params[name] = match[idx + 1];
  });
  return params;
}

/**
 * Router 클래스.
 * 페이지 네비게이션 및 history API 이벤트를 처리합니다.
 */
class Router {
  /**
   * Router 인스턴스를 생성합니다.
   * @param {object} dependencies - 라우터가 의존하는 외부 함수 및 객체들.
   * @param {function(string, string): Promise<void>} dependencies.includeHTML - 페이지 HTML 및 JS를 로드하는 함수.
   * @param {function(string): Promise<void>} dependencies.loadErrorPageContent - 에러 페이지를 로드하는 함수.
   * @param {function(string, object): void} dependencies.updateSidebarActiveState - 사이드바 활성 상태를 업데이트하는 함수.
   * @param {function(string, string): void} dependencies.updateBreadcrumbState - 브레드크럼 상태를 업데이트하는 함수. (main.js에서 전달)
   * @param {function(boolean): void} dependencies.setBreadcrumbVisibility - 브레드크럼 표시 상태를 설정하는 함수.
   * @param {function(string): void} dependencies.closeAllDrawers - 모든 드로워를 닫는 함수 (sidebar에서 제공).
   */
  constructor(dependencies) {
    this.includeHTML = dependencies.includeHTML;
    this.loadErrorPageContent = dependencies.loadErrorPageContent;
    this.updateSidebarActiveState = dependencies.updateSidebarActiveState;
    this.updateBreadcrumbState = dependencies.updateBreadcrumbState;
    this.setBreadcrumbVisibility = dependencies.setBreadcrumbVisibility; // main.js에서 전달
    this.closeAllDrawers = dependencies.closeAllDrawers;

    // 이벤트 리스너 바인딩
    this.handlePopstate = this.handlePopstate.bind(this);
    this.handleSidebarNavigate = this.handleSidebarNavigate.bind(this);
    this.handleAppNavigate = this.handleAppNavigate.bind(this); // 앱 전역 네비게이션 요청 핸들러 바인딩

    // 동적 라우트 정의
    this.routeMap = [
      { 
        pattern: '/boards/:boardName', 
        subdir: '', 
        page: 'boards', 
        title: (params) => {
          const boardTypes = {
            notice: '공지사항',
            knowledge: '지식공유',
          };
          return `${boardTypes[params.boardName] || params.boardName} 게시판`;
        }
      },
      {
        pattern: '/boards/:boardName/write',
        subdir: 'boards',
        page: 'board-write',
        title: (params) => {
          const boardTypes = {
            notice: '공지사항',
            knowledge: '지식공유',
          };
          return `${boardTypes[params.boardName] || params.boardName} 글쓰기`;
        }
      },
      {
        pattern: '/boards/:boardName/edit/:postId',
        subdir: 'boards',
        page: 'board-edit',
        title: (params) => {
          const boardTypes = {
            notice: '공지사항',
            knowledge: '지식공유',
          };
          return `${boardTypes[params.boardName] || params.boardName} 수정`;
        }
      }
    ];
  }

  /**
   * 주어진 경로에 대해 동적 라우트 매칭을 시도합니다.
   * @param {string} path - 매칭할 경로
   * @returns {object|null} 매칭된 라우트 정보와 파라미터, 또는 null
   */
  matchDynamicRoute(path) {
    for (const route of this.routeMap) {
      const params = matchRoutePattern(route.pattern, path);
      if (params) {
        return {
          route,
          params
        };
      }
    }
    return null;
  }

  /**
   * 라우터를 초기화하고 필요한 이벤트 리스너를 설정합니다.
   */
  init() {
    // popstate 이벤트 리스너 등록
    window.addEventListener('popstate', this.handlePopstate);
    // 사이드바 네비게이션 이벤트 리스너 등록
    document.addEventListener('sidebar:navigate', this.handleSidebarNavigate);
    // 애플리케이션 전역 네비게이션 요청 이벤트 리스너 등록
    document.addEventListener('app:request-navigation', this.handleAppNavigate);

    console.info('[라우터] 초기화 완료. popstate, sidebar:navigate, app:request-navigation 이벤트 리스너 등록.');
  }

  /**
   * 초기 페이지 로딩을 처리합니다.
   * 애플리케이션 시작 시 호출됩니다.
   * @async
   * @param {string} initialPath - 초기 로드할 경로 (window.location.pathname).
   */
  async handleInitialLoad(initialPath) {
    const path = initialPath;
    let initialSubDir = 'common';
    let initialPageName = import.meta.env.DEV ? 'dev' : 'main';
    let initialPageTitle = import.meta.env.DEV ? '개발자 페이지' : '메인';
    let canonicalPath = `/${initialSubDir}/${initialPageName}`; // 기본 정식 경로
    let routeParams = {};

    // 동적 라우트 매칭 시도
    const matchedRoute = this.matchDynamicRoute(path);
    if (matchedRoute) {
      initialSubDir = matchedRoute.route.subdir;
      initialPageName = matchedRoute.route.page;
      initialPageTitle = typeof matchedRoute.route.title === 'function' 
        ? matchedRoute.route.title(matchedRoute.params)
        : (matchedRoute.route.title || initialPageName);
      canonicalPath = matchedRoute.route.pattern;
      window.currentRouteParams = matchedRoute.params;
    } else {
      // 기존 URL 파싱 로직
      const segments = path.split('/').filter(segment => segment !== '' && segment !== 'index.html');
      if (segments.length === 1 && segments[0] !== 'common' && segments[0]) {
        if(segments.length === 0) {
          initialSubDir = 'common';
        } else {
          initialSubDir = '';
        }
        initialPageName = segments[0];
        initialPageTitle = segments[0];
        canonicalPath = `/${initialSubDir}/${initialPageName}`;
      } else if (segments.length >= 2) {
        initialSubDir = segments[0];
        initialPageName = segments[1];
        initialPageTitle = segments[1];
        canonicalPath = `/${initialSubDir}/${initialPageName}`;
      }
    }

    console.info(`[라우터] 초기 페이지 로드 결정: ${initialSubDir}/${initialPageName}`);

    // 루트 경로('/') 접근 시, 정식 경로로 URL 변경 (페이지 리로드 없이)
    if (window.location.pathname === '/' && canonicalPath !== '/') {
        console.info(`[라우터 DEBUG] 루트 경로('/') 감지. 정식 경로 '${canonicalPath}'(으)로 URL 상태 교체 시도.`);
        history.replaceState({
            subdir: initialSubDir,
            page: initialPageName,
            initialLoad: true,
            navigationSource: 'initialRootNormalization'
        }, '', canonicalPath);
        console.log(`[라우터 DEBUG] history.replaceState 직후. window.location.pathname: '${window.location.pathname}', canonicalPath: '${canonicalPath}'`);
    }

    document.title = `${initialPageTitle} - 기술보증기금 (KIBO)`;
    console.info('[라우터] 초기 페이지 includeHTML 호출 시작.');

    try {
      await this.includeHTML(initialPageName, initialSubDir);
      console.info(`[라우터] 초기 페이지(${initialSubDir}/${initialPageName}) 로드 완료.`);

        // 초기 로드 후 사이드바 및 브레드크럼 업데이트
        this.updateSidebarActiveState(window.location.pathname + window.location.search, { navigationSource: 'initialLoad' });
        this.updateBreadcrumbState(window.location.pathname + window.location.search, document.title); // 브레드크럼은 navigationSource 불필요

        // 초기 페이지 로드 후 브레드크럼 표시 상태 설정
        const isInitialPageReport = (initialSubDir === 'common' && initialPageName === 'report-iframe');
        this.setBreadcrumbVisibility(isInitialPageReport);

    } catch (error) {
      console.error(`[라우터 오류] 초기 페이지 로드 중 문제 발생 (${initialSubDir}/${initialPageName}):`, error);
      await this.handleLoadError(error, initialSubDir, initialPageName);
      throw error;
    }
  }

  /**
   * 페이지 로드 오류를 처리합니다.
   * @async
   * @param {Error} error - 발생한 오류
   * @param {string} subDir - 페이지의 하위 디렉토리
   * @param {string} pageName - 페이지 이름
   */
  async handleLoadError(error, subDir, pageName) {
    if (error.message && error.message.includes('HTTP 404')) {
      await this.loadErrorPageContent('404');
    } else if (error.message && error.message.startsWith('HTTP 5')) {
      await this.loadErrorPageContent('500');
    } else if (error.message && error.message.includes('HTTP 400')) {
      await this.loadErrorPageContent('400');
    } else if (error.message && error.message.includes('HTTP 401')) {
      await this.loadErrorPageContent('401');
    } else if (error.message && error.message.includes('HTTP 403')) {
      await this.loadErrorPageContent('403');
    } else if (!navigator.onLine) {
      await this.loadErrorPageContent('offline');
    } else {
       // 개발 모드에서 기본 개발 페이지 로드 실패 시 루트로 리디렉션
      if (import.meta.env.DEV && subDir === 'common' && pageName === 'dev') {
        console.warn(`[라우터] 개발 기본 페이지 /common/dev 로드 실패. 루트('/')로 리디렉션합니다.`);
        window.location.replace('/');
        return;
      }
      const mainContainer = document.getElementById("content-container");
      if(mainContainer) mainContainer.innerHTML = "<p>콘텐츠를 불러오는 데 실패했습니다. 개발자 콘솔을 확인해주세요.</p>";
    }
    this.setBreadcrumbVisibility(false);
  }

  /**
   * 지정된 하위 디렉토리 및 페이지 이름으로 SPA 네비게이션을 수행합니다.
   * `history.pushState`를 사용하여 URL을 변경하고, 해당 페이지의 HTML 및 JS를 로드합니다.
   * `stateData`를 통해 리포트 경로, 제목 등의 추가 정보를 전달할 수 있습니다.
   *
   * @async
   * @param {string} subdirOrFullPath - 페이지의 하위 디렉토리 경로 또는 전체 경로 (예: 'admin', 'common/report-iframe').
   * @param {string | null} pageNameOrNull - 페이지 이름 (예: 'code-group'). `subdirOrFullPath`가 전체 경로이면 null.
   * @param {object} [stateData={}] - `history.pushState`에 전달할 추가 상태 객체.
   *    주로 `reportPath` (실제 리포트 경로), `reportTitle` (페이지 제목) 등을 포함합니다.
   */ // NOSONAR
  async navigateToPage(subdirOrFullPath, pageNameOrNull, stateData = {}) {
    console.log(`[라우터 DEBUG] navigateToPage 호출됨: subdirOrFullPath='${subdirOrFullPath}', pageNameOrNull='${pageNameOrNull}', stateData:`, JSON.parse(JSON.stringify(stateData)));
    const currentLoadingIndicator = document.getElementById('loading-indicator');
    if (currentLoadingIndicator) currentLoadingIndicator.style.display = 'flex';

    // --- 1. 최종 하위 디렉토리(finalSubDir) 및 페이지 이름(finalPageName) 결정 ---
    let finalSubDir, finalPageName;
    const isRootRequest = (subdirOrFullPath === '/'); // 루트 경로 요청인지 확인

    if (pageNameOrNull) { // pageName이 명시적으로 제공된 경우
        finalSubDir = subdirOrFullPath.replace(/^\/+|\/+$/g, ''); // 예: 'admin'
        finalPageName = pageNameOrNull.replace(/^\/+|\/+$/g, ''); // 예: 'code-group'
    } else { // subdirOrFullPath에 전체 경로가 제공된 경우 (예: 'admin/code-group', '/admin/code-group', 'home', '/')
        if (isRootRequest) { // 루트 경로('/') 특별 처리
            // 초기 로드 로직과 일관되게 기본 페이지로 매핑
            finalSubDir = 'common';
            finalPageName = import.meta.env.DEV ? 'dev' : 'main'; // 프로덕션 기본 페이지는 'main' 또는 다른 설정값
        } else {
            const path = subdirOrFullPath.replace(/^\/+|\/+$/g, ''); // 예: "admin/code-group" 또는 "home"
            const parts = path.split('/');
            finalPageName = parts.pop(); // 예: "code-group" 또는 "home"
            finalSubDir = parts.join('/'); // 예: "admin" 또는 "" (home의 경우)
        }
    }

    // --- 2. 브라우저 주소창에 표시될 경로(displayPath) 및 문서 제목(newDocumentTitle) 결정 ---
    let displayPath;
    let newDocumentTitle;

    // report-iframe 경로는 stateData.reportPath를 우선 사용 (sidebar에서 이미 완성된 형태로 넘겨줌)
    if (stateData.reportPath) {
        displayPath = stateData.reportPath;
        // stateData.title 또는 reportTitle 사용, 없으면 pageName 기반
        newDocumentTitle = stateData.title || stateData.reportTitle || (finalPageName ? finalPageName.charAt(0).toUpperCase() + finalPageName.slice(1) : '페이지');
    } else if (isRootRequest) { // 원본 요청이 루트였던 경우
        // 루트 요청 시 표시 경로는 정규화된 기본 페이지 경로 (예: /common/dev)
        displayPath = `/${finalSubDir}/${finalPageName}`;
        newDocumentTitle = finalPageName.charAt(0).toUpperCase() + finalPageName.slice(1);
    } else {
        const segments = [];
        if (finalSubDir) segments.push(finalSubDir); // finalSubDir이 "" (루트 페이지)가 아니면 추가
        segments.push(finalPageName);
        displayPath = '/' + segments.join('/'); // 예: "/admin/code-group" 또는 "/home"
        newDocumentTitle = finalPageName.charAt(0).toUpperCase() + finalPageName.slice(1);
    }

    console.info(`[라우터] navigateToPage 결정 값:
      finalSubDir='${finalSubDir}',
      finalPageName='${finalPageName}',
      displayPath='${displayPath}',
      newDocumentTitle='${newDocumentTitle}'`);

    // 동적 라우트 매칭 시도
    const matchedRoute = this.matchDynamicRoute(displayPath);
    if (matchedRoute) {
      finalSubDir = matchedRoute.route.subdir || "";
      finalPageName = matchedRoute.route.page;
      newDocumentTitle = typeof matchedRoute.route.title === 'function' 
        ? matchedRoute.route.title(matchedRoute.params)
        : (matchedRoute.route.title || finalPageName);
      window.currentRouteParams = matchedRoute.params;
    }
    
    // ✨ 수정: displayPath와 현재 URL 전체(경로 + 쿼리)를 비교하여 불필요한 pushState 방지
    const currentFullRelativePath = window.location.pathname + window.location.search;
    if (currentFullRelativePath !== displayPath) {
        console.info(`[라우터] 페이지 이동 요청. 표시 URL: ${displayPath}, 로드 대상: ${finalSubDir}/${finalPageName}`);
        console.log(`[라우터 DEBUG] currentFullRelativePath: '${currentFullRelativePath}', displayPath: '${displayPath}'`);

    } else {
        // URL이 같더라도, report-iframe의 경우 쿼리 파라미터만 다를 수 있으므로
        // 페이지 로딩 및 상태 업데이트는 필요할 수 있음.
        // 여기서는 URL이 완전히 같으면 로딩을 건너뛰지만, 필요에 따라 로딩 로직을 분리할 수 있음.
        console.info(`[라우터] 페이지 이동 불필요: 현재 URL(${currentFullRelativePath})과 목표 URL(${displayPath}) 동일.`);
        // URL이 같더라도, report-iframe의 경우 쿼리 파라미터만 다를 수 있으므로
        // 페이지 로딩 및 상태 업데이트는 필요할 수 있음.
        // 여기서는 URL이 완전히 같으면 로딩을 건너뛰지만, 필요에 따라 로딩 로직을 분리할 수 있음.
        // 현재 includeHTML은 URL이 아닌 인자로 페이지를 결정하므로, URL이 같아도 인자가 다르면 로딩됨.
        // 따라서 이 else 블록에서는 로딩을 건너뛰지 않고 아래 로직을 그대로 수행.
    }

    // ✨ 중요: history.pushState를 먼저 호출하여 URL을 변경한 후,
    // 변경된 URL을 기준으로 사이드바 상태를 저장하고 UI를 업데이트합니다.
    // 이렇게 해야 saveSidebarState에서 latchedActivePageHref를 새 URL로 저장할 수 있고,
    // updateSidebarActiveState도 새 URL 기준으로 동작합니다.
    if (currentFullRelativePath !== displayPath) { // NOSONAR: 조건부 pushState는 의도된 동작
        history.pushState({ subdir: finalSubDir, page: finalPageName }, '', displayPath);
    }

    this.closeAllDrawers(`navigateToPage: ${finalSubDir}/${finalPageName}`); // 상세 사유 전달
    try {
      // 페이지 로딩
      await this.includeHTML(finalPageName, finalSubDir);
      document.title = `${newDocumentTitle} - 기술보증기금 (KIBO)`;

      // navigateToPage로 인한 새 페이지 로드 시, history.state 업데이트 (sidebarState 없이)
      if (currentFullRelativePath !== displayPath) { // URL이 실제로 변경된 경우에만 state 업데이트
        history.replaceState({ // pushState 대신 replaceState로 현재 항목의 state만 업데이트
            subdir: finalSubDir,
            page: finalPageName,
            id: stateData.id, title: stateData.title, reportPath: displayPath,
            navigationSource: stateData.navigationSource || 'navigateToPage'
        }, '', displayPath);
      }
      // 사이드바 및 브레드크럼 업데이트
      // navigateToPage에 의한 이동은 래치 상태를 소모해야 함 (preserveCurrentLatch: false)
      this.updateSidebarActiveState(displayPath, { navigationSource: stateData.navigationSource || 'navigateToPage' });
      this.updateBreadcrumbState(displayPath, newDocumentTitle); // 브레드크럼은 navigationSource 불필요

      // 페이지 로드 및 브레드크럼 업데이트 후 표시 상태 설정
      const isReportPage = (finalSubDir === 'common' && finalPageName === 'report-iframe');
      this.setBreadcrumbVisibility(isReportPage);

    } catch (error) {
      console.error(`[라우터] navigateToPage: '${finalSubDir}/${finalPageName}' 페이지 로드 중 오류:`, error);
      await this.handleLoadError(error, finalSubDir, finalPageName);
    } finally {
      if (currentLoadingIndicator) currentLoadingIndicator.style.display = 'none';
    }
  }

  /**
   * 브라우저의 뒤로가기/앞으로가기 버튼 클릭(`popstate` 이벤트) 시 호출됩니다.
   * 변경된 URL 및 `history.state`를 기반으로 적절한 페이지를 로드하고 UI를 업데이트합니다.
   * @param {PopStateEvent} event - popstate 이벤트 객체.
   */
  async handlePopstate(event) {
    const currentLoadingIndicator = document.getElementById('loading-indicator');
    if (currentLoadingIndicator) currentLoadingIndicator.style.display = 'flex';

    const newPath = window.location.pathname;
    console.info(`[라우터] popstate 이벤트 발생. 새 경로: ${newPath}`);

    let newSubDir = 'common';
    let newPageName = import.meta.env.DEV ? 'dev' : 'main';
    let newDocumentTitle = '메인';
    // 동적 라우트 매칭 시도
    const matchedRoute = this.matchDynamicRoute(newPath);
    if (matchedRoute) {
      newSubDir = matchedRoute.route.subdir;
      newPageName = matchedRoute.route.page;
      newDocumentTitle = typeof matchedRoute.route.title === 'function' 
        ? matchedRoute.route.title(matchedRoute.params)
        : (matchedRoute.route.title || newPageName);
      window.currentRouteParams = matchedRoute.params;
    } else {
    let targetPathForSidebar = newPath + window.location.search; // 사이드바 업데이트에 사용할 경로 (쿼리 포함)

    // 1. history.state에 정보가 있으면 우선 사용
    if (event.state && event.state.subdir && event.state.page) {
      newSubDir = event.state.subdir;
      newPageName = event.state.page;
      // popstate 시 title은 state에 저장된 title (report-iframe용) 또는 pageName 기반으로 설정
      if (newPageName === 'report-iframe' && event.state.title) {
        newDocumentTitle = event.state.title;
      } else {
        newDocumentTitle = newPageName.charAt(0).toUpperCase() + newPageName.slice(1);
      }
      // report-iframe의 경우 state에 저장된 reportPath를 사이드바 업데이트 경로로 사용
      if (newPageName === 'report-iframe' && event.state.reportPath) {
          targetPathForSidebar = event.state.reportPath;
      }
      console.log(`[라우터 popstate] history.state 기반 페이지 정보: subdir='${newSubDir}', page='${newPageName}', targetPathForSidebar='${targetPathForSidebar}'`);
    } else {
      // 2. history.state가 없거나 부족하면 URL 파싱 (navigateToPage에서 state를 저장하므로 이 케이스는 드물어야 함)
      const newSegments = newPath.split('/').filter(segment => segment !== '' && segment !== 'index.html');
      if (newPath === '/') { // 루트 경로
        newSubDir = 'common';
        newPageName = import.meta.env.DEV ? 'dev' : 'main';
        newDocumentTitle = newPageName.charAt(0).toUpperCase() + newPageName.slice(1);
      } else if (newSegments.length >= 2) { // 예: /admin/code-group -> ['admin', 'code-group']
        newSubDir = newSegments[0];
        newPageName = newSegments[1];
        newDocumentTitle = newSegments[1];
      } else if (newSegments.length === 1 && newSegments[0]) {
        newSubDir = newSegments[0]; // 기본값
        newPageName = newSegments[0];
        newDocumentTitle = newSegments[0];
      } else {
        console.warn(`[라우터 popstate] URL 파싱으로 페이지 정보 결정 불가: ${newPath}. 기본 페이지(${newSubDir}/${newPageName}) 로드 시도.`);
      }
       // report-iframe URL인 경우, 쿼리 파라미터에서 id/title을 가져와 targetPathForSidebar 구성
       if (newPath.startsWith('/common/report-iframe')) {
           const urlParams = new URLSearchParams(window.location.search);
           const idFromQuery = urlParams.get('id');
           const titleFromQuery = urlParams.get('title');
           if (idFromQuery && titleFromQuery) {
               targetPathForSidebar = `/common/report-iframe?id=${idFromQuery}&title=${encodeURIComponent(titleFromQuery)}`;
               newDocumentTitle = titleFromQuery; // report-iframe의 경우 title 쿼리 파라미터 사용
           } else {
               console.warn(`[라우터 popstate] /common/report-iframe URL이지만 id 또는 title 쿼리 파라미터가 없습니다.`);
           }
       }
      console.log(`[라우터 popstate] URL 파싱 기반 페이지 정보: subdir='${newSubDir}', page='${newPageName}', targetPathForSidebar='${targetPathForSidebar}'`);
    }
  }

    try {
        // 1. 모든 드로워를 닫음
        this.closeAllDrawers(`popstate: ${newSubDir}/${newPageName}`); // 상세 사유 전달

        // 2. 페이지 로딩
        await this.includeHTML(newPageName, newSubDir);
        document.title = `${newDocumentTitle} - 기술보증기금 (KIBO)`;

        // 3. 사이드바 및 브레드크럼 업데이트
        // 래치 관련 옵션 제거
        this.updateSidebarActiveState(targetPathForSidebar, { navigationSource: (event.state && event.state.navigationSource) || 'popstate' });
        this.updateBreadcrumbState(targetPathForSidebar, newDocumentTitle); // 브레드크럼은 navigationSource 불필요

        // 5. 페이지 변경 후 브레드크럼 표시 상태 설정
        const isReportPageAfterPop = (newSubDir === 'common' && newPageName === 'report-iframe');
        this.setBreadcrumbVisibility(isReportPageAfterPop);

    } catch (error) {
      console.error(`[라우터] popstate: '${newSubDir}/${newPageName}' 페이지 로드 중 오류:`, error);
      await this.handleLoadError(error, newSubDir, newPageName);
    } finally {
      if (currentLoadingIndicator) currentLoadingIndicator.style.display = 'none';
    }
  }

  /**
   * sidebar:navigate 커스텀 이벤트 발생 시 호출됩니다.
   * 이벤트 데이터를 사용하여 navigateToPage를 호출합니다.
   * @param {CustomEvent} event - sidebar:navigate 커스텀 이벤트 객체.
   */
  handleSidebarNavigate(event) {
    console.log('[라우터] sidebar:navigate 이벤트 수신.', event.detail);
    const { subdirOrFullPath, pageNameOrNull, stateData } = event.detail;
    this.navigateToPage(subdirOrFullPath, pageNameOrNull, stateData);
  }

  /**
   * app:request-navigation 커스텀 이벤트 발생 시 호출됩니다.
   * window.navigateToPage 대신 사용되며, 이벤트 데이터를 사용하여 navigateToPage를 호출합니다.
   * @param {CustomEvent} event - app:request-navigation 커스텀 이벤트 객체.
   *   event.detail은 { subdirOrFullPath, pageNameOrNull, stateData } 형태를 기대합니다.
   */
  handleAppNavigate(event) {
    console.log('[라우터] app:request-navigation 이벤트 수신.', event.detail);
    if (event.detail) {
      const { subdirOrFullPath, pageNameOrNull, stateData } = event.detail;
      this.navigateToPage(subdirOrFullPath, pageNameOrNull, stateData || {});
    } else {
      console.warn('[라우터] app:request-navigation 이벤트에 detail 객체가 없습니다.');
    }
  }
}

export default Router;