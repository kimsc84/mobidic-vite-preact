// src/components/common/Form/Form.jsx
import { h } from 'preact';

/**
 * @typedef {'default' | 'layout-2-column-grid' | 'layout-mixed-flex'} FormLayout
 */

/**
 * @param {object} props
 * @param {FormLayout} [props.layout='default'] - 폼 레이아웃 타입 (CSS 클래스 매핑)
 * @param {string} [props.className] - 추가적인 CSS 클래스
 * @param {import("preact").ComponentChildren} props.children - 폼 내부 요소들 (주로 Field 컴포넌트)
 * @param {function} [props.onSubmit] - 폼 제출 이벤트 핸들러
 * @returns {import("preact").JSX.Element} Form 컴포넌트
 */
export function Form({ layout = 'default', className = '', children, onSubmit, ...restProps }) {
  const layoutClass = layout !== 'default' ? `form--${layout}` : '';
  const combinedClassName = `form ${layoutClass} ${className}`.trim();

  return (
    <form class={combinedClassName} onSubmit={onSubmit} {...restProps}>
      {children}
    </form>
  );
}

// 사용 예시:
// <Form onSubmit={handleSubmit}>
//   <Field label="이름" htmlFor="name"><Input id="name" name="name" /></Field>
//   <Field label="나이" htmlFor="age"><Input id="age" name="age" type="number" /></Field>
//   <Button htmlType="submit">제출</Button>
// </Form>

// <Form layout="layout-2-column-grid" onSubmit={handleGridSubmit}>
//   {/* 2단 그리드 레이아웃으로 필드 배치 */}
//   <Field label="주소" htmlFor="address1"><Input id="address1" name="address1" /></Field>
//   <Field label="상세 주소" htmlFor="address2"><Input id="address2" name="address2" /></Field>
//   {/* ... */}
// </Form>