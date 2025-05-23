import { loadSettingsData } from '../settings/board-settings.js';

let editorModule = null;

// 게시글 작성/수정 페이지 초기화
export async function initializeEdit(container, postData = null) {
  try {
    // HTML 로드
    const [editHtml, editorHtml] = await Promise.all([
      fetch("/src/pages/boards/features/write/board-write.html").then(response => response.text()),
      fetch("/src/components/editor/editor.html").then(response => response.text())
    ]);

    // board-write.html 삽입
    container.innerHTML = editHtml;

    // 목록 버튼 이벤트 리스너 추가
    const cancelButton = container.querySelector('.board-write__cancel-button');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        if (confirm('작성을 취소하시겠습니까?')) {
          const boardType = window.currentRouteParams?.boardName || 'notice';
          window.location.href = `/boards/${boardType}`;
        }
      });
    }

    // 에디터 초기화
    await initializeEditor(editorHtml);

    // 게시글 데이터가 있으면 폼에 로드
    if (postData) {
      loadPostData(postData);
      loadSettingsData(postData);

      const submitButton = document.querySelector('.board-write__submit');
      if (submitButton) {
        submitButton.textContent = '수정';
      }
    }

    // 폼 제출 이벤트 초기화
    initializeFormSubmit();
  } catch (error) {
    console.error("게시글 작성 페이지를 불러오는 중 오류가 발생했습니다:", error);
  }
}

// 게시글 데이터를 폼에 로드
function loadPostData(postData) {
  // 제목 로드
  const titleInput = document.querySelector(".board-write__title-input");
  if (titleInput) {
    titleInput.value = postData.title;
  }

  // 내용 로드
  if (editorModule && postData.content) {
    editorModule.setEditorContents(postData.content);
  }

}

// 에디터 초기화
async function initializeEditor(editorHtml) {
  const editorContainer = document.querySelector("#editor-container2");
  console.log("editorContainer", editorContainer);
  if (!editorContainer) return;

  // HTML 파싱
  const template = document.createElement("template");
  template.innerHTML = editorHtml;

  // link 태그 처리
  template.content.querySelectorAll("link").forEach(link => {
    if (!document.querySelector(`link[href="${link.getAttribute("href")}"]`)) {
      document.head.appendChild(link.cloneNode(true));
    }
  });

  // script 태그 처리
  const scripts = Array.from(template.content.querySelectorAll("script"));
  template.content.querySelectorAll("script").forEach(script => script.remove());

  // HTML 구조 삽입
  editorContainer.appendChild(template.content.cloneNode(true));

  // 스크립트 순차적 로드
  for (const script of scripts) {
    if (script.src) {
      await new Promise(resolve => {
        const newScript = document.createElement("script");
        newScript.src = script.src;
        newScript.onload = resolve;
        document.head.appendChild(newScript);
      });
    }
  }

  // 에디터 모듈 동적 import 및 초기화
  editorModule = await import("../../../../components/editor/editor.js");
  editorModule.initializeEditor();
}

// 폼 제출 이벤트 초기화
function initializeFormSubmit() {
  console.log("initializeFormSubmit");
  const form = document.querySelector(".board-write__form");
  console.log("form", form);
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    console.log("submit");
    e.preventDefault();

    // 입력값 검증
    if (!validateForm()) return;

    // 폼 데이터 수집
    const formData = collectFormData();

    try {
      // API 호출
      const response = await fetch("/api/boards/save", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("서버 응답 오류");

      alert("저장되었습니다.");
      window.location.href = "/board?page=list";
    } catch (error) {
      console.error("저장 중 오류 발생:", error);
      alert("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  });
}

// 폼 입력값 검증
function validateForm() {
  const titleInput = document.querySelector(".board-write__title-input");
  if (!titleInput.value.trim()) {
    alert("제목을 입력해주세요.");
    titleInput.focus();
    return false;
  }

  const editorContents = editorModule.getEditorContents();
  if (!editorContents || !editorContents.text.trim()) {
    alert("내용을 입력해주세요.");
    return false;
  }

  // 팝업 설정 검증
  const usePopup = document.querySelector('input[name="usePopup"]')?.checked;
  if (usePopup) {
    const startDate = document.querySelector('input[name="popupStartDate"]');
    const endDate = document.querySelector('input[name="popupEndDate"]');

    if (!startDate?.value) {
      alert("팝업 시작일을 선택해주세요.");
      startDate?.focus();
      return false;
    }

    if (!endDate?.value) {
      alert("팝업 종료일을 선택해주세요.");
      endDate?.focus();
      return false;
    }

    if (new Date(startDate.value) > new Date(endDate.value)) {
      alert("팝업 종료일은 시작일보다 이후여야 합니다.");
      endDate?.focus();
      return false;
    }
  }

  return true;
}

// 폼 데이터 수집
function collectFormData() {
  const formData = new FormData();
  const titleInput = document.querySelector(".board-write__title-input");
  const editorContents = editorModule.getEditorContents();

  // 제목, 내용
  formData.append("title", titleInput.value);
  formData.append("content", JSON.stringify(editorContents.delta));
  formData.append("contentHtml", editorContents.html);

  // 첨부파일
  document.querySelectorAll(".board-util__attachments-item").forEach(item => {
    const fileInput = item.querySelector(".attachment-file");
    const file = fileInput?.files[0];
    if (file) formData.append("files", file);
  });

  // 게시 대상
  const selectedTargets = Array.from(document.querySelectorAll(".board-util__selected-targets-item"))
    .map(item => ({
      value: item.dataset.value,
      text: item.querySelector(".board-util__selected-targets-name").textContent,
    }));
  formData.append("targets", JSON.stringify(selectedTargets));

  // 팝업 설정
  const usePopup = document.querySelector('input[name="usePopup"]')?.checked || false;
  formData.append("usePopup", usePopup);

  if (usePopup) {
    formData.append("popupStartDate", document.querySelector('input[name="popupStartDate"]').value);
    formData.append("popupEndDate", document.querySelector('input[name="popupEndDate"]').value);
  }

  return formData;
} 