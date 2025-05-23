// src/components/common/Toast/Toast.jsx
import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks';

/**
 * @typedef {'info' | 'success' | 'warning' | 'error'} ToastType
 * @typedef {'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left'} ToastPosition
 */

/**
 * @param {object} props
 * @param {string} props.id - 토스트 고유 ID (제거 시 사용)
 * @param {ToastType} [props.type='info'] - 토스트 타입
 * @param {import("preact").ComponentChildren} props.message - 토스트 메시지
 * @param {number} [props.duration=3000] - 자동 사라짐 시간 (ms), 0이면 자동 사라지지 않음
 * @param {function(string): void} props.onDismiss - 토스트 사라질 때 호출될 콜백 (id 전달)
 * @param {boolean} [props.showCloseButton=true] - 닫기 버튼 표시 여부
 * @param {string} [props.className] - 추가적인 CSS 클래스
 * @returns {import("preact").JSX.Element} Toast 컴포넌트
 */
export function Toast({
  id,
  type = 'info',
  message,
  duration = 3000,
  onDismiss,
  showCloseButton = true,
  className = '',
  ...restProps
}) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  // Alert 컴포넌트와 유사한 아이콘 사용 가능
  const icons = {
    info: <svg viewBox="0 0 20 20" fill="currentColor" class="toast__icon-svg"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>,
    success: <svg viewBox="0 0 20 20" fill="currentColor" class="toast__icon-svg"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>,
    // ... warning, error 아이콘 추가
  };

  // global.css에 .toast, .toast--info 등과 .toast__icon, .toast__message, .toast__close-button 스타일 정의 필요
  const typeClass = `toast--${type}`;
  const combinedClassName = `toast ${typeClass} ${className}`.trim();

  return (
    <div class={combinedClassName} role="status" aria-live="polite" {...restProps}>
      {icons[type] && <span class="toast__icon">{icons[type]}</span>}
      <div class="toast__message">{message}</div>
      {showCloseButton && (
        <button onClick={() => onDismiss(id)} class="toast__close-button" aria-label="닫기">
          <svg viewBox="0 0 20 20" fill="currentColor" class="toast__close-icon-svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
        </button>
      )}
    </div>
  );
}

// Toast를 관리하는 ToastContainer 컴포넌트가 별도로 필요할 수 있습니다.
// ToastContainer는 여러 Toast들을 특정 위치(예: top-right)에 쌓아서 보여주는 역할을 합니다.