import { boardData } from '../const/board-const.js';

export async function initializePage() {
  // URL에서 게시판 타입과 게시글 ID 가져오기
  const boardType = window.currentRouteParams?.boardName;
  const postId = window.currentRouteParams?.postId;

  if (!boardType || !postId) {
    alert('잘못된 접근입니다.');
    window.location.href = '/boards';
    return;
  }

  // 게시판 타입에 따른 데이터 가져오기
  const boardDataList = boardData[boardType] || [];
  const postData = boardDataList.find(post => post.id === parseInt(postId));

  if (!postData) {
    alert('게시글을 찾을 수 없습니다.');
    window.location.href = `/boards/${boardType}`;
    return;
  }

  // 게시판 타입에 따른 타이틀 설정
  const boardTitles = {
    notice: '공지사항',
    knowledge: '지식공유'
  };
  const boardTitle = boardTitles[boardType] || boardType;

  // 레이아웃 로드
  const layoutResponse = await fetch('/src/pages/boards/features/layout/board-layout.html');
  const layoutHtml = await layoutResponse.text();
  
  // edit.html 로드
  const editResponse = await fetch('/src/pages/boards/features/write/board-write.html');
  const editHtml = await editResponse.text();
  
  // util.html 로드
  const utilResponse = await fetch('/src/pages/boards/features/settings/board-settings.html');
  const utilHtml = await utilResponse.text();
  
  // 현재 페이지 컨텐츠 로드(index.html)
  const contentContainer = document.getElementById('content-container');
  
  // 레이아웃 적용
  const parser = new DOMParser();
  const layoutDoc = parser.parseFromString(layoutHtml, 'text/html');
  const layoutContainer = layoutDoc.querySelector('.board-layout');
  
  if (layoutContainer) {
    // 헤더 타이틀 변경
    const titleElement = layoutContainer.querySelector('.board-layout__title');
    if (titleElement) {
      titleElement.textContent = `${boardTitle} 수정`;
    }
    
    // left-area에 edit.html 삽입
    const leftArea = layoutContainer.querySelector('#left-area');
    if (leftArea) {
      leftArea.innerHTML = editHtml;
    }
    
    // right-area에 detail.html 삽입
    const rightArea = layoutContainer.querySelector('#right-area');
    if (rightArea) {
      rightArea.innerHTML = utilHtml;
    }
    
    // 레이아웃으로 교체
    contentContainer.innerHTML = '';
    contentContainer.appendChild(layoutContainer);

    // 각 영역의 스크립트 로드 및 초기화
    try {
      const { initializeEdit } = await import("../features/write/board-write.js");
      const { initializeUtil } = await import("../features/settings/board-settings.js");
      await Promise.all([
        initializeEdit(leftArea, { ...postData, boardType }), // 게시글 데이터와 게시판 타입 전달
        initializeUtil(rightArea)
      ]);   
    } catch (error) {
      console.error("페이지 초기화 중 오류가 발생했습니다:", error);
    }
  }
}