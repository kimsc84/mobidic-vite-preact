// src/components/common/Radio/Radio.jsx
import { h } from 'preact';

/**
 * @param {object} props
 * @param {string} props.id - radio 버튼 ID (label과 연결)
 * @param {string} props.name - radio 그룹 이름 (같은 그룹은 같은 name을 가져야 함)
 * @param {string | number} props.value - radio 버튼 값
 * @param {string} props.label - 사용자에게 보여질 라벨 텍스트
 * @param {boolean} [props.checked] - 체크 여부
 * @param {function} [props.onChange] - change 이벤트 핸들러
 * @param {boolean} [props.disabled] - 비활성화 여부
 * @param {string} [props.className] - 추가적인 CSS 클래스 (label에 적용)
 * @returns {import("preact").JSX.Element} Radio 컴포넌트
 */
export function Radio({ id, name, value, label, checked, onChange, disabled, className = '', ...restProps }) {
  return (
    <label class={`control-group__item ${className} ${disabled ? 'control-group__item--disabled' : ''}`} htmlFor={id}>
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        class="control-group__input" // global.css의 .control-group__input 사용
        {...restProps}
      />
      <span class="control-group__label-text">{label}</span>
    </label>
  );
}

// 사용 예시:
// <Radio id="gender-male" name="gender" value="male" label="남자" checked={selectedGender === 'male'} onChange={handleGenderChange} />
// <Radio id="gender-female" name="gender" value="female" label="여자" checked={selectedGender === 'female'} onChange={handleGenderChange} />