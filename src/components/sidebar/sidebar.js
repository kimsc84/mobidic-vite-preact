/**
 * @file 사이드바 UI 및 동작 관리.
 * 메뉴 동적 생성, 드로워(2~5뎁스) 토글, 현재 경로 따른 활성 상태 업데이트, 외부 상호작용 처리 등 담당.
 */
import menuConfigFromFile, {
  quickMenuItemsData, // ✨ quickMenuItemsData 임포트 추가
  menuConfig,
  drawerMenuGroupsData,
  transformReportItemHref, // ✨ transformReportItemHref 임포트 추가
  subDrawerMenuGroupsData, // 이제 flatMenuData 생성 시 사용됨
  subSubDrawerMenuGroupsData, // 이제 flatMenuData 생성 시 사용됨
  subSubSubDrawerMenuGroupsData // 이제 flatMenuData 생성 시 사용됨
} from '@/config/menuConfig.js'; // 1뎁스 주 메뉴 및 2~5뎁스 메뉴 데이터 import

import '@components/sidebar/sidebar.css'; // 사이드바 CSS

// --- 전역(모듈 스코프) 변수 ---
/** @type {HTMLElement | null} 사이드바 전체 컨테이너 DOM 요소. */
let sidebarContainer = null;
/** @type {Object.<number, string | null>} 활성 드로워 키 저장 객체. (키: 뎁스, 값: 활성 폴더 href) */
let activeDrawerKeys = { 3: null, 4: null, 5: null };
/** @type {Object.<number, DrawerDepthConfig>} 뎁스별 드로워 설정 객체. */
let drawerConfigByDepth = {};
/** @type {boolean} 외부 상호작용에 의한 드로워 닫기 진행 여부 플래그. */
let externalCloseInProgress = false;
/** @type {boolean} 전역 이벤트 리스너 부착 여부 플래그. */
let globalListenersAttached = false;
/** @type {Object.<string, FlatMenuItem>} 사전 가공된 플랫 메뉴 데이터 맵. (키: 정규화된 href) */
let flatMenuData = {};
// TODO: JSDoc SidebarLatchedState 내부 folderPath 타입 명확화 (현재 Array<{href: string, title: string}>)
/**
 * @typedef {object} SidebarLatchedState
 * @description 사이드바 마지막 활성 페이지 및 경로 상태 기억 객체.
 * @property {string | null} firstLevelMenuId - 래치된 1뎁스 메뉴 ID.
 * @property {string | null} firstLevelMenuTitle - 래치된 1뎁스 메뉴 제목.
 * @property {string | null} pageHref - 래치된 페이지의 href (정규화된 경로).
 * @property {string | null} pageTitle - 래치된 페이지의 제목.
 * @property {Array<{href: string, title: string}>} folderPath - 래치된 페이지 도달용 중간 폴더 정보 배열 ({href, title}).
 */

/** @type {SidebarLatchedState} 사이드바 래치 상태 저장 객체 */
let latchedState = { firstLevelMenuId: null, firstLevelMenuTitle: null, pageHref: null, pageTitle: null, folderPath: [] };

// --- Helper/Utility Functions ---
/**
 * URL 경로 정규화. 루트('/') 제외하고 끝 슬래시('/') 제거.
 * @param {string} path - 정규화할 원본 URL 경로.
 * @returns {string} 정규화된 URL 경로.
 */
function normalizePath(path) {
  if (path === '/') return path; // 루트 경로는 그대로 둠
  return path.endsWith('/') ? path.slice(0, -1) : path;
}


/**
 * 지정 DOM 요소 표시 및 상호작용 가능 설정. (CSS display: block)
 * @param {HTMLElement | null} hostElement - 표시할 DOM 요소.
 */
function showHost(hostElement) {
  if (hostElement) {
    hostElement.style.display = 'block'; // Use display: block instead of visibility: visible
    // pointer-events: auto is default for block elements, can be omitted unless specifically set to none elsewhere
  }
}

/**
 * 지정 DOM 요소 숨김 및 상호작용 불가 설정. (CSS display: none)
 * @param {HTMLElement | null} hostElement - 숨길 DOM 요소.
 */
function hideHost(hostElement) {
  if (hostElement) {
    hostElement.style.display = 'none'; // Use display: none instead of visibility: hidden
    // pointer-events: none is not strictly necessary with display: none, but doesn't hurt.
  }
}

/**
 * UL 직계 자식 LI 중, 내부 A 태그의 data-href가 주어진 href와 일치하는 첫 LI 반환.
 * @param {HTMLUListElement | null} ulElement - 검색 대상 UL 요소.
 * @param {string} href - 찾을 href 값 (정규화된 경로).
 * @returns {HTMLLIElement | null} 일치 LI 요소 또는 null.
 */
function findLiByHref(ulElement, href) {
  if (!ulElement) return null;
  const normalizedHrefToFind = normalizePath(href);
  const itemsInUl = ulElement.querySelectorAll(':scope > li.sidebar__item');
  for (const li of itemsInUl) {
    const link = li.querySelector('a');
    if (link && link.dataset.href && normalizePath(link.dataset.href) === normalizedHrefToFind) { // ✨ Use dataset.href for consistency
      return li;
    }
  }
  return null;
}

/**
 * 퀵메뉴 또는 드로워(2~5뎁스) 메뉴 아이템 LI DOM 요소 생성.
 * @param {QuickMenuItemConfig | import('../../config/menuConfig.js').DrawerMenuItemConfig} itemData - 생성할 메뉴 아이템의 설정 데이터.
 * @param {boolean} [isQuickMenu=false] - 퀵메뉴 아이템 여부.
 * @param {number} [depth=2] - 메뉴 아이템 뎁스 (2-5). 드로워 메뉴 해당.
 * @returns {HTMLLIElement} 생성된 LI DOM 요소.
 */
function createSubMenuItemElement(itemData, isQuickMenu = false, depth = 2) {
  // NOSONAR 다음 행은 의도된 동작임. itemData.href가 없을 경우 '#'을 기본값으로 사용.
  const listItem = document.createElement('li');
  const link = document.createElement('a');
  link.href = itemData.href || '#';

  // --- 아이콘 생성 (공통) ---
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', isQuickMenu ? '24' : '16'); // 퀵메뉴 아이콘 크기 24, 일반 16
  svg.setAttribute('height', isQuickMenu ? '24' : '16'); // 퀵메뉴 아이콘 크기 24, 일반 16
  svg.setAttribute('role', 'img');
  // JSDoc @type 에 따라 itemData.title 또는 itemData.ariaLabel 사용 (text -> title 변경)
  svg.setAttribute('aria-label', isQuickMenu ? itemData.ariaLabel : (itemData.ariaLabel || itemData.title));
  svg.classList.add('sidebar__item-icon');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${itemData.iconId}`);
  svg.appendChild(use);
  link.appendChild(svg); // 메인 아이콘은 항상 링크의 첫 번째 자식으로 추가

  // 이벤트 위임을 위해 필요한 정보 data 속성으로 추가
  if (itemData.href) link.dataset.href = itemData.href;
  link.dataset.title = itemData.title; // 메뉴 제목
  if (itemData.id) link.dataset.id = itemData.id; // id 추가 (리프 노드용)
  link.dataset.iconId = itemData.iconId; // 폴더 여부 판단 등에 사용
  link.dataset.depth = String(depth);
  if (isQuickMenu) link.dataset.isQuickMenu = 'true';
  if (itemData.onClick && typeof itemData.onClick === 'function') link.dataset.hasCustomClick = 'true';

  if (isQuickMenu) {
    listItem.classList.add('sidebar__quick-menu-item');
    link.classList.add('sidebar__quick-menu-link'); // CSS에서 퀵메뉴 링크 스타일링 용도
    if (itemData.subItems && itemData.subItems.length > 0) {
      listItem.classList.add('has-submenu'); // 하위 메뉴가 있음을 나타내는 클래스

      // 하위 메뉴 컨테이너 및 리스트 생성
      const subMenuDiv = document.createElement('div');
      subMenuDiv.className = 'sidebar__quick-submenu'; // 오버레이 될 하위 메뉴

      const subMenuListUl = document.createElement('ul');
      subMenuListUl.className = 'sidebar__quick-submenu-list';

      itemData.subItems.forEach(subItemData => {
        const subLi = document.createElement('li'); // QuickMenuSubItemConfig는 text 유지
        const subLink = document.createElement('a'); // ✨ subLink 정의 추가!
        subLink.href = subItemData.href || '#'; // NOSONAR: 의도된 동작, href 없으면 '#'
        if (subItemData.href) subLink.dataset.href = subItemData.href;
        subLink.dataset.title = subItemData.text; // 퀵메뉴 하위 아이템 제목
        if (subItemData.iconId) subLink.dataset.iconId = subItemData.iconId;
        subLink.dataset.isQuickSubmenuItem = 'true';
        if (subItemData.onClick && typeof subItemData.onClick === 'function') subLink.dataset.hasCustomClick = 'true';

        // (선택) 하위 메뉴 아이템 아이콘
        if (subItemData.iconId) {
          const subIconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          subIconSvg.setAttribute('width', '16'); // 하위 메뉴 아이콘 크기 16
          subIconSvg.setAttribute('height', '16'); // 하위 메뉴 아이콘 크기 16
          subIconSvg.setAttribute('role', 'img');
          subIconSvg.setAttribute('aria-label', subItemData.text);
          subIconSvg.classList.add('sidebar__item-icon', 'sidebar__quick-submenu-item-icon');

          const subIconUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
          subIconUse.setAttributeNS('http://www.w3.org/1999/xlink', 'href', `#${subItemData.iconId}`);
          subIconSvg.appendChild(subIconUse);
          subLink.appendChild(subIconSvg);
        }
        const subSpan = document.createElement('span');
        subSpan.textContent = subItemData.text;
        subLink.appendChild(subSpan); // 아이콘이 있다면 아이콘 뒤에, 없다면 첫 자식
        // 개별 이벤트 리스너 제거 (이벤트 위임으로 처리)
        subLi.appendChild(subLink);
        subMenuListUl.appendChild(subLi);
      });
      subMenuDiv.appendChild(subMenuListUl);
      listItem.appendChild(subMenuDiv); // li에 하위 메뉴 div 추가

      // 하위 메뉴 위치 및 꼬리 스타일 동적 조절 리스너 (CSS 호버/포커스 시)
      link.addEventListener('click', (eMain) => { // NOSONAR: 이 리스너는 하위 메뉴 위치 조정을 위해 유지
        // 하위 메뉴 위치 및 꼬리(::before 스타일) 위치 동적 조절 로직
        const adjustSubmenuAndTailPosition = () => { // 함수명 복원
          const triggerItemRect = listItem.getBoundingClientRect(); // 호버/포커스된 li
          // --- 1. 하위 메뉴(.sidebar__quick-submenu)가 화면 벗어나는지 체크 및 위치 조정 ---
          // subMenuDiv가 아직 화면에 표시되지 않았다면 (display:none), submenuRect.height는 0일 수 있음.
          // 이 경우, 임시로 보이게 하여 높이를 측정하고 다시 숨김.
          let actualSubmenuHeight = subMenuDiv.offsetHeight;
          if (subMenuDiv.style.display !== 'block') { // 아직 display:block이 아니라면
            subMenuDiv.style.visibility = 'hidden'; // 안 보이게
            subMenuDiv.style.display = 'block';    // 공간 차지하게 (높이 계산용)
            actualSubmenuHeight = subMenuDiv.offsetHeight;
            subMenuDiv.style.display = '';       // 원래대로 (CSS에 의해 none으로 돌아감)
            subMenuDiv.style.visibility = '';    // 원래대로
          }
          // TODO: 화면 벗어남 체크 로직 추가 (현재는 높이 계산만)
          const viewportHeight = window.innerHeight;
          // --- 2. 꼬리(::before)의 top 위치 계산 및 CSS 변수 설정 ---
          const submenuRect = subMenuDiv.getBoundingClientRect(); // 서브메뉴의 현재 화면상 위치
          const triggerItemCenterY = triggerItemRect.top + (triggerItemRect.height / 2);

          // CSS rem 단위를 JS에서 px로 계산하기 위해 root 폰트 크기 사용
          const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
          const tailHeightPx = 1 * rootFontSize; // 꼬리 높이 1rem을 px로 변환

          // 꼬리의 top 위치 계산: (퀵메뉴 아이템의 중앙 Y) - (서브메뉴의 상단 Y) - (꼬리 높이의 절반)
          const newTailTopPx = triggerItemCenterY - submenuRect.top - (tailHeightPx / 2);
          // 계산된 꼬리 top 위치를 CSS 변수로 설정하여 ::before 가상 요소에 적용
          subMenuDiv.style.setProperty('--tail-top', `${newTailTopPx}px`); // NOSONAR: 이미지는 아니지만, CSS 변수 설정은 정당함
        };
        listItem.addEventListener('mouseenter', adjustSubmenuAndTailPosition);
        listItem.addEventListener('focusin', adjustSubmenuAndTailPosition);
      });
    }
    // 하위 메뉴 없는 퀵메뉴 아이템은 별도 JS 로직 불필요 (이벤트 위임으로 처리)
  } else { // 일반 드로워 메뉴 아이템 (isQuickMenu = false)
    listItem.classList.add('sidebar__item');

    // 드로워 메뉴 아이템 텍스트
    if (itemData.title) { // text -> title 변경
      const span = document.createElement('span');
      span.textContent = itemData.title;
      link.appendChild(span); // 아이콘 다음에 텍스트 추가 (올바른 'link'에 추가됨)
    }
  }
  listItem.appendChild(link); // 최종적으로 li에 링크 추가
  return listItem;
}

/**
 * 지정 뎁스 및 하위 모든 드로워 닫고 상태 초기화.
 * @param {number} depthToClose - 닫기 시작할 뎁스 (3, 4, 또는 5).
 */
function closeDrawerLevelAndBelow(depthToClose) {
  for (let d = depthToClose; d <= 5; d++) {
    const config = drawerConfigByDepth[d];
    if (config) {
      const hostElement = config.getHostElement();
      if (hostElement) {
        hostElement.innerHTML = '';
        hideHost(hostElement);
      }
      activeDrawerKeys[d] = null;
    }
  }
}


/**
 * 일반화된 드로워 렌더링.
 * 지정 뎁스의 드로워 호스트 내용 비우고, 하위 드로워 닫고, 메뉴 아이템 생성/추가 후 표시.
 * @param {number} depth - 렌더링할 드로워의 뎁스 (3, 4, 또는 5).
 * @param {string} menuKey - `menuDataMap`에서 메뉴 아이템을 가져올 키.
 * @returns {HTMLUListElement | null} 생성된 메뉴 UL 요소 또는 null.
 */
function renderGenericDrawerMenu(depth, menuKey) {
  console.info(`[사이드바] 드로워 렌더링 요청: depth=${depth}, menuKey=${menuKey}`);
  const config = drawerConfigByDepth[depth];
  if (!config) {
    console.warn(`[사이드바] 드로워 렌더링 실패: 지원하지 않는 뎁스(${depth})`);
    return null;
  }

  const hostElement = config.getHostElement();
  if (!hostElement) {
    console.warn(`[사이드바] 드로워 렌더링 실패: ${depth}뎁스 호스트 요소 없음.`);
    return null;
  }

  const { menuDataMap, drawerClassModifier, childCloseDepth } = config;
  // console.debug(`[사이드바] ${depth}뎁스 드로워(${menuKey}) 렌더링 준비: 호스트 비우고 ${childCloseDepth}뎁스 이하 닫기.`);
  hostElement.innerHTML = ''; // 기존 내용 비우기
  closeDrawerLevelAndBelow(childCloseDepth);

  if (menuKey && menuDataMap[menuKey]) {
    // console.debug(`[사이드바] ${depth}뎁스 드로워(${menuKey}) 메뉴 데이터 유효. 컨테이너 생성.`);
    const drawerContainer = document.createElement('div');
    drawerContainer.className = `sidebar__drawer sidebar__drawer${drawerClassModifier} scroll--common is-open`;
    const menuList = document.createElement('ul');
    menuList.className = 'sidebar__menu';

    // 메뉴 아이템 정렬: 폴더 우선, 그 외 텍스트 오름차순 (이 부분은 flatMenuData 사용 시 사전 정렬 가능)
    let menuItems = [...menuDataMap[menuKey]]; // Copy array before sorting
    menuItems.sort((a, b) => {
      const isAFolder = a.iconId === 'icon-folder';
      const isBFolder = b.iconId === 'icon-folder';
      if (isAFolder && !isBFolder) return -1;
      if (!isAFolder && isBFolder) return 1; // text -> title 변경
      return a.title.localeCompare(b.title, 'ko');
    });

    menuItems.forEach(itemData => {
      const menuItemElement = createSubMenuItemElement(itemData, false, depth);
      menuList.appendChild(menuItemElement);
    });

    drawerContainer.appendChild(menuList);
    hostElement.appendChild(drawerContainer);
    showHost(hostElement);
    console.info(`[사이드바] 드로워 렌더링 완료: depth=${depth}, menuKey=${menuKey}`);
    return menuList;
  } else if (menuKey) {
    console.warn(`[사이드바] 드로워 렌더링 실패: ${depth}뎁스 메뉴 데이터 없음 (key: ${menuKey})`);
  }
  hideHost(hostElement); // 메뉴 데이터 없으면 호스트 숨김
  // console.debug(`[사이드바] ${depth}뎁스 드로워(${menuKey}) 렌더링 조건 불충족 또는 호스트 숨김.`);
  return null;
}


/**
 * drawerKey 해당 2뎁스 메뉴 아이템을 secondaryMenuListElement 내부에 렌더링.
 * 기존 메뉴 및 하위 드로워 초기화 후 진행.
 * @param {string | undefined} drawerKey - `drawerMenuGroupsData` 객체의 키. `undefined`일 경우 드로워를 비웁니다.
 * @param {HTMLUListElement} secondaryMenuListElement - 2뎁스 메뉴 아이템들을 담을 UL DOM 요소.
 */
function renderDrawerMenu(drawerKey, secondaryMenuListElement) {
  secondaryMenuListElement.innerHTML = '';
  closeDrawerLevelAndBelow(3); // 2뎁스 변경 시 3뎁스 이하 닫기
  if (drawerKey && drawerMenuGroupsData[drawerKey]) {
    let menuItems = [...drawerMenuGroupsData[drawerKey]]; // 원본 배열 변경 방지를 위해 복사

    // 2뎁스 메뉴 아이템 정렬 로직:
    // 1. 'icon-folder'를 사용하는 아이템을 최상단으로 올림.
    // 2. 나머지는 text 기준으로 오름차순 정렬.
    menuItems.sort((a, b) => {
      const isAFolder = a.iconId === 'icon-folder';
      const isBFolder = b.iconId === 'icon-folder';
      if (isAFolder && !isBFolder) return -1; // a가 폴더고 b가 아니면 a를 앞으로
      if (!isAFolder && isBFolder) return 1;  // b가 폴더고 a가 아니면 b를 앞으로
      // 둘 다 폴더거나 둘 다 폴더가 아니면 title로 오름차순 정렬 (text -> title 변경)
      return a.title.localeCompare(b.title, 'ko'); // 한글 오름차순 정렬
    });

    menuItems.forEach(itemData => {
      const menuItemElement = createSubMenuItemElement(itemData, false, 2); // depth 2
      secondaryMenuListElement.appendChild(menuItemElement);
    });
  } else if (drawerKey) {
    console.warn(`[사이드바] 2뎁스 메뉴 그룹 데이터 없음 (키: ${drawerKey})`);
  }
}


/**
 * 일반화된 드로워 토글 로직 호출 래퍼.
 * 클릭된 폴더 아이템 기반 하위 드로워 토글. activeDrawerKeys 업데이트 및 'ancestor-folder' 클래스 처리.
 * @param {number} parentDepth - 클릭된 폴더 아이템의 뎁스 (예: 2뎁스 폴더 클릭 시 2).
 * @param {string} keyToToggle - 토글할 드로워의 키 (클릭된 폴더의 href).
 * @param {HTMLLIElement | null} clickedLiElement - 클릭된 폴더 LI DOM 요소.
 */
function toggleGenericDrawerWrapper(parentDepth, keyToToggle, clickedLiElement) {
  const targetDepth = parentDepth + 1; // 열릴 드로워의 뎁스
  const config = drawerConfigByDepth[targetDepth];

  if (!config) {
    console.warn(`[사이드바] 드로워 토글 실패: 지원하지 않는 뎁스(${targetDepth})`);
    return;
  }

  const currentActiveKeyForTargetDepth = activeDrawerKeys[targetDepth];
  let parentUlToClearCurrentPage; // 현재 페이지 표시를 지울 부모 UL

  // 부모 UL 결정 로직 (하위 드로워 열릴 때, 부모 드로워의 'current-page' 표시 제거용)
  if (parentDepth === 1) {
    parentUlToClearCurrentPage = sidebarContainer?.querySelector('.sidebar__drawer:not(.sidebar__drawer--sub) #secondary-menu-list'); // 2뎁스 메뉴 UL
  } else if (parentDepth >= 2 && parentDepth <= 4) {
    const parentConfig = drawerConfigByDepth[parentDepth];
    const parentHost = parentConfig?.getHostElement();
    parentUlToClearCurrentPage = parentHost?.querySelector(`.sidebar__drawer${parentConfig.drawerClassModifier} ul.sidebar__menu`);
  }

  // 클릭된 LI에 대한 스타일 처리
  if (clickedLiElement) { // 클릭된 폴더 아이템에 'ancestor-folder' 클래스 토글
    const parentUl = clickedLiElement.closest('ul.sidebar__menu');
    parentUl?.querySelectorAll('li.sidebar__item.sidebar__item--ancestor-folder')
      .forEach(li => li.classList.remove('sidebar__item--ancestor-folder'));
    if (currentActiveKeyForTargetDepth !== keyToToggle) { // 새로 열릴 경우에만 ancestor 표시
      clickedLiElement.classList.add('sidebar__item--ancestor-folder');
    }
  }

  if (currentActiveKeyForTargetDepth === keyToToggle) { // Case 1: 이미 열린 드로워의 폴더 다시 클릭
    closeDrawerLevelAndBelow(targetDepth); // 해당 뎁스 이하 모두 닫기 (activeDrawerKeys[targetDepth]는 여기서 null됨)
  } else { // Case 2: 새로운 드로워를 열거나 다른 드로워로 전환
    closeDrawerLevelAndBelow(config.childCloseDepth); // 이 드로워의 자식 드로워들만 먼저 닫기 (예: 3뎁스 열 때 4,5뎁스 닫기)
    renderGenericDrawerMenu(targetDepth, keyToToggle);
    activeDrawerKeys[targetDepth] = keyToToggle;

    // 새로운 드로워가 열렸으므로, 부모 드로워에 있던 'current-page' 표시는 제거
    if (parentUlToClearCurrentPage) {
      parentUlToClearCurrentPage.querySelectorAll('li.sidebar__item.sidebar__item--current-page')
        .forEach(li => li.classList.remove('sidebar__item--current-page'));
    }
  }
}

/**
 * 1뎁스 주 메뉴 아이템 동적 생성 및 mainMenuListElement에 추가.
 * 클릭 이벤트 리스너 바인딩.
 * @param {HTMLElement} sidebarContainerElement - 사이드바 전체 컨테이너 DOM 요소.
 * @param {HTMLUListElement} mainMenuListElement - 1뎁스 메뉴 아이템들을 담을 UL DOM 요소.
 * @param {HTMLElement} drawerElement - 2뎁스 메뉴를 표시하는 드로워 DOM 요소.
 */
function initializeMainMenuList(sidebarContainerElement, mainMenuListElement, drawerElement) {
  menuConfigFromFile.forEach((menuItem) => {
    const li = document.createElement('li');
    li.id = menuItem.id;
    li.className = 'sidebar__menu-item';

    // 아이콘 추가: iconId (SVG 스프라이트) 우선, 없으면 iconPath (이미지 경로) 사용
    if (menuItem.iconId) {
      const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('class', 'sidebar__item-icon'); // 2,3뎁스와 동일한 아이콘 클래스 사용
      iconSvg.setAttribute('width', '16');
      iconSvg.setAttribute('height', '16');
      iconSvg.setAttribute('role', 'img');
      iconSvg.setAttribute('aria-label', menuItem.title); // 접근성 레이블: 메뉴 제목 사용
      const iconUse = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      iconUse.setAttribute('href', `#${menuItem.iconId}`);
      iconSvg.appendChild(iconUse);
      li.appendChild(iconSvg);
    } else if (menuItem.iconPath) {
      // iconId가 없고 iconPath만 있을 경우 기존 이미지 방식 사용 (fallback)
      const iconImg = document.createElement('img');
      iconImg.src = menuItem.iconPath;
      iconImg.alt = menuItem.title;
      iconImg.className = 'sidebar__item-icon';
      iconImg.style.width = '16px'; // 아이콘 크기 명시적 지정 (CSS로 관리 권장)
      iconImg.style.height = '16px'; // 아이콘 크기 명시적 지정
      li.appendChild(iconImg);
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = menuItem.title;
    li.appendChild(textSpan);

    // 래치 인디케이터 span 추가
    const latchIndicator = document.createElement('span');
    latchIndicator.className = 'sidebar__menu-latch-indicator';
    li.appendChild(latchIndicator);

    li.dataset.menuId = menuItem.id; // 이벤트 위임에서 1뎁스 메뉴 식별용
    mainMenuListElement.appendChild(li);
  });
}

/**
 * 사이드바 래치 상태 업데이트.
 * 사용자 마지막 활성 페이지 및 경로 정보 저장. 실제 페이지 아이템에 대해서만 래치 업데이트.
 * @private
 * @param {FlatMenuItem | null} pageItemInfo - 활성화된 페이지의 `flatMenuData` 아이템 정보.
 */
function _updateLatchedState(pageItemInfo) { // NOSONAR: 폴더도 래치 대상이므로 isFolder 조건 제거
  if (pageItemInfo && pageItemInfo.firstLevelMenuId) { // 폴더든 페이지든 firstLevelMenuId가 있으면 래치 가능
    const newLatchedState = {
      firstLevelMenuId: pageItemInfo.firstLevelMenuId,
      firstLevelMenuTitle: menuConfigFromFile.find(m => m.id === pageItemInfo.firstLevelMenuId)?.title || '',
      pageHref: pageItemInfo.href,
      pageTitle: pageItemInfo.title,
      folderPath: [] // Array of {href, title}
    };

    // folderPath 계산: 1뎁스 메뉴와 현재 아이템(pageItemInfo) 사이의 모든 중간 폴더
    // pageItemInfo.ancestorHrefs는 [1뎁스href, 중간폴더1href, ..., 현재아이템href] 형태
    // pageItemInfo.depth가 2 이상이고 (즉, 1뎁스 자체가 아닌 경우)
    // ancestorHrefs의 길이가 2를 초과해야 중간 폴더가 존재 (1뎁스 href, 현재 아이템 href 제외)
    if (pageItemInfo.depth > 1 && pageItemInfo.ancestorHrefs && pageItemInfo.ancestorHrefs.length > 1) {
      // pageItemInfo.depth - 1 은 현재 아이템의 직계 부모 폴더까지의 인덱스를 의미.
      // slice(1, pageItemInfo.depth - 1)은 1뎁스 메뉴 다음부터 ~ 현재 아이템의 직계 부모 폴더까지.
      const intermediateFolderHrefs = pageItemInfo.ancestorHrefs.slice(1, pageItemInfo.depth - 1);
      newLatchedState.folderPath = intermediateFolderHrefs.map(href => {
        const folderInfo = flatMenuData[href];
        return {
          href: href,
          title: folderInfo ? folderInfo.title : href.split('/').pop() // Fallback title
        };
      });
    }
    latchedState = newLatchedState; // Update the global latchedState
    console.info('[사이드바] 래치 상태 업데이트:', JSON.parse(JSON.stringify(latchedState)));
    // 래치 상태 변경 시 커스텀 이벤트 발생
    document.dispatchEvent(new CustomEvent('sidebar:latch-updated', {
      detail: { ...latchedState } // Send a copy of the new structure
    }));
    // console.debug('[사이드바] sidebar:latch-updated 이벤트 발생.');
  }
}

/**
 * 사이드바 래치 상태 초기화.
 * @private
 */
function _clearLatchedState() {
  latchedState = {
    firstLevelMenuId: null,
    firstLevelMenuTitle: null,
    pageHref: null,
    pageTitle: null,
    folderPath: []
  };
  console.info('[사이드바] 래치 상태 초기화.');
  document.dispatchEvent(new CustomEvent('sidebar:latch-updated', { // 래치 초기화 시에도 이벤트 발생
    detail: { ...latchedState }
  }));
}

/**
 * 주어진 경로 해당 1뎁스 메뉴 설정 반환.
 * flatMenuData 사용 조회.
 * @param {string} pathForLookup - 조회할 경로 (정규화 상태여야 함).
 * @returns {import('../../config/menuConfig.js').MenuConfigItem | null} 해당하는 1뎁스 메뉴 설정 객체 또는 null.
 */
function get1stLevelConfigForPath(pathForLookup) {
  const normalizedPath = normalizePath(pathForLookup);

  // 1뎁스 메뉴 클릭 시 href가 없어 생성된 임시 경로 처리
  if (normalizedPath.startsWith('_1st_level_conceptual_path_')) {
    const menuId = normalizedPath.substring('_1st_level_conceptual_path_'.length);
    return menuConfigFromFile.find(m => m.id === menuId) || null;
  }
  const targetItemInfo = flatMenuData[normalizedPath];

  if (targetItemInfo) {
    if (targetItemInfo.depth === 1) { // 조회 경로 자체가 1뎁스 메뉴인 경우
      return menuConfigFromFile.find(m => m.id === targetItemInfo.id);
    } else if (targetItemInfo.ancestorHrefs && targetItemInfo.ancestorHrefs.length > 0) {
      return menuConfigFromFile.find(m => m.drawerItemsKey === targetItemInfo.firstLevelDrawerKey || m.id === targetItemInfo.firstLevelMenuId);
    }
  }
  return null;
}

/**
 * 현재 페이지 경로(currentPath) 따라 사이드바 전체 활성 메뉴 상태 업데이트.
 * 1뎁스 메뉴 활성화 및 하위 드로워 아이템 활성 클래스 적용. 필요시 드로워 열고 메뉴 렌더링.
 * @param {string} currentPath - 현재 페이지 전체 URL 경로 (예: '/admin/code-management').
 * @param {object} [options={}] - 추가 옵션 객체.
 * @param {string} [options.navigationSource='unknown'] - 네비게이션 출처 (예: 'initialLoad', 'drawerItemClick').
 */
function updateSidebarActiveState(currentPath, options = {}) { // NOSONAR: 파라미터 사용됨
  const navigationSource = options.navigationSource || 'unknown';
  console.info(`[사이드바] 활성 상태 업데이트 시작: 경로=${currentPath}, 출처=${navigationSource}`);

  const mainMenuList = sidebarContainer?.querySelector('#main-menu-list'); // sidebarContainer에서 가져오도록 수정
  const drawerElement = sidebarContainer?.querySelector('.sidebar__drawer');
  if (!mainMenuList || !drawerElement) return;

  // 0. 이전 current-page 및 ancestor-folder 표시 모두 제거 (새로운 표시를 위해)
  document.querySelectorAll('.sidebar__item--current-page')
    .forEach(item => item.classList.remove('sidebar__item--current-page'));
  // 이전 1뎁스 래치 표시도 제거
  mainMenuList.querySelectorAll('.sidebar__menu-item--latched')
    .forEach(item => item.classList.remove('sidebar__menu-item--latched'));
  document.querySelectorAll('.sidebar__item--ancestor-folder')
    .forEach(item => item.classList.remove('sidebar__item--ancestor-folder'));

  // 1. 3뎁스 이상 드로워는 일단 닫고 시작 (래치 복원 또는 현재 URL에 따라 필요한 것만 다시 열림)
  closeDrawerLevelAndBelow(3); // activeDrawerKeys[3,4,5]도 여기서 null로 초기화됨

  // 2. 현재 경로(currentPath)에 해당하는 1뎁스 메뉴 찾기
  const normalizedCurrentPath = normalizePath(currentPath); // currentPath는 URL이므로 정규화
  const newActive1stLevelConfig = get1stLevelConfigForPath(normalizedCurrentPath);

  let folderPathToOpen = [];
  let finalPageHrefToActivate = normalizedCurrentPath;

  if (!newActive1stLevelConfig) {
    console.warn(`[사이드바] 1뎁스 메뉴 조회 실패: 경로=${normalizedCurrentPath}`);
    // 1뎁스 메뉴 못 찾으면, 관련된 모든 상태 초기화
    _clearLatchedState(); // 1뎁스 메뉴를 못 찾았으므로 래치도 초기화
    mainMenuList.querySelectorAll('.sidebar__menu-item.is-active')
      .forEach(item => item.classList.remove('is-active'));
    if (drawerElement) { // 2뎁스 드로워도 닫고 비움
      drawerElement.classList.remove('is-open');
      hideHost(drawerElement);
      const secondaryMenuList = drawerElement.querySelector('#secondary-menu-list');
      if (secondaryMenuList) secondaryMenuList.innerHTML = '';
    }
    return;
  }
  // 현재 활성화될 1뎁스 메뉴가 기존 래치의 1뎁스 메뉴와 다르면, 기존 래치 초기화
  if (newActive1stLevelConfig.id !== latchedState.firstLevelMenuId && latchedState.firstLevelMenuId !== null) {
    _clearLatchedState();
  }

  // 4. 1뎁스 메뉴 활성화 (is-active 클래스 처리)
  mainMenuList.querySelectorAll('.sidebar__menu-item.is-active')
    .forEach(item => item.classList.remove('is-active'));
  const firstLevelLi = document.getElementById(newActive1stLevelConfig.id);
  if (firstLevelLi) {
    firstLevelLi.classList.add('is-active');
    // 현재 활성화된 1뎁스 메뉴가 래치된 상태이면 특별 클래스 추가
    if (newActive1stLevelConfig.id === latchedState.firstLevelMenuId && latchedState.pageHref) {
      firstLevelLi.classList.add('sidebar__menu-item--latched'); // 래치 스타일 적용
      // console.debug(`[사이드바] 1뎁스 메뉴(${newActive1stLevelConfig.id}) 래치 스타일 적용.`);
    } else {
      // console.debug(`[사이드바] 1뎁스 메뉴(${newActive1stLevelConfig.id}) 래치 스타일 미적용. 래치 상태:`, JSON.parse(JSON.stringify(latchedState)));
    }
  }

  // 페이지 이동 후 드로워를 닫힌 상태로 유지하기 위한 처리:
  // drawerItemClick으로 페이지가 변경된 경우, 1뎁스 활성화 및 래치 업데이트만 수행하고
  // 드로워를 다시 열거나 current-page를 설정하는 로직은 건너뛴다.
  // 드로워는 handleDrawerItemClick에서 이미 closeAllDrawersInternal을 호출하여 닫혔다고 가정한다.
  if (navigationSource === 'drawerItemClick') {
    const targetPageItemInfoForLatch = flatMenuData[normalizedCurrentPath]; // normalizedCurrentPath는 새 페이지 경로
    if (targetPageItemInfoForLatch && !targetPageItemInfoForLatch.isFolder) {
      _updateLatchedState(targetPageItemInfoForLatch);
    }
    console.info('[사이드바] 페이지 아이템 클릭 출처: 드로워 열기/현재 페이지 설정 건너뜀.');
    return; // 여기서 함수 종료하여 하단 드로워 열기/current-page 설정 로직 실행 방지
  }

  // console.debug('[사이드바] 드로워 열기 로직 진입. 1뎁스 메뉴 드로워 키:', newActive1stLevelConfig.drawerItemsKey);

  // 5. 2뎁스 드로워 처리 및 하위 폴더/페이지 복원/표시 (finalPageHrefToActivate 와 folderPathToOpen은 위에서 결정됨)
  if (newActive1stLevelConfig.drawerItemsKey) {
    // console.debug(`[사이드바] 1뎁스 메뉴(${newActive1stLevelConfig.id}) 드로워(${newActive1stLevelConfig.drawerItemsKey}) 처리 시작.`);
    drawerElement.classList.add('is-open');
    showHost(drawerElement);
    // console.debug('[사이드바] 2뎁스 드로워 is-open 설정 및 표시.');
    drawerElement.dataset.currentDrawerKey = newActive1stLevelConfig.drawerItemsKey;

    const secondaryMenuList = drawerElement.querySelector('#secondary-menu-list');
    if (secondaryMenuList) {
      renderDrawerMenu(newActive1stLevelConfig.drawerItemsKey, secondaryMenuList);

      if (folderPathToOpen.length === 0) { // folderPathToOpen 계산 (필요시)
        // console.debug('[사이드바] 열릴 폴더 경로(folderPathToOpen) 계산 시작. 현재 경로:', normalizedCurrentPath);
        const currentItemInfo = flatMenuData[normalizedCurrentPath];
        if (currentItemInfo && currentItemInfo.ancestorHrefs && currentItemInfo.ancestorHrefs.length > 1) {
          // console.debug('[사이드바] 현재 아이템 정보:', { title: currentItemInfo.title, depth: currentItemInfo.depth, isFolder: currentItemInfo.isFolder });
          let pathSegments = currentItemInfo.isFolder ? currentItemInfo.ancestorHrefs.slice(1) : currentItemInfo.ancestorHrefs.slice(1, -1);
          folderPathToOpen = pathSegments.filter(href => flatMenuData[href]?.isFolder);
          // console.debug('[사이드바] 열릴 폴더 경로 계산 완료:', JSON.parse(JSON.stringify(folderPathToOpen)));
        } else {
          // console.debug('[사이드바] 열릴 폴더 경로 계산 건너뜀: 현재 아이템 정보 또는 상위 경로 부족.');
        }
      } else {
        // console.debug('[사이드바] 열릴 폴더 경로 이미 존재:', JSON.parse(JSON.stringify(folderPathToOpen)));
      }
    } else {
      console.warn('[사이드바] 2뎁스 드로워 #secondary-menu-list 요소 없음. 하위 드로워 처리 불가.');
    }

    // 5.2 결정된 폴더 경로에 따라 드로워 열기 및 조상 폴더 스타일링
    if (folderPathToOpen.length > 0) {
      // console.debug('[사이드바] 폴더 경로 기반 하위 드로워 열기 시작:', JSON.parse(JSON.stringify(folderPathToOpen)));
      let currentUlElementForAncestorStyle = secondaryMenuList; // 2뎁스 UL부터 시작
      for (let i = 0; i < folderPathToOpen.length; i++) {
        const folderHrefToOpen = folderPathToOpen[i];
        const folderItemInfo = flatMenuData[folderHrefToOpen];
        if (!folderItemInfo || !folderItemInfo.isFolder) continue;

        const childDrawerDepthToOpen = folderItemInfo.depth + 1;
        // console.debug(`[사이드바] 하위 드로워 열기 루프 ${i + 1}/${folderPathToOpen.length}: 대상폴더=${folderHrefToOpen}(${folderItemInfo.depth}뎁스), 열릴드로워=${childDrawerDepthToOpen}뎁스`);

        if (currentUlElementForAncestorStyle) {
          const folderLiToStyle = findLiByHref(currentUlElementForAncestorStyle, folderHrefToOpen);
          if (folderLiToStyle) folderLiToStyle.classList.add('sidebar__item--ancestor-folder');
        }

        const childDrawerConfig = drawerConfigByDepth[childDrawerDepthToOpen];
        const hostElementForChild = childDrawerConfig?.getHostElement();
        const menuDataForChild = childDrawerConfig?.menuDataMap?.[folderHrefToOpen];

        // console.debug(`[사이드바] 드로워 열기 조건 확인: 뎁스=${childDrawerDepthToOpen}, 폴더=${folderHrefToOpen}, 설정존재=${!!childDrawerConfig}, 호스트존재=${!!hostElementForChild}, 데이터존재=${!!menuDataForChild}`);

        if (activeDrawerKeys[childDrawerDepthToOpen] === folderHrefToOpen) {
          // console.debug(`[사이드바] ${childDrawerDepthToOpen}뎁스 드로워(${folderHrefToOpen}) 이미 열려있음. 렌더링 건너뜀.`);
          if (hostElementForChild && childDrawerConfig) {
            currentUlElementForAncestorStyle = hostElementForChild.querySelector(
              `.sidebar__drawer${childDrawerConfig.drawerClassModifier} ul.sidebar__menu`
            );
          }
        } else {
          // console.debug(`[사이드바] ${childDrawerDepthToOpen}뎁스 드로워(${folderHrefToOpen}) 렌더링 호출.`);
          const renderedList = renderGenericDrawerMenu(childDrawerDepthToOpen, folderHrefToOpen);
          if (renderedList) {
            activeDrawerKeys[childDrawerDepthToOpen] = folderHrefToOpen;
            // console.debug(`[사이드바] ${childDrawerDepthToOpen}뎁스 활성 드로워 키 설정: ${folderHrefToOpen}`);
            currentUlElementForAncestorStyle = renderedList.closest('.sidebar__drawer')?.querySelector('ul.sidebar__menu');
          } else {
            console.warn(`[사이드바] ${childDrawerDepthToOpen}뎁스 드로워(${folderHrefToOpen}) 렌더링 실패. 루프 중단.`);
            break;
          }
        }
      } // closes for loop
    } // Closes if (folderPathToOpen.length > 0)
  } /* Closes if (newActive1stLevelConfig.drawerItemsKey) */ else { // 1뎁스 메뉴가 드로워를 가지지 않는 경우 (예: 바로 페이지 이동 또는 커스텀 onClick)
  drawerElement.classList.remove('is-open');
  hideHost(drawerElement);
  const secondaryMenuList = drawerElement.querySelector('#secondary-menu-list');
  if (secondaryMenuList) secondaryMenuList.innerHTML = '';
}

// 6. 최종 활성 페이지 아이템에 current-page 클래스 적용
// finalPageHrefToActivate는 현재 URL(normalizedCurrentPath)로 설정됨.
// 또는 breadcrumbReportFolderFocus, 1stLevelMenuLatchedFolderRestore 등의 경우 폴더 href가 될 수 있음.
const targetPageItemInfo = flatMenuData[finalPageHrefToActivate];

if (targetPageItemInfo) { // isFolder 여부 상관없이 targetPageItemInfo가 있으면 일단 진입
  let listElementToSearchIn = null; // current-page를 적용할 LI를 찾을 UL 요소

  if (targetPageItemInfo.depth === 1) {
    // 1뎁스 메뉴 자체가 링크인 경우 (이미 is-active 처리됨, 여기서는 current-page는 불필요할 수 있음)
  } else if (targetPageItemInfo.depth === 2) {
    listElementToSearchIn = drawerElement?.querySelector('#secondary-menu-list');
  } else if (targetPageItemInfo.depth >= 3) {
    // 3뎁스 이상 페이지 또는 폴더의 경우, 해당 아이템이 속한 드로워의 UL을 찾아야 함.
    const pageActualDepth = targetPageItemInfo.depth;
    const parentFolderHref = targetPageItemInfo.parentHref;
    const drawerConfigForPage = drawerConfigByDepth[pageActualDepth];
    if (drawerConfigForPage && activeDrawerKeys[pageActualDepth] === parentFolderHref) {
      const hostElementForPageDrawer = drawerConfigForPage.getHostElement();
      if (hostElementForPageDrawer) {
        listElementToSearchIn = hostElementForPageDrawer.querySelector(
          `.sidebar__drawer${drawerConfigForPage.drawerClassModifier} ul.sidebar__menu`
        );
      }
    }
  }

  if (listElementToSearchIn) {
    const finalLi = findLiByHref(listElementToSearchIn, finalPageHrefToActivate);
    if (finalLi) {
      finalLi.classList.add('sidebar__item--current-page'); // 폴더든 페이지든 current-page 적용
    } else {
      console.warn(`[사이드바] 현재 페이지 표시 대상 LI 없음: ${finalPageHrefToActivate}`);
    }
  } else if (targetPageItemInfo.depth > 1 && navigationSource !== 'breadcrumbReportFolderFocus' && navigationSource !== '1stLevelMenuLatchedFolderRestoreAttempt') {
    // 1뎁스는 is-active로 처리. 특정 폴더 복원 케이스는 이 경고에서 제외.
    console.warn('[사이드바] 현재 페이지 표시 대상 UL 없음. 페이지 정보:', targetPageItemInfo);
  }

  // 래치 업데이트는 실제 '페이지'(폴더X) 활성화 시 수행.
  // URL 기반으로 사이드바 상태를 업데이트할 때는, URL이 페이지를 가리키는 경우에만 래치를 업데이트.
  // 폴더 클릭으로 인한 래치는 handleDrawerItemClick에서 직접 처리.
  // breadcrumbReportFolderFocus나 1stLevelMenuLatchedFolderRestoreAttempt 등 폴더를 대상으로 하는 경우는 여기서 래치 안 함.
  if (!targetPageItemInfo.isFolder && navigationSource !== 'breadcrumbReportFolderFocus' && navigationSource !== '1stLevelMenuLatchedFolderRestoreAttempt') {
    _updateLatchedState(targetPageItemInfo);
  }
} else {
  console.warn('[사이드바] 최종 활성화할 페이지 정보를 flatMenuData에서 찾지 못함:', finalPageHrefToActivate);
} // NOSONAR: 의도적으로 빈 블록을 가질 수 있음 (조건에 따른 로깅 회피)
} // updateSidebarActiveState 함수 닫는 중괄호

/**
 * 메뉴 데이터 사전 가공하여 플랫 맵(flatMenuData) 생성.
 * 각 메뉴 아이템 전체 경로, 뎁스, 부모 정보 등 포함.
 * @returns {Object.<string, FlatMenuItem>} 생성된 플랫 메뉴 데이터 맵.
 */
function preprocessMenuData() {
  const newFlatMenuData = {};

  /**
   * @typedef {object} FlatMenuItem
   * @description 사전 가공된 플랫 메뉴 아이템 정보.
   * @property {string} id - 메뉴 아이템 원본 ID (1뎁스 메뉴 경우).
   * @property {string} title - 메뉴 텍스트 (기존 text에서 변경).
   * @property {string} [iconId] - 아이콘 ID.
   * @property {string} href - 정규화된 href.
   * @property {number} depth - 메뉴 뎁스 (1부터 시작).
   * @property {string | null} parentHref - 부모 폴더 href (정규화됨).
   * @property {string | null} firstLevelMenuId - 이 아이템 속한 1뎁스 메뉴 ID.
   * @property {string | null} firstLevelDrawerKey - 이 아이템 속한 1뎁스 메뉴 drawerItemsKey.
   * @property {string[]} ancestorHrefs - 1뎁스부터 현재 아이템까지 모든 상위 폴더 href 배열 (정규화됨).
   * @property {boolean} isFolder - 폴더 여부.
   * @property {function} [onClick] - 사용자 정의 클릭 핸들러.
   * @property {object} [originalConfig] - 원본 메뉴 설정 객체 (디버깅/추가 정보용).
   */
  function processLevel(items, depth, parentHref, firstLevelMenuId, firstLevelDrawerKey, currentAncestorHrefs) {
    if (!items) return; // NOSONAR: items가 null 또는 undefined일 수 있음
    items.forEach(item => {
      // 원본 데이터 변경 방지 위해 깊은 복사 사용
      const itemCopy = JSON.parse(JSON.stringify(item));
      const originalItemForLog = { ...itemCopy }; // href 변환 전 원본 저장 (로그용)

      // href 누락 점검 (transformReportItemHref 호출 전)
      // 리포트 아이템(iconId !== 'icon-folder' && id && title)은 transformReportItemHref에서 href를 생성하므로,
      // 초기 href가 없어도 경고하지 않음. 그 외의 경우(예: 폴더인데 href가 없거나, 일반 아이템인데 id/title/href 모두 없는 경우)에만 href 누락 경고.
      const isPotentialReportItem = item.iconId !== 'icon-folder' && item.id && item.title;
      if (!item.href && !isPotentialReportItem) {
        // 폴더이거나, 리포트 아이템이 될 조건(id, title)을 만족하지 못하는데 href도 없는 경우
        console.warn(`[사이드바 데이터 점검] href 누락 (리포트 변환 대상 아님): 제목='${item.title}', ID='${item.id || '없음'}', 아이콘='${item.iconId}', 뎁스=${depth}. 내부 ID 자동 생성 예정. 경로 기반 기능에 문제 발생 가능성 있음.`);
      }

      transformReportItemHref(item);

      const normalizedHref = item.href ? normalizePath(item.href) : `_internal_folder_id_${depth}_${(item.title || '').replace(/\s+/g, '_')}`;
      // 정규화된 href 중복 점검
      if (newFlatMenuData[normalizedHref]) {
        console.warn(`[사이드바 데이터 점검] href 중복 감지: 정규화된 경로='${normalizedHref}' (제목: '${item.title}', 원본 href: '${originalItemForLog.href || '없음'}')가 기존 항목(제목: '${newFlatMenuData[normalizedHref].title}')과 충돌. 데이터 덮어쓰기 발생 가능.`);
      }
      const isFolder = item.iconId === 'icon-folder';
      const newAncestorHrefs = [...currentAncestorHrefs, normalizedHref];
      newFlatMenuData[normalizedHref] = {
        id: item.id || (depth === 1 ? item.id : null), // 1뎁스 또는 리프노드의 id
        title: item.title,
        iconId: item.iconId,
        href: normalizedHref,
        depth: depth,
        parentHref: parentHref,
        firstLevelMenuId: firstLevelMenuId,
        firstLevelDrawerKey: firstLevelDrawerKey,
        ancestorHrefs: newAncestorHrefs,
        isFolder: isFolder,
        onClick: item.onClick,
        originalConfig: originalItemForLog, // 로그용으로 저장했던 원본 사용
      };

      if (isFolder) {
        let subItems = null;
        if (depth === 1 && item.drawerItemsKey && drawerMenuGroupsData[item.drawerItemsKey]) {
          subItems = drawerMenuGroupsData[item.drawerItemsKey];
          processLevel(subItems, depth + 1, normalizedHref, firstLevelMenuId, item.drawerItemsKey, newAncestorHrefs);
        } else if (depth === 2 && subDrawerMenuGroupsData[normalizedHref]) {
          subItems = subDrawerMenuGroupsData[normalizedHref];
          processLevel(subItems, depth + 1, normalizedHref, firstLevelMenuId, firstLevelDrawerKey, newAncestorHrefs);
        } else if (depth === 3 && subSubDrawerMenuGroupsData[normalizedHref]) {
          subItems = subSubDrawerMenuGroupsData[normalizedHref];
          processLevel(subItems, depth + 1, normalizedHref, firstLevelMenuId, firstLevelDrawerKey, newAncestorHrefs);
        } else if (depth === 4 && subSubSubDrawerMenuGroupsData[normalizedHref]) {
          subItems = subSubSubDrawerMenuGroupsData[normalizedHref];
          processLevel(subItems, depth + 1, normalizedHref, firstLevelMenuId, firstLevelDrawerKey, newAncestorHrefs);
        }
      }
    });
  }

  // 1뎁스 메뉴 처리
  menuConfigFromFile.forEach(item1st => {
    // 1뎁스 href 누락 점검
    if (!item1st.href && !item1st.drawerItemsKey) { // drawerItemsKey가 있으면 폴더 역할을 하므로 href 없어도 괜찮음
      console.warn(`[사이드바 데이터 점검] 1뎁스 href 누락: ID='${item1st.id}', 제목='${item1st.title}'. 내부 ID 자동 생성 예정. 경로 기반 기능에 문제 발생 가능성 있음.`);
    }
    const normalizedHref1st = item1st.href ? normalizePath(item1st.href) : `_internal_id_1_${item1st.id}`;
    if (newFlatMenuData[normalizedHref1st]) {
      console.warn(`[사이드바 데이터 점검] 1뎁스 href 중복 감지: 정규화된 경로='${normalizedHref1st}' (ID: '${item1st.id}', 제목: '${item1st.title}')가 기존 항목(제목: '${newFlatMenuData[normalizedHref1st].title}')과 충돌. 데이터 덮어쓰기 발생 가능.`);
    }
    const ancestorHrefs1st = [normalizedHref1st];
    newFlatMenuData[normalizedHref1st] = {
      id: item1st.id,
      title: item1st.title,
      iconId: item1st.iconId,
      href: normalizedHref1st,
      depth: 1,
      parentHref: null,
      firstLevelMenuId: item1st.id,
      firstLevelDrawerKey: item1st.drawerItemsKey || null,
      ancestorHrefs: ancestorHrefs1st,
      isFolder: !!item1st.drawerItemsKey,
      onClick: item1st.onClick,
      originalConfig: { ...item1st },
    };
    if (item1st.drawerItemsKey && drawerMenuGroupsData[item1st.drawerItemsKey]) {
      processLevel(drawerMenuGroupsData[item1st.drawerItemsKey], 2, normalizedHref1st, item1st.id, item1st.drawerItemsKey, ancestorHrefs1st);
    }
  });
  return newFlatMenuData;
}

/**
 * 사이드바 컴포넌트 초기화.
 * 1뎁스 주 메뉴, 퀵메뉴 동적 생성, 이벤트 리스너 설정.
 * 하위 뎁스 드로워 호스트 요소 초기화 및 외부 상호작용 드로워 닫기 로직 설정.
 * @param {HTMLElement} sidebarContainerElement - 사이드바 전체 감싸는 최상위 컨테이너 DOM 요소.
 * @param {import('../dialog/dialogManager.js').default} dialogManager - DialogManager 인스턴스 (메뉴 커스텀 onClick 등 사용).
 */
export function initializeSidebar(sidebarContainerElement, dialogManager) { // dialogManager 파라미터 추가
  if (!sidebarContainerElement) {
    console.error('[사이드바 초기화 실패] sidebarContainerElement가 제공되지 않았습니다.');
    return;
  }
  sidebarContainer = sidebarContainerElement;
  // 메뉴 데이터 사전 가공
  flatMenuData = preprocessMenuData(); // NOSONAR: 전역 변수 flatMenuData에 할당
  console.info('[사이드바] 초기화 시작', { container: sidebarContainerElement, dialogManager: !!dialogManager });
  const mainMenuList = sidebarContainerElement.querySelector('#main-menu-list');
  const quickMenuList = sidebarContainerElement.querySelector('.sidebar__quick-menu-list');
  const secondaryMenuList = sidebarContainerElement.querySelector('#secondary-menu-list'); // 드로워 내부
  const drawerElement = sidebarContainerElement.querySelector('.sidebar__drawer');

  // 1. 1뎁스 주 메뉴 초기화
  if (mainMenuList && menuConfigFromFile && drawerElement) {
    mainMenuList.innerHTML = '';
    initializeMainMenuList(sidebarContainerElement, mainMenuList, drawerElement); // 내부에서 이벤트 위임으로 변경될 것
  } else {
    if (!mainMenuList) console.warn('[사이드바] 1뎁스 메뉴 목록(#main-menu-list) 없음.');
    if (!menuConfigFromFile) console.warn('[사이드바] 1뎁스 메뉴 설정(menuConfigFromFile) 없음.');
    if (!drawerElement) console.warn('[사이드바] 2뎁스 드로워(.sidebar__drawer) 없음.');
  }

  // 2. 퀵메뉴 동적 생성
  if (quickMenuList) {
    quickMenuList.innerHTML = '';
    quickMenuItemsData.forEach(itemData => {
      quickMenuList.appendChild(createSubMenuItemElement(itemData, true, 1)); // 퀵메뉴는 뎁스 1로 간주
    });
  } else {
    console.warn('[사이드바] 퀵메뉴 목록(.sidebar__quick-menu-list) 없음.');
  }

  // 3. 2뎁스 드로워 메뉴 초기화
  if (secondaryMenuList) {
    renderDrawerMenu(undefined, secondaryMenuList);
  } else {
    console.warn('[사이드바] 2뎁스 드로워 메뉴 목록(#secondary-menu-list) 없음.');
  }

  // 4. 3, 4, 5뎁스 드로워 설정을 위한 drawerConfigByDepth 객체 초기화 및 각 뎁스별 호스트 요소 설정
  drawerConfigByDepth = {
    3: {
      getHostElement: () => sidebarContainerElement.querySelector('#sub-drawer-host'),
      menuDataMap: subDrawerMenuGroupsData,
      drawerClassModifier: '--sub',
      childCloseDepth: 4, // 3뎁스 열면 4뎁스부터 닫음
    },
    4: {
      getHostElement: () => sidebarContainerElement.querySelector('#sub-sub-drawer-host'),
      menuDataMap: subSubDrawerMenuGroupsData,
      drawerClassModifier: '--sub-sub',
      childCloseDepth: 5, // 4뎁스 열면 5뎁스부터 닫음
    },
    5: {
      getHostElement: () => sidebarContainerElement.querySelector('#sub-sub-sub-drawer-host'),
      menuDataMap: subSubSubDrawerMenuGroupsData,
      drawerClassModifier: '--sub-sub-sub',
      childCloseDepth: 6, // 5뎁스 하위는 없음 (닫을 대상 없음)
    },
  };

  // 각 뎁스 호스트 초기 숨김 처리
  for (const depthKey in drawerConfigByDepth) {
    const host = drawerConfigByDepth[depthKey].getHostElement();
    if (host) hideHost(host);
    else console.warn(`[사이드바] ${depthKey}뎁스 드로워 호스트 요소 없음. (HTML 확인 필요)`);
  }
  /**
   * 1뎁스 주 메뉴 아이템 클릭 처리 (드로워 있는 메뉴).
   * 이미 활성 메뉴 클릭 시 드로워 토글, 다른 메뉴 클릭 시 이전 메뉴 비활성화 및 새 메뉴 활성화/드로워 열기.
   * @param {HTMLElement} clickedLi - 클릭된 메뉴 아이템의 LI 요소
   * @param {import('../../config/menuConfig.js').MenuItemConfig} menuItem - 클릭된 메뉴의 설정 데이터
   */
  function handleNormalMenuClick(clickedLi, menuItem) {
    const drawerElement = sidebarContainer?.querySelector('.sidebar__drawer');

    if (clickedLi.classList.contains('is-active')) {
      // 활성 1뎁스 메뉴 재클릭: 래치된 페이지 있으면 복원, 없으면 2뎁스 드로워 토글
      if (latchedState.firstLevelMenuId === menuItem.id && latchedState.pageHref) {
        // console.debug(`[사이드바] 활성 1뎁스(${menuItem.id}) 재클릭: 래치 페이지(${latchedState.pageHref}) 복원 시도.`);
        updateSidebarActiveState(latchedState.pageHref, { navigationSource: flatMenuData[normalizePath(latchedState.pageHref)]?.isFolder ? '1stLevelMenuLatchedFolderRestoreAttempt' : '1stLevelMenuLatchedPageRestoreAttempt' });
      } else {
        // console.debug(`[사이드바] 활성 1뎁스(${menuItem.id}) 재클릭: 래치 없음. 2뎁스 드로워 토글.`);
        const isDrawerOpen = drawerElement?.classList.contains('is-open');
        if (isDrawerOpen && drawerElement.dataset.currentDrawerKey === menuItem.drawerItemsKey) {
          drawerElement.classList.remove('is-open');
          hideHost(drawerElement);
          closeDrawerLevelAndBelow(3); // 하위 드로워도 닫기
        } else if (drawerElement) { // 드로워 닫혔거나 다른 1뎁스 메뉴 드로워 열린 경우
          drawerElement.classList.add('is-open');
          showHost(drawerElement);
          drawerElement.dataset.currentDrawerKey = menuItem.drawerItemsKey;
          const secondaryMenuList = drawerElement.querySelector('#secondary-menu-list');
          if (secondaryMenuList) {
            renderDrawerMenu(menuItem.drawerItemsKey, secondaryMenuList);
            // 2뎁스만 열고, 더 깊은 드로워는 닫힌 상태로 시작 (updateSidebarActiveState가 아니므로)
            closeDrawerLevelAndBelow(3); // 3뎁스 이하는 닫힌 상태로 시작
          }
        }
      }
    } else {
      // 비활성 1뎁스 메뉴 클릭: 래치된 페이지 있으면 해당 경로로, 없으면 메뉴 기본 경로로 상태 업데이트
      let pathForUpdate = menuItem.href ? normalizePath(menuItem.href) : `_1st_level_conceptual_path_${menuItem.id}`;
      if (latchedState.firstLevelMenuId === menuItem.id && latchedState.pageHref) {
        pathForUpdate = latchedState.pageHref;
        // console.debug(`[사이드바] 비활성 1뎁스(${menuItem.id}) 클릭: 래치 페이지(${pathForUpdate})로 업데이트 시도.`);
      } else {
        // console.debug(`[사이드바] 비활성 1뎁스(${menuItem.id}) 클릭: 래치 없음. 경로(${pathForUpdate})로 업데이트 시도.`);
      }
      updateSidebarActiveState(pathForUpdate, { navigationSource: '1stLevelMenuClick' });
    }
  }
  // 5. 초기 UI 상태 설정: 2뎁스 드로워 닫고, 1뎁스 활성화 제거
  if (drawerElement) drawerElement.classList.remove('is-open');
  if (mainMenuList) mainMenuList.querySelectorAll('.sidebar__menu-item.is-active').forEach(item => item.classList.remove('is-active'));
  // --- Event Handlers & Delegation Setup ---
  if (mainMenuList && drawerElement) { // 1뎁스 메뉴 및 2뎁스 드로워 요소 확인
    mainMenuList.addEventListener('click', (e) => {
      const clickedLi = e.target.closest('li.sidebar__menu-item');
      if (!clickedLi || !clickedLi.dataset.menuId) return;
      e.stopPropagation();

      const menuId = clickedLi.dataset.menuId;
      const menuItem = menuConfigFromFile.find(m => m.id === menuId);
      if (!menuItem) return;

      if (menuItem.drawerItemsKey) { // 드로워가 있는 1뎁스 메뉴
        handleNormalMenuClick(clickedLi, menuItem);
      } else { // 드로워가 없는 1뎁스 메뉴 (직접 링크 또는 커스텀 onClick)
        e.preventDefault(); // 기본 링크 이동은 handleMenuItemClick에서 제어
        handleMenuItemClick(clickedLi.querySelector('a'), e);
      }
    });
  }

  /**
   * 드로워 메뉴(2~5뎁스) 아이템 클릭 공통 핸들러 (이벤트 위임용).
   * itemConfig.onClick 실행, 폴더면 하위 드로워 토글, 아니면 페이지 이동 로직 수행 (sidebar:navigate 이벤트 발생).
   */
  function handleDrawerItemClick(e) {
    const link = e.target.closest('a');
    if (!link || !link.dataset.href) return; // href 없으면 처리 안 함 (또는 다른 data 속성으로 판단)
    e.preventDefault(); // 기본 동작(링크 이동) 방지
    e.stopPropagation();

    const href = link.dataset.href;
    const title = link.dataset.title;
    const id = link.dataset.id;
    const iconId = link.dataset.iconId;
    const depth = parseInt(link.dataset.depth, 10);
    const clickedLi = link.closest('li.sidebar__item');
    const itemConfig = flatMenuData[normalizePath(href)]; // 사전 가공된 데이터에서 정보 가져오기

    // 커스텀 onClick 핸들러가 있다면 먼저 실행
    if (itemConfig && itemConfig.onClick && typeof itemConfig.onClick === 'function' && link.dataset.hasCustomClick) {
      try {
        itemConfig.onClick(e);
        if (e.defaultPrevented) {
          return; // onClick 핸들러에서 기본 동작 막았으면 여기서 종료
        }
      } catch (onClickError) {
        console.error(`[사이드바] 드로워 아이템 onClick 오류 (${href}):`, onClickError);
      }
    }

    if (iconId === 'icon-folder' && itemConfig && itemConfig.isFolder) {
      toggleGenericDrawerWrapper(depth, href, clickedLi);
      _updateLatchedState(itemConfig); // ✨ 클릭된 폴더 정보로 래치 업데이트
      // 1뎁스 메뉴에도 래치 표시 업데이트
      if (itemConfig.firstLevelMenuId) {
        const firstLevelLiToLatch = document.getElementById(itemConfig.firstLevelMenuId);
        if (firstLevelLiToLatch) {
          const mainMenuList = sidebarContainer?.querySelector('#main-menu-list');
          mainMenuList?.querySelectorAll('.sidebar__menu-item--latched').forEach(item => item.classList.remove('sidebar__menu-item--latched'));
          firstLevelLiToLatch.classList.add('sidebar__menu-item--latched');
        }
      }
    } else if (iconId === 'icon-folder' && (!itemConfig || !itemConfig.isFolder)) {
      console.error(`[사이드바] 폴더 아이콘(${iconId})이나 메뉴 설정 오류. href: ${href}`);
    } else if (href && href !== '#') {
      // 폴더 아닌 아이템: 페이지 이동 (sidebar:navigate 이벤트 발생)
      // href는 transformReportItemHref에 의해 /common/report-iframe?id=... 형태일 수 있음
      const stateData = {
        reportPath: href,
        // report-iframe 페이지의 경우, id와 title은 stateData에 명시적으로 포함 (data-* 속성에서 가져옴)
        id: id,
        title: title,
        navigationSource: 'drawerItemClick' // 이벤트 출처 명시
      };
      let navSubdirOrFullPath;
      let navPageNameOrNull = null;

      const url = new URL(href, window.location.origin);
      const pathSegments = url.pathname.split('/').filter(Boolean);

      if (url.pathname.startsWith('/common/report-iframe')) {
        navSubdirOrFullPath = 'common/report-iframe'; // 라우터 특별 처리 키
      } else if (pathSegments.length > 0) {
        if (pathSegments.length === 1) {
          navSubdirOrFullPath = pathSegments[0];
        } else {
          navSubdirOrFullPath = pathSegments.slice(0, -1).join('/');
          navPageNameOrNull = pathSegments.slice(-1)[0];
        }
      } else if (url.pathname === '/') {
        navSubdirOrFullPath = '/';
      }

      if (navSubdirOrFullPath !== undefined) {
        document.dispatchEvent(new CustomEvent('sidebar:navigate', {
          detail: { subdirOrFullPath: navSubdirOrFullPath, pageNameOrNull: navPageNameOrNull, stateData: stateData }
        }));
        closeAllDrawersInternal("drawer_item_navigation"); // 페이지 이동 시 모든 드로워 닫기
      } else {
        console.warn(`[사이드바] 드로워 아이템 클릭: 유효한 네비게이션 경로 파싱 불가 (${href})`);
      }
    }
  }

  /**
   * 퀵메뉴 하위 아이템 클릭 핸들러.
   * itemConfig.onClick 실행, sidebar:navigate 이벤트 발생시켜 라우터에 네비게이션 요청.
   */
  function handleQuickSubmenuItemClick(e) {
    const link = e.target.closest('a');
    if (!link || (!link.dataset.href && !link.dataset.hasCustomClick)) return;
    e.preventDefault(); // 기본 동작(링크 이동) 방지
    e.stopPropagation();

    const href = link.dataset.href;
    const title = link.dataset.title;
    const url = new URL(href, window.location.origin);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    let navSubdirOrFullPath;
    let navPageNameOrNull = null;

    if (pathSegments.length > 0) {
      if (pathSegments.length === 1) {
        navSubdirOrFullPath = pathSegments[0];
      } else {
        navSubdirOrFullPath = pathSegments.slice(0, -1).join('/');
        navPageNameOrNull = pathSegments.slice(-1)[0];
      }
    } else if (url.pathname === '/') {
      navSubdirOrFullPath = '/';
    }

    const stateData = { navigationSource: 'quickSubmenuItemClick' };

    // 커스텀 onClick 핸들러가 있다면 먼저 실행
    const itemConfig = quickMenuItemsData.find(item => item.subItems?.some(sub => normalizePath(sub.href) === normalizePath(href)))
      ?.subItems?.find(sub => normalizePath(sub.href) === normalizePath(href));
    if (itemConfig && itemConfig.onClick && typeof itemConfig.onClick === 'function' && link.dataset.hasCustomClick) {
      try {
        itemConfig.onClick(e);
        if (e.defaultPrevented) return; // onClick 핸들러에서 기본 동작 막았으면 여기서 종료
      } catch (onClickError) {
        console.error(`[사이드바] 퀵 서브메뉴 onClick 오류 (${href}):`, onClickError);
      }
    }

    if (navSubdirOrFullPath !== undefined) {
      document.dispatchEvent(new CustomEvent('sidebar:navigate', {
        detail: { subdirOrFullPath: navSubdirOrFullPath, pageNameOrNull: navPageNameOrNull, stateData: stateData }
      }));
    } else {
      console.warn(`[사이드바] 퀵 서브메뉴 클릭: 유효한 네비게이션 경로 파싱 불가 (${href})`);
    }
  }

  /**
   * 1뎁스 메뉴 링크 또는 퀵메뉴 아이템 클릭 공통 핸들러.
   * isQuickSubmenuItem이면 handleQuickSubmenuItemClick 위임.
   * href 있으면 페이지 이동 로직, hasCustomClick이면 onClick 핸들러 실행.
   * @param {HTMLAnchorElement} linkElement - 클릭된 `<a>` 요소.
   * @param {MouseEvent} event - 클릭 이벤트 객체.
   */
  function handleMenuItemClick(linkElement, event) {
    const href = linkElement.dataset.href;
    const hasCustomClick = linkElement.dataset.hasCustomClick === 'true';
    const isQuickMenuItem = linkElement.dataset.isQuickMenu === 'true';
    const isQuickSubmenuItem = linkElement.dataset.isQuickSubmenuItem === 'true';

    // 퀵메뉴 하위 메뉴 아이템은 별도 핸들러로 위임
    if (isQuickSubmenuItem) {
      handleQuickSubmenuItemClick(event);
      return;
    }

    // 하위 메뉴 없는 퀵메뉴 아이템 또는 1뎁스 주 메뉴(drawerItemsKey 없는 링크) 처리
    if (href && href !== '#') {
      const stateData = { navigationSource: isQuickMenuItem ? 'quickMenuItemClick' : '1stLevelLinkClick' };
      const url = new URL(href, window.location.origin);
      const pathSegments = url.pathname.split('/').filter(Boolean);

      let navSubdirOrFullPath;
      let navPageNameOrNull = null;

      if (pathSegments.length > 0) {
        if (pathSegments.length === 1) {
          navSubdirOrFullPath = pathSegments[0];
        } else {
          navSubdirOrFullPath = pathSegments.slice(0, -1).join('/');
          navPageNameOrNull = pathSegments.slice(-1)[0];
        }
      } else if (url.pathname === '/') {
        navSubdirOrFullPath = '/';
      }

      if (navSubdirOrFullPath !== undefined) {
        document.dispatchEvent(new CustomEvent('sidebar:navigate', {
          detail: { subdirOrFullPath: navSubdirOrFullPath, pageNameOrNull: navPageNameOrNull, stateData: stateData }
        }));
      } else {
        console.warn(`[사이드바] 메뉴 아이템 클릭: 유효한 네비게이션 경로 파싱 불가 (${href})`);
      }
    } else if (hasCustomClick) {
      // 커스텀 onClick만 있는 경우 (예: 공통 필드 테스트)
      const menuId = linkElement.closest('li.sidebar__menu-item')?.dataset.menuId; // 1뎁스 메뉴 ID
      const menuItem = menuConfigFromFile.find(m => m.id === menuId);
      if (menuItem && menuItem.onClick && typeof menuItem.onClick === 'function') {
        try {
          menuItem.onClick(event);
        } catch (onClickError) {
          console.error(`[사이드바] 1뎁스 메뉴 onClick 오류 (${menuId}):`, onClickError);
        }
      } else {
        console.warn(`[사이드바] 메뉴 아이템 클릭: 커스텀 onClick 핸들러 없음.`);
      }
    }
  }

  // 퀵메뉴 클릭 이벤트 위임 (상위 아이템 및 하위 아이템 모두 처리)
  if (quickMenuList) {
    quickMenuList.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link || (!link.dataset.href && !link.dataset.hasCustomClick)) return;

      // 하위 메뉴 있는 퀵메뉴 메인 링크는 CSS 호버로 열리므로 JS 클릭 방지
      const parentLi = link.closest('li.sidebar__quick-menu-item');
      if (parentLi && parentLi.classList.contains('has-submenu') && link.classList.contains('sidebar__quick-menu-link')) {
        return;
      }

      e.preventDefault(); // 기본 동작(링크 이동) 방지
      handleMenuItemClick(link, e);
    });
  }

  [drawerElement, ...Object.values(drawerConfigByDepth).map(config => config.getHostElement())]
    .filter(Boolean) // null 요소 제거
    .forEach(host => host.addEventListener('click', handleDrawerItemClick));

  // breadcrumb에서 report-iframe 페이지의 중간 폴더 클릭 시 이벤트 리스너
  document.addEventListener('breadcrumb:report-folder-selected', (event) => {
    const { folderPath, firstLevelMenuId, reportPageHref } = event.detail;
    console.info('[사이드바] breadcrumb:report-folder-selected 이벤트 수신:', event.detail);

    if (!folderPath || !firstLevelMenuId) {
      console.warn('[사이드바] 브레드크럼 폴더 선택 이벤트 처리 중단: folderPath 또는 firstLevelMenuId 누락.');
      return;
    }

    const folderItemInfo = flatMenuData[normalizePath(folderPath)];
    if (!folderItemInfo || !folderItemInfo.isFolder) {
      console.warn(`[사이드바] 브레드크럼 폴더 선택: 유효한 폴더 정보 없음 (${folderPath})`);
      return;
    }

    // 1. 래치 상태 강제 업데이트 (선택된 폴더를 새로운 "페이지"로 간주)
    const newLatchedStateFromBreadcrumb = {
      firstLevelMenuId: firstLevelMenuId,
      firstLevelMenuTitle: menuConfigFromFile.find(m => m.id === firstLevelMenuId)?.title || '',
      pageHref: folderItemInfo.href, // 클릭된 폴더가 "페이지"가 됨
      pageTitle: folderItemInfo.title, // 클릭된 폴더의 제목이 "페이지 제목"이 됨
      folderPath: [] // 이 폴더에 도달하기 위한 중간 폴더들
    };

    // folderItemInfo.ancestorHrefs는 [1뎁스href, ..., 이 폴더의 부모href, 이 폴더href]
    // newLatchedStateFromBreadcrumb.folderPath는 1뎁스 제외, pageHref(folderItemInfo.href) 제외한 중간 폴더.
    if (folderItemInfo.depth > 2) { // 1뎁스, 2뎁스 폴더는 중간 폴더 없음
      const intermediateFolderHrefs = folderItemInfo.ancestorHrefs.slice(1, folderItemInfo.depth - 1);
      newLatchedStateFromBreadcrumb.folderPath = intermediateFolderHrefs.map(href => {
        const interFolderInfo = flatMenuData[href];
        return {
          href: href,
          title: interFolderInfo ? interFolderInfo.title : href.split('/').pop()
        };
      });
    }
    latchedState = newLatchedStateFromBreadcrumb; // 전역 래치 상태 업데이트

    document.dispatchEvent(new CustomEvent('sidebar:latch-updated', {
      detail: { ...latchedState }
    }));
    console.info('[사이드바] 브레드크럼 폴더 선택: 래치 수동 업데이트 및 이벤트 발생 완료.');

    // 2. 사이드바 상태 업데이트하여 드로워 열기
    updateSidebarActiveState(folderPath, { navigationSource: 'breadcrumbReportFolderFocus' });
  });

  /**
   * 외부 상호작용(사이드바 외부 클릭, iframe 포커스 등) 시 열린 드로워 닫기.
   * externalCloseInProgress 플래그로 중복 실행 방지.
   * @param {string} [interactionSource="unknown"] - 상호작용 출처 문자열 (디버깅용).
   */
  function handleExternalInteractionClose(interactionSource = "unknown") {
    if (externalCloseInProgress) return; // 중복 실행 방지
    externalCloseInProgress = true;

    // 래치 저장은 updateSidebarActiveState에서 담당. 여기서는 드로워 닫기에만 집중.
    closeAllDrawersInternal(`external_interaction: ${interactionSource}`);

    setTimeout(() => {
      externalCloseInProgress = false;
    }, 100);
  }
  // --- Global Event Listeners (Document, Window) ---
  if (!globalListenersAttached && drawerElement && sidebarContainer && mainMenuList) {
    document.addEventListener('click', (e) => {
      const currentSidebarDOM = document.getElementById('sidebar-container');
      // 브레드크럼 컨테이너를 식별할 수 있는 셀렉터 (breadcrumb.js에서 nav.nav-breadcrumb 사용)
      const breadcrumbNavElement = document.querySelector('nav.nav-breadcrumb');

      if (!currentSidebarDOM) { // 사이드바 자체가 DOM에 없으면 무시
        console.warn('[사이드바] 문서 클릭: sidebar-container DOM 없음.');
        return;
      }
      // 클릭된 대상이 사이드바 내부도 아니고, 브레드크럼 내부도 아닐 때만 외부 클릭으로 간주하여 드로워를 닫음.
      const isClickOutsideSidebar = !currentSidebarDOM.contains(e.target);
      const isClickOutsideBreadcrumb = breadcrumbNavElement ? !breadcrumbNavElement.contains(e.target) : true; // 브레드크럼 없으면 외부로 간주
      if (isClickOutsideSidebar && isClickOutsideBreadcrumb) {
        handleExternalInteractionClose("document_click");
      }
    });
  }

  // 7. iframe 활성화 시 (window blur) 사이드바 드로어 닫기 로직
  if (!globalListenersAttached) {
    window.addEventListener('blur', () => {
      const reportFrame = document.getElementById('report-frame');
      const contentContainer = document.getElementById('content-container');
      const isReportFramePageActive = contentContainer && reportFrame && contentContainer.contains(reportFrame);

      if (isReportFramePageActive && document.activeElement === reportFrame) {
        handleExternalInteractionClose("iframe_focus_via_blur"); // iframe 포커스 시 드로워 닫기
      }
    }, true); // Use capture phase
  }

  // --- Window Exports ---

  /**
   * 모든 활성 드로워(2~5뎁스) 닫고 관련 상태 초기화.
   * 1뎁스 메뉴 활성 상태는 변경 안 함. (내부 사용 함수)
   * @param {string} [reason="unknown"] - 드로워 닫는 이유 (디버깅용).
   * @private (내부 사용 함수임을 나타냄)
   */
  function closeAllDrawersInternal(reason = "unknown") {
    const drawer2ndElement = sidebarContainer?.querySelector('.sidebar__drawer:not(.sidebar__drawer--sub):not(.sidebar__drawer--sub-sub):not(.sidebar__drawer--sub-sub-sub)');
    if (drawer2ndElement) {
      drawer2ndElement.classList.remove('is-open');
      hideHost(drawer2ndElement);
    }
    closeDrawerLevelAndBelow(3); // 3뎁스 이하 모든 드로워 닫기
  }

  if (!globalListenersAttached && drawerElement && sidebarContainer && mainMenuList) {
    globalListenersAttached = true;
  }

  return {
    updateSidebarActiveState,
    closeAllDrawers: closeAllDrawersInternal, // 내부 함수를 직접 반환하여 window 객체 의존성 제거
    get1stLevelConfigForPath,
  };
}
