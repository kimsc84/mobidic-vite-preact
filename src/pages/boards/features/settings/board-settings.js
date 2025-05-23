import { DEPARTMENTS } from "../../const/board-const";

// 게시판 유틸리티 초기화
export async function initializeUtil(container) {
  try {
    // HTML 로드
    const response = await fetch("/src/pages/boards/features/settings/board-settings.html");
    const html = await response.text();
    
    // HTML 삽입
    container.innerHTML = html;
    
    // 기능 초기화
    initializeFileUpload();
    initializeTargetSelection();
    initializePopupSettings();
  } catch (error) {
    console.error("게시판 유틸리티를 불러오는 중 오류가 발생했습니다:", error);
  }
}

// 파일 업로드 관련 기능
function initializeFileUpload() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.multiple = true;
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  fileInput.addEventListener("change", (e) => {
    Array.from(e.target.files).forEach(attachFile);
  });

  const addButton = document.querySelector(".board-settings__attachments-title button");
  if (addButton) {
    addButton.addEventListener("click", () => fileInput.click());
  }
}

function attachFile(file) {
  // 파일 크기 제한 (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    alert('파일 크기는 10MB를 초과할 수 없습니다.');
    return;
  }

  // 허용된 파일 타입
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    alert('지원하지 않는 파일 형식입니다.');
    return;
  }

  const fileItem = document.createElement("li");
  fileItem.className = "board-settings__attachments-item";

  const fileInfoDiv = document.createElement("div");
  fileInfoDiv.className = "board-settings__attachments-item-info";

  const fileNameDiv = document.createElement("span");
  fileNameDiv.className = "board-settings__attachments-item-name";
  fileNameDiv.textContent = file.name;

  const fileSizeDiv = document.createElement("span");
  fileSizeDiv.className = "board-settings__attachments-item-size";
  fileSizeDiv.textContent = formatFileSize(file.size);

  fileInfoDiv.appendChild(fileNameDiv);
  fileInfoDiv.appendChild(fileSizeDiv);

  const hiddenInput = document.createElement("input");
  hiddenInput.type = "file";
  hiddenInput.style.display = "none";
  hiddenInput.className = "attachment-file";

  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  hiddenInput.files = dataTransfer.files;

  const deleteButton = document.createElement("button");
  deleteButton.className = "button button--ghost button--icon button--xsmall";
  deleteButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.319 10L17.9518 2.32147C18.063 2.19387 17.9695 2 17.7977 2H15.7813C15.6625 2 15.5488 2.05153 15.4705 2.13988L10 8.47362L4.52951 2.13988C4.45371 2.05153 4.34 2 4.21872 2H2.20235C2.03052 2 1.93703 2.19387 2.04821 2.32147L8.68102 10L2.04821 17.6785C2.02331 17.707 2.00733 17.7418 2.00218 17.7788C1.99702 17.8158 2.00291 17.8534 2.01914 17.8873C2.03537 17.9211 2.06125 17.9497 2.09373 17.9697C2.1262 17.9897 2.1639 18.0002 2.20235 18H4.21872C4.33748 18 4.45118 17.9485 4.52951 17.8601L10 11.5264L15.4705 17.8601C15.5463 17.9485 15.66 18 15.7813 18H17.7977C17.9695 18 18.063 17.8061 17.9518 17.6785L11.319 10Z" fill="black"/>
    </svg>
  `;

  deleteButton.addEventListener("click", () => {
    if (confirm(`'${file.name}' 파일을 삭제하시겠습니까?`)) {
      fileItem.remove();
      updateEmptyState();
    }
  });

  fileItem.appendChild(hiddenInput);
  fileItem.appendChild(fileInfoDiv);
  fileItem.appendChild(deleteButton);

  const attachmentsList = document.querySelector(".board-settings__attachments-list");
  const emptyState = attachmentsList.querySelector(".board-settings__attachments-empty");
  emptyState?.remove();
  attachmentsList.appendChild(fileItem);
}

// 파일 크기 포맷팅 함수
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateEmptyState() {
  const attachmentsList = document.querySelector(".board-settings__attachments-list");
  const items = attachmentsList.querySelectorAll(".board-settings__attachments-item");
  const emptyState = attachmentsList.querySelector(".board-settings__attachments-empty");

  if (items.length === 0 && !emptyState) {
    const empty = document.createElement("li");
    empty.className = "board-settings__attachments-empty";
    empty.textContent = "데이터가 없습니다";
    attachmentsList.appendChild(empty);
  }
}

// 대상 선택 관련 기능
function initializeTargetSelection() {
  loadDepartments();
  initializeMultiselect();
}

async function loadDepartments() {
  try {
    const departments = DEPARTMENTS; // 임시 데이터 사용
    const optionsList = document.querySelector(".multiselect-options");
    
    departments.forEach((dept) => {
      const option = document.createElement("li");
      option.className = "multiselect-option";
      option.dataset.value = dept.id;
      option.textContent = dept.name;
      optionsList.appendChild(option);
    });
  } catch (error) {
    console.error("부서 목록을 불러오는 중 오류가 발생했습니다:", error);
  }
}

function initializeMultiselect() {
  const container = document.querySelector(".multiselect-container");
  const input = document.querySelector(".multiselect-input");
  const dropdown = document.querySelector(".multiselect-dropdown");
  const optionsList = document.querySelector(".multiselect-options");
  const selectAllBtn = document.querySelector(".multiselect-action-btn.select-all");
  const deselectAllBtn = document.querySelector(".multiselect-action-btn.deselect-all");

  // 드롭다운 토글
  input?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown?.classList.toggle("show");
  });

  // 옵션 선택
  optionsList?.addEventListener("click", (e) => {
    const option = e.target.closest(".multiselect-option");
    if (!option || option.classList.contains("selected")) return;

    addTarget(option.dataset.value, option.textContent);
    option.classList.add("selected");
  });

  // 전체 선택
  selectAllBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    optionsList.querySelectorAll(".multiselect-option:not(.selected)").forEach((option) => {
      addTarget(option.dataset.value, option.textContent);
      option.classList.add("selected");
    });
  });

  // 전체 해제
  deselectAllBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!confirm("모든 게시 대상을 삭제하시겠습니까?")) return;

    document.querySelectorAll(".multiselect-tag").forEach(tag => tag.remove());
    optionsList.querySelectorAll(".multiselect-option.selected")
      .forEach(option => option.classList.remove("selected"));
  });

  // 외부 클릭 시 드롭다운 닫기
  document.addEventListener("click", (e) => {
    if (!container?.contains(e.target)) {
      dropdown?.classList.remove("show");
    }
  });
}

// addTarget 함수를 export
export function addTarget(value, text) {
  const tags = document.querySelector(".multiselect-tags");
  const placeholder = tags?.querySelector(".multiselect-placeholder");
  
  if (!tags || tags.querySelector(`.multiselect-tag[data-value="${value}"]`)) return;

  // placeholder 숨김
  if (placeholder) placeholder.style.display = "none";

  // 태그 생성
  const tag = document.createElement("div");
  tag.className = "multiselect-tag";
  tag.dataset.value = value;

  const tagText = document.createElement("span");
  tagText.className = "multiselect-tag-text";
  tagText.textContent = text;

  const removeButton = document.createElement("button");
  removeButton.className = "multiselect-tag-remove";
  removeButton.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.319 10L17.9518 2.32147C18.063 2.19387 17.9695 2 17.7977 2H15.7813C15.6625 2 15.5488 2.05153 15.4705 2.13988L10 8.47362L4.52951 2.13988C4.45371 2.05153 4.34 2 4.21872 2H2.20235C2.03052 2 1.93703 2.19387 2.04821 2.32147L8.68102 10L2.04821 17.6785C2.02331 17.707 2.00733 17.7418 2.00218 17.7788C1.99702 17.8158 2.00291 17.8534 2.01914 17.8873C2.03537 17.9211 2.06125 17.9497 2.09373 17.9697C2.1262 17.9897 2.1639 18.0002 2.20235 18H4.21872C4.33748 18 4.45118 17.9485 4.52951 17.8601L10 11.5264L15.4705 17.8601C15.5463 17.9485 15.66 18 15.7813 18H17.7977C17.9695 18 18.063 17.8061 17.9518 17.6785L11.319 10Z" fill="black"/>
    </svg>
  `;

  removeButton.addEventListener("click", (e) => {
    e.stopPropagation();
    tag.remove();
    
    // 옵션 선택 상태 제거
    const option = document.querySelector(`.multiselect-option[data-value="${value}"]`);
    if (option) option.classList.remove("selected");

    // 태그가 모두 삭제되었다면 placeholder 표시
    if (!tags.querySelector(".multiselect-tag")) {
      placeholder.style.display = "block";
    }
  });

  tag.appendChild(tagText);
  tag.appendChild(removeButton);
  tags.insertBefore(tag, placeholder);
}

// 팝업 설정 관련 기능
function initializePopupSettings() {
  const usePopupCheckbox = document.querySelector('input[name="usePopup"]');
  if (!usePopupCheckbox) return;

  updatePopupSettingsState();
  usePopupCheckbox.addEventListener("change", updatePopupSettingsState);
}

function updatePopupSettingsState() {
  const usePopupCheckbox = document.querySelector('input[name="usePopup"]');
  const startDateInput = document.querySelector('input[name="popupStartDate"]');
  const endDateInput = document.querySelector('input[name="popupEndDate"]');

  const isEnabled = usePopupCheckbox?.checked || false;
  startDateInput.disabled = !isEnabled;
  endDateInput.disabled = !isEnabled;
}

// 게시글 설정 데이터 로드
export function loadSettingsData(postData) {
  if (!postData) return;

  // 첨부파일 로드
  loadAttachments(postData.attachments);
  
  // 게시대상 로드
  loadTargets(postData.targets);
  
  // 팝업 설정 로드
  loadPopupSettings(postData);
}

// 첨부파일 로드
function loadAttachments(attachments) {
  if (!attachments || attachments.length === 0) return;

  const attachmentsContainer = document.querySelector(".board-settings__attachments-list");
  if (!attachmentsContainer) return;

  const attachmentsList = attachments.map(attachment => `
    <li class="board-settings__attachments-item">
      <div class="board-settings__attachments-item-info">
        <span class="board-settings__attachments-item-name">${attachment.name}</span>
        <span class="board-settings__attachments-item-size">${attachment.size}</span>
      </div>
      <button type="button" class="button button--ghost button--icon button--xsmall">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.319 10L17.9518 2.32147C18.063 2.19387 17.9695 2 17.7977 2H15.7813C15.6625 2 15.5488 2.05153 15.4705 2.13988L10 8.47362L4.52951 2.13988C4.45371 2.05153 4.34 2 4.21872 2H2.20235C2.03052 2 1.93703 2.19387 2.04821 2.32147L8.68102 10L2.04821 17.6785C2.02331 17.707 2.00733 17.7418 2.00218 17.7788C1.99702 17.8158 2.00291 17.8534 2.01914 17.8873C2.03537 17.9211 2.06125 17.9497 2.09373 17.9697C2.1262 17.9897 2.1639 18.0002 2.20235 18H4.21872C4.33748 18 4.45118 17.9485 4.52951 17.8601L10 11.5264L15.4705 17.8601C15.5463 17.9485 15.66 18 15.7813 18H17.7977C17.9695 18 18.063 17.8061 17.9518 17.6785L11.319 10Z" fill="black"/>
        </svg>
      </button>
    </li>
  `).join('');
  
  attachmentsContainer.innerHTML = attachmentsList;
}

// 게시대상 로드
function loadTargets(targets) {
  if (!targets || targets.length === 0) return;

  // 기존 선택된 대상들 제거
  const tags = document.querySelector(".multiselect-tags");
  if (tags) {
    const existingTags = tags.querySelectorAll(".multiselect-tag");
    existingTags.forEach(tag => tag.remove());
  }

  // 새로운 대상들 추가
  targets.forEach(target => {
    const option = document.querySelector(`.multiselect-option[data-value="${target.value}"]`);
    if (option) {
      option.classList.add("selected");
      addTarget(target.value, target.text);
    }
  });
}

// 팝업 설정 로드
function loadPopupSettings(postData) {
  const usePopupCheckbox = document.querySelector('input[name="usePopup"]');
  if (!usePopupCheckbox) return;

  usePopupCheckbox.checked = postData.usePopup || false;

  if (postData.usePopup) {
    const startDateInput = document.querySelector('input[name="popupStartDate"]');
    const endDateInput = document.querySelector('input[name="popupEndDate"]');
    
    if (startDateInput && postData.popupStartDate) {
      startDateInput.value = postData.popupStartDate;
    }
    if (endDateInput && postData.popupEndDate) {
      endDateInput.value = postData.popupEndDate;
    }
  }
} 