// src/components/common/Breadcrumb/Breadcrumb.jsx
import { h, Fragment } from 'preact'; // Fragment 임포트
import { useState, useEffect, useMemo } from 'preact/hooks';

/**
 * @typedef {object} OriginalMenuItem - Placeholder for menu item structure from menuConfig.js
 * @property {string | number} id - Unique ID
 * @property {string} title - Display title
 * @property {string} [href] - Navigation link
 * @property {string} [iconId] - Icon identifier (e.g., 'icon-folder')
 * @property {string} [drawerItemsKey] - Key to access drawer items
 * @property {OriginalMenuItem[]} [children] - Child menu items (used if drawerItemsKey is not present)
 */

/**
 * @typedef {object} MenuConfigProps
 * @property {OriginalMenuItem[]} menuConfigFromFile - Top-level menu items.
 * @property {Record<string, OriginalMenuItem[]>} drawerMenuGroupsData - Data for 2nd level menus.
 * @property {Record<string, OriginalMenuItem[]>} subDrawerMenuGroupsData - Data for 3rd level menus.
 * @property {Record<string, OriginalMenuItem[]>} subSubDrawerMenuGroupsData - Data for 4th level menus.
 * @property {Record<string, OriginalMenuItem[]>} subSubSubDrawerMenuGroupsData - Data for 5th level menus.
 */

/**
 * @typedef {object} SidebarLatchedState - Placeholder for sidebar latch state
 * @property {string} [firstLevelMenuId]
 * @property {string} [firstLevelMenuTitle]
 * @property {Array<{title: string, href: string}>} [folderPath]
 * @property {string} [pageHref]
 * @property {string} [pageTitle]
 */

/**
 * @typedef {object} DisplayBreadcrumbItem
 * @property {string} key - Unique key for list rendering
 * @property {string} label - Text to display
 * @property {string} [href] - URL to navigate to or identifier for action
 * @property {boolean} [isActive] - If this is the current page/segment
 * @property {boolean} [isFolder] - If this item represents a folder that might not navigate directly
 */

/**
 * @param {object} props
 * @param {string} props.currentPath - The current URL path (e.g., '/admin/users/edit').
 * @param {string} [props.pageTitle] - The title of the current page, used as a fallback.
 * @param {MenuConfigProps} props.menuData - All levels of menu configuration data.
 * @param {string} props.homeHref - The href for the "Home" link (e.g., '/common/main').
 * @param {SidebarLatchedState} [props.latchState] - Sidebar latch state for special report-iframe handling.
 * @param {function(path: string, type: 'page' | 'folderFocus' | 'reportFolder', details?: { firstLevelMenuId?: string, reportPageHref?: string }): void} [props.onNavigate] - Callback for navigation or folder focus.
 * @param {string} [props.className] - 추가적인 CSS 클래스
 * @param {import("preact").ComponentChildren} [props.separator='>'] - 항목 구분자
 * @param {string} [props.ariaLabel='현재 위치'] - ARIA 라벨
 * @returns {import("preact").JSX.Element} Breadcrumb 컴포넌트
 */
export function Breadcrumb({
  currentPath,
  pageTitle,
  menuData,
  homeHref,
  latchState,
  onNavigate,
  className = '',
  separator = ' > ',
  ariaLabel = '현재 위치',
  ...restProps
}) {
  const [breadcrumbItems, setBreadcrumbItems] = useState([]);

  const normalizePath = (path) => {
    if (!path) return '';
    if (path === '/') return path;
    return path.endsWith('/') ? path.slice(0, -1) : path;
  };

  useEffect(() => {
    if (!menuData) return;

    const {
      menuConfigFromFile,
      drawerMenuGroupsData,
      subDrawerMenuGroupsData,
      subSubDrawerMenuGroupsData,
      subSubSubDrawerMenuGroupsData,
    } = menuData;

    const normalizedCurrentPath = normalizePath(currentPath);
    let items = [];

    // Logic adapted from breadcrumb.js's updateBreadcrumbState and getPathSegments
    if (
      normalizedCurrentPath.includes('/common/report-iframe') &&
      latchState &&
      latchState.pageHref &&
      normalizePath(latchState.pageHref) === normalizedCurrentPath
    ) {
      // report-iframe specific logic
      if (latchState.firstLevelMenuId && latchState.firstLevelMenuTitle) {
        const firstLevelMenuConfig = menuConfigFromFile.find(m => m.id === latchState.firstLevelMenuId);
        if (firstLevelMenuConfig) {
          items.push({
            key: `latch-1st-${latchState.firstLevelMenuId}`,
            label: latchState.firstLevelMenuTitle,
            href: firstLevelMenuConfig.href || (firstLevelMenuConfig.drawerItemsKey ? `_internal_id_1_${firstLevelMenuConfig.id}` : '#'),
            isFolder: !!firstLevelMenuConfig.drawerItemsKey,
            isActive: false,
          });
        }
      }
      if (latchState.folderPath && latchState.folderPath.length > 0) {
        latchState.folderPath.forEach((folder, idx) => {
          items.push({
            key: `latch-folder-${idx}-${folder.href}`,
            label: folder.title,
            href: folder.href,
            isFolder: true,
            isActive: false,
          });
        });
      }
      items.push({
        key: `latch-current-${normalizedCurrentPath}`,
        label: latchState.pageTitle || pageTitle || '리포트',
        href: normalizedCurrentPath,
        isActive: true,
      });
    } else {
      // Standard path finding logic
      const findRecursive = (itemsToSearch, targetPath, depth, currentFoundPath) => {
        for (const item of itemsToSearch) {
          const itemHrefNormalized = item.href ? normalizePath(item.href) : null;
          if (!itemHrefNormalized) continue;

          const currentItemSegment = {
            key: `${depth}-${item.id || item.href}`, // Ensure key is unique
            label: item.title,
            href: itemHrefNormalized,
            isFolder: item.iconId === 'icon-folder' || !!item.drawerItemsKey || (!!item.children && item.children.length > 0),
            isActive: false,
          };

          if (itemHrefNormalized === targetPath) {
            currentItemSegment.isFolder = false; // Target page is not a folder
            currentItemSegment.isActive = true;
            return [...currentFoundPath, currentItemSegment];
          }

          if (currentItemSegment.isFolder) {
            let nextLevelItems = null;
            if (depth === 1 && item.drawerItemsKey && drawerMenuGroupsData?.[item.drawerItemsKey]) {
              nextLevelItems = drawerMenuGroupsData[item.drawerItemsKey];
            } else if (depth === 2 && subDrawerMenuGroupsData?.[itemHrefNormalized]) {
              nextLevelItems = subDrawerMenuGroupsData[itemHrefNormalized];
            } else if (depth === 3 && subSubDrawerMenuGroupsData?.[itemHrefNormalized]) {
              nextLevelItems = subSubDrawerMenuGroupsData[itemHrefNormalized];
            } else if (depth === 4 && subSubSubDrawerMenuGroupsData?.[itemHrefNormalized]) {
              nextLevelItems = subSubSubDrawerMenuGroupsData[itemHrefNormalized];
            } else if (item.children) { // Fallback to generic children if specific depth groups are not used
              nextLevelItems = item.children;
            }

            if (nextLevelItems) {
              const result = findRecursive(nextLevelItems, targetPath, depth + 1, [...currentFoundPath, currentItemSegment]);
              if (result) return result;
            }
          }
        }
        return null;
      };

      let menuPathItems = null;
      for (const menuItem1st of menuConfigFromFile) {
        const pathItemsAccumulator = [];
        const item1stHrefNormalized = menuItem1st.href ? normalizePath(menuItem1st.href) : null;

        if (item1stHrefNormalized === normalizedCurrentPath && !menuItem1st.drawerItemsKey && (!menuItem1st.children || menuItem1st.children.length === 0)) {
          menuPathItems = [{ key: `1st-${menuItem1st.id}`, label: menuItem1st.title, href: item1stHrefNormalized, isActive: true, isFolder: false }];
          break;
        }
        
        const firstLevelSegment = {
            key: `1st-${menuItem1st.id}`,
            label: menuItem1st.title,
            href: item1stHrefNormalized || (menuItem1st.drawerItemsKey ? `_internal_id_1_${menuItem1st.id}` : '#'),
            isFolder: !!menuItem1st.drawerItemsKey || (!!menuItem1st.children && menuItem1st.children.length > 0),
            isActive: item1stHrefNormalized === normalizedCurrentPath,
        };
        pathItemsAccumulator.push(firstLevelSegment);

        let initialSearchItems = null;
        if (menuItem1st.drawerItemsKey && drawerMenuGroupsData?.[menuItem1st.drawerItemsKey]) {
            initialSearchItems = drawerMenuGroupsData[menuItem1st.drawerItemsKey];
        } else if (menuItem1st.children) {
            initialSearchItems = menuItem1st.children;
        }

        if (initialSearchItems) {
          const result = findRecursive(initialSearchItems, normalizedCurrentPath, 2, pathItemsAccumulator);
          if (result) {
            menuPathItems = result;
            break;
          }
        } else if (firstLevelSegment.isActive) { // 1st level is the target and has no children/drawer
            menuPathItems = [firstLevelSegment];
            break;
        }
      }

      items = menuPathItems || [];

      const isHomePage = normalizedCurrentPath === normalizePath(homeHref);
      if (!isHomePage && (items.length === 0 || !items[items.length - 1].isActive) && pageTitle) {
         const lastItemIsCurrent = items.length > 0 && items[items.length - 1].href === normalizedCurrentPath && items[items.length - 1].isActive;
        if (!lastItemIsCurrent) {
            items.push({
                key: `current-${normalizedCurrentPath}`,
                label: pageTitle,
                href: normalizedCurrentPath,
                isActive: true,
            });
        }
      }
    }
    setBreadcrumbItems(items);
  }, [currentPath, pageTitle, menuData, homeHref, latchState]);

  const handleLinkClick = (e, item) => {
    e.preventDefault();
    if (onNavigate && item.href) {
      if (item.isFolder) {
        // Logic from breadcrumb.js for folder clicks
        const isReportIframe = normalizePath(currentPath).includes('/common/report-iframe');
        if (isReportIframe && latchState?.firstLevelMenuId) {
          onNavigate(item.href, 'reportFolder', {
            firstLevelMenuId: latchState.firstLevelMenuId,
            reportPageHref: latchState.pageHref,
          });
        } else {
          onNavigate(item.href, 'folderFocus');
        }
      } else {
        onNavigate(item.href, 'page');
      }
    }
  };

  if (breadcrumbItems.length === 0) {
    return null; // 아이템 없으면 렌더링 안 함
  }

  // global.css에 .breadcrumb, .breadcrumb__list, .breadcrumb__item, .breadcrumb__link, .breadcrumb__separator 스타일 정의 필요
  const combinedClassName = `breadcrumb ${className}`.trim();
  return (
    <nav aria-label={ariaLabel} class={combinedClassName} {...restProps}>
      <ol class="breadcrumb__list">
        {breadcrumbItems.map((item, index) => (
          <li key={item.key} class={`breadcrumb__item ${item.isActive ? 'breadcrumb__item--active' : ''}`}>
            {!item.isActive && item.href ? (
              <a
                href={item.href}
                class={`breadcrumb__link ${item.isFolder ? 'breadcrumb__folder-interactive' : ''}`}
                onClick={(e) => handleLinkClick(e, item)}
              >
                {item.label}
              </a>
            ) : (
              <span class="breadcrumb__current" aria-current={item.isActive ? 'page' : undefined}>
                {item.label}
              </span>
            )}
            {index < breadcrumbItems.length - 1 && (
              <span class="breadcrumb__separator" aria-hidden="true">
                {typeof separator === 'string' ? separator.trim() : separator}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}