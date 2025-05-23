// src/components/common/ImageUpload/ImageUpload.jsx
import { h } from 'preact';
import { useState, useRef } from 'preact/hooks';
import { Button } from '@/components/common/Button/Button'; // Button 컴포넌트 임포트

/**
 * @param {object} props
 * @param {string} [props.id] - 파일 입력 필드 ID
 * @param {string} [props.name] - 파일 입력 필드 name
 * @param {File | null} props.file - 현재 선택된 파일 객체
 * @param {function(File | null): void} props.onFileChange - 파일 변경 시 호출될 콜백 함수 (File 객체 또는 null 전달)
 * @param {string} [props.previewUrl] - 파일 미리보기 URL (file prop 대신 직접 URL을 줄 수도 있음)
 * @param {string} [props.className] - 컴포넌트 전체에 적용될 추가 클래스
 * @param {string} [props.placeholderText='이미지를 선택하거나 드래그하세요.'] - 파일 없을 때 보여줄 텍스트
 * @param {string} [props.selectButtonText='이미지 선택'] - 파일 선택 버튼 텍스트
 * @param {string} [props.removeButtonText='이미지 제거'] - 파일 제거 버튼 텍스트
 * @param {boolean} [props.disabled] - 비활성화 여부
 * @param {string} [props.accept='image/*'] - 허용할 파일 타입 (input accept 속성)
 * @returns {import("preact").JSX.Element} ImageUpload 컴포넌트
 */
export function ImageUpload({
  id,
  name,
  file,
  onFileChange,
  previewUrl, // 외부에서 미리보기 URL을 직접 줄 경우 사용
  className = '',
  placeholderText = '이미지를 선택하거나 드래그하세요.',
  selectButtonText = '이미지 선택',
  removeButtonText = '이미지 제거',
  disabled,
  accept = 'image/*', // 기본값: 모든 이미지 파일
  ...restProps
}) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // 파일 객체 또는 previewUrl이 있으면 미리보기 URL 결정
  const currentPreviewUrl = previewUrl || (file ? URL.createObjectURL(file) : null);

  // 파일 입력 필드 클릭 트리거
  const handleSelectClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 파일 입력 필드 변경 이벤트 핸들러
  const handleFileInputChange = (event) => {
    const selectedFile = event.target.files && event.target.files[0];
    onFileChange(selectedFile || null);
    // 같은 파일 다시 선택해도 onChange 이벤트 발생하도록 input value 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 파일 제거 핸들러
  const handleRemoveClick = () => {
    onFileChange(null);
    // input value 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 드래그 앤 드롭 이벤트 핸들러
  const handleDragOver = (event) => {
    event.preventDefault(); // 기본 동작 방지 (파일 열림)
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event) => {
    event.preventDefault(); // 기본 동작 방지
    setIsDragOver(false);

    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      // 첫 번째 파일만 처리 (단일 파일 업로드 가정)
      onFileChange(droppedFiles[0]);
    }
  };

  // global.css의 .image-upload-field-content 클래스를 기본으로 사용
  const combinedClassName = `image-upload-field-content ${className}`.trim();
  const previewContainerClass = `image-upload-field__preview-container ${isDragOver ? 'image-upload-field__preview-container--dragover' : ''}`.trim();

  return (
    <div class={combinedClassName} {...restProps}>
      <div class="image-upload-field-content-wrapper">
        <div
          class={previewContainerClass}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {currentPreviewUrl ? (
            <img src={currentPreviewUrl} alt="미리보기" class="image-upload-field__preview" style={{ display: 'block' }} />
          ) : (
            <div class="image-upload-field__placeholder">
              {/* 아이콘 (global.css의 .button__icon 스타일 활용) */}
              <span class="button__icon">
                 {/* SVG 아이콘 예시 (파일/이미지 아이콘) */}
                 <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-2 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zM9.5 12c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5zm4.5 4h-4v-1h4v1zM13 9V3.5L18.5 9H13z"/></svg>
              </span>
              <p>{placeholderText}</p>
            </div>
          )}
        </div>
        <div class="image-upload-field__actions">
          {/* 실제 파일 입력 필드는 숨기고 버튼으로 트리거 */}
          <input
            ref={fileInputRef}
            type="file"
            id={id}
            name={name}
            accept={accept}
            onChange={handleFileInputChange}
            disabled={disabled}
            class="image-upload-field__input" // global.css에서 display: none 처리
            {...restProps}
          />
          <Button type="secondary" size="small" onClick={handleSelectClick} disabled={disabled} class="image-upload-field__select-button">
             {/* 아이콘 (global.css의 .button__icon 스타일 활용) */}
             <span class="button__icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
             </span>
             {selectButtonText}
          </Button>
          {file && ( // 파일이 선택되었을 때만 제거 버튼 표시
            <Button type="ghost" size="small" onClick={handleRemoveClick} disabled={disabled} class="image-upload-field__remove-button">
              {/* 아이콘 (global.css의 .button__icon 스타일 활용) */}
              <span class="button__icon">
                 <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </span>
              {removeButtonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// 사용 예시:
// const [selectedImage, setSelectedImage] = useState(null);
// <ImageUpload file={selectedImage} onFileChange={setSelectedImage} />

// 파일 업로드 컴포넌트 (FileUpload)는 ImageUpload를 기반으로 accept 속성만 변경하거나,
// 미리보기 로직을 범용적으로 수정하여 만들 수 있습니다.
// 예: <FileUpload file={selectedFile} onFileChange={setSelectedFile} accept=".pdf,.doc,.docx" placeholderText="파일을 선택하거나 드래그하세요." selectButtonText="파일 선택" removeButtonText="파일 제거" />