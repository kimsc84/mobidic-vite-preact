// src/pages/common/dev/dev.js

/**
 * @file 개발자용 대시보드 페이지 초기화 및 기능 구현.
 * @description - 오류 로깅, 환경 정보 표시, 개발자 액션 버튼, 빠른 페이지 이동 패널, 명령어 팔레트 기능 제공.
 */

// --- 전역(모듈 스코프) 변수 ---
/** @constant {number} MAX_ERRORS_TO_DISPLAY - 화면에 표시할 최대 오류 개수. */
const MAX_ERRORS_TO_DISPLAY = 5;
/** @type {Array<{message: string, timestamp: Date}>} 최근 발생 오류 저장 배열. */
const lastErrors = [];

// --- 핵심 로직: console.error 래핑하여 오류 로깅 ---
const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError.apply(console, args); // 기존 console.error 동작 유지
  // 오류 메시지 포맷팅
  const errorMessage = args.map(arg => {
    if (arg instanceof Error) {
      return `${arg.name}: ${arg.message}\n${arg.stack}`;
    }
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2); // 객체는 JSON 문자열로
      } catch (e) {
        return String(arg); // 순환 참조 등 오류 시 문자열로
      }
    }
    return String(arg);
  }).join(' ');

  lastErrors.unshift({ message: errorMessage, timestamp: new Date() }); // 새 오류 맨 앞에 추가
  if (lastErrors.length > MAX_ERRORS_TO_DISPLAY) {
    lastErrors.pop(); // 최대 개수 초과 시 가장 오래된 오류 제거
  }
  // 개발자 페이지 활성 상태면 오류 목록 즉시 업데이트
  if (document.getElementById('last-errors-list')) {
    updateLastErrorsDisplay();
  }
};

/**
 * HTML 문자열 이스케이프 처리 유틸리티. XSS 방지.
 * @param {string} unsafe - 이스케이프 처리할 원본 문자열.
 * @returns {string} 이스케이프 처리된 안전한 HTML 문자열.
 */
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

/**
 * @description '최근 오류 로그' 섹션 DOM 업데이트.
 */
function updateLastErrorsDisplay() {
  const errorListContainer = document.getElementById('last-errors-list');
  if (errorListContainer) {
    errorListContainer.innerHTML = ''; // 기존 내용 비우기
    if (lastErrors.length === 0) {
      errorListContainer.innerHTML = '<li>최근 오류 없음. 평화롭구만! 🕊️</li>';
      return;
    }
    lastErrors.forEach(err => {
      const listItem = document.createElement('li');
      const timeString = err.timestamp.toLocaleTimeString('ko-KR', { hour12: false });
      // pre 태그 사용해 포맷 유지, escapeHtml로 XSS 방지
      listItem.innerHTML = `<strong>[${timeString}]</strong> <pre>${escapeHtml(err.message)}</pre>`;
      errorListContainer.appendChild(listItem);
    });
  }
}

/**
 * @description '개발 환경 정보' 섹션 DOM 업데이트.
 */
function updateDevEnvironmentInfo() {
  const envInfoContainer = document.getElementById('dev-environment-info');
  if (envInfoContainer) {
    envInfoContainer.innerHTML = `
      <ul>
        <li><strong>애플리케이션 모드:</strong> ${import.meta.env.MODE} (${import.meta.env.DEV ? '개발 환경' : '프로덕션 환경'})</li>
        <li><strong>Vite 서버 실행 여부:</strong> ${import.meta.env.DEV ? '실행 중 ✅' : '빌드 버전 🚀'}</li>
        <li><strong>User Agent:</strong> ${navigator.userAgent}</li>
        <li><strong>화면 해상도:</strong> ${window.screen.width}x${window.screen.height} (현재 창 크기: ${window.innerWidth}x${window.innerHeight})</li>
        <li><strong>온라인 상태:</strong> ${navigator.onLine ? '온라인 👍' : '오프라인 👎'}</li>
        <li><strong>쿠키 활성화 여부:</strong> ${navigator.cookieEnabled ? '활성화됨 ✅' : '비활성화됨 ❌'}</li>
      </ul>
    `;
  }
}

export function initializePage() {
  console.log('[DevPage] 초기화 시작');

  // --- 개발자 도구 초기화 로직 (index.html에서 이동) ---

  /**
   * @function initializeDevPanel
   * @description 개발자용 페이지 빠른 이동 패널을 초기화하고 이벤트를 설정.
   *              main.html 내에 통합되어 표시됩니다.
   */
  function initializeDevPanel() {
    // dev.html 내 패널 요소 탐색
    const panelContainer = document.getElementById('dev-panel-container-main');
    const toggleBtn = document.getElementById('dev-panel-toggle-btn-main');
    const panelContent = document.getElementById('dev-panel-content-main');
    const pageList = document.getElementById('dev-page-list-main');

    // --- 개발자 패널에 표시할 페이지 목록 (수동 관리) ---
    // TODO: 중앙 설정(예: menuConfig.js)에서 이 목록을 관리하거나, 향후 /src/pages 디렉토리 구조를 읽어와 자동 생성하도록 개선 고려
    const devPages = [
      { subdir: 'admin', page: 'code-group', name: '코드 그룹 관리' },
      { subdir: 'boards', page: 'notice', name: '공지사항 게시판' },
      { subdir: 'boards', page: 'knowledge', name: '지식공유 게시판' },
      // 예: { subdir: 'dashboard', page: 'overview', name: '대시보드 개요' },
    ];
    // --- 페이지 목록 설정 끝 ---

    if (!panelContainer || !toggleBtn || !panelContent || !pageList) {
      console.warn('[DevPage] 개발자 패널 UI 요소 없음. 초기화 실패.');
      return;
    }

    // 초기 상태: 패널 내용 표시, 버튼 텍스트 '닫기'
    panelContent.style.display = ''; 
    toggleBtn.textContent = '🚀 페이지 목록 닫기';

    toggleBtn.addEventListener('click', () => {
      const isHidden = panelContent.style.display === 'none';
      panelContent.style.display = isHidden ? '' : 'none'; // block 대신 기본값('')으로 설정하여 CSS 우선순위 문제 방지
      toggleBtn.textContent = isHidden ? '🚀 페이지 목록 닫기' : '🚀 페이지 목록 열기';
    });

    pageList.innerHTML = ''; // 기존 내용 비우기
    devPages.forEach(p => {
      const listItem = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#/${p.subdir}/${p.page}`; // SPA 네비게이션용 해시 경로
      link.textContent = `${p.subdir}/${p.page} ${p.name ? `(${p.name})` : ''}`;

      link.addEventListener('click', (e) => { // 링크 클릭 시 navigateToPage 호출 및 패널 닫기
        e.preventDefault(); // 기본 링크 동작 방지
        // window.navigateToPage 함수가 제거되었으므로, 관련 if/else 조건문 없이 바로 이벤트 발생
        document.dispatchEvent(new CustomEvent('app:request-navigation', {
          detail: {
            subdirOrFullPath: p.subdir,
            pageNameOrNull: p.page,
            stateData: { navigationSource: 'devPanelLinkClick' }
          }
        }));
        panelContent.style.display = 'none'; // 패널 닫기
        toggleBtn.textContent = '🚀 페이지 목록 열기'; // 버튼 텍스트 복원
        console.log(`[DevPanel] 페이지 이동 요청: ${p.subdir}/${p.page}`);
      });
      listItem.appendChild(link);
      pageList.appendChild(listItem);
    });

    // 키보드 단축키 (Ctrl + Alt + P) 로 패널 토글
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && (e.key === 'p' || e.key === 'P')) { // 단축키 변경: D -> P
        e.preventDefault();
        toggleBtn.click(); // 버튼 클릭 이벤트 발생
      }
    });
    console.info('[DevPage] 개발자 패널 초기화 완료 (Ctrl+Alt+P로 토글).');
  }

  /**
   * @function initializeCommandPalette
   * @description 개발자용 명령어 팔레트를 초기화하고 이벤트를 설정.
   *              main.html 내에 통합되어 표시됩니다.
   */
  function initializeCommandPalette() {
    // dev.html 내 팔레트 요소 탐색
    const paletteContainer = document.getElementById('command-palette-container-main');
    const paletteInput = document.getElementById('command-palette-input-main');
    const paletteList = document.getElementById('command-palette-list-main');

    // initializeDevPanel에서 사용하는 devPages와 동일한 목록 사용
    // TODO: 중앙 설정(예: menuConfig.js)에서 이 목록을 관리하거나, 향후 /src/pages 디렉토리 구조를 읽어와 자동 생성하도록 개선 고려
    const devPages = [
      { subdir: 'admin', page: 'code-group', name: '코드 그룹 관리' },
      { subdir: 'admin', page: 'code-management', name: '코드 관리' },
      { subdir: 'admin', page: 'user-management', name: '사용자 관리' },
      { subdir: 'admin', page: 'menu-management', name: '메뉴 관리' },
    ];

    if (!paletteContainer || !paletteInput || !paletteList) {
      console.warn('[DevPage] 명령어 팔레트 UI 요소 없음. 초기화 실패.');
      return;
    }

    // 초기 상태 설정 (CSS에서 display: none으로 설정되어 있음)
    paletteContainer.style.display = 'none';

    function openPalette() {
      paletteContainer.style.display = 'flex'; // flex로 변경 (CSS에서)
      paletteInput.value = '';
      renderList(devPages, ''); // 초기 전체 목록 표시
      paletteInput.focus();
    }

    function closePalette() {
      paletteContainer.style.display = 'none';
    }

    function renderList(pages, searchTerm) {
      paletteList.innerHTML = '';
      const lowerSearchTerm = searchTerm.toLowerCase();

      pages.forEach((p, index) => {
        const listItem = document.createElement('li');
        const originalText = `${p.subdir}/${p.page} ${p.name ? `(${p.name})` : ''}`;
        let displayText = originalText;

        if (lowerSearchTerm) {
          // 검색어와 일치하는 부분을 <strong> 태그로 감싸서 강조
          // 정규식 특수 문자를 이스케이프 처리
          const escapedSearchTerm = lowerSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedSearchTerm, 'gi'); // 'g'로 전체 일치, 'i'로 대소문자 무시
          
          // originalText에서 일치하는 부분을 찾아 <strong>으로 감쌈
          // HTML 구조를 유지하면서 텍스트 노드만 변경하는 것이 안전하지만,
          // 여기서는 간단하게 replace와 innerHTML을 사용.
          // 만약 originalText 내부에 HTML 태그가 있다면 이 방식은 문제가 될 수 있음.
          // 현재는 순수 텍스트이므로 괜찮음.
          displayText = originalText.replace(regex, (match) => {
            return `<strong>${match}</strong>`;
          });
        }
        listItem.innerHTML = displayText; // innerHTML을 사용하여 <strong> 태그가 렌더링되도록 함
        listItem.dataset.path = `${p.subdir}/${p.page}`; // # 제거하고 path로 저장
        listItem.tabIndex = -1; // 키보드 네비게이션용

        listItem.addEventListener('click', () => {
          const [subdir, page] = listItem.dataset.path.split('/');
          // window.navigateToPage 함수가 제거되었으므로, 관련 if/else 조건문 없이 바로 이벤트 발생
          document.dispatchEvent(new CustomEvent('app:request-navigation', {
            detail: {
              subdirOrFullPath: subdir,
              pageNameOrNull: page,
              stateData: { navigationSource: 'commandPaletteLinkClick' }
            }
          }));
          closePalette(); // 팔레트 닫기
          console.log(`[CommandPalette] 페이지 이동 요청: ${subdir}/${page}`);
        });
        paletteList.appendChild(listItem);
      });
       // 목록 업데이트 후 첫 번째 항목 선택
       const firstItem = paletteList.querySelector('li');
       if (firstItem) {
           firstItem.classList.add('selected');
       }
    }

    paletteInput.addEventListener('input', () => {
      const currentSearchTerm = paletteInput.value; // 하이라이트를 위해 원본 검색어 유지
      const lowerSearchTerm = currentSearchTerm.toLowerCase(); // 검색 필터링은 소문자로
      const filteredPages = devPages.filter(p => 
        p.page.toLowerCase().includes(lowerSearchTerm) || 
        p.subdir.toLowerCase().includes(lowerSearchTerm) ||
        (p.name && p.name.toLowerCase().includes(lowerSearchTerm))
      );
      renderList(filteredPages, currentSearchTerm); // 필터링된 목록과 원본 검색어를 전달
    });

    paletteInput.addEventListener('keydown', (e) => {
      const items = paletteList.querySelectorAll('li');
      if (!items.length) return;

      let currentIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
      if (currentIndex === -1) currentIndex = 0; // 선택된 항목이 없으면 첫 번째 항목 선택

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[currentIndex]?.classList.remove('selected');
        currentIndex = (currentIndex + 1) % items.length;
        items[currentIndex]?.classList.add('selected');
        // items[currentIndex]?.focus(); // 통합된 UI에서는 focus 필요 없을 수 있음
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[currentIndex]?.classList.remove('selected');
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        items[currentIndex]?.classList.add('selected');
        // items[currentIndex]?.focus(); // 통합된 UI에서는 focus 필요 없을 수 있음
      } else if (e.key === 'Enter') {
        e.preventDefault();
        items[currentIndex]?.click();
      } else if (e.key === 'Escape') {
        closePalette();
      }
    });

    // 키보드 단축키 (Ctrl + Alt + D) 로 팔레트 토글
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && !e.shiftKey && (e.key === 'd' || e.key === 'D')) { // Shift 키 조건 제거
        e.preventDefault();
        paletteContainer.style.display === 'none' ? openPalette() : closePalette();
      }
    });
    console.info('[DevPage] 명령어 팔레트 초기화 완료 (Ctrl+Alt+D로 토글).');
  }

  /**
   * @description '개발자 액션' 섹션 버튼들 초기화.
   */
  function initializeDeveloperActions() {
    const actionsContainer = document.getElementById('developer-actions-container');
    if (!actionsContainer) {
      console.warn('[DevPage] #developer-actions-container 요소를 찾을 수 없습니다.');
      return;
    }

    const actions = [
      { id: 'dev-action-clear-local-storage', text: 'localStorage 비우기', action: () => { localStorage.clear(); alert('localStorage가 비워졌습니다.'); console.info('[DevAction] localStorage 비워짐.'); } },
      { id: 'dev-action-clear-session-storage', text: 'sessionStorage 비우기', action: () => { sessionStorage.clear(); alert('sessionStorage가 비워졌습니다.'); console.info('[DevAction] sessionStorage 비워짐.'); } },
      { id: 'dev-action-trigger-test-error', text: '테스트 오류 발생', action: () => { console.error('개발자 페이지에서 발생시킨 테스트 오류입니다!', { message: 'This is a test error object.', code: 500, details: { timestamp: new Date().toISOString() } }); alert('테스트 오류가 콘솔에 기록되었습니다.');} },
      { id: 'dev-action-force-reload-app', text: '앱 강제 새로고침 (캐시 무시)', action: () => { window.location.reload(true); } },
      { id: 'dev-action-show-dialog-manager-state', text: 'DialogManager 상태 (콘솔)', action: () => { if(window.dialogManager && typeof window.dialogManager.getOpenDialogs === 'function') { console.log('[DialogManager 상태]', window.dialogManager.getOpenDialogs()); alert('DialogManager 상태가 콘솔에 기록되었습니다.'); } else { alert('DialogManager 또는 getOpenDialogs 메서드가 없습니다.');} } },
      { id: 'dev-action-force-sidebar-update', text: '사이드바 상태 강제 업데이트 (현재 경로)', action: () => {
          if (window.sidebarAPI && typeof window.sidebarAPI.updateSidebarActiveState === 'function') {
            const currentPath = window.location.pathname + window.location.search;
            window.sidebarAPI.updateSidebarActiveState(currentPath, { navigationSource: 'devActionForceUpdate' });
            alert(`사이드바 상태가 현재 경로(${currentPath}) 기준으로 강제 업데이트되었습니다.`);
            console.info('[DevAction] 사이드바 상태 강제 업데이트 실행.');
          } else { alert('window.sidebarAPI.updateSidebarActiveState 함수를 찾을 수 없습니다.'); }
        }
      },
      { id: 'dev-action-force-breadcrumb-update', text: '브레드크럼 상태 강제 업데이트 (현재 경로)', action: () => {
          if (window.updateBreadcrumbState && typeof window.updateBreadcrumbState === 'function') { // breadcrumb.js가 window에 직접 등록
            const currentPath = window.location.pathname + window.location.search;
            window.updateBreadcrumbState(currentPath, document.title);
            alert(`브레드크럼 상태가 현재 경로(${currentPath}) 기준으로 강제 업데이트되었습니다.`);
            console.info('[DevAction] 브레드크럼 상태 강제 업데이트 실행.');
          } else { alert('window.updateBreadcrumbState 함수를 찾을 수 없습니다.'); }
        }
      },
      { id: 'dev-action-latch-test-total-info', text: '1뎁스 "기금 총괄정보" 래치 테스트', action: () => {
          if (window.sidebarAPI && typeof window.sidebarAPI.updateSidebarActiveState === 'function') {
            // "기금 총괄정보"의 하위 페이지 중 하나로 강제 이동 및 래치 테스트
            // 예시: /fund/overview/dashboard-main (실제 존재하는 경로로 변경 필요)
            const testPath = '/fund/overview/dashboard-main';
            document.dispatchEvent(new CustomEvent('app:request-navigation', { detail: { subdirOrFullPath: 'fund/overview', pageNameOrNull: 'dashboard-main', stateData: { navigationSource: 'devActionLatchTest' } } }));
            // 페이지 이동 후 사이드바가 업데이트되면서 래치가 설정될 것을 기대
            alert(`"${testPath}" 경로로 이동하여 "기금 총괄정보" 래치 테스트를 시도합니다.`);
            console.info('[DevAction] 1뎁스 "기금 총괄정보" 래치 테스트 실행.');
          } else { alert('window.sidebarAPI.updateSidebarActiveState 함수를 찾을 수 없습니다.'); }
        }
      },
      { id: 'dev-action-close-all-drawers', text: '모든 드로워 닫기 (테스트)', action: () => { if(window.sidebarAPI && window.sidebarAPI.closeAllDrawers) { window.sidebarAPI.closeAllDrawers('devActionCloseAll'); alert('모든 드로워 닫기 시도.'); } else { alert('sidebarAPI.closeAllDrawers 없음');} } },
      { 
        id: 'dev-action-test-dialog', 
        text: '테스트 다이얼로그 열기', 
        action: () => { 
          if (window.globalShowDialog) { // Changed from window.dialogManager
            window.globalShowDialog('confirm', { 
              title: '개발자 테스트', 
              message: '이것은 개발자 페이지에서 실행된 테스트 다이얼로그입니다.',
              // Assuming the 'confirm' dialog template in dialogTemplates.js defines
              // footer buttons with actions 'confirm' and 'cancel'.
              // These texts might be part of the template itself or passed to override.
              // For this example, we rely on the template for button text and pass callbacks.
              callbacks: {
                confirm: () => console.log('[DevDialog] 확인됨'), // Corresponds to a button with action: 'confirm'
                cancel: () => console.log('[DevDialog] 취소됨')   // Corresponds to a button with action: 'cancel'
              }
              // If the 'confirm' template in dialogTemplates.js needs text overrides:
              // footerActions: [
              //   { text: '확인했음', action: 'confirm', class: 'button--primary' },
              //   { text: '안할래', action: 'cancel' }
              // ]
            }); 
          } else { 
            alert('globalShowDialog function not found.'); // Updated message
          } 
        } 
      },
      // { id: 'dev-action-test-toast', text: '테스트 토스트 메시지', action: () => { /* 여기에 토스트 메시지 호출 로직 */ alert('토스트 기능 구현 필요'); } },
    ];

    actionsContainer.innerHTML = ''; // 기존 버튼 비우기
    actions.forEach(actionConfig => {
      const button = document.createElement('button');
      button.id = actionConfig.id;
      button.textContent = actionConfig.text;
      button.classList.add('button', 'button--outline', 'button--small'); // 공통 버튼 스타일 적용
      button.addEventListener('click', actionConfig.action);
      actionsContainer.appendChild(button);
    });
    console.info('[DevPage] 개발자 액션 버튼 초기화 완료.');
  }

  // --- 개발자 도구 초기화 로직 끝 ---

  // 페이지 로드 시 실행할 함수들
  updateLastErrorsDisplay();    // 최근 오류 표시
  updateDevEnvironmentInfo();   // 개발 환경 정보 표시
  initializeDeveloperActions(); // 개발자 액션 버튼 생성
  initializeDevPanel(); // 개발자 패널 초기화
  initializeCommandPalette(); // 명령어 팔레트 초기화

  console.info('[DevPage] 모든 초기화 절차 완료.');
}