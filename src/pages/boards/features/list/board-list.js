import { ITEMS_PER_PAGE, boardData } from '../../const/board-const.js';

// 게시판 목록 초기화
export async function initializeList(container) {
  try {
    // 게시판 목록 기능 초기화
    initializeListFeatures();
  } catch (error) {
    console.error("게시판 목록을 불러오는 중 오류가 발생했습니다:", error);
  }
}

// 게시판 목록 기능 초기화
function initializeListFeatures() {
  // 현재 게시판 타입 가져오기
  const boardType = window.currentRouteParams?.boardName || 'notice';
  
  // 게시판 타입에 따른 데이터 가져오기
  let originalPosts = boardData[boardType] || [];
  let currentPosts = [...originalPosts];
  
  // 최신순으로 초기 정렬
  currentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // DOM 요소
  const tableBody = document.querySelector('.board-list__table-body');
  const paginationList = document.querySelector('.board-list__pagination-list');
  const prevButton = document.querySelector('.board-list__pagination-prev');
  const nextButton = document.querySelector('.board-list__pagination-next');

  // 페이지네이션 설정
  let currentPage = 1;
  let totalPages = Math.ceil(currentPosts.length / ITEMS_PER_PAGE);

  // 게시글 렌더링 함수
  function renderPosts() {
    if (!tableBody) return;
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pagePosts = currentPosts.slice(startIndex, endIndex);

    tableBody.innerHTML = pagePosts.map((post, index) => {
      const sequence = startIndex + index + 1;
      return `
        <tr class="table__row">
          <td class="table__cell">${sequence}</td>
          <td class="table__cell table__cell--align-left">
            <a href="#" class="table__link board-list__title" data-post-id="${post.id}">${post.title}</a>
          </td>
          <td class="table__cell">${post.date}</td>
          <td class="table__cell">${post.views}</td>
        </tr>
      `;
    }).join('');

    // 게시글 클릭 이벤트 추가
    const postLinks = tableBody.querySelectorAll('.table__link');
    postLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const postId = parseInt(link.dataset.postId);
        const post = currentPosts.find(p => p.id === postId);
        if (post) {
          // 게시글 상세 정보를 전역 이벤트로 전달
          const event = new CustomEvent('postSelected', { 
            detail: { 
              ...post,
              boardType // 게시판 타입 정보 추가
            } 
          });
          document.dispatchEvent(event);
        }
      });
    });
  }

  // 페이지네이션 렌더링 함수
  function renderPagination() {
    if (!paginationList) return;
    
    let paginationHTML = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button class="pagination__item ${i === currentPage ? 'pagination__item--active' : ''}" 
                data-page="${i}">${i}</button>
      `;
    }

    paginationList.innerHTML = paginationHTML;
    updatePaginationButtons();
  }

  // 페이지네이션 버튼 상태 업데이트
  function updatePaginationButtons() {
    if (!prevButton || !nextButton) return;
    
    prevButton.disabled = currentPage === 1;
    nextButton.disabled = currentPage === totalPages;
    
    prevButton.style.opacity = prevButton.disabled ? '0.5' : '1';
    nextButton.style.opacity = nextButton.disabled ? '0.5' : '1';
  }

  // 페이지 변경 함수
  function changePage(page) {
    currentPage = page;
    renderPosts();
    renderPagination();
  }

  // 정렬 기능
  function initializeSort() {
    const sortButtons = document.querySelectorAll('.board-list__sort-option');
    if (!sortButtons.length) return;

    // 현재 선택된 정렬 옵션 저장
    let currentSortType = '최신순';

    // 초기 정렬 버튼 활성화
    const latestSortButton = Array.from(sortButtons).find(button => 
      button.textContent.trim() === '최신순'
    );
    if (latestSortButton) {
      latestSortButton.classList.add('board-list__sort-option--active');
    }

    sortButtons.forEach(button => {
      button.addEventListener('click', () => {
        sortButtons.forEach(btn => btn.classList.remove('board-list__sort-option--active'));
        button.classList.add('board-list__sort-option--active');

        currentSortType = button.textContent.trim();
        sortPosts(currentSortType);
      });
    });

    // 정렬 함수
    function sortPosts(sortType) {
      if (sortType === '최신순') {
        currentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
      } else if (sortType === '조회순') {
        currentPosts.sort((a, b) => b.views - a.views);
      }

      currentPage = 1;
      totalPages = Math.ceil(currentPosts.length / ITEMS_PER_PAGE);
      renderPosts();
      renderPagination();
    }

    // 정렬 함수를 외부에서 사용할 수 있도록 반환
    return sortPosts;
  }

  // 검색 기능
  function initializeSearch() {
    const searchInput = document.querySelector('.board-list__input-search-wrap input');
    const searchSelect = document.querySelector('.select');
    const searchButton = document.querySelector('.board-list__search-btn');
    const sortButtons = document.querySelectorAll('.board-list__sort-option');

    if (!searchInput || !searchSelect || !searchButton) return;

    // 현재 선택된 정렬 옵션 가져오기
    const getCurrentSortType = () => {
      const activeButton = Array.from(sortButtons).find(button => 
        button.classList.contains('board-list__sort-option--active')
      );
      return activeButton ? activeButton.textContent.trim() : '최신순';
    };

    // 검색 실행 함수
    const executeSearch = () => {
      const searchType = searchSelect.value;
      const searchTerm = searchInput.value.toLowerCase().trim();
      
      // 검색어가 비어있으면 전체 목록 표시
      if (!searchTerm) {
        currentPosts = [...originalPosts];
      } else {
        // 원본 데이터에서 검색
        currentPosts = originalPosts.filter(post => {
          if (searchType === 'title') {
            return post.title.toLowerCase().includes(searchTerm);
          } else if (searchType === 'writer') {
            return post.author.toLowerCase().includes(searchTerm);
          }
          return true;
        });
      }

      // 현재 정렬 옵션으로 정렬
      const currentSortType = getCurrentSortType();
      if (currentSortType === '최신순') {
        currentPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
      } else if (currentSortType === '조회순') {
        currentPosts.sort((a, b) => b.views - a.views);
      }

      totalPages = Math.ceil(currentPosts.length / ITEMS_PER_PAGE);
      currentPage = 1;
      renderPosts();
      renderPagination();
    };

    // 검색 버튼 클릭 이벤트
    searchButton.addEventListener('click', executeSearch);

    // Enter 키 이벤트
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        executeSearch();
      }
    });
  }

  // 페이지네이션 이벤트 설정
  function setupPaginationEvents() {
    if (!paginationList || !prevButton || !nextButton) return;

    // 페이지 번호 클릭
    paginationList.addEventListener('click', (e) => {
      const pageButton = e.target.closest('.pagination__item');
      if (pageButton) {
        const page = parseInt(pageButton.dataset.page);
        changePage(page);
      }
    });

    // 이전 페이지 버튼
    prevButton.addEventListener('click', () => {
      if (currentPage > 1) {
        changePage(currentPage - 1);
      }
    });

    // 다음 페이지 버튼
    nextButton.addEventListener('click', () => {
      if (currentPage < totalPages) {
        changePage(currentPage + 1);
      }
    });
  }

  // 초기 렌더링
  renderPosts();
  renderPagination();
  
  // 이벤트 리스너 설정
  initializeSearch();
  initializeSort();
  setupPaginationEvents();

  // 글쓰기 버튼 이벤트 설정
  const writeButton = document.querySelector('.board-list__write-btn-wrap .button');
  if (writeButton) {
    writeButton.addEventListener('click', () => {
      const boardType = window.currentRouteParams?.boardName || 'notice';
      window.location.href = `/boards/${boardType}/write`;
    });
  }
} 