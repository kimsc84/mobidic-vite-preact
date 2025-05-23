// src/components/common/Field/Field.jsx
import { h, Fragment } from 'preact';
import { Label } from '@/components/common/Label/Label'; // Label 컴포넌트 임포트
// 필요에 따라 Input, Textarea, Select 등 다른 컨트롤 컴포넌트들도 여기서 임포트할 수 있지만,
// Field는 children으로 컨트롤을 받으므로 직접 임포트할 필요는 없음.

/**
 * @param {object} props
 * @param {string} props.label - 필드 라벨 텍스트
 * @param {string} props.htmlFor - 라벨과 연결될 input ID
 * @param {boolean} [props.required] - 필수 필드 여부
 * @param {string} [props.errorMessage] - 유효성 검사 에러 메시지
 * @param {'horizontal' | 'vertical'} [props.layout='horizontal'] - 필드 레이아웃 (기본 가로)
 * @param {string} [props.className] - Field 전체에 적용될 추가 클래스
 * @param {import("preact").ComponentChildren} props.children - 실제 입력 컨트롤 (Input, Select 등)
 * @returns {import("preact").JSX.Element} Field 컴포넌트
 */
export function Field({
  label,
  htmlFor,
  required,
  errorMessage,
  layout = 'horizontal', // 기본값은 가로 배치
  className = '',
  children, // 여기에 <Input />, <Select /> 등이 들어옴
  ...restProps
}) {
  const isInvalid = !!errorMessage;
  const fieldLayoutClass = layout === 'vertical' ? 'field--vertical' : '';
  const combinedClassName = `field ${fieldLayoutClass} ${isInvalid ? 'field--invalid' : ''} ${className}`.trim();

  return (
    <div class={combinedClassName} {...restProps}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      <div class="field__control-wrapper">
        {children} {/* 여기에 실제 입력 컨트롤 컴포넌트가 렌더링됨 */}
        {isInvalid && errorMessage && (
          <p class="field__error-message" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

// 사용 예시:
// <Field label="사용자 이름" htmlFor="username" required errorMessage={errors.username}>
//   <Input id="username" name="username" value={formData.username} onInput={handleChange} />
// </Field>

// <Field label="설명" htmlFor="description" layout="vertical">
//   <Textarea id="description" name="description" value={formData.description} onInput={handleChange} />
// </Field>