// src/components/common/Thumbnail/Thumbnail.jsx
import { h } from 'preact';

/**
 * @typedef {'image' | 'video' | 'icon'} ThumbnailType
 * @typedef {'small' | 'medium' | 'large' | 'custom'} ThumbnailSize
 */

/**
 * @param {object} props
 * @param {string} props.src - 썸네일 소스 URL (이미지/비디오) 또는 아이콘 식별자
 * @param {ThumbnailType} [props.type='image'] - 썸네일 타입
 * @param {string} [props.alt='썸네일'] - 이미지 alt 텍스트
 * @param {ThumbnailSize} [props.size='medium'] - 썸네일 크기 (CSS 클래스 매핑)
 * @param {string} [props.className] - 추가적인 CSS 클래스
 * @param {boolean} [props.rounded=false] - 둥근 모서리 적용 여부
 * @param {import("preact").ComponentChildren} [props.children] - 썸네일 위에 겹쳐질 내용 (예: 재생 버튼)
 * @returns {import("preact").JSX.Element} Thumbnail 컴포넌트
 */
export function Thumbnail({
  src,
  type = 'image',
  alt = '썸네일',
  size = 'medium',
  className = '',
  rounded = false,
  children,
  ...restProps
}) {
  // global.css에 .thumbnail, .thumbnail--image, .thumbnail--video, .thumbnail--icon,
  // .thumbnail--small, .thumbnail--rounded 등의 스타일 정의 필요
  const typeClass = `thumbnail--${type}`;
  const sizeClass = `thumbnail--${size}`;
  const roundedClass = rounded ? 'thumbnail--rounded' : '';
  const combinedClassName = `thumbnail ${typeClass} ${sizeClass} ${roundedClass} ${className}`.trim();

  return (
    <div class={combinedClassName} {...restProps}>
      {type === 'image' && <img src={src} alt={alt} class="thumbnail__media" />}
      {type === 'video' && <video src={src} class="thumbnail__media" controls={false} preload="metadata" />} {/* controls는 예시, 필요에 따라 조정 */}
      {type === 'icon' && <span class="thumbnail__icon-placeholder">{/* 여기에 아이콘 SVG 또는 폰트 아이콘 */}</span>}
      {children && <div class="thumbnail__overlay">{children}</div>}
    </div>
  );
}

// 사용 예시:
// <Thumbnail src="/path/to/image.jpg" alt="예시 이미지" />
// <Thumbnail src="/path/to/video.mp4" type="video" rounded>
//   <Button type="icon" ariaLabel="재생"><svg>...</svg></Button>
// </Thumbnail>