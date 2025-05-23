// src/components/common/Tabs/Tabs.jsx
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';

/**
 * @typedef TabItem
 * @property {string} id - 탭의 고유 ID (필수)
 * @property {string} label - 탭 버튼에 표시될 텍스트
 * @property {import("preact").ComponentChildren} content - 탭 선택 시 보여줄 콘텐츠
 * @property {boolean} [disabled=false] - 탭 비활성화 여부
 */

/**
 * @param {object} props
 * @param {TabItem[]} props.items - 탭 아이템 배열
 * @param {string} [props.initialTabId] - 초기에 선택될 탭 ID (없으면 첫 번째 탭)
 * @param {function(string): void} [props.onTabChange] - 탭 변경 시 호출될 콜백 (선택된 탭 ID 전달)
 * @param {string} [props.className] - Tabs 컴포넌트 전체에 적용될 추가 클래스
 * @param {'horizontal' | 'vertical'} [props.orientation='horizontal'] - 탭 방향
 * @returns {import("preact").JSX.Element} Tabs 컴포넌트
 */
export function Tabs({
  items = [],
  initialTabId,
  onTabChange,
  className = '',
  orientation = 'horizontal',
  ...restProps
}) {
  const [activeTabId, setActiveTabId] = useState(initialTabId || (items.length > 0 ? items[0].id : null));

  useEffect(() => {
    // initialTabId가 변경되면 activeTabId도 업데이트 (외부에서 제어 가능하도록)
    if (initialTabId && initialTabId !== activeTabId) {
      setActiveTabId(initialTabId);
    }
  }, [initialTabId]);

  const handleTabClick = (tabId) => {
    if (tabId !== activeTabId) {
      setActiveTabId(tabId);
      if (onTabChange) {
        onTabChange(tabId);
      }
    }
  };

  if (!items || items.length === 0) {
    return null;
  }

  // global.css에 .tabs, .tabs__list, .tabs__item, .tabs__item--active, .tabs__panel 스타일 정의 필요
  const orientationClass = `tabs--${orientation}`;
  const combinedClassName = `tabs ${orientationClass} ${className}`.trim();

  return (
    <div class={combinedClassName} {...restProps}>
      <div class="tabs__list" role="tablist" aria-orientation={orientation}>
        {items.map((item) => (
          <button
            key={item.id}
            id={`tab-${item.id}`}
            role="tab"
            aria-selected={activeTabId === item.id}
            aria-controls={`panel-${item.id}`}
            class={`tabs__item ${activeTabId === item.id ? 'tabs__item--active' : ''}`}
            onClick={() => !item.disabled && handleTabClick(item.id)}
            disabled={item.disabled}
            tabIndex={activeTabId === item.id ? 0 : -1}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          id={`panel-${item.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${item.id}`}
          class="tabs__panel"
          hidden={activeTabId !== item.id}
        >
          {activeTabId === item.id && item.content} {/* 활성 탭의 콘텐츠만 렌더링 */}
        </div>
      ))}
    </div>
  );
}