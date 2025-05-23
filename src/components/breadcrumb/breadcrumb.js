/**
 * @file breadcrumb.js
 * @description 브레드크럼 UI 생성 및 상태 관리 담당.
 * 페이지 경로 변경에 따라 동적으로 브레드크럼 업데이트함.
 */

import './breadcrumb.css';

// ✨ 사이드바 메뉴 데이터 import
import menuConfigFromFile, {
  drawerMenuGroupsData,
  subDrawerMenuGroupsData,
  subSubDrawerMenuGroupsData,
  subSubSubDrawerMenuGroupsData
} from '@/config/menuConfig.js'; // 모든 메뉴 설정을 menuConfig.js에서 가져옴

/** @type {HTMLElement | null} 브레드크럼 컴포넌트 최상위 컨테이너 DOM 요소. `initializeBreadcrumb`에서 설정됨. */
let breadcrumbContainer = null;
/** @type {HTMLElement | null} 브레드크럼 아이템 담는 OL DOM 요소. `initializeBreadcrumb`에서 설정됨. */
let breadcrumbListElement = null;

/** @type {import('../sidebar/sidebar.js').SidebarLatchedState | null} 사이드바로부터 받은 마지막 래치 상태. */
let lastReceivedLatchState = null;

/**
 * @typedef {object} BreadcrumbConfig
 * @description 브레드크럼 동작 제어 설정 값 집합.
 * @property {string[]} [showOnPathsPrefix=[]] - 브레드크럼 표시 페이지 경로 접두사 목록.
 *    (예: `['/admin', '/fund/overview']`) 빈 배열 시 모든 경로에 표시.
 * @property {string} [homeText='홈'] - 홈 아이템 표시 텍스트 (현재는 홈 아이템 생략 로직 적용됨).
 * @property {string} [homeHref='/common/main'] - 홈 아이템 클릭 시 이동 경로 (현재는 홈 아이템 생략 로직 적용됨).
 */

/**
 * @type {BreadcrumbConfig}
 * @description 브레드크럼 컴포넌트의 기본 설정 객체입니다.
 */
const BREADCRUMB_CONFIG = {
  showOnPathsPrefix: [], // 빈 배열: 모든 페이지에 표시. 특정 경로 예: ['/admin', '/fund/overview']
  homeText: '홈',
  homeHref: import.meta.env.DEV ? '/common/dev' : '/common/main', // DEV 환경 따라 홈 경로 동적 설정
};


/**
 * @deprecated 현재 사용되지 않음. `findMenuPathItems` 함수로 대체됨.
 * @description 전체 경로와 메뉴 아이템 목록에서 일치 아이템 텍스트 검색함. (현재 미사용)
 * @param {string} fullPathToSegment - 검색 대상 전체 URL 경로 (정규화된 형태).
 * @param {import('../sidebar/menuConfig.js').DrawerMenuItemConfig[]} items - 검색 대상 메뉴 아이템 객체 배열.
 * @returns {string | null} 일치 메뉴 아이템 `title` (과거 `text`) 또는 `null`.
 */
function findItemTextByPath(fullPathToSegment, items) {
  if (!items) return null;
  for (const item of items) {
    if (item.href && normalizePath(item.href) === normalizePath(fullPathToSegment)) {
      return item.title; // text -> title 일관성 유지
    }
  }
  return null;
}

/**
 * @description URL 경로 문자열 정규화. 루트('/') 제외하고 끝 슬래시('/') 제거함.
 * @param {string} path - 정규화할 원본 URL 경로.
 * @returns {string} 정규화된 URL 경로.
 */
function normalizePath(path) {
  // 사이드바 모듈에도 동일 기능 함수 존재하나, 모듈 간 의존성 최소화 및 독립적 사용을 위해 본 모듈 내에도 정의함.
  if (path === '/') return path;
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

/**
 * @description 현재 경로 기반 브레드크럼 아이템 정보 배열 생성. 메뉴 구조 탐색 결과 사용. (홈 아이템은 생략됨)
 * @param {string} currentPath - 현재 페이지 전체 경로 (예: '/admin/code-management/group-edit').
 * @returns {Array<BreadcrumbItem>} 브레드크럼 아이템 정보 배열. 현재 페이지는 `isCurrentPage: true` 가짐.
 */

function getPathSegments(currentPath) {
  const normalizedCurrentPath = normalizePath(currentPath);
  const breadcrumbItems = []; // 홈 아이템 생략, 빈 배열로 시작

  // 2. 현재 경로에 해당하는 메뉴 경로 찾기
  // findMenuPathItems는 현재 페이지 포함 전체 경로 아이템 배열 반환 (isCurrentPage 플래그 포함)
  const menuPathItems = findMenuPathItems(normalizedCurrentPath);

  // 현재 경로가 홈 경로이고, 메뉴 경로를 찾지 못한 경우 (menuPathItems가 null), 빈 배열 반환
  if (normalizedCurrentPath === normalizePath(BREADCRUMB_CONFIG.homeHref) && !menuPathItems) {
    return [];
  }

  if (menuPathItems) {
    // findMenuPathItems 반환 모든 아이템 추가 (마지막 아이템 포함)
    breadcrumbItems.push(...menuPathItems);
  }
  return breadcrumbItems;
}

/**
 * @typedef {object} BreadcrumbItem
 * @property {string} text - 브레드크럼 아이템 표시 텍스트.
 * @property {string} href - 브레드크럼 아이템 링크 경로.
 * @property {boolean} [isIntermediateFolder] - 중간 폴더 여부.
 * @property {boolean} [isCurrentPage] - 현재 페이지 여부.
 */
/**
 * @description 현재 URL 경로(`targetPath`) 해당 메뉴 계층 구조 탐색, 브레드크럼 경로 아이템 배열 반환. 1뎁스 메뉴부터 재귀 탐색. (홈 아이템은 여기서 생성 안 함)
 * @param {string} targetPath - 현재 페이지 전체 URL 경로 (정규화 상태여야 함).
 * @returns {Array<BreadcrumbItem> | null} 찾은 메뉴 경로 아이템 배열 또는 `null`.
 */
function findMenuPathItems(targetPath) {
  const pathItems = [];

  // 1단계: 1뎁스 메뉴에서 시작점 찾기
  for (const menuItem1st of menuConfigFromFile) {
    const normalizedItem1stHref = menuItem1st.href ? normalizePath(menuItem1st.href) : null;

    if (normalizedItem1stHref === targetPath && !menuItem1st.drawerItemsKey) { // 1뎁스 자체가 링크이고 하위 드로워가 없는 경우
      // 1뎁스 메뉴 자체가 타겟 페이지.
      return [{ text: menuItem1st.title, href: normalizedItem1stHref, isIntermediateFolder: false, isCurrentPage: true }];
    }

    if (menuItem1st.drawerItemsKey && drawerMenuGroupsData[menuItem1st.drawerItemsKey]) {
      // 1뎁스 메뉴 아이템 추가 (중간 폴더로 간주)
      pathItems.push({ 
        text: menuItem1st.title, // menuConfig.js의 1뎁스 항목은 title 속성 사용
        // 1뎁스 메뉴가 href 없고 drawerItemsKey만 있으면 (폴더 역할),
        // sidebar.js의 flatMenuData 생성 시 사용되는 placeholder href(`_internal_id_1_{ID}`)를 사용.
        href: menuItem1st.href || (menuItem1st.drawerItemsKey ? `_internal_id_1_${menuItem1st.id}` : '#'),
        isIntermediateFolder: true // 하위 메뉴가 있으므로 중간 폴더로 간주
      });

      const drawerItems = drawerMenuGroupsData[menuItem1st.drawerItemsKey];
      const result = findRecursiveMenuPath(
        drawerItems,
        targetPath,
        2,
        []  // 2뎁스부터 탐색 시작 (1뎁스는 위 pathItems에 이미 추가됨)
      );

      if (result) {
        return [...pathItems, ...result];
      }
    }
  }
  // console.debug('[브레드크럼] 메뉴 경로 탐색 실패: 일치하는 1뎁스 시작점 없음 (targetPath: %s)', targetPath);
  return null;
}

/**
 * @description 지정 메뉴 아이템 목록(`itemsToSearch`)에서 목표 경로(`targetPath`)까지 계층 경로 재귀 탐색, 브레드크럼 아이템 배열 반환.
 * @param {import('../sidebar/menuConfig.js').DrawerMenuItemConfig[]} itemsToSearch - 현재 뎁스에서 검색할 메뉴 아이템의 배열.
 * @param {string} targetPath - 최종적으로 찾아야 할 목표 페이지의 전체 URL 경로 (정규화된 상태).
 * @param {number} currentDepth - 현재 탐색 중인 메뉴의 뎁스 (2뎁스부터 시작).
 * @param {Array<BreadcrumbItem>} currentFoundPath - 이전 재귀 호출까지 누적된 상위 경로 아이템 배열.
 * @returns {Array<BreadcrumbItem> | null} `currentFoundPath`에 현재 뎁스에서 찾은 경로 아이템 추가한 전체 경로 배열, 또는 `null`.
 */
function findRecursiveMenuPath(itemsToSearch, targetPath, currentDepth, currentFoundPath) {
  for (const item of itemsToSearch) {
    const normalizedItemHref = item.href ? normalizePath(item.href) : null;
    if (!normalizedItemHref) continue;

    // 현재 아이템에 대한 경로 세그먼트 생성
    const currentItemSegment = {
      text: item.title, // text -> title 일관성 유지
      href: normalizedItemHref,
      isIntermediateFolder: item.iconId === 'icon-folder',
      isCurrentPage: false
    };

    if (normalizedItemHref === targetPath) {
      currentItemSegment.isIntermediateFolder = false; // 최종 페이지는 폴더 아님
      currentItemSegment.isCurrentPage = true; // 현재 페이지임을 표시
      return [...currentFoundPath, currentItemSegment];
    }

    if (item.iconId === 'icon-folder') {
      let nextLevelItems = null;
      if (currentDepth === 2 && subDrawerMenuGroupsData[normalizedItemHref]) {
        nextLevelItems = subDrawerMenuGroupsData[normalizedItemHref];
      } else if (currentDepth === 3 && subSubDrawerMenuGroupsData[normalizedItemHref]) {
        nextLevelItems = subSubDrawerMenuGroupsData[normalizedItemHref];
      } else if (currentDepth === 4 && subSubSubDrawerMenuGroupsData[normalizedItemHref]) {
        nextLevelItems = subSubSubDrawerMenuGroupsData[normalizedItemHref];
      }

      if (nextLevelItems) {
        // 재귀 호출: 현재 폴더 아이템 포함한 경로(newFoundPath) 전달
        const result = findRecursiveMenuPath(nextLevelItems, targetPath, currentDepth + 1, [...currentFoundPath, currentItemSegment]);
        if (result) return result;
      }
    }
  }
  return null;
}

/**
 * @description 브레드크럼 링크에 이벤트 리스너 추가. 폴더 링크와 일반 페이지 링크 구분 처리함.
 * @param {HTMLElement | null} listElement - 이벤트 리스너를 추가할 OL 요소.
 */
function addEventListenersToBreadcrumbLinks(listElement) {
  if (!listElement) return;

  // 기존 리스너가 중복 추가되는 것을 방지하기 위해,
  // 실제 프로덕션 코드에서는 AbortController를 사용하거나,
  // 링크 새로 생성 시 리스너 한 번만 붙이는 방식 고려 필요. (현재는 innerHTML 변경 시 기존 리스너 제거됨 가정)
  listElement.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');

      // 현재 경로가 report-iframe 페이지인지 확인
      const currentWindowPath = normalizePath(window.location.pathname + window.location.search);

      if (link.classList.contains('breadcrumb__folder-interactive')) {
        const folderPath = link.dataset.folderPath;

        if (currentWindowPath.includes('/common/report-iframe') && folderPath && lastReceivedLatchState && lastReceivedLatchState.firstLevelMenuId) {
          // report-iframe 페이지에서 중간 폴더 클릭 시 커스텀 이벤트 발생
          console.info('[브레드크럼] Report-iframe 페이지 중간 폴더 선택: %s. 이벤트 발생.', folderPath);
          document.dispatchEvent(new CustomEvent('breadcrumb:report-folder-selected', {
            detail: {
              folderPath: folderPath,
              firstLevelMenuId: lastReceivedLatchState.firstLevelMenuId,
              reportPageHref: lastReceivedLatchState.pageHref // 현재 리포트 페이지 정보 전달
            }
          }));
        } else if (folderPath && window.focusSidebarOnPath) { // 일반 페이지: window.focusSidebarOnPath 호출
          console.info('[브레드크럼] 일반 페이지 중간 폴더 선택: %s. 사이드바 포커스 요청.', folderPath);
          window.focusSidebarOnPath(folderPath); // 사이드바 특정 경로 포커스/열기 (외부 API)
        } else if (folderPath) {
          console.warn('[브레드크럼] 중간 폴더 클릭 처리 불가: window.focusSidebarOnPath 없음 또는 report-iframe 컨텍스트 정보 부족. 경로: %s', folderPath);
        }

      } else if (link.hasAttribute('data-navigate') && href && href !== 'javascript:void(0);' && href !== '#') {
        console.info('[브레드크럼] 페이지 링크 선택: %s. 네비게이션 요청.', href);
        const pathSegments = href.startsWith('/') ? href.substring(1).split('/') : href.split('/');
        const targetPageName = pathSegments.pop() || null;
        const targetSubDirectory = pathSegments.join('/') || '/';

        document.dispatchEvent(new CustomEvent('app:request-navigation', {
          detail: {
            subdirOrFullPath: targetSubDirectory,
            pageNameOrNull: targetPageName,
            stateData: { navigationSource: 'breadcrumbLinkClick' }
          }
        }));
      }
    });
  });
}

/**
 * @description 브레드크럼 아이템 정보 배열 사용하여 `<ol>` 리스트 내부 `<li>` HTML 문자열 생성.
 * @param {Array<BreadcrumbItem>} items - 브레드크럼 각 아이템 정보 담은 객체 배열.
 * @returns {string} 생성된 `<li>` 요소 HTML 문자열.
 */
function generateBreadcrumbHtml(items) {
  let html = '';
  items.forEach((item, index) => {
    // const isActive = item.isCurrentPage || (index === items.length - 1 && !items.slice(0, index).some(i => i.isCurrentPage)); // isActive 변수 현재 미사용
    const isLast = index === items.length - 1;

    if (item.isCurrentPage) { // 현재 페이지 아이템
      html += `
        <li class="breadcrumb__item breadcrumb__item--active" aria-current="page">
          <span class="breadcrumb__text">${item.text}</span>
        </li>`;
    } else if (item.isIntermediateFolder) { // Case 2: Intermediate Folder - 클릭 시 사이드바 포커스 이동
      html += `
        <li class="breadcrumb__item">
          <a href="javascript:void(0);" class="breadcrumb__link breadcrumb__folder-interactive" data-folder-path="${item.href}">
            <span class="breadcrumb__text">${item.text}</span>
          </a>
          ${!isLast ? '<span class="breadcrumb__separator">&gt;</span>' : ''}
        </li>`;
    } else { // 중간 페이지 아이템 (클릭 시 페이지 이동)
      html += `
        <li class="breadcrumb__item">
          <a href="${item.href || '#'}" class="breadcrumb__link" data-navigate>
            <span class="breadcrumb__text">${item.text}</span>
          </a>
          ${!isLast ? '<span class="breadcrumb__separator">&gt;</span>' : ''}
        </li>`;
    }
  });
  return html;
}

/**
 * @description 현재 페이지 경로 및 제목 기반 브레드크럼 UI 업데이트.
 * @param {string} currentPath - 현재 페이지 전체 URL 경로.
 * @param {string} pageTitle - 현재 페이지 제목.
 */
function updateBreadcrumbState(currentPath, pageTitle) {
    if (!breadcrumbListElement || !breadcrumbContainer) {
        console.warn('[브레드크럼] UI 업데이트 중단: 브레드크럼 리스트 또는 컨테이너 DOM 요소를 찾을 수 없습니다.');
        return;
    }

    const normalizedPath = normalizePath(currentPath);
    let itemsForHtml = [];

    // report-iframe 페이지이고, 유효한 래치 정보가 현재 경로와 일치할 경우 특별 처리
    if (normalizedPath.includes('/common/report-iframe') &&
        lastReceivedLatchState &&
        lastReceivedLatchState.pageHref &&
        normalizePath(lastReceivedLatchState.pageHref) === normalizedPath) {

        // console.debug('[브레드크럼] Report-iframe 페이지: 일치하는 래치 정보로 브레드크럼 구성.');
        // 홈 아이템 생략
        if (lastReceivedLatchState.firstLevelMenuId && lastReceivedLatchState.firstLevelMenuTitle) {
            const firstLevelMenuConfig = menuConfigFromFile.find(m => m.id === lastReceivedLatchState.firstLevelMenuId);
            if (firstLevelMenuConfig) {
                itemsForHtml.push({
                    text: lastReceivedLatchState.firstLevelMenuTitle,
                    // 1뎁스 메뉴가 href 없고 drawerItemsKey만 있으면 (폴더 역할),
                    // sidebar.js의 flatMenuData 생성 시 사용되는 placeholder href(`_internal_id_1_{ID}`)를 사용.
                    // 그렇지 않으면 일반적인 href 또는 폴백 '#' 사용.
                    href: firstLevelMenuConfig.href || (firstLevelMenuConfig.drawerItemsKey ? `_internal_id_1_${firstLevelMenuConfig.id}` : '#'),
                    isIntermediateFolder: !!firstLevelMenuConfig.drawerItemsKey,
                    isCurrentPage: false,
                });
            } else {
                 console.warn('[브레드크럼] 래치된 1뎁스 메뉴 설정 조회 실패: ID=%s', lastReceivedLatchState.firstLevelMenuId);
            }
        }
        
        // 래치된 folderPath 기반 중간 폴더 추가
        if (lastReceivedLatchState.folderPath && lastReceivedLatchState.folderPath.length > 0) {
            lastReceivedLatchState.folderPath.forEach(folder => {
                itemsForHtml.push({
                    text: folder.title,
                    href: folder.href,
                    isIntermediateFolder: true,
                    isCurrentPage: false,
                });
            });
        }

        // 현재 리포트 페이지 아이템 추가
        itemsForHtml.push({
            text: lastReceivedLatchState.pageTitle || pageTitle || '리포트', // 래치된 페이지 제목 우선 사용
            href: normalizedPath,
            isCurrentPage: true,
        });

    } else {
        // --- 기존 로직 (report-iframe이 아니거나, 래치 정보가 부적합/불일치하는 경우) ---
        itemsForHtml = getPathSegments(normalizedPath); // 홈 아이템 포함
        const isHomePage = normalizedPath === normalizePath(BREADCRUMB_CONFIG.homeHref);

        // 메뉴 경로 탐색 실패 또는 홈 페이지 아닌 경우: pageTitle을 마지막 아이템으로 추가
        // 홈 페이지가 아닌 경우, pageTitle을 마지막 아이템으로 추가
        if (!isHomePage && (itemsForHtml.length === 0 || !itemsForHtml[itemsForHtml.length - 1].isCurrentPage)) {
            const lastGeneratedItem = itemsForHtml.length > 0 ? itemsForHtml[itemsForHtml.length -1] : null;
            // 마지막 생성 아이템이 현재 페이지와 다를 경우에만 추가 (중복 방지)
            if (!(lastGeneratedItem && lastGeneratedItem.href === normalizedPath && lastGeneratedItem.isCurrentPage)) {
                 itemsForHtml.push({
                    text: pageTitle || '현재 페이지',
                    href: normalizedPath,
                    isCurrentPage: true
                });
            }
        }
    }

    breadcrumbListElement.innerHTML = generateBreadcrumbHtml(itemsForHtml);
    addEventListenersToBreadcrumbLinks(breadcrumbListElement);
    breadcrumbContainer.style.display = itemsForHtml.length > 0 ? 'block' : 'none'; // 아이템 있을 때만 표시
}

/**
 * @description 브레드크럼 컴포넌트 초기화. DOM 요소 설정, 전역 함수 노출, 이벤트 리스너 등록.
 * @param {HTMLElement} containerElement - 브레드크럼 컴포넌트 삽입 및 관리할 부모 컨테이너 DOM 요소.
 */
export function initializeBreadcrumb(containerElement) {
  if (!containerElement) {
    console.error('[브레드크럼] 초기화 실패: 컨테이너 DOM 요소 누락.');
    return;
  }

  // 브레드크럼 기본 HTML 구조 삽입
  containerElement.innerHTML = `
    <nav class="nav-breadcrumb" aria-label="breadcrumb">
      <ol class="breadcrumb">
        <!-- Breadcrumb 아이템은 JavaScript에 의해 동적으로 생성됩니다. -->
      </ol>
    </nav>
  `;

  breadcrumbContainer = containerElement;
  breadcrumbListElement = breadcrumbContainer.querySelector('.breadcrumb');

  if (!breadcrumbListElement) {
    console.error('[브레드크럼] 초기화 실패: 브레드크럼 리스트 요소(.breadcrumb) 없음.');
    return;
  }

  // 다른 모듈에서 브레드크럼 업데이트 가능하도록 window 객체에 함수 할당
  window.updateBreadcrumbState = updateBreadcrumbState;

  // 브라우저 뒤로가기/앞으로가기 이벤트(popstate) 리스너 등록
  window.addEventListener('popstate', (event) => {
    // 참고: SPA 라우터 사용 시 event.state 활용하여 더 정확한 pageTitle 획득 가능 (현재는 document.title 사용)
    console.info('[브레드크럼] Popstate 이벤트 감지: 경로=%s, 제목=%s. 브레드크럼 업데이트.', window.location.pathname, document.title);
    updateBreadcrumbState(window.location.pathname, document.title);
  });

  // 사이드바 래치 상태 변경 이벤트 리스너 등록
  document.addEventListener('sidebar:latch-updated', (event) => {
    lastReceivedLatchState = event.detail;
    // console.debug('[브레드크럼] sidebar:latch-updated 이벤트 수신:', JSON.parse(JSON.stringify(lastReceivedLatchState)));

    const currentPath = normalizePath(window.location.pathname + window.location.search);
    // 현재 페이지가 report-iframe이고, 래치된 페이지 정보와 일치할 경우 브레드크럼 업데이트
    if (currentPath.includes('/common/report-iframe') &&
        lastReceivedLatchState &&
        lastReceivedLatchState.pageHref &&
        normalizePath(lastReceivedLatchState.pageHref) === currentPath) {

      // lastReceivedLatchState.pageTitle (래치된 페이지 제목) 사용
      const titleFromLatch = lastReceivedLatchState.pageTitle || document.title;

      console.info(`[브레드크럼] 래치 업데이트로 report-iframe 브레드크럼 재구성 호출. 경로: ${currentPath}, 제목: ${titleFromLatch}`);
      updateBreadcrumbState(currentPath, titleFromLatch);
    }
  });
  console.info('[브레드크럼] 초기화 절차 완료.');
}