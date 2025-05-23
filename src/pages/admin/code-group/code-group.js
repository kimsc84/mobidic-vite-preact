// code-group.js

// import DialogManager from "../../../js/dialogManager.js"; // KIBO-UI DialogManager 임포트
import DialogManager from "@/components/dialog/dialogManager.js"; // KIBO-UI DialogManager

// 전역 상태 관리
const state = {
    codeGroups: [],
    selectedCodeGroup: null,
    initialized: false
};

// DOM 요소 참조
const dom = {
    searchInput: null,
    searchButton: null,
    searchFilterCheckboxesContainer: null,
    searchFilterCheckboxes: {}, // 각 체크박스 DOM 요소를 저장할 객체
    codeGroupTableBody: null,
    addCodeGroupButton: null,
    // 상세 정보 DOM 요소들
    codeDetailContainer: null,
    codeDetailEditButton: null,
    detailGroupIdInput: null,
    detailGroupNameInput: null,
    detailDescriptionTextarea: null,
    detailStatusRadios: [], // 라디오 버튼 NodeList 저장
    // 하위 코드 DOM 요소들
    detailAddSubCodeButton: null,
    detailSubCodeTableBody: null
};

// Panel Templates for DialogManager.renderFormInContainer
// We assume DialogManager has a 'customHtml' field type that injects raw HTML.
const panelTemplates = {
    listPanel: {
        // This template describes the *content* of the form generated in #list-panel-content-wrapper
        // dialogLayout: "default", // Optional: layout hint for renderFormInContainer
        fields: [
            {
                id: 'listPanelHeader',
                type: 'customHtml',
                html: `
                    <header class="list-panel__header section-header">
                        <h2 class="section-header__title">코드그룹 목록</h2>
                        <button type="button" class="button button--primary button--medium section-header__action list-panel__add-button">추가</button>
                    </header>
                `
            },
            {
                id: 'listPanelTable',
                type: 'customHtml',
                html: `
                    <table class="table">
                        <thead class="table__header">
                            <tr>
                                <th class="table__head-cell">코드그룹ID</th>
                                <th class="table__head-cell">코드그룹명</th>
                                <th class="table__head-cell">사용여부</th>
                                <th class="table__head-cell">등록자</th>
                                <th class="table__head-cell">등록일자</th>
                            </tr>
                        </thead>
                        <tbody class="table__body list-panel__table-body">
                            <!-- Populated by renderCodeGroupList -->
                        </tbody>
                    </table>
                `
            }
        ]
    },
    detailPanel: {
        // This template describes the *content* of the form generated in #detail-panel-content-wrapper
        // dialogLayout: "default",
        fields: [
            {
                id: 'detailPanelHeader',
                type: 'customHtml',
                html: `
                    <header class="detail-panel__header section-header">
                        <h2 class="section-header__title">코드그룹 상세</h2>
                        <button type="button" class="button button--primary button--medium section-header__action detail-panel__edit-button">편집</button>
                    </header>
                `
            },
            {
                id: 'detailPanelFormFields', // This customHtml field contains all the form-like elements
                type: 'customHtml',
                html: `
                    <div class="detail-panel__content form-layout">
                        <div class="form-field">
                            <label class="form-field__label">코드그룹 ID</label>
                            <input type="text" class="form-field__input detail-panel__group-id" placeholder="코드그룹 ID를 입력하세요" disabled />
                        </div>
                        <div class="form-field">
                            <label class="form-field__label">코드그룹명</label>
                            <input type="text" class="form-field__input detail-panel__group-name" placeholder="코드그룹명을 입력하세요" disabled />
                        </div>
                        <div class="form-field">
                            <label class="form-field__label">설명</label>
                            <textarea class="form-field__textarea detail-panel__description" placeholder="설명을 입력하세요" disabled></textarea>
                        </div>
                        <div class="form-field">
                            <label class="form-field__label">사용여부</label>
                            <div class="form-field__control radio-group" id="codeGroupUpdate_usage_DM">
                                <label class="radio-group__item" for="codeGroupUpdate_usage_0_DM">
                                    <input class="radio-group__input detail-panel__status-radio" type="radio" name="codeGroupUpdate_usage_DM" id="codeGroupUpdate_usage_0_DM" value="1" disabled>
                                    <span class="radio-group__label-text">사용</span>
                                </label>
                                <label class="radio-group__item" for="codeGroupUpdate_usage_1_DM">
                                    <input class="radio-group__input detail-panel__status-radio" type="radio" name="codeGroupUpdate_usage_DM" id="codeGroupUpdate_usage_1_DM" value="0" disabled>
                                    <span class="radio-group__label-text">미사용</span>
                                </label>
                            </div>
                        </div>
                        <div class="form-field form-field--vertical sub-item-list">
                            <div class="form-field__header sub-item-list__header">
                                <label class="form-field__label">코드</label>
                                <button type="button" class="button button--primary button--small sub-item-list__add-button">추가</button>
                            </div>
                            <table class="table">
                                <thead class="table__header">
                                    <tr>
                                        <th class="table__head-cell">코드ID</th>
                                        <th class="table__head-cell">코드명</th>
                                        <th class="table__head-cell">사용 여부</th>
                                        <th class="table__head-cell">상세</th>
                                    </tr>
                                </thead>
                                <tbody class="table__body scroll--common sub-item-list__table-body">
                                    <!-- Populated by renderSubCodeList -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                `
            }
        ]
    }
};

// KIBO-UI DialogManager 인스턴스 생성
// DialogManager는 main.js에서 전역으로 window.dialogManager에 할당될 수 있으므로,
// 여기서는 해당 인스턴스를 사용하거나, 없다면 새로 생성하도록 로직을 추가하는 것이 안전합니다.
// 현재 코드는 페이지 로드 시점에 DialogManager가 이미 전역에 있다고 가정합니다.
// const dialogManager = new DialogManager(); // main.js에서 전역으로 관리하는 경우 주석 처리

/**
 * 지정된 셀렉터에 해당하는 모든 DOM 요소가 나타날 때까지 기다립니다.
 * @param {string[]} selectors - 확인할 DOM 요소의 셀렉터 배열.
 * @param {number} [timeout=5000] - 대기 시간 초과 (밀리초).
 * @returns {Promise<void>} 모든 요소가 찾아지면 resolve, 시간 초과 시 reject.
 */
async function waitForElements(selectors, timeout = 5000) {
  console.info(`[DOM 대기] 시작. 셀렉터: ${selectors.join(', ')}`);
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const foundStatus = selectors.map(selector => ({ selector, found: !!document.querySelector(selector) }));
      const allFound = foundStatus.every(status => status.found);
      if (allFound) {
        clearInterval(interval);
        console.info(`[DOM 대기] 모든 요소 발견됨. 소요시간: ${Date.now() - startTime}ms. 셀렉터: ${selectors.join(', ')}`);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        const missing = foundStatus.filter(status => !status.found).map(status => status.selector);
        console.error(`[DOM 대기 오류] 시간 초과. 누락된 요소: ${missing.join(', ')} (제한 시간: ${timeout}ms)`);
        reject(new Error(`필수 DOM 요소(${missing.join(', ')})를 ${timeout}ms 내에 찾지 못했습니다.`));
      } else {
        // 주기적으로 어떤 요소가 아직 없는지 확인 (너무 잦은 로그 방지를 위해 주석 처리 가능)
        // const stillMissing = foundStatus.filter(status => !status.found).map(status => status.selector);
        // if (stillMissing.length > 0) console.log(`[waitForElements] 아직 대기 중... 못 찾은 요소: ${stillMissing.join(', ')}`);
      }
    }, 250); // 확인 간격 250ms
  });
}

/**
 * 코드 그룹 목록을 테이블에 렌더링합니다.
 * @param {object[]} groupsToRender - 렌더링할 코드 그룹 객체의 배열.
 */
function renderCodeGroupList(groupsToRender) {
    if (!dom.codeGroupTableBody) {
        console.error("[렌더링] 오류: 코드 그룹 테이블 본문 요소를 찾을 수 없습니다.");
        return;
    }

    try {
        dom.codeGroupTableBody.innerHTML = "";
        
        if (!groupsToRender || groupsToRender.length === 0) {
            dom.codeGroupTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="table__cell--empty">
                        표시할 코드 그룹이 없습니다.
                    </td>
                </tr>
            `;
            return;
        }

        groupsToRender.forEach(group => {
            const row = document.createElement('tr');
            row.className = "table__row";
            row.dataset.groupId = group.id;
            row.innerHTML = `
                <td class="table__cell">${group.id || ''}</td>
                <td class="table__cell">${group.name || ''}</td>
                <td class="table__cell">${group.usage === '1' ? '사용' : '미사용'}</td>
                <td class="table__cell">${group.registrant || ''}</td>
                <td class="table__cell">${group.registrationDate || ''}</td>
            `;
            row.addEventListener('click', () => selectCodeGroup(group.id));
            dom.codeGroupTableBody.appendChild(row);
        });
    } catch (error) {
        console.error("[렌더링] 오류:", error);
        dom.codeGroupTableBody.innerHTML = '<tr><td colspan="5" class="table__cell--error">데이터 렌더링 중 오류가 발생했습니다.</td></tr>';
    }
}

/**
 * 지정된 ID의 코드 그룹을 선택하고 상세 정보를 표시합니다.
 * @param {string} groupId - 선택할 코드 그룹의 ID.
 */
function selectCodeGroup(groupId) {
    state.selectedCodeGroup = state.codeGroups.find(g => g.id === groupId) || null;
    console.info(`[선택] 코드 그룹 ID: ${state.selectedCodeGroup?.id}`);
    renderCodeGroupDetail(); // 상세 정보 렌더링 호출

    // dom.codeGroupTableBody가 유효할 때만 실행
    if (dom.codeGroupTableBody) {
        Array.from(dom.codeGroupTableBody.querySelectorAll('.table__row')).forEach(row => {
            row.classList.toggle('table__row--selected', row.dataset.groupId === groupId);
        });
    } else {
        console.warn("[선택] 코드 그룹 테이블 본문(dom.codeGroupTableBody)이 없어 선택 상태 UI 업데이트를 건너<0xEB><0><0x8E>니다.");
    }
}

/**
 * 현재 선택된 코드 그룹의 상세 정보를 화면에 렌더링합니다.
 */
function renderCodeGroupDetail() {
    if (!state.selectedCodeGroup) {
        // 선택된 그룹이 없으면 상세 정보 영역 숨기기 또는 초기화
        if (dom.codeDetailContainer) {
            dom.codeDetailContainer.style.display = 'none';
        }
        // 모든 입력 필드 비활성화 및 초기화
        if (dom.detailGroupIdInput) { dom.detailGroupIdInput.value = ""; dom.detailGroupIdInput.disabled = true; }
        if (dom.detailGroupNameInput) { dom.detailGroupNameInput.value = ""; dom.detailGroupNameInput.disabled = true; }
        if (dom.detailDescriptionTextarea) { dom.detailDescriptionTextarea.value = ""; dom.detailDescriptionTextarea.disabled = true; }
        if (dom.detailStatusRadios.length > 0) {
            dom.detailStatusRadios.forEach(radio => { radio.checked = false; radio.disabled = true; });
        }
        if (dom.detailSubCodeTableBody) dom.detailSubCodeTableBody.innerHTML = '<tr><td colspan="4" class="table__cell--empty">코드 그룹을 선택하세요.</td></tr>';
        if (dom.codeDetailEditButton) dom.codeDetailEditButton.disabled = true;
        if (dom.detailAddSubCodeButton) dom.detailAddSubCodeButton.disabled = true;
        return;
    }

    // 선택된 그룹이 있으면 상세 정보 표시
    if (dom.codeDetailContainer) {
        dom.codeDetailContainer.style.display = ''; // 또는 'block' 등, CSS에 따라
    }

    const group = state.selectedCodeGroup;
    if (dom.detailGroupIdInput) dom.detailGroupIdInput.value = group.id || "";
    if (dom.detailGroupNameInput) dom.detailGroupNameInput.value = group.name || "";
    if (dom.detailDescriptionTextarea) dom.detailDescriptionTextarea.value = group.description || "";
    if (dom.detailStatusRadios.length > 0) {
        dom.detailStatusRadios.forEach(radio => radio.checked = radio.value === group.usage);
    }
    renderSubCodeList(group.codes || []); // 하위 코드 목록 렌더링
}

/**
 * 주어진 하위 코드 목록을 테이블에 렌더링합니다.
 * @param {object[]} codes - 렌더링할 하위 코드 객체의 배열.
 */
function renderSubCodeList(codes) {
    if (!dom.detailSubCodeTableBody) return;

    dom.detailSubCodeTableBody.innerHTML = "";
    if (!codes || codes.length === 0) {
        dom.detailSubCodeTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="table__cell--empty">
                    하위 코드가 없습니다.
                </td>
            </tr>`;
        return;
    }

    codes.forEach(code => {
        const row = document.createElement('tr');
        row.className = "table__row";
        row.innerHTML = `
            <td class="table__cell">${code.id}</td>
            <td class="table__cell">${code.name || ''}</td>
            <td class="table__cell">${code.usage === '1' ? '사용' : '미사용'}</td>
            <td class="table__cell">
                <button class="button button--secondary button--xsmall" data-action="view-sub-code" data-code-id="${code.id}">
                    보기
                </button>
            </td>
        `;
        dom.detailSubCodeTableBody.appendChild(row);
    });
}

/**
 * 지정된 ID의 하위 코드 상세 정보를 모달로 표시합니다.
 * @param {string} codeId - 상세 정보를 볼 하위 코드의 ID.
 */
function viewSubCodeDetail(codeId) {
    // DialogManager 인스턴스가 전역에 있는지 확인
    const dialogManager = window.dialogManager;
    if (!dialogManager) {
        console.error("[상세] 하위 코드: DialogManager 인스턴스를 찾을 수 없습니다.");
        alert("모달 기능을 사용할 수 없습니다. 페이지 초기화 오류를 확인해주세요.");
        return;
    }

    if (!state.selectedCodeGroup || !state.selectedCodeGroup.codes) {
        // 사용자에게 알림 (좀 더 부드럽게)
        console.warn("[상세] 하위 코드: 상위 코드 그룹 또는 하위 코드가 선택되지 않았습니다.");
        dialogManager.open('alert', { title: '알림', message: '상위 코드 그룹 또는 하위 코드가 선택되지 않았습니다.' });
        return;
    }
    const subCode = state.selectedCodeGroup.codes.find(c => c.id === codeId);
    if (subCode) {
        // dialogTemplates.js의 codeDetail 템플릿 사용
        const dialogData = {
            group_id: state.selectedCodeGroup.id,
            group_name: state.selectedCodeGroup.name,
            id: subCode.id,
            name: subCode.name,
            description: subCode.description || '', // 설명이 없을 수도 있으니 기본값 처리
            usage: subCode.usage,
            parent: subCode.parent || '', // 하위 코드의 parent 정보가 있다면 사용, 없으면 빈 문자열
            dialogWidth: "700px", 
        };
        
        //dialogData.dialogWidth = '500px'; // 모달 너비 설정

        dialogManager.open('codeDetail', dialogData);
    } else {
        alert("해당 ID의 하위 코드를 찾을 수 없습니다.");
    }
}

/**
 * 현재 선택된 코드 그룹의 하위 코드 목록을 새로고침합니다. (API 연동 필요)
 */
async function refreshSubCodes() {
    if (!state.selectedCodeGroup) return;
    
    try {
        // API 호출로 최신 하위 코드 목록 조회
        // TODO: 실제 API 엔드포인트 및 호출 로직 구현 필요
        // const response = await fetch(`/api/code-groups/${state.selectedCodeGroup.id}/sub-codes`);
        // if (!response.ok) throw new Error('하위 코드 조회 실패');
        // const subCodes = await response.json();
        
        // 임시 데이터 사용 (API 연동 전까지)
        const subCodes = state.selectedCodeGroup.codes; // 현재 상태의 하위 코드 사용
        
        state.selectedCodeGroup.codes = subCodes; // API 응답에 따라 codes 또는 subCodes
        
        updateSubCodeList();
    } catch (error) {
        console.error('[오류] 하위 코드 새로고침:', error);
        alert('하위 코드 목록을 새로고침하는데 실패했습니다.');
    }
}

/**
 * 하위 코드 목록 UI를 업데이트합니다.
 * (주: 현재 `renderSubCodeList`와 기능이 유사하여 통합 고려 가능)
 */
function updateSubCodeList() {
    if (!dom.detailSubCodeTableBody || !state.selectedCodeGroup?.codes) return; // codes로 변경
    
    dom.detailSubCodeTableBody.innerHTML = state.selectedCodeGroup.codes.map(code => `
        <tr class="table__row" data-sub-code-id="${code.id}">
            <td class="table__cell">${code.id}</td>
            <td class="table__cell">${code.name}</td>
            <td class="table__cell">${code.usage === '1' ? '사용' : '미사용'}</td>
            <td class="table__cell">
                <button class="button button--secondary button--xsmall" data-action="view-sub-code" data-code-id="${code.id}">상세</button>
            </td>
        </tr>
    `).join('');
}

/**
 * 현재 선택된 코드 그룹에 새로운 하위 코드를 추가하기 위한 모달을 엽니다.
 */
function addSubCode() {
     // DialogManager 인스턴스가 전역에 있는지 확인
     const dialogManager = window.dialogManager;
     if (!dialogManager) {
         console.error("[추가] 하위 코드: DialogManager 인스턴스를 찾을 수 없습니다.");
         alert("모달 기능을 사용할 수 없습니다. 페이지 초기화 오류를 확인해주세요.");
         return;
     }

    if (!state.selectedCodeGroup) {
        alert("코드를 추가할 상위 코드 그룹을 먼저 선택해주세요.");
        return;
    }
    dialogManager.open('codeCreate', {
        group_id: state.selectedCodeGroup.id,
        group_name: state.selectedCodeGroup.name
    });
}

/**
 * 현재 설정된 필터 조건과 검색어를 기반으로 코드 그룹 목록을 필터링하고 UI를 업데이트합니다.
 */
function applyFiltersAndSearch() {
    console.groupCollapsed('[필터링] 검색 및 필터 적용');
    const searchTerm = dom.searchInput?.value?.toLowerCase() || '';
    const activeSearchConditions = getActiveSearchConditions(); // 어떤 컬럼을 검색할지
    const includeDisabled = dom.searchFilterCheckboxes.displayDisabled?.checked;

    console.info(`[필터링 정보] 검색어: '${searchTerm}', 활성 조건:`, activeSearchConditions, `미사용 포함: ${includeDisabled}`);

    const filteredGroups = state.codeGroups.filter(group => {
        // 미사용 포함 필터
        // "미사용 포함"이 체크 안 됐을 때만, usage가 '0' (미사용)인 그룹을 제외
        if (!includeDisabled && group.usage === '0') { 
            // console.debug(`[applyFiltersAndSearch] 그룹 '${group.id}': 미사용 필터에 의해 제외됨.`); // 상세 로그
            return false;
        }

        // 검색어 필터
        if (searchTerm) {
            let matchesSearchTerm = false;
            const searchInAll = activeSearchConditions.all;
            const searchInGroupId = activeSearchConditions.groupId;
            const searchInGroupName = activeSearchConditions.groupName;
            const searchInCodeId = activeSearchConditions.codeId;
            const searchInCodeName = activeSearchConditions.codeName;

            // 검색 대상 필드 결정: '전체'가 체크되었거나 해당 필드 체크박스가 개별적으로 체크된 경우
            const shouldSearchGroupId = searchInAll || searchInGroupId;
            const shouldSearchGroupName = searchInAll || searchInGroupName;
            const shouldSearchCodeId = searchInAll || searchInCodeId;
            const shouldSearchCodeName = searchInAll || searchInCodeName;

            // 결정된 필드에서 검색 실행
            // 각 조건에서 매치되면 matchesSearchTerm = true로 설정하고 더 이상 검사할 필요 없음
            if (shouldSearchGroupId && group.id && group.id.toLowerCase().includes(searchTerm)) {
                 matchesSearchTerm = true;
            }
            // 이전 조건에서 이미 매치되지 않았을 경우에만 다음 조건 검사
            if (!matchesSearchTerm && shouldSearchGroupName && group.name && group.name.toLowerCase().includes(searchTerm)) {
                 matchesSearchTerm = true;
            }
            // 코드 ID, 코드명 검색은 group.codes 배열 내부를 순회
            if (!matchesSearchTerm && shouldSearchCodeId && group.codes && Array.isArray(group.codes)) {
                if (group.codes.some(code => code.id && code.id.toLowerCase().includes(searchTerm))) matchesSearchTerm = true;
            }
            if (!matchesSearchTerm && shouldSearchCodeName && group.codes && Array.isArray(group.codes)) {
                if (group.codes.some(code => code.name && code.name.toLowerCase().includes(searchTerm))) matchesSearchTerm = true;
            }
            
            // 검색어가 있지만, 선택된 어떤 필드에서도 검색어를 찾지 못했다면 해당 그룹 제외
            if (!matchesSearchTerm) return false; 
        }
        // 모든 필터를 통과한 경우 true 반환
        return true;
    });

    console.info(`[필터링 결과] 원본 그룹 수: ${state.codeGroups.length}, 필터링 후 그룹 수: ${filteredGroups.length}`);
    console.groupEnd();
    
    renderCodeGroupList(filteredGroups); // 필터링된 목록으로 UI 업데이트
}

/**
 * 현재 활성화된 검색 조건(체크박스 상태)을 객체 형태로 반환합니다.
 * @returns {object} 각 검색 조건 필드의 활성화 여부를 나타내는 객체.
 */
function getActiveSearchConditions() {
    if (!dom.searchFilterCheckboxesContainer) return {};
    const conditions = {};
    for (const key in dom.searchFilterCheckboxes) {
        // dom.searchFilterCheckboxes[key]가 유효한 DOM 요소이고 체크박스인지 확인
        const checkbox = dom.searchFilterCheckboxes[key];
        if (checkbox && checkbox.type === 'checkbox') {
            conditions[key] = checkbox.checked;
        } else {
             // console.warn(`[조건 확인] 유효하지 않은 체크박스: ${key}`);
        }
    }
    return conditions;
}

// Dialog 콜백 업데이트
// DialogManager 인스턴스가 전역에 있다고 가정
if (window.dialogManager) {
    window.dialogManager.setSubmitCallback((dialogType, formData) => {
        console.info(`[Dialog 제출] 유형: ${dialogType}, 데이터:`, formData);
        
        if (dialogType === 'codeGroupCreate') {
            const newGroup = {
                ...formData,
                // TODO: 실제 API 호출로 ID, 등록자, 등록일 등 받아오기
                id: `GRP-${Date.now().toString().slice(-6)}`, // 임시 ID 생성
                registrant: '현재사용자', // 임시 등록자
                registrationDate: new Date().toISOString().split('T')[0], // 임시 등록일
                codes: [] // 새 그룹은 하위 코드가 비어있음
            };
            state.codeGroups.push(newGroup);
            applyFiltersAndSearch(); // 필터/검색 상태 유지하며 목록 업데이트
            selectCodeGroup(newGroup.id); // 새로 추가된 그룹 선택
            alert('새 코드 그룹이 등록되었습니다!');
        } 
        else if (dialogType === 'codeGroupUpdate' && state.selectedCodeGroup) {
            // TODO: 실제 API 호출로 수정 반영
            // Object.assign(state.selectedCodeGroup, formData); // API 응답으로 상태 업데이트 필요
            
            // 임시: 현재 상태 직접 업데이트
            const updatedGroupIndex = state.codeGroups.findIndex(g => g.id === state.selectedCodeGroup.id);
            if (updatedGroupIndex !== -1) {
                 state.codeGroups[updatedGroupIndex] = {
                     ...state.codeGroups[updatedGroupIndex], // 기존 속성 유지
                     ...formData // 폼 데이터로 덮어쓰기
                 };
                 state.selectedCodeGroup = state.codeGroups[updatedGroupIndex]; // 선택된 그룹 참조 업데이트
            }

            applyFiltersAndSearch(); // 필터/검색 상태 유지하며 목록 업데이트
            renderCodeGroupDetail(); // 상세 정보 다시 렌더링
            alert('코드 그룹 정보가 수정되었습니다!'); 
        }
        else if (dialogType === 'codeCreate' && state.selectedCodeGroup) {
             // TODO: 실제 API 호출로 코드 추가 및 ID 받아오기
            const newCode = {
                ...formData,
                id: `CODE-${Date.now().toString().slice(-6)}` // 임시 ID 생성
            };
            state.selectedCodeGroup.codes.push(newCode);
            renderSubCodeList(state.selectedCodeGroup.codes); // 하위 코드 목록 다시 렌더링
            alert('새 코드가 추가되었습니다!');
        }
        else if (dialogType === 'codeUpdate' && state.selectedCodeGroup) {
            // TODO: 실제 API 호출로 코드 수정 반영
            const codeIndex = state.selectedCodeGroup.codes.findIndex(c => c.id === formData.id);
            if (codeIndex >= 0) {
                state.selectedCodeGroup.codes[codeIndex] = {...state.selectedCodeGroup.codes[codeIndex], ...formData}; // 기존 속성 유지하며 덮어쓰기
                renderSubCodeList(state.selectedCodeGroup.codes); // 하위 코드 목록 다시 렌더링
                alert('코드 정보가 수정되었습니다!');
            } else {
                console.warn(`[Dialog 제출 오류] 코드 수정: 코드 그룹(${state.selectedCodeGroup.id})에서 코드 ID(${formData.id})를 찾을 수 없습니다.`);
                alert('코드 수정에 실패했습니다. 해당 코드를 찾을 수 없습니다.');
            }
        }
        // TODO: 다른 dialogType (예: codeDetail 보기 모달의 수정 버튼) 처리 추가
    });
} else {
    console.error("[code-group.js] DialogManager 인스턴스(window.dialogManager)를 찾을 수 없습니다. 모달 기능이 작동하지 않습니다.");
}


/**
 * 페이지 내 주요 DOM 요소들에 대한 이벤트 리스너를 초기화하고 바인딩합니다.
 */
function initializeEventListeners() {
    // 검색 관련 이벤트
    if (dom.searchInput) {
        dom.searchInput.addEventListener('input', () => {
            // 입력 중에는 바로 필터링 (선택사항, 성능 고려)
            applyFiltersAndSearch();
        });
    }

    if (dom.searchButton) {
        dom.searchButton.addEventListener('click', () => {
            applyFiltersAndSearch(); // 버튼 클릭 시 필터링
        });
    }

    // --- 검색 조건 체크박스 이벤트 리스너 ---
    const allCheckbox = dom.searchFilterCheckboxes.all;
    const displayDisabledCheckbox = dom.searchFilterCheckboxes.displayDisabled;
    
    // "전체" 체크박스를 제외한 모든 개별 검색 조건 체크박스 목록
    const individualSearchConditionCheckboxes = [
        dom.searchFilterCheckboxes.groupId,
        dom.searchFilterCheckboxes.groupName,
        dom.searchFilterCheckboxes.codeId,
        dom.searchFilterCheckboxes.codeName,
    ].filter(cb => cb); // 존재하지 않는 요소 필터링

    // "전체" 체크박스에 의해 상태가 토글될 모든 체크박스 목록 (개별 검색 조건 + 미사용 포함)
    const allTogglableCheckboxes = [
        ...individualSearchConditionCheckboxes,
        displayDisabledCheckbox // 미사용 포함 체크박스 추가
    ].filter(cb => cb); // 존재하지 않는 요소 필터링

    // 1. "전체" 체크박스 이벤트 리스너
    if (allCheckbox) {
        console.debug(`[이벤트 리스너] "전체" 체크박스(#all) 추가.`);
        allCheckbox.addEventListener('change', () => {
            const isAllChecked = allCheckbox.checked;
            console.info(`[이벤트] "전체" 체크박스: ${isAllChecked ? '선택됨' : '해제됨'}. 다른 필터 상태 동기화.`);
            
            // "전체" 변경 시, "전체" 체크박스 자신을 제외한 모든 토글 대상 체크박스 상태 변경
            allTogglableCheckboxes.forEach(cb => {
                 if (cb !== allCheckbox) { // "전체" 체크박스 자신은 제외
                    cb.checked = isAllChecked;
                 }
            });
            applyFiltersAndSearch(); // 필터 다시 적용
        });
    }

    // 2. 개별 검색 조건 체크박스들 이벤트 리스너 (미사용 포함 포함)
    allTogglableCheckboxes.forEach(checkbox => {
        // "전체" 체크박스 자신에게는 이 리스너를 붙이지 않음
        if (checkbox && checkbox !== allCheckbox) {
            console.debug(`[이벤트 리스너] 개별 필터 체크박스(#${checkbox.id}) 추가.`);
            checkbox.addEventListener('change', () => {
                if (allCheckbox) {
                    // 모든 토글 대상 체크박스(미사용 포함 포함)가 선택되었는지 확인
                    const allTogglableSelected = allTogglableCheckboxes.every(cb => cb.checked);
                    
                    // "전체" 체크박스의 현재 상태와 모든 개별 체크박스의 상태 일치 여부 확인
                    if (allCheckbox.checked !== allTogglableSelected) {
                        allCheckbox.checked = allTogglableSelected;
                        console.info(`[이벤트] 개별 필터(#${checkbox.id}): "전체" 체크박스 상태 업데이트됨 (${allTogglableSelected ? '선택' : '해제'}).`);
                    }
                }
                applyFiltersAndSearch(); // 필터 다시 적용
            });
        }
    });
    // --- 검색 조건 체크박스 이벤트 리스너 끝 ---

    // 코드그룹 추가 버튼
    if (dom.addCodeGroupButton) {
        dom.addCodeGroupButton.addEventListener('click', () => {
             // DialogManager 인스턴스가 전역에 있는지 확인
             const dialogManager = window.dialogManager;
             if (!dialogManager) {
                 console.error("[Dialog 오류] 코드 그룹 추가: DialogManager 없음.");
                 alert("모달 기능을 사용할 수 없습니다. 페이지 초기화 오류를 확인해주세요.");
                 return;
             }
            dialogManager.open('codeGroupCreate');
        });
    }

    // 코드그룹 상세 편집 버튼
    if (dom.codeDetailEditButton) {
        dom.codeDetailEditButton.addEventListener('click', () => {
             // DialogManager 인스턴스가 전역에 있는지 확인
             const dialogManager = window.dialogManager;
             if (!dialogManager) {
                 console.error("[Dialog 오류] 코드 그룹 편집: DialogManager 없음.");
                 alert("모달 기능을 사용할 수 없습니다. 페이지 초기화 오류를 확인해주세요.");
                 return;
             }

            if (!state.selectedCodeGroup) {
                alert('편집할 코드 그룹을 선택해주세요.');
                return;
            }
            // codeGroupUpdate 템플릿에 현재 선택된 그룹 데이터 전달
            dialogManager.open('codeGroupUpdate', state.selectedCodeGroup);
            // TODO: 편집 모달이 열리면 상세 정보 필드들의 disabled 속성을 해제해야 함.
            // 모달 닫힐 때 다시 disabled 처리 필요.
        });
    }

    // 하위 코드 추가 버튼
    if (dom.detailAddSubCodeButton) {
        dom.detailAddSubCodeButton.addEventListener('click', addSubCode);
    }

    // 하위 코드 상세 보기 버튼들 (이벤트 위임)
    if (dom.detailSubCodeTableBody) {
        dom.detailSubCodeTableBody.addEventListener('click', (e) => {
            const viewButton = e.target.closest('[data-action="view-sub-code"]');
            if (viewButton) {
                const codeId = viewButton.dataset.codeId;
                viewSubCodeDetail(codeId);
            }
        });
    }

    // 엔터키로 검색 실행
    if (dom.searchInput) {
        dom.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // 폼 제출 방지
                applyFiltersAndSearch();
            }
        });
    }
}

/**
 * DialogManager를 사용하여 페이지의 주요 패널들(리스트, 상세)의 내용을 렌더링합니다.
 * 각 패널의 내용은 <form> 태그로 감싸져 #*-content-wrapper 내부에 생성됩니다.
 */
async function renderPanelsUsingDialogManager() {
    console.info('[패널 렌더링] DialogManager.renderFormInContainer 사용하여 시작');
    const dialogManager = window.dialogManager;
    if (!dialogManager || typeof dialogManager.renderFormInContainer !== 'function') {
        console.error("[패널 렌더링 오류] DialogManager 또는 renderFormInContainer 사용 불가.");
        throw new Error("DialogManager 또는 renderFormInContainer를 사용할 수 없습니다.");
    }

    const listPanelContentWrapper = document.getElementById('list-panel-content-wrapper');
    const detailPanelContentWrapper = document.getElementById('detail-panel-content-wrapper');

    if (!listPanelContentWrapper || !detailPanelContentWrapper) {
        console.error("[패널 렌더링 오류] 패널 컨텐츠 래퍼 요소를 찾을 수 없습니다.");
        throw new Error("패널 컨텐츠 래퍼 요소를 찾을 수 없습니다 (#list-panel-content-wrapper 또는 #detail-panel-content-wrapper).");
    }

    try {
        // renderFormInContainer는 컨테이너 내부에 <form>을 생성하고 그 안에 template의 fields를 렌더링합니다.
        // 반환값은 폼 제어 객체이지만, 여기서는 당장 사용하지 않습니다.
        dialogManager.renderLayoutBlocks(listPanelContentWrapper, panelTemplates.listPanel.fields);
        console.info('[패널 렌더링] 리스트 패널 컨텐츠 생성 완료 (renderLayoutBlocks 사용).');

        dialogManager.renderLayoutBlocks(detailPanelContentWrapper, panelTemplates.detailPanel.fields);
        console.info('[패널 렌더링] 상세 패널 컨텐츠 생성 완료 (renderLayoutBlocks 사용).');

        // 상세 패널은 초기에 숨김 처리 (detail-panel 클래스가 있는 <aside> 태그를 숨김)
        const detailPanelAside = document.querySelector('.detail-panel');
        if (detailPanelAside) {
            detailPanelAside.style.display = 'none';
        } else {
            console.warn('[패널 렌더링] 상세 패널 <aside class="detail-panel"> 요소를 찾지 못해 숨김 처리 불가.');
        }
        console.info('[패널 렌더링] DialogManager.renderLayoutBlocks 사용하여 완료.');
    } catch (error) {
        console.error('[패널 렌더링 오류] renderFormInContainer 실행 중:', error);
        throw error; // 초기화 실패로 이어지도록 오류 다시 던지기
    }
}

/**
 * 코드 그룹 관리 페이지의 초기화 로직을 수행합니다.
 * DOM 요소 대기, DOM 요소 참조 초기화, 이벤트 리스너 등록, 초기 데이터 로드를 포함합니다.
 */
export async function initializePage() {
    console.info(`[페이지 초기화] 시작: code-group.js (${window.location.pathname})`);
    // 이 페이지가 정상 작동하기 위해 "반드시" 먼저 존재해야 하는 핵심 DOM 요소들의 셀렉터 목록
    // 패널 컨텐츠 래퍼와 검색 관련 요소들을 먼저 기다립니다.
    const initialCriticalSelectors = [
        '.search-panel__input',             // dom.searchInput
        '#list-panel-content-wrapper',      // 리스트 패널 내용이 들어갈 컨테이너
        '#detail-panel-content-wrapper',    // 상세 패널 내용이 들어갈 컨테이너
        '.search-panel__filter-options',    // dom.searchFilterCheckboxesContainer
        '#all', '#groupId', '#groupName', '#codeId', '#codeName', '#displayDisabled' // 각 체크박스 ID
    ];

    try {
        console.debug(`[DOM 대기] 필수 요소 확인 시작: ${window.location.pathname}`);
        await waitForElements(initialCriticalSelectors, 10000); // 대기 시간 10초
        console.debug(`[DOM 대기] 완료: 모든 필수 DOM 요소 확인됨 (${window.location.pathname}).`);

        // DialogManager를 사용하여 패널 컨텐츠 렌더링
        await renderPanelsUsingDialogManager();

        // 패널 컨텐츠가 렌더링된 후, 그 내부의 핵심 요소들을 기다립니다.
        // DialogManager가 <form>을 생성하므로, form 내부의 요소를 기다려야 합니다.
        const panelInternalCriticalSelectors = [
            '#list-panel-content-wrapper .list-panel__table-body', // 'form' 제거
            '#list-panel-content-wrapper .list-panel__add-button', // 'form' 제거
            // '.detail-panel'은 <aside> 태그 자체이므로 이미 initialCriticalSelectors에서 확인됨.
            '#detail-panel-content-wrapper .detail-panel__edit-button', // 'form' 제거
            '#detail-panel-content-wrapper .detail-panel__group-id', // 'form' 제거
            '#detail-panel-content-wrapper .sub-item-list__add-button', // 'form' 제거
            '#detail-panel-content-wrapper .sub-item-list__table-body', // 'form' 제거
        ];
        console.debug(`[DOM 대기] 패널 내부 요소 확인 시작: ${window.location.pathname}`);
        await waitForElements(panelInternalCriticalSelectors, 5000); // 내부 요소 대기 시간 5초
        console.debug(`[DOM 대기] 완료: 모든 패널 내부 필수 DOM 요소 확인됨 (${window.location.pathname}).`);

        // DOM 요소 초기화
        initializeDomElements();
        
        // 이벤트 리스너 등록
        // initializeDomElements 이후에 호출되어야 dom 객체가 채워져 있음.
        initializeEventListeners();
        
        // 초기 데이터 로드
        await loadInitialData();
        
        state.initialized = true;
        console.info('[페이지 초기화] 완료: 코드 그룹 관리.');
    } catch (error) {
        console.error('[초기화 오류] 치명적:', error);
        // 사용자에게 알림 (실제 운영 환경에서는 좀 더 세련된 방식 고려)
        const contentContainer = document.getElementById('content-container');
        if (contentContainer) contentContainer.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">페이지를 초기화하는 중 문제가 발생했습니다. 관리자에게 문의하거나 잠시 후 다시 시도해주세요. (오류: ${error.message})</p>`;
        alert('페이지 초기화에 실패했습니다. 페이지를 새로고침해주세요.');
    }
}

/**
 * 페이지에서 사용될 주요 DOM 요소들에 대한 참조를 `dom` 객체에 초기화합니다.
 */
function initializeDomElements() {
    // 검색 관련
    dom.searchInput = document.querySelector('.search-panel__input');
    dom.searchButton = document.querySelector('.search-panel__button');
    dom.searchFilterCheckboxesContainer = document.querySelector('.search-panel__filter-options');
    if (dom.searchFilterCheckboxesContainer) {
        dom.searchFilterCheckboxes.all = dom.searchFilterCheckboxesContainer.querySelector('#all');
        dom.searchFilterCheckboxes.groupId = dom.searchFilterCheckboxesContainer.querySelector('#groupId');
        dom.searchFilterCheckboxes.groupName = dom.searchFilterCheckboxesContainer.querySelector('#groupName');
        dom.searchFilterCheckboxes.codeId = dom.searchFilterCheckboxesContainer.querySelector('#codeId');
        dom.searchFilterCheckboxes.codeName = dom.searchFilterCheckboxesContainer.querySelector('#codeName');
        dom.searchFilterCheckboxes.displayDisabled = dom.searchFilterCheckboxesContainer.querySelector('#displayDisabled');
    }

    // DialogManager가 #list-panel-content-wrapper 내부에 <form>을 생성하고,
    // 그 <form> 내부에 panelTemplates.listPanel의 customHtml 내용이 들어갑니다.
    // 이제 <form>이 없으므로, '#list-panel-content-wrapper .실제클래스명' 형태로 찾습니다.
    // 코드 그룹 테이블
    const listPanelWrapper = document.getElementById('list-panel-content-wrapper');
    dom.codeGroupTableBody = listPanelWrapper ? listPanelWrapper.querySelector('.list-panel__table-body') : null;
    dom.addCodeGroupButton = listPanelWrapper ? listPanelWrapper.querySelector('.list-panel__add-button') : null;
    
    // 상세 정보 관련
    // dom.codeDetailContainer는 <aside class="detail-panel"> 자체를 가리키도록 유지 (표시/숨김 제어용)
    dom.codeDetailContainer = document.querySelector('.detail-panel'); 
    
    const detailPanelWrapper = document.getElementById('detail-panel-content-wrapper');
    dom.codeDetailEditButton = detailPanelWrapper ? detailPanelWrapper.querySelector('.detail-panel__edit-button') : null;
    dom.detailGroupIdInput = detailPanelWrapper ? detailPanelWrapper.querySelector('.detail-panel__group-id') : null;
    dom.detailGroupNameInput = detailPanelWrapper ? detailPanelWrapper.querySelector('.detail-panel__group-name') : null;
    dom.detailDescriptionTextarea = detailPanelWrapper ? detailPanelWrapper.querySelector('.detail-panel__description') : null;
    dom.detailStatusRadios = detailPanelWrapper ? Array.from(detailPanelWrapper.querySelectorAll('.detail-panel__status-radio')) : [];
    
    // 하위 코드 관련
    dom.detailAddSubCodeButton = detailPanelWrapper ? detailPanelWrapper.querySelector('.sub-item-list__add-button') : null;
    dom.detailSubCodeTableBody = detailPanelWrapper ? detailPanelWrapper.querySelector('.sub-item-list__table-body') : null;
    
    // DOM 요소 검증: waitForElements로 인해 criticalSelectors에 명시된 요소들은 존재해야 함.
    // 패널 내부 요소들은 renderPanelsUsingDialogManager 이후에 찾아야 하므로, 여기서 null일 경우 경고.
    if (!dom.searchInput) console.warn('[DOM 요소 누락] 검색 입력 필드(.search-panel__input)');
    if (!dom.searchButton) console.warn('[DOM 요소 누락] 검색 버튼(.search-panel__button)');
    if (!dom.searchFilterCheckboxesContainer) console.warn('[DOM 요소 누락] 검색 필터 체크박스 컨테이너(.search-panel__filter-options)');

    // 패널 내부 요소들에 대한 검증
    if (!listPanelWrapper) console.warn('[DOM 요소 누락] 리스트 패널 래퍼 (#list-panel-content-wrapper). HTML 구조 확인 필요.');
    if (!dom.codeGroupTableBody) console.warn('[DOM 요소 누락] 코드 그룹 테이블 본문(.list-panel__table-body). 패널 렌더링 확인 필요.');
    if (!dom.addCodeGroupButton) console.warn('[DOM 요소 누락] 코드 그룹 추가 버튼(.list-panel__add-button). 패널 렌더링 확인 필요.');
    
    if (!dom.codeDetailContainer) console.warn('[DOM 요소 누락] 코드 상세 정보 컨테이너(.detail-panel)');
    if (!detailPanelWrapper) console.warn('[DOM 요소 누락] 상세 패널 래퍼 (#detail-panel-content-wrapper). HTML 구조 확인 필요.');
    if (!dom.codeDetailEditButton) console.warn('[DOM 요소 누락] 코드 상세 편집 버튼(.detail-panel__edit-button). 패널 렌더링 확인 필요.');
    if (!dom.detailGroupIdInput) console.warn('[DOM 요소 누락] 상세 정보 - 코드그룹 ID 입력 필드(.detail-panel__group-id). 패널 렌더링 확인 필요.');
    if (!dom.detailGroupNameInput) console.warn('[DOM 요소 누락] 상세 정보 - 코드그룹 이름 입력 필드(.detail-panel__group-name). 패널 렌더링 확인 필요.');
    if (!dom.detailDescriptionTextarea) console.warn('[DOM 요소 누락] 상세 정보 - 코드그룹 설명 텍스트에어리어(.detail-panel__description). 패널 렌더링 확인 필요.');
    if (dom.detailStatusRadios.length === 0 && detailPanelWrapper) console.warn('[DOM 요소 누락] 상세 정보 - 상태 라디오 버튼(.detail-panel__status-radio). 패널 렌더링 확인 필요.');
    if (!dom.detailAddSubCodeButton) console.warn('[DOM 요소 누락] 하위 코드 추가 버튼(.sub-item-list__add-button). 패널 렌더링 확인 필요.');
    if (!dom.detailSubCodeTableBody) console.warn('[DOM 요소 누락] 하위 코드 테이블 본문(.sub-item-list__table-body). 패널 렌더링 확인 필요.');

    // 체크박스 개별 검증
    if (!dom.searchFilterCheckboxes.all) console.warn('[DOM 요소 누락] 검색 필터 체크박스 #all');
    if (!dom.searchFilterCheckboxes.groupId) console.warn('[DOM 요소 누락] 검색 필터 체크박스 #groupId');
    if (!dom.searchFilterCheckboxes.groupName) console.warn('[DOM 요소 누락] 검색 필터 체크박스 #groupName');
    if (!dom.searchFilterCheckboxes.codeId) console.warn('[DOM 요소 누락] 검색 필터 체크박스 #codeId');
    if (!dom.searchFilterCheckboxes.codeName) console.warn('[DOM 요소 누락] 검색 필터 체크박스 #codeName');
    if (!dom.searchFilterCheckboxes.displayDisabled) console.warn('[DOM 요소 누락] 검색 필터 체크박스 #displayDisabled');
}


/**
 * (개발용) 코드 그룹 목록을 가져오는 API 호출을 시뮬레이션합니다.
 * @async
 * @returns {Promise<Array<object>>} 코드 그룹 목록 데이터.
 */
async function fetchCodeGroupsAPI() {
    console.info('[API 호출 시뮬레이션] 코드 그룹 목록 조회 시작');
    // --- 실제 API 호출 로직 (시작) ---
    // try {
    //   const response = await fetch('/api/code-groups'); // 실제 API 엔드포인트
    //   if (!response.ok) {
    //     throw new Error(`[API 오류] 코드 그룹 목록 조회 실패: ${response.status} ${response.statusText}`);
    //   }
    //   const data = await response.json();
    //   console.info('[API 호출 시뮬레이션] 코드 그룹 목록 조회 성공:', data);
    //   return data;
    // } catch (error) {
    //   console.error(error.message);
    //   throw error; // 오류를 다시 던져서 loadInitialData에서 처리하도록 함
    // }
    // --- 실제 API 호출 로직 (끝) ---

    // 개발용 임시 데이터 (위 실제 API 호출 로직 사용 시 이 부분은 주석 처리 또는 삭제)
    console.warn('[API 호출 시뮬레이션] 개발용 임시 데이터를 사용합니다.');
    await new Promise(resolve => setTimeout(resolve, 300)); // API 호출 시간 시뮬레이션
    return mockCodeGroups; // 하단에 정의된 mockCodeGroups 사용
}

/**
 * 페이지에 필요한 초기 데이터를 로드합니다. (현재는 개발용 임시 데이터 사용)
 * 데이터 로드 후, 코드 그룹 목록을 렌더링하고 초기 필터 상태를 설정합니다.
 */
async function loadInitialData() {
    try {
        // API(시뮬레이션)를 통해 코드 그룹 목록 데이터 로드
        state.codeGroups = await fetchCodeGroupsAPI();
        
        // 초기 데이터 로드 후 첫 번째 항목 자동 선택 및 필터 초기 상태 설정
        // renderCodeGroupList는 dom.codeGroupTableBody가 설정된 후에 호출되어야 함.
        // initializeDomElements가 이미 호출되었으므로 dom.codeGroupTableBody는 유효해야 함.
        renderCodeGroupList(state.codeGroups);
        if (state.codeGroups.length > 0) {
            selectCodeGroup(state.codeGroups[0].id);
        }

        // ✨ 페이지 로드 시 "전체" 체크박스를 기본으로 체크하고, 다른 모든 체크박스도 활성화
        //    이벤트 리스너가 이미 바인딩된 상태에서 실행되어야 함.
        if (dom.searchFilterCheckboxes.all) {
            dom.searchFilterCheckboxes.all.checked = true;
            // "전체" 체크박스의 change 이벤트를 수동으로 트리거하여 다른 체크박스 상태 업데이트 및 필터 적용
            dom.searchFilterCheckboxes.all.dispatchEvent(new Event('change'));
             console.info('[초기 상태] "전체" 체크박스: 기본 선택 및 이벤트 트리거.');
        } else {
             console.warn('[초기 상태 경고] "전체" 체크박스: 요소 없음, 기본 설정 건너뜀.');
        }


    } catch (error) {
        console.error('[데이터 로드 오류] 초기 데이터:', error);
        throw error;
    } // finally 블록은 필요시 추가
}

// 개발용 임시 데이터 (실제 API 연동 시 이 부분은 삭제하거나 주석 처리)
const mockCodeGroups = [
    {
        id: 'GRP001',
        name: '사용자 유형',
        description: '시스템 사용자 유형 분류',
        usage: '1', // '1': 사용, '0': 미사용
        registrant: '관리자',
        registrationDate: '2024-01-15',
        codes: [
            { id: 'USR001', name: '일반 사용자', description: '기본 기능을 사용하는 사용자', usage: '1' },
            { id: 'USR002', name: '관리자', description: '시스템 관리 권한을 가진 사용자', usage: '1' },
            { id: 'USR003', name: '게스트', description: '제한된 접근 권한을 가진 사용자', usage: '0' }
        ]
    },
    {
        id: 'GRP002',
        name: '문서 상태',
        description: '문서의 현재 처리 상태',
        usage: '1',
        registrant: '김철수',
        registrationDate: '2024-02-20',
        codes: [
            { id: 'DOC001', name: '작성중', description: '문서가 편집 중인 상태', usage: '1' },
            { id: 'DOC002', name: '검토 대기', description: '검토를 기다리는 상태', usage: '1' },
            { id: 'DOC003', name: '승인 완료', description: '최종 승인된 상태', usage: '1' },
            { id: 'DOC004', name: '반려', description: '검토 또는 승인이 거부된 상태', usage: '1' }
        ]
    },
    {
        id: 'GRP003',
        name: '결제 수단',
        description: '온라인 결제 시 사용 가능한 수단',
        usage: '0', // 미사용 그룹 예시
        registrant: '이영희',
        registrationDate: '2023-12-01',
        codes: [
            { id: 'PAY001', name: '신용카드', description: '국내 및 해외 신용카드', usage: '1' },
            { id: 'PAY002', name: '계좌이체', description: '실시간 계좌이체', usage: '1' }
        ]
    }
];

/**
 * 데이터 바인딩 예시:
 * 1. 서버 데이터 로드: `loadInitialData` -> `fetchCodeGroupsAPI` (또는 mockCodeGroups)를 통해 `state.codeGroups`에 전체 데이터 저장.
 * 2. 목록 렌더링: `renderCodeGroupList(state.codeGroups)` 함수는 `state.codeGroups` 데이터를 기반으로
 *    `dom.codeGroupTableBody` (panelTemplates.listPanel에 정의된 tbody) 내부에 HTML 행(<tr>)들을 동적으로 생성하여 채워 넣음.
 *    각 행에는 `data-group-id` 속성을 부여하고, 클릭 시 `selectCodeGroup` 함수 호출.
 * 3. 상세 정보 렌더링: `selectCodeGroup(groupId)` 함수는 `state.codeGroups`에서 해당 ID의 그룹을 찾아 `state.selectedCodeGroup`에 저장.
 *    `renderCodeGroupDetail()` 함수는 `state.selectedCodeGroup` 데이터를 사용하여
 *    `dom.detailGroupIdInput`, `dom.detailGroupNameInput` 등 (panelTemplates.detailPanel에 정의된 입력 필드들)의 `value`를 설정.
 *    하위 코드 목록은 `renderSubCodeList(state.selectedCodeGroup.codes)`를 통해
 *    `dom.detailSubCodeTableBody` (panelTemplates.detailPanel에 정의된 하위 코드 테이블의 tbody)를 채움.
 * 4. DialogManager를 통한 데이터 처리: 'codeGroupCreate', 'codeGroupUpdate' 등의 모달에서 사용자가 입력한 데이터(formData)는
 *    `dialogManager.setSubmitCallback`에 등록된 콜백 함수로 전달됨. 이 콜백 함수 내에서 `state.codeGroups`를 업데이트하고,
 *    `applyFiltersAndSearch()` (내부적으로 `renderCodeGroupList` 호출) 및 `renderCodeGroupDetail()`을 호출하여 UI를 다시 그림.
 */
