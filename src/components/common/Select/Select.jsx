// src/components/common/Select/Select.jsx
import { h } from 'preact';

/**
 * @typedef {object} OptionProps
 * @property {string | number} value - 옵션 값
 * @property {string} label - 옵션 레이블 (사용자에게 표시될 텍스트)
 * @property {boolean} [disabled] - 옵션 비활성화 여부
 */

/**
 * @param {object} props
 * @param {string} [props.id] - select ID
 * @param {string} [props.name] - select name
 * @param {string | number} [props.value] - 현재 선택된 값
 * @param {function} [props.onChange] - change 이벤트 핸들러
 * @param {boolean} [props.disabled] - 비활성화 여부
 * @param {string} [props.className] - 추가적인 CSS 클래스
 * @param {object} [props.selectRef] - select 요소에 대한 ref
 * @param {string} [props.ariaLabel] - ARIA 레이블
 * @param {OptionProps[]} [props.options] - 옵션 목록 배열. children 대신 사용 가능.
 * @param {import("preact").ComponentChildren} [props.children] - <option> 요소들. options prop과 함께 사용하지 않음.
 * @returns {import("preact").JSX.Element} Select 컴포넌트
 */
export function Select({
  id,
  name,
  value,
  onChange,
  disabled,
  className = '',
  selectRef,
  ariaLabel,
  options,
  children,
  ...restProps
}) {
  // global.css의 .select 클래스를 기본으로 사용
  const combinedClassName = `select ${className}`.trim();

  return (
    <select
      ref={selectRef}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      class={combinedClassName}
      aria-label={ariaLabel}
      {...restProps}
    >
      {options
        ? options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))
        : children}
    </select>
  );
}

// 사용 예시 (options prop 사용):
// const myOptions = [
//   { value: 'apple', label: '사과' },
//   { value: 'banana', label: '바나나', disabled: true },
//   { value: 'orange', label: '오렌지' },
// ];
// <Select options={myOptions} value={selectedFruit} onChange={handleFruitChange} />

// 사용 예시 (children 사용):
// <Select value={selectedColor} onChange={handleColorChange}>
//   <option value="red">빨강</option>
//   <option value="blue">파랑</option>
// </Select>