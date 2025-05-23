// src/components/common/Textarea/Textarea.jsx
import { h } from 'preact';

/**
 * @param {object} props
 * @param {string} [props.id] - textarea ID
 * @param {string} [props.name] - textarea name
 * @param {string} [props.value] - textarea 값
 * @param {string} [props.placeholder] - placeholder 텍스트
 * @param {function} [props.onInput] - input 이벤트 핸들러
 * @param {function} [props.onChange] - change 이벤트 핸들러
 * @param {boolean} [props.disabled] - 비활성화 여부
 * @param {boolean} [props.readonly] - 읽기 전용 여부
 * @param {number} [props.rows] - textarea 행 수
 * @param {number} [props.cols] - textarea 열 수 (CSS로 제어하는 것을 더 권장)
 * @param {string} [props.className] - 추가적인 CSS 클래스
 * @param {object} [props.textareaRef] - textarea 요소에 대한 ref
 * @param {string} [props.ariaLabel] - ARIA 레이블
 * @param {string} [props.ariaDescribedby] - ARIA 설명 ID
 * @returns {import("preact").JSX.Element} Textarea 컴포넌트
 */
export function Textarea({
  id,
  name,
  value,
  placeholder,
  onInput,
  onChange,
  disabled,
  readonly,
  rows = 3, // 기본 행 수
  cols,
  className = '',
  textareaRef,
  ariaLabel,
  ariaDescribedby,
  ...restProps // 나머지 HTML 속성들
}) {
  // global.css의 .textarea 클래스를 기본으로 사용
  const combinedClassName = `textarea ${className}`.trim();

  return (
    <textarea
      ref={textareaRef}
      id={id}
      name={name}
      value={value} // Preact에서는 value prop으로 제어
      placeholder={placeholder}
      onInput={onInput}
      onChange={onChange}
      disabled={disabled}
      readOnly={readonly}
      rows={rows}
      cols={cols}
      class={combinedClassName}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      {...restProps}
    >
      {/* value prop을 사용하므로 children은 필요 없음 */}
    </textarea>
  );
}