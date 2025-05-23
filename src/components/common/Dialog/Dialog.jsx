// src/components/common/Dialog/Dialog.jsx
import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Button } from '@/components/common/Button/Button'; // Button 컴포넌트 임포트 (닫기 버튼용)

/**
 * @param {object} props
 * @param {boolean} props.isOpen - 다이얼로그 열림/닫힘 상태
 * @param {function} props.onClose - 다이얼로그 닫기 요청 시 호출될 함수
 * @param {string} [props.title] - 다이얼로그 제목
 * @param {string} [props.className] - 다이얼로그 전체에 적용될 추가 클래스
 * @param {import("preact").ComponentChildren} props.children - 다이얼로그 본문 내용
 * @param {import("preact").ComponentChildren} [props.footer] - 다이얼로그 푸터 내용 (주로 버튼)
 * @param {'left' | 'center' | 'right'} [props.footerAlign='center'] - 푸터 내용 정렬 방식
 * @param {boolean} [props.showCloseButton=true] - 닫기 버튼 표시 여부
 * @param {string} [props.closeButtonAriaLabel='닫기'] - 닫기 버튼 ARIA 라벨
 * @returns {import("preact").JSX.Element | null} Dialog 컴포넌트 또는 null (닫혀있을 때)
 */
export function Dialog({
  isOpen,
  onClose,
  title,
  className = '',
  children,
  footer,
  footerAlign = 'center',
  showCloseButton = true,
  closeButtonAriaLabel = '닫기',
  ...restProps
}) {
  const dialogRef = useRef(null);

  // isOpen 상태 변경 시 dialog 요소의 open 속성 제어
  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (!dialogElement) return;

    if (isOpen) {
      // showModal() 사용 시 백드롭 자동 생성 및 포커스 관리
      dialogElement.showModal();
    } else {
      dialogElement.close();
    }

    // 모달 외부 클릭 시 닫기 처리 (backdrop 클릭)
    const handleBackdropClick = (event) => {
      if (dialogElement && event.target === dialogElement) {
        onClose();
      }
    };
    dialogElement.addEventListener('click', handleBackdropClick);

    return () => {
      dialogElement.removeEventListener('click', handleBackdropClick);
    };
  }, [isOpen, onClose]); // isOpen 또는 onClose 변경 시 효과 재실행

  // 푸터 정렬 클래스
  const footerAlignClass = footerAlign !== 'center' ? `dialog__footer--align-${footerAlign}` : '';
  const combinedFooterClassName = `dialog__footer ${footerAlignClass}`.trim();

  // global.css의 .dialog 클래스를 기본으로 사용
  const combinedClassName = `dialog ${className}`.trim();

  return (
    <dialog ref={dialogRef} class={combinedClassName} {...restProps}>
      <div class="dialog__content">
        <div class="dialog__header">
          {title && <h2 class="dialog__title">{title}</h2>}
          {showCloseButton && (
            <Button type="ghost" size="xsmall" onClick={onClose} ariaLabel={closeButtonAriaLabel} class="dialog__close-button">
              {/* SVG 아이콘 예시 (global.css에 .button__icon 스타일 있음) */}
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </Button>
          )}
        </div>
        <div class="dialog__body scroll--common"> {/* 스크롤바 유틸리티 클래스 적용 */}
          {children} {/* 다이얼로그 본문 내용 */}
        </div>
        {footer && (
          <div class={combinedFooterClassName}>
            {footer} {/* 다이얼로그 푸터 내용 (주로 버튼 그룹) */}
          </div>
        )}
      </div>
    </dialog>
  );
}

// 사용 예시:
// const [isModalOpen, setIsModalOpen] = useState(false);
// <Button onClick={() => setIsModalOpen(true)}>모달 열기</Button>
// <Dialog
//   isOpen={isModalOpen}
//   onClose={() => setIsModalOpen(false)}
//   title="정보 입력"
//   footer={(
//     <>
//       <Button type="secondary" onClick={() => setIsModalOpen(false)}>취소</Button>
//       <Button type="primary" onClick={() => { /* 저장 로직 */ setIsModalOpen(false); }}>저장</Button>
//     </>
//   )}
//   footerAlign="right"
// >
//   {/* 여기에 폼 컴포넌트나 다른 내용 */}
//   <p>모달 본문 내용입니다.</p>
// </Dialog>