// src/components/common/Spinner/Spinner.jsx
import { h } from 'preact';

/**
 * @param {object} props
 * @param {'small' | 'medium' | 'large'} [props.size='medium'] - 스피너 크기
 * @param {string} [props.color='var(--color-primary-600)'] - 스피너 색상
 * @param {string} [props.className] - 추가적인 CSS 클래스
 * @param {string} [props.label='로딩 중...'] - 스크린 리더를 위한 라벨
 * @returns {import("preact").JSX.Element} Spinner 컴포넌트
 */
export function Spinner({
  size = 'medium',
  color = 'var(--color-primary-600)', // global.css의 CSS 변수 사용
  className = '',
  label = '로딩 중...',
  ...restProps
}) {
  // global.css에 .spinner, .spinner--small, .spinner--large 등의 스타일 정의 필요
  const sizeClass = `spinner--${size}`;
  const combinedClassName = `spinner ${sizeClass} ${className}`.trim();

  // 간단한 CSS 기반 스피너 예시 (SVG나 다른 방식으로 대체 가능)
  // 이 스타일은 global.css 또는 Spinner.module.css에 정의되어야 합니다.
  // 예: @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  // .spinner { border: 4px solid rgba(0,0,0,0.1); border-left-color: var(--spinner-color, #09f); border-radius: 50%; animation: spin 1s linear infinite; }
  // .spinner--medium { width: 40px; height: 40px; }
  // .spinner--small { width: 20px; height: 20px; border-width: 2px; }
  // .spinner--large { width: 60px; height: 60px; border-width: 6px; }

  return (
    <div class={combinedClassName} style={{ borderColor: `${color} transparent transparent transparent` }} role="status" aria-label={label} {...restProps}>
      <span class="sr-only">{label}</span> {/* 스크린 리더 전용 텍스트 */}
    </div>
  );
}