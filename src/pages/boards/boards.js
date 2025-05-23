export async function initializePage() {
    // 게시판 타입에 따른 타이틀 매핑
    const boardTitles = {
      notice: '공지사항',
      knowledge: '지식공유'
    };

    // 현재 게시판 타입 가져오기
    const boardType = window.currentRouteParams?.boardName || 'notice';
    const boardTitle = boardTitles[boardType] || '게시판';

    // 레이아웃 로드
    const layoutResponse = await fetch('/src/pages/boards/features/layout/board-layout.html');
    const layoutHtml = await layoutResponse.text();
    
    // list.html 로드
    const listResponse = await fetch('/src/pages/boards/features/list/board-list.html');
    const listHtml = await listResponse.text();
    
    // detail.html 로드
    const detailResponse = await fetch('/src/pages/boards/features/detail/board-detail.html');
    const detailHtml = await detailResponse.text();
    
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
        titleElement.textContent = boardTitle;
      }
      
      // left-area에 list.html 삽입
      const leftArea = layoutContainer.querySelector('#left-area');
      if (leftArea) {
        leftArea.innerHTML = listHtml;
      }
      
      // right-area에 detail.html 삽입
      const rightArea = layoutContainer.querySelector('#right-area');
      if (rightArea) {
        rightArea.innerHTML = detailHtml;
      }
      
      // 레이아웃으로 교체
      contentContainer.innerHTML = '';
      contentContainer.appendChild(layoutContainer);
  
      // 각 영역의 스크립트 로드 및 초기화
      try {
        const { initializeList } = await import("./features/list/board-list.js");
        const { initializeDetail } = await import("./features/detail/board-detail.js");
        
        await Promise.all([
          initializeList(leftArea),
          initializeDetail(rightArea)
        ]);
      } catch (error) {
        console.error("페이지 초기화 중 오류가 발생했습니다:", error);
      }
    }
  }