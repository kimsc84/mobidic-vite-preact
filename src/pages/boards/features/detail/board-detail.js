import { initializeEditor as initEditor } from '../../../../components/editor/editor.js';
import { boardData } from '../../const/board-const.js';

// 게시글 상세 페이지 초기화
export async function initializeDetail(container) {
  try {
    // HTML 로드
    const [detailHtml, editorHtml] = await Promise.all([
      fetch("/src/pages/boards/features/detail/board-detail.html").then(response => response.text()),
      fetch("/src/components/editor/editor.html").then(response => response.text())
    ]);

    // HTML 삽입
    container.innerHTML = detailHtml;

    // 이벤트 핸들러 초기화
    initializeEventHandlers();

    // 에디터 초기화
    await initializeEditor(editorHtml);

    // 게시글 선택 이벤트 리스너 등록
    document.addEventListener('postSelected', handlePostSelected);

    // 현재 게시판 타입 가져오기
    const boardType = window.currentRouteParams?.boardName || 'notice';

    let originalPosts = boardData[boardType] || [];
    let currentPosts = [...originalPosts];
    
    // 최신순으로 초기 정렬
    currentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 초기 게시글 표시
    const firstPost = currentPosts[0];
    if (firstPost) {
      displayBoardData(firstPost);
    } else {
      // 게시글이 없는 경우 빈 상태 표시
      displayEmptyState();
    }
  } catch (error) {
    console.error("게시글 상세 페이지를 불러오는 중 오류가 발생했습니다:", error);
  }
}

// 빈 상태 표시 함수
function displayEmptyState() {
  const titleElement = document.querySelector(".board-detail__title");
  if (titleElement) titleElement.textContent = "게시글이 없습니다.";

  const authorElement = document.querySelector(".board-detail__author");
  if (authorElement) authorElement.textContent = "";

  const dateElement = document.querySelector(".board-detail__date");
  if (dateElement) dateElement.textContent = "";

  const viewsElement = document.querySelector(".board-detail__views");
  if (viewsElement) viewsElement.textContent = "";

  const editor = document.querySelector('.ql-editor');
  if (editor) {
    editor.innerHTML = '<p>등록된 게시글이 없습니다.</p>';
  }

  // 첨부파일과 댓글 영역 초기화
  displayAttachments([]);
  displayComments([]);
}

// 이벤트 핸들러 초기화
function initializeEventHandlers() {
  // 게시글 헤더의 드롭다운 초기화
  const headerDropdownButton = document.querySelector('.board-detail__header .board-detail__dropdown .button--icon');
  if (headerDropdownButton) {
    headerDropdownButton.addEventListener('click', toggleDropdown);
  }

  // 댓글의 드롭다운 초기화
  const commentDropdownButtons = document.querySelectorAll('.board-detail__comments-item-header .board-detail__dropdown .button--icon');
  commentDropdownButtons.forEach(button => {
    button.addEventListener('click', toggleDropdown);
  });

  // 게시글 헤더의 드롭다운 메뉴 항목 이벤트 연결
  const headerDropdown = document.querySelector('.board-detail__header .board-detail__dropdown-menu');
  if (headerDropdown) {
    const editButton = headerDropdown.querySelector('.board-detail__dropdown-item:nth-child(1)');
    const deleteButton = headerDropdown.querySelector('.board-detail__dropdown-item:nth-child(2)');

    if (editButton) editButton.addEventListener('click', handleEdit);
    if (deleteButton) deleteButton.addEventListener('click', handleDelete);
  }

  // 댓글 작성 폼 이벤트 리스너 등록
  const commentForm = document.querySelector('.board-detail__comment-form');
  if (commentForm) {
    commentForm.addEventListener('submit', handleCommentSubmit);
  }

  // 드롭다운 메뉴 외부 클릭 시 닫기
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.board-detail__dropdown')) {
      document.querySelectorAll('.board-detail__dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');
      });
    }
  });

  // 스크롤 시 열린 드롭다운 메뉴 닫기
  document.addEventListener('scroll', () => {
    document.querySelectorAll('.board-detail__dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
  });
}

// 에디터 초기화 (읽기 전용)
async function initializeEditor(editorHtml) {
  const editorContainer = document.querySelector(".board-detail__body#editor-container2");
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

  // 에디터 초기화
  initEditor(true);
}

// 게시글 선택 이벤트 핸들러
function handlePostSelected(event) {
  const post = event.detail;
  displayBoardData(post);
}

// 게시글 데이터 표시
function displayBoardData(post) {
  // 현재 게시글 ID 저장
  document.querySelector('.board-detail__content').dataset.postId = post.id;

  // 제목 표시
  const titleElement = document.querySelector(".board-detail__title");
  if (titleElement) titleElement.textContent = post.title;

  // 작성자 정보 표시
  const authorElement = document.querySelector(".board-detail__author");
  if (authorElement) authorElement.textContent = post.author;

  // 작성일 표시
  const dateElement = document.querySelector(".board-detail__date");
  if (dateElement) dateElement.textContent = post.date;

  // 조회수 표시
  const viewsElement = document.querySelector(".board-detail__views");
  if (viewsElement) viewsElement.textContent = `조회수: ${post.views}`;

  // 에디터에 내용 표시
  const editor = document.querySelector('.ql-editor');
  if (editor && post.content) {
    editor.innerHTML = '';
    if (post.content.ops) {
      post.content.ops.forEach(op => {
        if (op.attributes && op.attributes.bold) {
          const boldElement = document.createElement('strong');
          boldElement.textContent = op.insert;
          editor.appendChild(boldElement);
        } else {
          const textNode = document.createTextNode(op.insert);
          editor.appendChild(textNode);
        }
      });
    }
  }

  // 첨부파일 표시
  displayAttachments(post.attachments);

  // 댓글 표시
  displayComments(post.comments);
}

// 첨부파일 표시
function displayAttachments(attachments) {
  const attachmentsContainer = document.querySelector('.board-detail__attachments');
  if (!attachments || attachments.length === 0) {
    attachmentsContainer.innerHTML = `
      <div class="board-detail__attachments-title">첨부파일</div>
      <ul class="board-detail__attachments-list scroll--common">
        <li class="board-detail__attachments-item">첨부파일이 없습니다.</li>
      </ul>
    `;
    return;
  }

  const attachmentsList = attachments.map(attachment => {
    const fileName = typeof attachment === 'object' ? attachment.name : attachment;
    return `
      <li class="board-detail__attachments-item">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18.5201 7.62068C15.1046 11.4423 12.3744 14.4317 9.44353 17.7568C8.4131 18.8546 7.40458 19.5498 6.41799 19.8426C4.55621 20.3549 2.94399 19.5672 1.68238 18.1959C0.498477 16.8786 -0.0605844 15.4698 0.0051934 13.9695C0.10386 11.719 0.750627 10.9872 2.04414 9.52351L10.463 0.192387L11.8113 1.72929L3.42534 11.0604C2.60723 12.0179 1.83593 13.1573 1.94546 14.4635C2.19656 16.4537 4.38573 18.2113 5.92469 17.7568C7.2901 17.1806 7.91285 16.3863 8.90088 15.2868C11.8989 11.9424 14.2173 9.33472 17.1389 6.08384C18.1422 4.86209 18.4138 4.07196 17.4677 2.9369C16.9415 2.35142 16.4263 2.09527 15.9221 2.16845C15.3337 2.24966 14.9268 2.62026 14.5409 3.04665L6.87836 11.5727C6.5277 11.9622 5.85461 12.8492 6.15488 13.2193C6.7469 13.5033 7.31196 12.772 7.63476 12.4143L14.6724 4.58353L16.0536 6.0838L9.01601 13.9512C7.75993 15.3062 6.22501 16.2798 4.80658 14.7562C3.50678 13.0712 4.37453 11.296 5.49719 10.0358L13.1597 1.50975C13.9489 0.631533 14.804 0.131442 15.7248 0.00947796C17.0157 -0.0867335 18.0519 0.560876 18.849 1.43657C19.5847 2.25969 19.9922 3.14894 20 4.25422C19.9522 5.58308 19.1656 6.88969 18.5201 7.62068Z" fill="black"/>
        </svg>
        <label class="board-detail__attachments-item-label">${fileName}</label>
      </li>
    `;
  }).join('');

  attachmentsContainer.innerHTML = `
    <div class="board-detail__attachments-title">첨부파일</div>
    <ul class="board-detail__attachments-list scroll--common">
      ${attachmentsList}
    </ul>
  `;
}

// 댓글 표시
function displayComments(comments) {
  const commentsContainer = document.querySelector('.board-detail__comments-list');
  if (!comments || comments.length === 0) {
    commentsContainer.innerHTML = `
        <li class="board-detail__comments-item">댓글이 없습니다.</li>
    `;
    return;
  }

  // 댓글 HTML 생성 함수
  function generateCommentHTML(comment) {
    const repliesHTML = comment.children.map(reply => generateCommentHTML(reply)).join('');
    
    return `
      <li class="board-detail__comments-item ${comment.isAdmin ? 'board-detail__comments-item--admin' : ''}" data-comment-id="${comment.id}">
        <div class="board-detail__comments-item-header">
          <span class="board-detail__comments-author">${comment.author}</span>
          <div class="board-detail__comments-item-buttons">
            <div class="board-detail__dropdown">
              <button type="button" class="button button--ghost button--icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 9.99583H10.0083V10.0042H10V9.99583ZM10 4.1625H10.0083V4.17083H10V4.1625ZM10 15.8292H10.0083V15.8375H10V15.8292Z" stroke="gray" stroke-width="3.75" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="board-detail__dropdown-menu">
                <button class="board-detail__dropdown-item" data-action="reply">답글달기</button>
                <button class="board-detail__dropdown-item" data-action="edit">수정하기</button>
                <button class="board-detail__dropdown-item" data-action="delete">삭제하기</button>
              </div>
            </div>
          </div>
        </div>
        <span class="board-detail__comments-content">${comment.content}</span>
        <form class="board-detail__reply-form" style="display: none;">
          <div class="board-detail__reply-header">
            <div class="board-detail__reply-info">
              <span class="board-detail__reply-to">@${comment.author}</span>님에게 답글 작성 중...
            </div>
            <div class="board-detail__reply-buttons">
              <button type="button" class="button button--secondary button--xsmall board-detail__comment-cancel">취소</button>
              <button type="submit" class="button button--primary button--xsmall">답글 등록</button>
            </div>
          </div>
          <textarea class="board-detail__comment-textarea scroll--common" placeholder="답글을 입력하세요"></textarea>
        </form>
        ${comment.children.length > 0 ? `
            ${comment.children.map(reply => `
              <li class="board-detail__comments-item board-detail__comments-item--reply" data-comment-id="${reply.id}">
                <div class="board-detail__comments-item-header">
                  <div class="board-detail__comments-item-info">
                    <svg class="board-detail__reply-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="board-detail__comments-author">${reply.author}</span>
                  </div>
                  <div class="board-detail__comments-item-buttons">
                    <div class="board-detail__dropdown">
                      <button type="button" class="button button--ghost button--icon">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 9.99583H10.0083V10.0042H10V9.99583ZM10 4.1625H10.0083V4.17083H10V4.1625ZM10 15.8292H10.0083V15.8375H10V15.8292Z" stroke="gray" stroke-width="3.75" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      <div class="board-detail__dropdown-menu">
                        <button class="board-detail__dropdown-item" data-action="reply">답글달기</button>
                        <button class="board-detail__dropdown-item" data-action="edit">수정하기</button>
                        <button class="board-detail__dropdown-item" data-action="delete">삭제하기</button>
                      </div>
                    </div>
                  </div>
                </div>
                <span class="board-detail__comments-content">${reply.content}</span>
                <form class="board-detail__reply-form" style="display: none;">
                  <div class="board-detail__reply-header">
                    <div class="board-detail__reply-info">
                      <span class="board-detail__reply-to">@${reply.author}</span>님에게 답글 작성 중...
                    </div>
                    <div class="board-detail__reply-buttons">
                      <button type="button" class="button button--secondary button--xsmall board-detail__comment-cancel">취소</button>
                      <button type="submit" class="button button--primary button--xsmall">답글 등록</button>
                    </div>
                  </div>
                  <textarea class="board-detail__comment-textarea scroll--common" placeholder="답글을 입력하세요"></textarea>
                </form>
                ${reply.children.length > 0 ? `<ul class="board-detail__comments-list board-detail__comments-list--reply">${generateCommentHTML(reply)}</ul>` : ''}
              </li>
            `).join('')}
        ` : ''}
      </li>
    `;
  }

  const commentsList = comments.map(comment => generateCommentHTML(comment)).join('');

  commentsContainer.innerHTML = `
      ${commentsList}
  `;

  // 동적으로 생성된 댓글의 드롭다운 이벤트 리스너 등록
  const commentDropdownButtons = commentsContainer.querySelectorAll('.board-detail__comments-item-header .board-detail__dropdown .button--icon');
  commentDropdownButtons.forEach(button => {
    button.addEventListener('click', toggleDropdown);
  });

  // 동적으로 생성된 댓글의 드롭다운 메뉴 항목 이벤트 연결
  const commentDropdowns = commentsContainer.querySelectorAll('.board-detail__comments-item-header .board-detail__dropdown-menu');
  commentDropdowns.forEach(dropdown => {
    const replyButton = dropdown.querySelector('[data-action="reply"]');
    const editButton = dropdown.querySelector('[data-action="edit"]');
    const deleteButton = dropdown.querySelector('[data-action="delete"]');

    if (replyButton) replyButton.addEventListener('click', handleReply);
    if (editButton) editButton.addEventListener('click', handleCommentEdit);
    if (deleteButton) deleteButton.addEventListener('click', handleCommentDelete);
  });

  // 답글 취소 버튼 이벤트 리스너 등록
  const cancelButtons = commentsContainer.querySelectorAll('.board-detail__comment-cancel');
  cancelButtons.forEach(button => {
    button.addEventListener('click', handleReplyCancel);
  });

  // 답글 폼 제출 이벤트 리스너 등록
  const replyForms = commentsContainer.querySelectorAll('.board-detail__reply-form');
  console.log("replyForms", replyForms);
  replyForms.forEach(form => {
    form.addEventListener('submit', handleReplySubmit);
  });
}

// 드롭다운 메뉴 토글
function toggleDropdown(event) {
  const button = event.currentTarget;
  const dropdown = button.nextElementSibling;
  
  // 다른 열린 드롭다운 메뉴들을 닫습니다
  document.querySelectorAll('.board-detail__dropdown-menu.show').forEach(menu => {
    if (menu !== dropdown) {
      menu.classList.remove('show');
    }
  });

  // 현재 드롭다운 메뉴를 토글합니다
  dropdown.classList.toggle('show');
}

// 게시글 수정 핸들러
function handleEdit() {
  const postId = document.querySelector('.board-detail__content').dataset.postId;
  const boardType = window.currentRouteParams?.boardName || 'notice';
  
  if (postId) {
    window.location.href = `/boards/${boardType}/edit/${postId}`;
  }
}

// 게시글 삭제 핸들러
function handleDelete() {
  // 게시글 삭제 기능 구현
  if (confirm('게시글을 정말 삭제하시겠습니까?')) {
    alert('게시글이 삭제되었습니다.');
  }
}

// 댓글 답글 핸들러
function handleReply(event) {
  const dropdownItem = event.target;
  const commentItem = dropdownItem.closest('.board-detail__comments-item');
  const replyForm = commentItem.querySelector('.board-detail__reply-form');
  
  // 다른 열린 답글 폼 닫기
  document.querySelectorAll('.board-detail__reply-form').forEach(form => {
    if (form !== replyForm) {
      form.style.display = 'none';
    }
  });

  // 답글 폼 토글
  replyForm.style.display = replyForm.style.display === 'none' ? 'block' : 'none';
  
  // 드롭다운 메뉴 닫기
  const dropdown = dropdownItem.closest('.board-detail__dropdown-menu');
  dropdown.classList.remove('show');
}

// 댓글 수정 핸들러
function handleCommentEdit(event) {
  const dropdownItem = event.target;
  const commentItem = dropdownItem.closest('.board-detail__comments-item');
  const contentDiv = commentItem.querySelector('.board-detail__comments-content');
  const originalContent = contentDiv.textContent;

  // textarea 생성
  const textarea = document.createElement('textarea');
  textarea.className = 'board-detail__edit-textarea scroll--common';
  textarea.value = originalContent;

  // 버튼 컨테이너 생성
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'board-detail__edit-buttons';

  // 취소 버튼
  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = 'button button--secondary button--xsmall';
  cancelButton.textContent = '취소';

  // 수정 버튼
  const submitButton = document.createElement('button');
  submitButton.type = 'button';
  submitButton.className = 'button button--primary button--xsmall';
  submitButton.textContent = '수정';

  // 버튼 이벤트 리스너
  cancelButton.addEventListener('click', () => {
    contentDiv.textContent = originalContent;
    textarea.replaceWith(contentDiv);
    buttonContainer.remove();
  });

  submitButton.addEventListener('click', () => {
    const newContent = textarea.value.trim();
    if (newContent) {
      contentDiv.textContent = newContent;
      textarea.replaceWith(contentDiv);
      buttonContainer.remove();
    }
  });

  // 버튼 추가
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(submitButton);

  // 기존 내용을 textarea로 교체하고 버튼 추가
  contentDiv.replaceWith(textarea);
  textarea.parentNode.insertBefore(buttonContainer, textarea.nextSibling);

  // textarea에 포커스
  textarea.focus();

  // 드롭다운 메뉴 닫기
  const dropdown = dropdownItem.closest('.board-detail__dropdown-menu');
  dropdown.classList.remove('show');
}

// 댓글 삭제 핸들러
function handleCommentDelete(event) {
  const dropdownItem = event.target;
  const commentItem = dropdownItem.closest('.board-detail__comments-item');
  const commentId = commentItem.dataset.commentId;
  const postId = document.querySelector('.board-detail__content').dataset.postId;
  const boardType = window.currentRouteParams?.boardName || 'notice';

  if (confirm('댓글을 정말 삭제하시겠습니까?')) {
    // TODO: 댓글 삭제 API 호출
    console.log('댓글 삭제:', {
      commentId,
      postId,
      boardType
    });

    // 댓글 요소 제거
    commentItem.remove();

    // 댓글이 없는 경우 메시지 표시
    const commentsList = document.querySelector('.board-detail__comments-list');
    if (commentsList.children.length === 0) {
      commentsList.innerHTML = '<li class="board-detail__comments-item">댓글이 없습니다.</li>';
    }
  }

  // 드롭다운 메뉴 닫기
  const dropdown = dropdownItem.closest('.board-detail__dropdown-menu');
  dropdown.classList.remove('show');
}

// 답글 취소 핸들러
function handleReplyCancel(event) {
  const cancelButton = event.target;
  const replyForm = cancelButton.closest('.board-detail__reply-form');
  replyForm.style.display = 'none';
}

// 답글 제출 핸들러
function handleReplySubmit(event) {
  event.preventDefault();
  event.stopPropagation(); // 이벤트 전파 중단
  
  const form = event.target;
  const replyForm = form.closest('.board-detail__reply-form');
  const commentItem = replyForm.closest('.board-detail__comments-item');
  const textarea = form.querySelector('.board-detail__comment-textarea');
  const content = textarea.value.trim();

  if (!content) {
    alert('답글 내용을 입력해주세요.');
    return;
  }

  // 답글 데이터 생성
  const reply = {
    id: Date.now(), // 임시 ID 생성
    author: document.querySelector('.board-detail__comment-form-author').textContent,
    content: content,
    date: new Date().toLocaleDateString(),
    children: []
  };

  // 답글 HTML 생성
  const replyHTML = `
    <li class="board-detail__comments-item board-detail__comments-item--reply" data-comment-id="${reply.id}">
      <div class="board-detail__comments-item-header">
        <div class="board-detail__comments-item-info">
          <svg class="board-detail__reply-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span class="board-detail__comments-author">${reply.author}</span>
        </div>
        <div class="board-detail__comments-item-buttons">
          <div class="board-detail__dropdown">
            <button type="button" class="button button--ghost button--icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 9.99583H10.0083V10.0042H10V9.99583ZM10 4.1625H10.0083V4.17083H10V4.1625ZM10 15.8292H10.0083V15.8375H10V15.8292Z" stroke="gray" stroke-width="3.75" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="board-detail__dropdown-menu">
              <button class="board-detail__dropdown-item" data-action="reply">답글달기</button>
              <button class="board-detail__dropdown-item" data-action="edit">수정하기</button>
              <button class="board-detail__dropdown-item" data-action="delete">삭제하기</button>
            </div>
          </div>
        </div>
      </div>
      <span class="board-detail__comments-content">${reply.content}</span>
      <div class="board-detail__reply-form" style="display: none;">
        <div class="board-detail__reply-header">
          <div class="board-detail__reply-info">
            <span class="board-detail__reply-to">@${reply.author}</span>님에게 답글 작성 중...
          </div>
          <div class="board-detail__reply-buttons">
            <button type="button" class="button button--secondary button--xsmall board-detail__comment-cancel">취소</button>
            <button type="submit" class="button button--primary button--xsmall">답글 등록</button>
          </div>
        </div>
        <form class="board-detail__comment-form">
          <textarea class="board-detail__comment-textarea scroll--common" placeholder="답글을 입력하세요"></textarea>
        </form>
      </div>
    </li>
  `;

  // 답글 목록이 없으면 생성
  let repliesList = commentItem.querySelector('.board-detail__comments-list--reply');
  if (!repliesList) {
    repliesList = document.createElement('ul');
    repliesList.className = 'board-detail__comments-list board-detail__comments-list--reply';
    commentItem.appendChild(repliesList);
  }

  // 답글 추가
  repliesList.insertAdjacentHTML('beforeend', replyHTML);

  // 새로 추가된 답글의 이벤트 리스너 등록
  const newReply = repliesList.lastElementChild;
  const dropdownButton = newReply.querySelector('.board-detail__dropdown .button--icon');
  const dropdown = newReply.querySelector('.board-detail__dropdown-menu');
  
  dropdownButton.addEventListener('click', toggleDropdown);
  
  const replyButton = dropdown.querySelector('[data-action="reply"]');
  const editButton = dropdown.querySelector('[data-action="edit"]');
  const deleteButton = dropdown.querySelector('[data-action="delete"]');
  
  if (replyButton) replyButton.addEventListener('click', handleReply);
  if (editButton) editButton.addEventListener('click', handleCommentEdit);
  if (deleteButton) deleteButton.addEventListener('click', handleCommentDelete);

  // 답글 폼 초기화 및 숨기기
  textarea.value = '';
  replyForm.style.display = 'none';

  // TODO: 답글 저장 API 호출
  console.log('답글 저장:', {
    commentId: commentItem.dataset.commentId,
    content: content
  });
}

// 댓글 작성 핸들러
function handleCommentSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const textarea = form.querySelector('.board-detail__comment-textarea');
  const content = textarea.value.trim();

  if (!content) {
    alert('댓글 내용을 입력해주세요.');
    return;
  }

  // 댓글 데이터 생성
  const comment = {
    id: Date.now(), // 임시 ID 생성
    author: document.querySelector('.board-detail__comment-form-author').textContent,
    content: content,
    date: new Date().toLocaleDateString(),
    children: []
  };

  // 댓글 HTML 생성
  const commentHTML = `
    <li class="board-detail__comments-item" data-comment-id="${comment.id}">
      <div class="board-detail__comments-item-header">
        <span class="board-detail__comments-author">${comment.author}</span>
        <div class="board-detail__comments-item-buttons">
          <div class="board-detail__dropdown">
            <button type="button" class="button button--ghost button--icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 9.99583H10.0083V10.0042H10V9.99583ZM10 4.1625H10.0083V4.17083H10V4.1625ZM10 15.8292H10.0083V15.8375H10V15.8292Z" stroke="gray" stroke-width="3.75" stroke-linejoin="round"/>
              </svg>
            </button>
            <div class="board-detail__dropdown-menu">
              <button class="board-detail__dropdown-item" data-action="reply">답글달기</button>
              <button class="board-detail__dropdown-item" data-action="edit">수정하기</button>
              <button class="board-detail__dropdown-item" data-action="delete">삭제하기</button>
            </div>
          </div>
        </div>
      </div>
      <span class="board-detail__comments-content">${comment.content}</span>
      <div class="board-detail__reply-form" style="display: none;">
        <div class="board-detail__reply-header">
          <div class="board-detail__reply-info">
            <span class="board-detail__reply-to">@${comment.author}</span>님에게 답글 작성 중...
          </div>
          <div class="board-detail__reply-buttons">
            <button type="button" class="button button--secondary button--xsmall board-detail__comment-cancel">취소</button>
            <button type="submit" class="button button--primary button--xsmall">답글 등록</button>
          </div>
        </div>
        <form class="board-detail__comment-form">
          <textarea class="board-detail__comment-textarea scroll--common" placeholder="답글을 입력하세요"></textarea>
        </form>
      </div>
    </li>
  `;

  // 댓글 목록에 추가
  const commentsList = document.querySelector('.board-detail__comments-list');
  if (commentsList.firstElementChild?.textContent === '댓글이 없습니다.') {
    commentsList.innerHTML = '';
  }
  commentsList.insertAdjacentHTML('beforeend', commentHTML);

  // 새로 추가된 댓글의 이벤트 리스너 등록
  const newComment = commentsList.lastElementChild;
  const dropdownButton = newComment.querySelector('.board-detail__dropdown .button--icon');
  const dropdown = newComment.querySelector('.board-detail__dropdown-menu');
  
  dropdownButton.addEventListener('click', toggleDropdown);
  
  const replyButton = dropdown.querySelector('[data-action="reply"]');
  const editButton = dropdown.querySelector('[data-action="edit"]');
  const deleteButton = dropdown.querySelector('[data-action="delete"]');
  
  if (replyButton) replyButton.addEventListener('click', handleReply);
  if (editButton) editButton.addEventListener('click', handleCommentEdit);
  if (deleteButton) deleteButton.addEventListener('click', handleCommentDelete);

  // 폼 초기화
  textarea.value = '';

  // TODO: 댓글 저장 API 호출
  console.log('댓글 저장:', {
    postId: document.querySelector('.board-detail__content').dataset.postId,
    content: content
  });
} 