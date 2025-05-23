// src/components/common/Button/Button.jsx
import { h } from 'preact';

/**
 * @typedef {'primary' | 'secondary' | 'line-primary' | 'line-secondary' | 'ghost' | 'info' | 'icon' | 'round' | 'text'} ButtonType
 * @typedef {'small' | 'xsmall' | 'medium'} ButtonSize
 */

/**
 * @param {object} props
 * @param {ButtonType} [props.type='primary'] - 버튼 타입 (CSS 클래스 매핑)
 * @param {ButtonSize} [props.size='medium'] - 버튼 크기 (CSS 클래스 매핑)
 * @param {boolean} [props.disabled] - 비활성화 여부
 * @param {function} [props.onClick] - 클릭 이벤트 핸들러
 * @param {string} [props.className] - 추가적인 CSS 클래스
 * @param {import("preact").ComponentChildren} props.children - 버튼 내용 (텍스트, 아이콘 등)
 * @param {string} [props.ariaLabel] - ARIA 라벨 (특히 아이콘 버튼에 유용)
 * @param {'button' | 'submit' | 'reset'} [props.htmlType='button'] - HTML button 태그의 type 속성
 * @returns {import("preact").JSX.Element} Button 컴포넌트
 */
export function Button({
  type = 'primary',
  size = 'medium',
  disabled,
  onClick,
  className = '',
  children,
  ariaLabel,
  htmlType = 'button',
  ...restProps // 나머지 HTML 속성들 (예: data-*, aria-*)
}) {
  // CSS 클래스 조합
  const typeClass = type !== 'primary' ? `button--${type}` : ''; // primary는 기본 스타일로 간주
  const sizeClass = size !== 'medium' ? `button--${size}` : ''; // medium은 기본 스타일로 간주
  const disabledClass = disabled ? 'button--disabled' : ''; // disabled prop에 따라 클래스 추가

  const combinedClassName = `button ${typeClass} ${sizeClass} ${disabledClass} ${className}`.trim();

  return (
    <button
      type={htmlType}
      class={combinedClassName}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      {...restProps}
    >
      {/* 아이콘 버튼의 경우 children이 SVG일 수 있으므로, global.css의 .button__icon 클래스를 활용 */}
      {/* children이 문자열이면 텍스트로, Preact 엘리먼트면 그대로 렌더링 */}
      {type === 'icon' ? <span class="button__icon">{children}</span> : children}
    </button>
  );
}

// 사용 예시:
// <Button type="primary" onClick={() => alert('클릭!')}>확인</Button>
// <Button type="secondary" size="small">취소</Button>
// <Button type="line-primary" disabled>저장</Button>
// <Button type="ghost" size="xsmall">삭제</Button>
// <Button type="icon" ariaLabel="검색">
//   <svg class="icon" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 0 0 1.48-5.34c-.47-2.78-2.79-5-5.59-5.34a6.505 6.505 0 0 0-7.27 7.27c.34 2.8 2.56 5.12 5.34 5.59a6.5 6.5 0 0 0 5.34-1.48l.27.28v.79l4.25 4.25c.41.41 1.08.41 1.49 0 .41-.41.41-1.08 0-1.49L15.5 14zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
// </Button>
// <Button type="round" size="small" htmlType="submit">제출</Button>
// <Button type="text">더보기</Button>