// src/components/common/DateInput/DateInput.jsx
import { h } from 'preact';
import { useRef, useEffect } from 'preact/hooks';

/**
 * @param {object} props
 * @param {string} [props.id] - input ID
 * @param {string} [props.name] - input name
 * @param {string} [props.value] - 선택된 날짜 값 (YYYY-MM-DD 형식)
 * @param {function} [props.onChange] - change 이벤트 핸들러
 * @param {boolean} [props.disabled] - 비활성화 여부
 * @param {string} [props.className] - 추가적인 CSS 클래스
 * @param {string} [props.placeholder] - placeholder 텍스트 ("YYYY-MM-DD" 기본값)
 * @param {string} [props.min] - 선택 가능한 최소 날짜 (YYYY-MM-DD 형식)
 * @param {string} [props.max] - 선택 가능한 최대 날짜 (YYYY-MM-DD 형식)
 * @param {object} [props.inputRef] - input 요소에 대한 ref
 * @param {string} [props.ariaLabel] - ARIA 레이블
 * @param {string} [props.ariaDescribedby] - ARIA 설명 ID
 * @returns {import("preact").JSX.Element} DateInput 컴포넌트
 */
export function DateInput({
  id,
  name,
  value,
  onChange,
  disabled,
  className = '',
  placeholder = 'YYYY-MM-DD',
  min,
  max,
  inputRef: propInputRef,
  ariaLabel,
  ariaDescribedby,
  ...restProps
}) {
  const inputRef = useRef(null);

  // global.css의 .input 클래스를 기본으로 사용하고, type="date" 추가
  const combinedClassName = `input ${className}`.trim();

  // 값이 변경될 때 has-value 클래스 토글
  useEffect(() => {
    const inputElement = propInputRef?.current || inputRef.current;
    if (inputElement) {
      inputElement.classList.toggle('has-value', !!value);
    }
  }, [value, propInputRef]);

  return (
    <input
      ref={(el) => {
        inputRef.current = el; // 내부 ref 설정
        if (propInputRef) propInputRef.current = el; // 외부 ref 설정 (있는 경우)
      }}
      type="date"
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      class={combinedClassName}
      placeholder={placeholder}
      min={min}
      max={max}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      {...restProps}
    />
  );
}