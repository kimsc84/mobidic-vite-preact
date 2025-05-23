// src/components/common/Label/Label.jsx
import { h } from 'preact';

/**
 * @param {object} props
 * @param {string} props.htmlFor - 연결할 input 요소의 ID
 * @param {string} [props.className] - 추가적인 CSS 클래스
 * @param {import("preact").ComponentChildren} props.children - 라벨 텍스트 또는 자식 요소
 * @param {boolean} [props.required] - 필수 필드 여부 (별표 표시용)
 * @returns {import("preact").JSX.Element} Label 컴포넌트
 */
export function Label({ htmlFor, className = '', children, required, ...restProps }) {
  // global.css의 .field__label 클래스를 기본으로 사용
  const combinedClassName = `field__label ${className}`.trim();

  return (
    <label htmlFor={htmlFor} class={combinedClassName} {...restProps}>
      {children}
      {required && <span class="field__required-mark" aria-hidden="true"> *</span>}
    </label>
  );
}

// 사용 예시:
// <Label htmlFor="username">사용자 이름</Label>
// <Label htmlFor="email" required>이메일 주소</Label>