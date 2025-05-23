// src/components/common/Checkbox/Checkbox.jsx
import { h } from 'preact';

/**
 * @param {object} props
 * @param {string} props.id - checkbox ID (label과 연결)
 * @param {string} props.label - 사용자에게 보여질 라벨 텍스트
 * @param {boolean} [props.checked] - 체크 여부
 * @param {function} [props.onChange] - change 이벤트 핸들러
 * @param {boolean} [props.disabled] - 비활성화 여부
 * @param {string} [props.className] - 추가적인 CSS 클래스 (label에 적용)
 * @returns {import("preact").JSX.Element} Checkbox 컴포넌트
 */
export function Checkbox({ id, label, checked, onChange, disabled, className = '', ...restProps }) {
  return (
    <label class={`checkbox ${className} ${disabled ? 'checkbox--disabled' : ''}`} htmlFor={id}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        class="checkbox__input" // global.css의 .checkbox__input 사용
        {...restProps}
      />
      <span class="checkbox__label-text">{label}</span>
    </label>
  );
}

// 사용 예시:
// <Checkbox id="agree-terms" label="약관에 동의합니다" checked={isAgreed} onChange={handleAgreementChange} />
// <Checkbox id="subscribe-news" label="뉴스레터 구독" disabled />