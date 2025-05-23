// src/components/common/Alert/Alert.jsx
import { h } from 'preact';

/**
 * @typedef {'info' | 'success' | 'warning' | 'error'} AlertType
 */

/**
 * @param {object} props
 * @param {AlertType} [props.type='info'] - 알림 타입 (CSS 클래스 매핑)
 * @param {import("preact").ComponentChildren} props.children - 알림 내용
 * @param {string} [props.title] - 알림 제목 (선택 사항)
 * @param {boolean} [props.showIcon=true] - 아이콘 표시 여부
 * @param {function} [props.onClose] - 닫기 버튼 클릭 시 호출될 함수 (닫기 버튼 표시 시)
 * @param {string} [props.className] - 추가적인 CSS 클래스
 * @returns {import("preact").JSX.Element | null} Alert 컴포넌트
 */
export function Alert({
  type = 'info',
  children,
  title,
  showIcon = true,
  onClose,
  className = '',
  ...restProps
}) {
  // global.css에 .alert, .alert--info, .alert--success 등과 .alert__icon, .alert__title, .alert__close-button 스타일 정의 필요
  const typeClass = `alert--${type}`;
  const combinedClassName = `alert ${typeClass} ${className}`.trim();

  // 타입별 기본 아이콘 (SVG 예시, 실제 아이콘으로 교체 필요)
  const icons = {
    info: <svg viewBox="0 0 20 20" fill="currentColor" class="alert__icon-svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>,
    success: <svg viewBox="0 0 20 20" fill="currentColor" class="alert__icon-svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>,
    warning: <svg viewBox="0 0 20 20" fill="currentColor" class="alert__icon-svg"><path fill-rule="evenodd" d="M8.257 3.099c.626-1.162 2.362-1.162 2.988 0l5.656 10.506c.626 1.162-.247 2.645-1.494 2.645H3.595c-1.247 0-2.12-.1.483-1.494-2.645L8.257 3.099zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>,
    error: <svg viewBox="0 0 20 20" fill="currentColor" class="alert__icon-svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" /></svg>,
  };

  return (
    <div class={combinedClassName} role="alert" {...restProps}>
      {showIcon && <span class="alert__icon">{icons[type]}</span>}
      <div class="alert__content">
        {title && <strong class="alert__title">{title}</strong>}
        <div class="alert__message">{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} class="alert__close-button" aria-label="닫기">
          <svg viewBox="0 0 20 20" fill="currentColor" class="alert__close-icon-svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
        </button>
      )}
    </div>
  );
}