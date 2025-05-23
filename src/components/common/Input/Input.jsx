// src/components/common/Input/Input.jsx
import { h } from 'preact';
// Input 컴포넌트용 CSS Module (선택 사항, global.css와 함께 사용 가능)
// import styles from './Input.module.css';

/**
 * @param {object} props
 * @param {string} props.type - input 타입 (text, password, email, number 등)
 * @param {string} [props.id] - input ID
 * @param {string} [props.name] - input name
 * @param {string | number} [props.value] - input 값
 * @param {string} [props.placeholder] - placeholder 텍스트
 * @param {function} [props.onInput] - input 이벤트 핸들러
 * @param {function} [props.onChange] - change 이벤트 핸들러
 * @param {boolean} [props.disabled] - 비활성화 여부
 * @param {boolean} [props.readonly] - 읽기 전용 여부
 * @param {string} [props.className] - 추가적인 CSS 클래스
 * @param {object} [props.inputRef] - input 요소에 대한 ref
 * @param {string} [props.ariaLabel] - ARIA 레이블
 * @param {string} [props.ariaDescribedby] - ARIA 설명 ID
 * @returns {import("preact").JSX.Element} Input 컴포넌트
 */
export function Input({
  type = 'text',
  id,
  name,
  value,
  placeholder,
  onInput,
  onChange,
  disabled,
  readonly,
  className = '',
  inputRef,
  ariaLabel,
  ariaDescribedby,
  ...restProps // 나머지 HTML 속성들
}) {
  // global.css의 .input 클래스를 기본으로 사용하고, 추가적인 className을 받을 수 있도록 함
  const combinedClassName = `input ${className}`.trim();

  return (
    <input
      ref={inputRef}
      type={type}
      id={id}
      name={name}
      value={value}
      placeholder={placeholder}
      onInput={onInput}
      onChange={onChange}
      disabled={disabled}
      readOnly={readonly} // JSX에서는 readonly 대신 readOnly 사용
      class={combinedClassName} // Preact에서는 class 사용
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      {...restProps}
    />
  );
}
