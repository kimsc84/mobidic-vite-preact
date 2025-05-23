/**
 * @file Bottom Drawer 슬라이더 아이템 동적 생성 및 관리
 * @description 하드코딩된 슬라이더 아이템을 제거하고, JS로 데이터를 기반으로 동적 생성합니다.
 */

import './bottom-drawer.css';


// TODO: 실제 환경에서는 API 호출 등을 통해 데이터를 가져와야 함
const sliderItemsData = [
  { id: "fav001", name: "분기별 이익 리포트", imgSrc: null, type: "favorite" }, // imgSrc가 null이면 플레이스홀더 SVG 사용
  { id: "fav002", name: "프로젝트 현황 대시보드", imgSrc: "/src/assets/img/report_thumb_sample.png", type: "favorite" },
  { id: "fav003", name: "월간 사용자 분석", imgSrc: "/src/assets/img/report_thumb_sample_2.png", type: "favorite" }, // 다른 샘플 이미지 경로
  { id: "fav004", name: "신규 고객 유치 전략", imgSrc: null, type: "favorite" },
  { id: "fav005", name: "영업 실적 보고서", imgSrc: "/src/assets/img/report_thumb_sample_3.png", type: "favorite" },
  { id: "fav006", name: "마케팅 캠페인 결과", imgSrc: "/src/assets/img/report_thumb_sample.png", type: "favorite" },
  { id: "recent001", name: "최근 실행한 A 보고서", imgSrc: "/src/assets/img/report_thumb_sample_2.png", type: "recent" },
  { id: "recent002", name: "어제 본 B 대시보드", imgSrc: null, type: "recent" },
];

/**
 * 슬라이더 아이템 DOM 요소를 생성합니다.
 * @param {object} itemData - 슬라이더 아이템 데이터 ({ id, name, imgSrc, type })
 * @returns {HTMLElement} 생성된 슬라이더 아이템 div 요소
 */
function createSliderItemElement(itemData) {
  const itemDiv = document.createElement('div');
  itemDiv.className = 'bottom-drawer__slider-item';
  itemDiv.dataset.id = itemData.id; // 데이터 식별을 위한 ID 추가
  itemDiv.dataset.type = itemData.type; // 탭 구분을 위한 타입 추가

  let thumbElement;

  if (itemData.imgSrc) {
    thumbElement = document.createElement('img');
    thumbElement.className = 'bottom-drawer__slider-thumb';
    thumbElement.src = itemData.imgSrc;
    thumbElement.alt = itemData.name || '슬라이더 아이템 썸네일';
  } else {
    // 플레이스홀더 SVG
    thumbElement = document.createElement('div');
    thumbElement.className = 'bottom-drawer__slider-thumb bottom-drawer__slider-thumb--blank';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '64');
    svg.setAttribute('height', '64');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', itemData.name || '보고서 썸네일 없음');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#icon-bottom-drawer-placeholder-thumb'); // sprite.svg의 ID 참조
    svg.appendChild(use);
    thumbElement.appendChild(svg);
  }

  const nameSpan = document.createElement('span');
  nameSpan.className = 'bottom-drawer__slider-name';
  nameSpan.textContent = itemData.name;

  itemDiv.appendChild(thumbElement);
  itemDiv.appendChild(nameSpan);

  return itemDiv;
}

/**
 * 슬라이더 트랙에 아이템들을 채웁니다.
 * @param {Array<object>} data - 표시할 슬라이더 아이템 데이터 배열
 */
function populateSlider(data) {
  const track = document.querySelector('.bottom-drawer__slider-track');
  if (!track) {
    console.error('슬라이더 트랙 요소를 찾을 수 없습니다. (bottom-drawer.js)');
    return;
  }

  // 1. 기존 아이템 모두 삭제
  track.innerHTML = '';

  // 2. 새 아이템들 추가
  data.forEach(itemData => {
    const sliderItemElement = createSliderItemElement(itemData);
    track.appendChild(sliderItemElement);
  });
  console.log('바텀 드로어 슬라이더 아이템 동적 로드 완료! (bottom-drawer.js)');
}

// --- 추가된 코드 시작 ---

// DOM 요소 선택
let toggleButton = null; // initializeBottomDrawer에서 할당
let drawerWrapper = null; // initializeBottomDrawer에서 할당
// const drawerContainer = document.querySelector('.bottom-drawer__container'); // 필요시 사용

const favoriteTab = document.getElementById('favorite');
const recentTab = document.getElementById('recent');
const favoriteEditButton = document.getElementById('favorite-edit');
const sliderTrack = document.querySelector('.bottom-drawer__slider-track');
const sliderPrevButton = document.getElementById('slider-prev');
const sliderNextButton = document.getElementById('slider-next');


/**
 * Bottom Drawer를 열거나 닫습니다.
 * drawerWrapper에 'active' 클래스를 토글하여 CSS로 제어합니다.
 */
function toggleDrawer() {
  if (drawerWrapper) {
    drawerWrapper.classList.toggle('active');
    const isOpen = drawerWrapper.classList.contains('active');
    // console.log(`바텀 드로어 상태 변경: ${isOpen ? '열림' : '닫힘'} (bottom-drawer.js)`);

    // 백드롭의 'show' 클래스도 함께 토글
    const backdrop = drawerWrapper.querySelector('.bottom-drawer__backdrop');
    if (backdrop) {
      backdrop.classList.toggle('show', isOpen);
    }
  } else {
    console.error('드로어 래퍼 요소를 찾을 수 없습니다. (bottom-drawer.js)');
  }
}

/**
 * 특정 탭을 활성화하고 해당 탭의 데이터를 슬라이더에 로드합니다.
 * @param {string} tabType - 'favorite' 또는 'recent'
 */
function activateTab(tabType) {
  const dataToLoad = sliderItemsData.filter(item => item.type === tabType);
  populateSlider(dataToLoad);

  // 탭 활성 상태 및 즐겨찾기 편집 버튼 표시 여부 변경
  if (favoriteTab && recentTab && favoriteEditButton) {
    favoriteTab.classList.toggle('bottom-drawer__tab--active', tabType === 'favorite');
    recentTab.classList.toggle('bottom-drawer__tab--active', tabType === 'recent');
    favoriteEditButton.style.display = (tabType === 'favorite') ? '' : 'none';
  } else {
    console.error('탭 또는 편집 버튼 요소를 찾을 수 없습니다. (bottom-drawer.js)');
  }
  console.log(`${tabType} 탭 활성화 및 데이터 로드 완료. (bottom-drawer.js)`);
}

/**
 * 슬라이더를 스크롤합니다.
 * @param {string} direction - 'prev' 또는 'next'
 */
function scrollSlider(direction) {
  if (!sliderTrack) {
    console.error('슬라이더 트랙 요소를 찾을 수 없습니다. (bottom-drawer.js)');
    return;
  }
  // 한번에 스크롤할 양 (예: 트랙 너비의 80% 또는 고정값)
  const scrollAmount = sliderTrack.clientWidth * 0.8;

  if (direction === 'next') {
    sliderTrack.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  } else if (direction === 'prev') {
    sliderTrack.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }
  console.log(`슬라이더 스크롤: ${direction}, 스크롤 양: ${scrollAmount}px (bottom-drawer.js)`);
}

// --- 추가된 코드 끝 ---

/**
 * Bottom Drawer 컴포넌트를 초기화합니다.
 * 이 함수는 bottom-drawer.html이 DOM에 삽입된 후 호출되어야 합니다.
 */
export function initializeBottomDrawer() {
  console.log('[BottomDrawer] 초기화 시작 (bottom-drawer.js)');
  drawerWrapper = document.getElementById('bottom-drawer-container'); // ✨ 여기서 실제 DOM 요소 할당
  toggleButton = document.getElementById('open-bottom-drawer'); // ✨ 여기서 실제 DOM 요소 할당

  activateTab('favorite'); // 초기에는 즐겨찾기 탭 활성화

  if (toggleButton) {
    toggleButton.addEventListener('click', toggleDrawer);
  } else {
    console.error('드로어 토글 버튼을 찾을 수 없습니다. (bottom-drawer.js)');
  }

  if (favoriteTab) {
    favoriteTab.addEventListener('click', () => activateTab('favorite'));
  }
  if (recentTab) {
    recentTab.addEventListener('click', () => activateTab('recent'));
  }

  if (sliderPrevButton) {
    sliderPrevButton.addEventListener('click', () => scrollSlider('prev'));
  } else {
    console.error('슬라이더 이전 버튼을 찾을 수 없습니다. (bottom-drawer.js)');
  }

  if (sliderNextButton) {
    sliderNextButton.addEventListener('click', () => scrollSlider('next'));
  } else {
    console.error('슬라이더 다음 버튼을 찾을 수 없습니다. (bottom-drawer.js)');
  }

  if (favoriteEditButton) {
    favoriteEditButton.addEventListener('click', () => {
      console.log('즐겨찾기 편집 버튼 클릭! (bottom-drawer.js)');
      alert('즐겨찾기 편집 기능은 아직 준비 중입니다. 🚧');
    });
  }
  console.log('[BottomDrawer] 이벤트 리스너 설정 및 초기화 완료 (bottom-drawer.js)');
}