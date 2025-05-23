/**
 * @file header.js
 * @description 헤더 컴포넌트의 동작을 담당. 로고 클릭, 검색 모달 제어, 최근 검색어 관리 등을 수행.
 */

// 임시 최근 검색어 데이터 (실제로는 localStorage나 API 연동 필요)
let recentSearchesData = ['매출', '분석', '신규 가입자', '이벤트', '현황'];
let searchFilter = ["전체", "대시보드", "리포트", "Oz리포트"]

// 예시 검색 결과 데이터
const searchResultsData = [
  { no: 1, type: '대시보드', name: '월간 매출 현황', date: '2024-06-01' },
  { no: 2, type: '리포트', name: '고객 이탈 분석', date: '2024-05-28' },
  { no: 3, type: 'Oz리포트', name: '부서별 실적 비교', date: '2024-05-25' },
  { no: 4, type: '대시보드', name: '신규 가입자 추이', date: '2024-05-20' },
  { no: 5, type: '리포트', name: '상품별 매출 분석', date: '2024-05-18' },
  { no: 6, type: 'Oz리포트', name: '월별 방문자 수', date: '2024-05-15' },
  { no: 7, type: '대시보드', name: '실시간 트래픽 모니터링', date: '2024-05-12' },
  { no: 8, type: '리포트', name: '이벤트 효과 분석', date: '2024-05-10' },
  { no: 9, type: 'Oz리포트', name: '고객 만족도 조사 결과', date: '2024-05-08' },
  { no: 10, type: '대시보드', name: '주간 업무 리포트', date: '2024-05-05' },
  { no: 11, type: '리포트', name: '연령별 구매 패턴', date: '2024-05-02' },
  { no: 12, type: 'Oz리포트', name: '지역별 매출 분포', date: '2024-04-30' },
  { no: 13, type: '대시보드', name: '재고 현황', date: '2024-04-28' },
  { no: 14, type: '리포트', name: '광고 캠페인 성과', date: '2024-04-25' },
  { no: 15, type: 'Oz리포트', name: '고객 문의 처리 현황', date: '2024-04-22' },
  { no: 16, type: '대시보드', name: '일별 매출 추이', date: '2024-04-20' },
  { no: 17, type: 'Oz리포트', name: '회원 등급별 분석', date: '2024-04-18' },
  { no: 18, type: 'Oz리포트', name: '서비스별 이용 현황', date: '2024-04-15' },
  { no: 19, type: '대시보드', name: '월간 목표 달성률', date: '2024-04-12' },
  { no: 20, type: '리포트', name: '신규 리포트 테스트', date: '2024-04-10' },
  { no: 21, type: 'Oz리포트', name: '부서별 예산 집행 현황', date: '2024-04-08' },
  { no: 22, type: '대시보드', name: '일간 방문자 분석', date: '2024-04-06' },
  { no: 23, type: '리포트', name: '고객 피드백 요약', date: '2024-04-04' },
  { no: 24, type: 'Oz리포트', name: '연도별 매출 성장률', date: '2024-04-02' },
  { no: 25, type: '대시보드', name: '실시간 주문 현황', date: '2024-03-30' },
  { no: 26, type: '리포트', name: '이용자 만족도 분석', date: '2024-03-28' },
  { no: 27, type: 'Oz리포트', name: '상품별 재고 현황', date: '2024-03-26' },
  { no: 28, type: '대시보드', name: '월간 신규 회원수', date: '2024-03-24' },
  { no: 29, type: '리포트', name: '광고비 지출 내역', date: '2024-03-22' },
  { no: 30, type: 'Oz리포트', name: '부서별 인원 현황', date: '2024-03-20' },
  { no: 31, type: '대시보드', name: '일간 매출 추이', date: '2024-03-18' },
  { no: 32, type: '리포트', name: '고객별 구매 이력', date: '2024-03-16' },
  { no: 33, type: 'Oz리포트', name: '연령대별 이용 현황', date: '2024-03-14' },
  { no: 34, type: '대시보드', name: '실시간 재고 모니터링', date: '2024-03-12' },
  { no: 35, type: '리포트', name: '이벤트별 매출 분석', date: '2024-03-10' },
  { no: 36, type: 'Oz리포트', name: '고객 문의 유형별 통계', date: '2024-03-08' },
  { no: 37, type: '대시보드', name: '월간 방문자 수', date: '2024-03-06' },
  { no: 38, type: '리포트', name: '상품별 반품률', date: '2024-03-04' },
  { no: 39, type: 'Oz리포트', name: '부서별 프로젝트 현황', date: '2024-03-02' },
  { no: 40, type: '대시보드', name: '일별 주문량', date: '2024-02-29' },
  { no: 41, type: '리포트', name: '고객 등급별 분석', date: '2024-02-27' },
  { no: 42, type: 'Oz리포트', name: '연도별 매출 비교', date: '2024-02-25' },
  { no: 43, type: '대시보드', name: '실시간 방문자 현황', date: '2024-02-23' },
  { no: 44, type: '리포트', name: '이벤트별 참여자 수', date: '2024-02-21' },
  { no: 45, type: 'Oz리포트', name: '부서별 예산 사용률', date: '2024-02-19' },
  { no: 46, type: '대시보드', name: '월간 주문 현황', date: '2024-02-17' },
  { no: 47, type: '리포트', name: '고객별 문의 내역', date: '2024-02-15' },
  { no: 48, type: 'Oz리포트', name: '상품별 판매 순위', date: '2024-02-13' },
  { no: 49, type: '대시보드', name: '일간 트래픽 분석', date: '2024-02-11' },
  { no: 50, type: '리포트', name: '광고별 전환율', date: '2024-02-09' },
  { no: 51, type: 'Oz리포트', name: '고객별 만족도 점수', date: '2024-02-07' },
  { no: 52, type: '대시보드', name: '주간 매출 요약', date: '2024-02-05' },
  { no: 53, type: '리포트', name: '이벤트별 매출 증감', date: '2024-02-03' },
  { no: 54, type: 'Oz리포트', name: '부서별 업무 분장', date: '2024-02-01' },
  { no: 55, type: '대시보드', name: '월별 신규 가입자', date: '2024-01-30' },
  { no: 56, type: '리포트', name: '고객별 구매 빈도', date: '2024-01-28' },
  { no: 57, type: 'Oz리포트', name: '상품별 재고 변동', date: '2024-01-26' },
  { no: 58, type: '대시보드', name: '실시간 주문 모니터링', date: '2024-01-24' },
  { no: 59, type: '리포트', name: '광고비 ROI 분석', date: '2024-01-22' },
  { no: 60, type: 'Oz리포트', name: '고객별 문의 처리 현황', date: '2024-01-20' },
];

// 페이지네이션 상태
let currentPage = 1;
const itemsPerPage = 10;

// 현재 활성화된 type 필터 (토글식, 배열)
let activeTypeFilter = ['전체'];

/**
 * 헤더 컴포넌트를 초기화합니다.
 * 주로 로고 클릭 시 홈으로 이동하는 네비게이션 이벤트를 설정합니다.
 * 이 함수는 헤더 HTML이 DOM에 삽입된 후 호출되어야 합니다.
 * @param {HTMLElement} [container] - 헤더 컴포넌트의 컨테이너 DOM 요소 (선택 사항, 없으면 #header-container 사용).
 * @exports initializeHeader
 */
export function initializeHeader(container) {
  const headerContainer = container || document.getElementById('header-container');
  if (!headerContainer) {
    console.warn('[Header] 헤더 컨테이너(#header-container)를 찾을 수 없습니다.');
    return;
  }
  const logoLink = headerContainer.querySelector('#header-logo-link');
  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      console.log(`[헤더 로고 클릭] 홈으로 이동합니다.`);
      // 'common/main'이 없을 경우를 대비해 개발 모드에서는 'common/dev'로 이동하도록 수정 가능
      const homePage = import.meta.env.DEV ? 'dev' : 'main';
      // window.navigateToPage('common', homePage); // main.js에 정의된 전역 함수 사용 (제거)
      document.dispatchEvent(new CustomEvent('app:request-navigation', {
        detail: {
          subdirOrFullPath: 'common',
          pageNameOrNull: homePage,
          stateData: {
            navigationSource: 'headerLogoClick' // 네비게이션 출처 명시
          }
        }
      }));
    });
  } else {
    console.warn('[Header] #header-logo-link 요소를 찾을 수 없습니다. header.html 파일을 확인해주세요.');
  }

  // 검색 모달 관련 요소 선택
  const headerSearchButton = headerContainer.querySelector('#header-search-button');
  const searchModal = document.getElementById('search-modal'); // 모달은 헤더 컨테이너 밖에 있을 수 있으므로 document에서 검색
  const modalCloseButton = document.getElementById('modal-close');
  const recentSearchesList = document.getElementById('recent-searches-list');
  const modalSearchInput = document.getElementById('modal-search-input');
  const modalSearchButton = document.getElementById('modal-search-button');
  const searchFilterDiv = searchModal.querySelector('.search__filters');
  const searchResultTbody = searchModal.querySelector('.header__search-result-table-body');
  const paginationListDiv = searchModal.querySelector('.header__search-result-pagination-list');
  const paginationPrevBtn = searchModal.querySelector('.header__search-result-pagination-prev');
  const paginationNextBtn = searchModal.querySelector('.header__search-result-pagination-next');
  const searchRecentsUl = searchModal.querySelector('.search__recents');
  const searchResultDiv = searchModal.querySelector('.search__result');
  const headerSearchInput = headerContainer.querySelector('#header-search-input');

  if (!searchModal || !headerSearchButton || !modalCloseButton || !modalSearchInput || !modalSearchButton) {
    console.warn('[Header] 검색 모달 또는 관련 요소를 찾을 수 없습니다. header.html의 ID를 확인해주세요.');
    return;
  }

  /**
   * 최근 검색어 목록을 화면에 렌더링합니다.
   * @function renderRecentSearches
   */
  function renderRecentSearches() {
    if (!recentSearchesList) return;
    recentSearchesList.innerHTML = ''; // 기존 목록 초기화

    if (recentSearchesData.length === 0) {
      const noItemLi = document.createElement('li');
      noItemLi.classList.add('search__recent--empty'); // 스타일링을 위한 클래스 (선택)
      noItemLi.textContent = '최근 검색 내역이 없습니다.';
      recentSearchesList.appendChild(noItemLi);
      return;
    }

    recentSearchesData.forEach((searchTerm, index) => {
      const listItem = document.createElement('li');
      listItem.classList.add('search__recent');

      const termSpan = document.createElement('span');
      termSpan.textContent = searchTerm;
      termSpan.addEventListener('click', () => {
        if (modalSearchInput) modalSearchInput.value = searchTerm;
        console.info(`[Header] 최근 검색어 클릭: ${searchTerm}`);
        executeSearch(searchTerm, 1, false);
      });

      const removeButton = document.createElement('button');
      removeButton.classList.add('button', 'button--ghost', 'button--xsmall');
      removeButton.setAttribute('aria-label', `${searchTerm} 삭제`);
      removeButton.innerHTML = `
        <svg width="12" height="12" role="img" aria-label="삭제">
          <use href="#icon-recent-item-remove"></use>
        </svg>
      `;
      removeButton.addEventListener('click', () => {
        recentSearchesData.splice(index, 1); // 데이터에서 삭제
        renderRecentSearches(); // 목록 다시 렌더링
        console.info(`[Header] 최근 검색어 삭제: ${searchTerm}`);
        // (선택) localStorage.setItem('recentSearches', JSON.stringify(recentSearchesData));
      });

      listItem.appendChild(termSpan);
      listItem.appendChild(removeButton);
      recentSearchesList.appendChild(listItem);
    });
  }

  // searchFilter 버튼 동적 렌더링 함수 (토글식)
  function renderSearchFilterButtons() {
    if (!searchFilterDiv) return;
    searchFilterDiv.innerHTML = '';
    const isAll = activeTypeFilter.includes('전체');
    searchFilter.forEach((filterName) => {
      const btn = document.createElement('button');
      btn.className = 'button button--secondary button--round button--xsmall search__filter';
      btn.textContent = filterName;
      // 토글: 배열에 있으면 active
      if (activeTypeFilter.includes(filterName)) {
        btn.classList.add('button--active');
      }
      // 전체가 아니고, 선택된 필터가 아니면 스타일만 비활성화
      if (!isAll && !activeTypeFilter.includes(filterName)) {
        btn.classList.add('button--disabled');
      } else {
        btn.classList.remove('button--disabled');
      }
      btn.addEventListener('click', () => {
        if (filterName === '전체') {
          if (isAll) {
            // 전체가 이미 선택되어 있으면 전체만 해제, 나머지 필터는 그대로 유지
            activeTypeFilter = activeTypeFilter.filter(f => f !== '전체');
          } else {
            // 전체 선택 시 모든 필터 선택
            activeTypeFilter = [...searchFilter];
          }
        } else {
          // 개별 필터 토글
          if (activeTypeFilter.includes(filterName)) {
            activeTypeFilter = activeTypeFilter.filter(f => f !== filterName);
          } else {
            activeTypeFilter = activeTypeFilter.filter(f => f !== '전체'); // 전체는 제외
            activeTypeFilter.push(filterName);
          }
          // 아무것도 선택 안 하면 전체 자동 선택
          if (activeTypeFilter.length === 0) {
            activeTypeFilter = ['전체'];
          }
          // 하나라도 해제된 항목이 있으면 전체 버튼도 해제
          if (activeTypeFilter.length > 0 && activeTypeFilter.length < searchFilter.length) {
            activeTypeFilter = activeTypeFilter.filter(f => f !== '전체');
          }
        }
        renderSearchFilterButtons();
        // 필터 변경 시 검색결과 갱신
        const keyword = modalSearchInput ? modalSearchInput.value.trim() : '';
        currentPage = 1;
        renderSearchResults(currentPage, keyword);
        renderPagination(keyword);
      });
      searchFilterDiv.appendChild(btn);
    });
  }

  // 검색어+필터로 데이터 필터링 함수 (토글식)
  function getFilteredResults(keyword) {
    let filtered = searchResultsData;
    // 아무것도 선택 안 했거나 전체만 선택 시 전체 반환
    if (activeTypeFilter.length === 0 || activeTypeFilter.includes('전체')) {
      // 전체 선택 시 전체 반환
    } else {
      filtered = filtered.filter(row => activeTypeFilter.includes(row.type));
    }
    if (keyword && keyword.trim() !== '') {
      filtered = filtered.filter(row => row.name.includes(keyword.trim()));
    }
    return filtered;
  }

  // 검색결과 렌더링 함수
  function renderSearchResults(page = 1, keyword = '') {
    if (!searchResultTbody) return;
    searchResultTbody.innerHTML = '';
    const filtered = getFilteredResults(keyword);
    const startIdx = (page - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const pageData = filtered.slice(startIdx, endIdx);
    if (pageData.length === 0) {
      searchResultTbody.innerHTML = '<tr><td colspan="4" class="table__cell table__cell--align-center">검색결과가 없습니다.</td></tr>';
      return;
    }
    pageData.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'table__row';
      tr.innerHTML = `
        <td class="table__cell table__cell--align-center">${startIdx + idx + 1}</td>
        <td class="table__cell table__cell--align-center">${row.type}</td>
        <td class="table__cell table__cell--align-left">${row.name}</td>
        <td class="table__cell table__cell--align-center">${row.date}</td>
      `;
      searchResultTbody.appendChild(tr);
    });
  }

  // 페이지네이션 렌더링 함수
  function renderPagination(keyword = '') {
    if (!paginationListDiv) return;
    paginationListDiv.innerHTML = '';
    const filtered = getFilteredResults(keyword);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.className = 'pagination__item' + (i === currentPage ? ' pagination__item--active' : '');
      btn.textContent = i;
      btn.addEventListener('click', () => {
        currentPage = i;
        executeSearch(keyword, currentPage);
      });
      paginationListDiv.appendChild(btn);
    }
    if (paginationPrevBtn) paginationPrevBtn.disabled = currentPage === 1;
    if (paginationNextBtn) paginationNextBtn.disabled = currentPage === totalPages;
  }

  // 실제 검색 실행 함수 (검색결과, 페이지네이션, showResultsOnly, 최근검색어 추가까지)
  function executeSearch(keyword, page = 1, addRecent = false) {
    showResultsOnly();
    currentPage = page;
    renderSearchResults(currentPage, keyword);
    renderPagination(keyword);
    if (addRecent) addRecentSearch(keyword);
    if (modalSearchInput) modalSearchInput.blur();
  }

  // 검색 결과/최근 검색어 show/hide 함수 (검색버튼 클릭 시만 검색결과 보이게)
  function showRecentsOnly() {
    renderRecentSearches();
    if (searchRecentsUl && searchResultDiv) {
      searchRecentsUl.style.display = '';
      searchResultDiv.style.display = 'none';
    }
  }
  function showResultsOnly() {
    if (searchRecentsUl && searchResultDiv) {
      searchRecentsUl.style.display = 'none';
      searchResultDiv.style.display = '';
    }
  }

  // 최근검색어 추가 함수 (중복 제거, 5개 유지)
  function addRecentSearch(term) {
    if (!term) return;
    // 이미 있으면 제거
    recentSearchesData = recentSearchesData.filter(item => item !== term);
    // 맨 앞에 추가
    recentSearchesData.unshift(term);
    // 5개까지만 유지
    if (recentSearchesData.length > 5) recentSearchesData = recentSearchesData.slice(0, 5);
    renderRecentSearches();
  }

  // 헤더 검색 버튼 클릭 시 모달 열기
  headerSearchButton.addEventListener('click', (event) => { // event 객체 추가
    event.stopPropagation(); // 이벤트 버블링 중단! 이게 핵심!
    searchModal.classList.add('modal--show');
    renderSearchFilterButtons(); // 모달 열 때 필터 버튼도 갱신
    if (headerSearchInput.value) {
      modalSearchInput.value = headerSearchInput.value;
    }
    currentPage = 1;
    const keyword = modalSearchInput ? modalSearchInput.value.trim() : '';
    if (keyword.length > 0) {
      executeSearch(keyword, 1, true);
    } else {
      showRecentsOnly();
      modalSearchInput.focus();
    }
    if (headerSearchInput) headerSearchInput.value = '';
  });

  // input 입력 시에는 아무것도 show/hide하지 않음 (기존 toggleSearchSections 제거)

  // 모달 닫기 버튼 클릭 시 모달 닫기
  modalCloseButton.addEventListener('click', () => {
    modalSearchInput.value = '';
    searchModal.classList.remove('modal--show');
    console.info('[Header] 검색 모달 닫힘 (닫기 버튼 클릭).');
  });

  // 모달 외부 영역 클릭 시 모달 닫기
  // 클릭으로 하면 모달안에서 눌렀다가 외부에서 떼면 닫히는 버그 발생(검색어 마우스로 긁을 때 발생)
  searchModal.addEventListener('mousedown', (event) => {
    if (event.target === searchModal) { // 모달 배경 클릭 시
      searchModal.classList.remove('modal--show');
      console.info('[Header] 검색 모달 닫힘 (외부 영역 클릭).');
    }
  });

  // 모달 내 검색 버튼 클릭 이벤트 (실제 검색 로직은 여기에 추가)
  modalSearchButton.addEventListener('click', () => {
    const searchTerm = modalSearchInput.value.trim();
    if (!searchTerm) {
      alert('검색어를 입력해 주세요.');
      modalSearchInput.focus();
      return;
    }
    executeSearch(searchTerm, 1, true);
    console.info(`[Header] 모달 내 검색 실행: ${searchTerm}`);
  });

  // 헤더 검색 input에서 엔터 시 검색 버튼 클릭과 동일하게 동작
  if (headerSearchInput) {
    headerSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        headerSearchButton.click();
      }
    });
  }
  // 모달 검색 input에서 엔터 시 검색 버튼 클릭과 동일하게 동작
  if (modalSearchInput) {
    modalSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const searchTerm = modalSearchInput.value.trim();
        if (!searchTerm) {
          alert('검색어를 입력해 주세요.');
          modalSearchInput.focus();
          return;
        }
        executeSearch(searchTerm, 1, true);
      }
    });
  }

  // 모달 검색 input에 포커스가 잡히면 최근검색어 목록을 보여줌
  if (modalSearchInput) {
    modalSearchInput.addEventListener('focus', () => {
      showRecentsOnly();
    });
  }

  // (선택) 초기 로드 시 localStorage에서 최근 검색어 불러오기
  // const storedSearches = localStorage.getItem('recentSearches');
  // if (storedSearches) {
  //   recentSearchesData = JSON.parse(storedSearches);
  // }
}