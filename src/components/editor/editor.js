let quillInstance = null;

const toolbarOptions = [
  [{ size: ["small", false, "large", "huge"] }],
  [{ align: [] }],
  ["bold", "italic", "underline", "strike", "blockquote"],
  [
    {
      color: [],
    },
    { background: [] },
  ],
  [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
  ["link", "image", "video", "clean"],
];

export function initializeEditor(isReadOnly = false) {
  console.log("initializeEditor");
  quillInstance = new Quill("#editor", {
    theme: "snow",
    // placeholder: 'please enter your content', // quill 에디터 자체에서 placeholder랑 입력한 컨텐츠가 겹치는 버그 발생 중이라 주석 처리
    modules: {
      toolbar: isReadOnly ? false : toolbarOptions,
    },
    readOnly: isReadOnly,
    theme: "snow", // or 'bubble'
  });

  return quillInstance;
}

export function getEditorContents() {
  if (!quillInstance) {
    console.error("에디터가 초기화되지 않았습니다.");
    return null;
  }
  return {
    delta: quillInstance.getContents(),
    html: quillInstance.root.innerHTML,
    text: quillInstance.getText(),
  };
}

export function setEditorContents(delta) {
  if (!quillInstance) {
    console.error("에디터가 초기화되지 않았습니다.");
    return;
  }

  // delta 객체가 문자열로 전달된 경우 파싱
  const content = typeof delta === "string" ? JSON.parse(delta) : delta;

  // 에디터 내용 설정
  quillInstance.setContents(content);
}

export function setReadOnly(isReadOnly) {
  if (!quillInstance) {
    console.error("에디터가 초기화되지 않았습니다.");
    return;
  }

  quillInstance.enable(!isReadOnly);
}

// window.addEventListener("DOMContentLoaded", initializeEditor);
