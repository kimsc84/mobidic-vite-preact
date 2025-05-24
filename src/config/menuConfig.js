/**
 * @fileoverview 사이드바 메뉴 구성을 정의하는 파일입니다.
 * 1뎁스 주 메뉴, 2~5뎁스 드로워 메뉴 데이터를 포함하며,
 * 리포트 아이템의 경로를 일괄적으로 변환하는 로직도 포함합니다.
 */

/**
 * @typedef {object} QuickMenuItemConfig 퀵메뉴 아이템 설정을 정의합니다.
 * @property {string} iconId - SVG 스프라이트 내 아이콘 ID (예: 'icon-user-line').
 * @property {string} ariaLabel - 아이콘의 접근성을 위한 ARIA 레이블.
 * @property {string} [href] - 클릭 시 이동할 URL 경로 (예: '/profile/settings').
 * @property {function(MouseEvent): void} [onClick] - 클릭 시 실행할 사용자 정의 콜백 함수.
 * @property {QuickMenuSubItemConfig[]} [subItems] - 이 아이템에 속한 하위 메뉴 목록 (퀵메뉴 전용).
 */

/**
 * @typedef {object} QuickMenuSubItemConfig 퀵메뉴 하위 아이템 설정을 정의합니다.
 * @property {string} text - 하위 메뉴에 표시될 텍스트.
 * @property {string} [iconId] - (선택) SVG 스프라이트 내 아이콘 ID.
 * @property {string} [href] - 클릭 시 이동할 URL 경로 (정규화된 형태).
 * @property {function(MouseEvent): void} [onClick] - 클릭 시 실행할 사용자 정의 콜백 함수.
 */

export const menuConfig = [
  {
    id: 'total-info',
    title: '기금 총괄정보', // text -> title
    path: '/',
    drawerItemsKey: 'fundOverview', // 👈 이 1뎁스 메뉴에 연결될 2뎁스 메뉴 그룹 키
    // onClick: () => { console.log('기금 총괄정보 클릭'); }
  },
  {
    id: 'daily-monthly',
    title: '일보 / 월보', // text -> title
    drawerItemsKey: 'reports', // 👈 예시: 'reports' 키를 사용하는 2뎁스 그룹
  },
  {
    id: 'performance-analysis',
    title: '실적현황 / 분석', // text -> title
    drawerItemsKey: 'performanceAnalysis', // 2뎁스 없으면 생략 가능
  },
  {
    id: 'sales-search',
    title: '영업점 자료검색', // text -> title
    drawerItemsKey: 'salesSearch',
  },
  {
    id: 'evaluation',
    title: '경영평가', // text -> title
    drawerItemsKey: 'evaluation',
  },
  {
    id: 'data-status',
    title: '데이터 보유현황', // text -> title
    drawerItemsKey: 'dataManagement', // 👈 예시: 'dataManagement' 키
  },
  {
    id: 'analysis-platform',
    title: '분석 플랫폼', // text -> title 변경
    drawerItemsKey: 'analysisPlatform', // 👈 'performanceAnalysis'에서 'analysisPlatform'으로 변경 (중복 방지)
  },
  {
    id: 'admin-common-fields',
    title: '공통 필드 테스트', // text -> title 변경
    onClick: () => {
      // 이 메뉴는 2뎁스 드로어를 열지 않고 바로 다이얼로그를 띄우므로 drawerItemsKey 불필요
      if (window.globalShowDialog) { // Changed from window.dialogManager
        window.globalShowDialog('commonField', {}); // Changed to new function call
      } else {
        console.error('[메뉴 클릭 오류] globalShowDialog function not found.'); // Updated error message
      }
    }
  }
];

// --- 퀵메뉴 데이터 정의 (sidebar.js에서 이동) ---
/** @type {QuickMenuItemConfig[]} 사이드바 상단에 표시될 퀵메뉴 아이템 목록입니다. */
export const quickMenuItemsData = [
  { iconId: 'icon-user-line', ariaLabel: '', href: 'icon-user' },
  { iconId: 'icon-community', ariaLabel: '커뮤니티', title: '커뮤니티', // 퀵메뉴도 title 추가 (일관성)
    subItems: [
      { text: '공지사항', href: '/boards/notice' }, // QuickMenuSubItemConfig는 text 유지
      { text: '지식공유', href: '/boards/knowledge' }, // QuickMenuSubItemConfig는 text 유지
    ] },
  { iconId: 'icon-admin', ariaLabel: '시스템 설정', title: '시스템 설정', // 퀵메뉴도 title 추가
    subItems: [
      { text: '코드 관리', href: '/admin/code-group' }, // QuickMenuSubItemConfig는 text 유지
      { text: '메뉴 관리', href: '/admin/menu-management' }, // QuickMenuSubItemConfig는 text 유지
      { text: '권한 관리', href: '/admin/authorization' },
      { text: '시스템 설정', href: '/admin/system' },
    ]
  }
];

export default menuConfig; // 1뎁스 메뉴는 default export 유지

/**
 * 메뉴 아이템이 폴더가 아니고 실제 리포트 페이지를 가리킬 경우,
 * 해당 아이템의 `href` 속성을 `/common/report-iframe` 경로로 변환하고,
 * 원본 경로와 제목을 쿼리 파라미터로 추가함.
 * 변경: 이제 `id`와 `title`을 사용하여 쿼리 파라미터를 생성함.
 * 이는 모든 리포트 페이지를 공통 iframe 래퍼를 통해 로드하기 위함임.
 *
 * @param {DrawerMenuItemConfig} item - 변환할 메뉴 아이템 객체.
 * @returns {DrawerMenuItemConfig} 원본 메뉴 아이템 객체 (필요시 `href` 속성이 수정됨).
 */
export function transformReportItemHref(item) { // 서버데이터 가공... 지금은 iconId를 reportType으로 변환하지만 실제 백엔드 사용시 반대 경우로 써야 함 SC
  // 폴더가 아니고, id와 title이 있으며, 아직 report-iframe 경로로 변환되지 않은 경우
  if (item.iconId !== 'icon-folder' && item.id && item.title && (!item.href || !item.href.startsWith('/common/report-iframe?'))) {
    const originalHref = item.href; 

    // --- 리포트 타입 결정 로직 ---
    // 설명: item.iconId의 접두사를 기반으로 리포트 타입을 결정함.
    // 향후 새로운 리포트 타입이 추가될 경우, reportTypePrefixMapping 객체에 추가하여 쉽게 확장 가능.
    const reportTypePrefixMapping = {
      'icon-oz': 'oz', 
      'icon-py': 'py', 
      'icon-re': 'report', 
      'icon-da': 'dashboard',
      'icon-do': 'dossier',      // 예시: 'DASH_': 'dashboard', // 대시보드 타입 추가 시 여기에 정의
    };

    let determinedReportType = 'report'; // 매칭되는 접두사 없을 시 기본값: 'report'
    
    for (const prefix in reportTypePrefixMapping) {
      if (item.iconId.startsWith(prefix)) {
        determinedReportType = reportTypePrefixMapping[prefix];
        break; // 일치하는 첫 번째 타입으로 결정하고 루프 종료
      }
    }
    const reportType = determinedReportType; // 최종 결정된 리포트 타입
    // 참고: 현재 이 'reportType' 변수는 아래 newHref 생성 시 사용되지 않고 있음.
    // 만약 URL에 리포트 타입을 포함시키려면, newHref 문자열에 '&type=${reportType}' 등을 추가해야 함.
    const newHref = `/common/report-iframe?type=${reportType}&id=${item.id}&title=${encodeURIComponent(item.title)}&originalPath=${encodeURIComponent(originalHref || '')}`; // originalPath는 리포트 부르는 방식에 따라 필요할수도 있을것 같아서 남겨둠 SC
    
    item.href = newHref;
  }
  return item;
}

// --- 2~5뎁스 메뉴 데이터 (sidebar.js에서 이동) ---
/**
 * @typedef {object} DrawerMenuItemConfig
 * @property {string} iconId - SVG 스프라이트 내 아이콘 ID.
 *    폴더 아이템은 'icon-folder' 사용.
 * @property {string} title - 메뉴 텍스트.
 * @property {string} [id] - 메뉴 아이템의 고유 ID (리프 노드에 필요).
 * @property {string} [href] - 클릭 시 이동할 경로 (예: '/admin/user-management')
 *    리프 노드의 경우 `transformReportItemHref`에 의해 동적으로 생성되거나, 폴더의 경우 하위 메뉴를 열기 위한 키로 사용됨.
 * @property {function} [onClick] - 클릭 시 실행할 커스텀 함수
 */

/**
 * @typedef {Object.<string, DrawerMenuItemConfig[]>} DrawerMenuGroups
 * @description 2뎁스 메뉴 그룹 데이터.
 * 각 키는 `menuConfig`의 1뎁스 메뉴 아이템 `drawerItemsKey` 값과 일치해야 하며,
 * 값은 해당 1뎁스 메뉴 클릭 시 표시될 {@link DrawerMenuItemConfig} 배열임.
 * 모든 리프 노드(폴더가 아닌 메뉴 아이템)는 `transformReportItemHref` 함수를 통해 `href`가 변환됨.
 */
/** @type {DrawerMenuGroups} 2뎁스 메뉴 그룹 데이터 */
export const drawerMenuGroupsData = {
  // 예시: 'fundOverview' 키는 '기금 총괄정보' 1뎁스 메뉴에 연결됨
  // 중요: 폴더가 아닌 리프 메뉴 아이템들은 이제 'id'와 'title'을 가져야 하며, 'href'는 transformReportItemHref 함수가 생성해줌.
  // 기존 'text'는 'title'로 변경.
  fundOverview: [
    { iconId: 'icon-dashboard', id: 'B19DEDCC11D4E0EFC000EB9495D0F44F', title: '종합 현황 대시보드' }, // href는 transformReportItemHref가 생성
    { iconId: 'icon-report', id: 'DAILY_FUND_REPORT_01', title: '일일 기금 보고서' },
    { iconId: 'icon-folder', title: '기금 관련 문서함', href: '/fund/overview/document-folder' }, // 폴더는 href 유지
    { iconId: 'icon-oz-report', id: 'OZ_FUND_DETAIL_003', title: '기금 상세 Oz 리포트' },
    { iconId: 'icon-python', id: 'PY_FUND_ANALYSIS_004', title: 'Python 기반 기금 분석' },
    { iconId: 'icon-report', id: 'MONTHLY_PERF_RPT_005', title: '월간 성과 보고' },
    { iconId: 'icon-dashboard', id: 'RISK_MGMT_DASH_006', title: '리스크 관리 현황판' },
    { iconId: 'icon-folder', title: '투자 포트폴리오', href: '/fund/overview/investment-portfolio' },
    { iconId: 'icon-oz-report', id: 'OZ_RETURNS_RPT_007', title: '수익률 Oz 보고서' },
    { iconId: 'icon-report', id: 'QUARTERLY_OPS_RPT_008', title: '분기별 운영 보고' },
    { iconId: 'icon-dashboard', id: 'ASSET_ALLOC_DASH_009', title: '자산 배분 대시보드' },
    { iconId: 'icon-python', id: 'PY_MARKET_FORECAST_010', title: '시장 예측 모델 (Python)' },
    { iconId: 'icon-folder', title: '감사 자료 폴더', href: '/fund/overview/audit-documents' },
    { iconId: 'icon-report', id: 'ANNUAL_CLOSING_RPT_011', title: '연간 기금 결산 보고서' },
    { iconId: 'icon-oz-report', id: 'OZ_SPECIAL_AUDIT_012', title: '특별 감사 Oz 리포트' },
    { iconId: 'icon-dashboard', id: 'LIQUIDITY_DASH_013', title: '유동성 관리 대시보드' },
  ].map(transformReportItemHref),
  reports: [
    { iconId: 'icon-report', id: 'DAILY_WORK_RPT_01', title: '일일 업무 보고' },
    { iconId: 'icon-report', id: 'WEEKLY_PERF_RPT_02', title: '주간 실적 보고' },
    { iconId: 'icon-report', id: 'MONTHLY_CLOSING_RPT_03', title: '월간 결산 보고서' },
    { iconId: 'icon-folder', title: '보고서 템플릿', href: '/reports/templates' }, // 폴더
    { iconId: 'icon-oz-report', id: 'REGULAR_OZ_RPT_04', title: '정기 Oz 보고서' },
    { iconId: 'icon-dashboard', id: 'REPORT_STATS_DASH_05', title: '보고서 통계' },
    { iconId: 'icon-folder', title: '지난 보고서 보관함', href: '/reports/archive' }, // 폴더
  ].map(transformReportItemHref),
  dataManagement: [
    { iconId: 'icon-dashboard', id: 'DB_STATUS_DASH_01', title: '데이터베이스 현황' },
    { iconId: 'icon-folder', title: '데이터 분류 폴더', href: '/data/status/categories' }, // 폴더
    { iconId: 'icon-report', id: 'DATA_QUALITY_RPT_02', title: '데이터 품질 보고서' },
    { iconId: 'icon-dashboard', id: 'DATA_USAGE_DASH_03', title: '데이터 사용량 대시보드' },
    { iconId: 'icon-python', id: 'DATA_CATALOG_SEARCH_04', title: '데이터 카탈로그 검색' },
    { iconId: 'icon-report', id: 'DATA_HISTORY_RPT_05', title: '데이터 변경 이력' },
  ].map(transformReportItemHref),
  performanceAnalysis: [
    { iconId: 'icon-dashboard', id: 'PERF_MAIN_DASH_01', title: '종합 실적 대시보드' },
    { iconId: 'icon-report', id: 'PERF_DEPT_RPT_02', title: '부서별 실적 보고서' },
    { iconId: 'icon-folder', title: '분석 자료 모음', href: '/performance/analysis-docs' }, // 폴더
    { iconId: 'icon-oz-report', id: 'PERF_OZ_RPT_03', title: '실적 관련 Oz 리포트' },
    { iconId: 'icon-python', id: 'PERF_TREND_ANALYSIS_04', title: '추세 분석' },
    { iconId: 'icon-oz-report', id: 'PERF_TARGET_VS_ACTUAL_05', title: '목표 대비 실적' },
  ].map(transformReportItemHref),
  analysisPlatform: [ // 'analysis-platform' 1뎁스 메뉴에 대한 2뎁스 데이터 (새로 추가 또는 내용 채우기)
    // 예시: { iconId: 'icon-dashboard', id: 'AP_DASH_01', title: '플랫폼 개요 대시보드' },
    //       { iconId: 'icon-folder', title: '플랫폼 도구', href: '/analysis-platform/tools' },
    // 현재는 비워두거나, 필요한 메뉴 항목 추가
  ].map(transformReportItemHref),
  salesSearch: [
    { iconId: 'icon-folder', title: '영업점 문서함', href: '/sales/docs/branch-docs' }, // 폴더
    { iconId: 'icon-report', id: 'SALES_DAILY_RPT_01', title: '일일 영업 보고' },
    { iconId: 'icon-python', id: 'SALES_CUSTOMER_SEARCH_02', title: '고객 정보 검색' },
    { iconId: 'icon-dashboard', id: 'SALES_BRANCH_LOC_03', title: '영업점 위치' },
    { iconId: 'icon-oz-report', id: 'SALES_OZ_RPT_04', title: '영업점 Oz 리포트' },
    { iconId: 'icon-dashboard', id: 'SALES_PERF_DASH_05', title: '영업 실적 현황판' },
  ].map(transformReportItemHref),
  evaluation: [ // '경영평가' 1뎁스 메뉴에 해당
    { iconId: 'icon-report', id: 'EVAL_2023_RESULTS_01', title: '2023년 경영평가 결과' },
    { iconId: 'icon-folder', title: '평가 지표 관리', href: '/evaluation/indicators' }, // 폴더
    { iconId: 'icon-oz-report', id: 'EVAL_DEPT_OZ_RPT_02', title: '부서별 평가 Oz 리포트' },
    { iconId: 'icon-dashboard', id: 'EVAL_PROGRESS_DASH_03', title: '평가 진행 현황' },
    { iconId: 'icon-python', id: 'EVAL_DATA_ANALYSIS_PY_04', title: '평가 데이터 분석 (Py)' },
    { iconId: 'icon-folder', title: '과거 평가 자료', href: '/evaluation/archive' }, // 폴더
  ].map(transformReportItemHref),
};

/**
 * @typedef {Object.<string, DrawerMenuItemConfig[]>} SubDrawerMenuGroups
 * @description 3뎁스 메뉴 그룹 데이터.
 * 각 키는 2뎁스 메뉴 중 폴더 아이템의 `href` 값과 일치해야 하며 (정규화된 경로),
 * 값은 해당 2뎁스 폴더 클릭 시 표시될 {@link DrawerMenuItemConfig} 배열임.
 * 모든 리프 노드는 `transformReportItemHref` 함수를 통해 `href`가 변환됨.
 */ // Note: transformReportItemHref mutates the original array items.
/** @type {SubDrawerMenuGroups} */
export const subDrawerMenuGroupsData = {
  // 예시: '/fund/overview/document-folder' 키는 '기금 관련 문서함' 2뎁스 폴더 메뉴에 연결됨
  '/fund/overview/document-folder': [
    { iconId: 'icon-report', id: 'DOCS_INTERNAL_AUDIT_01', title: '내부 감사 자료' },
    { iconId: 'icon-report', id: 'DOCS_EXTERNAL_REPORTS_02', title: '외부 제출 보고서' },
    { iconId: 'icon-folder', title: '성과 평가 폴더', href: '/fund/overview/docs/performance-reviews' }, // 폴더
  ].map(transformReportItemHref),
  '/fund/overview/audit-documents': [
    { iconId: 'icon-report', id: 'AUDIT_2023_REPORT_01', title: '2023년 감사 보고서' },
    { iconId: 'icon-report', id: 'AUDIT_LEGAL_DOCS_02', title: '관련 법규 문서' },
    { iconId: 'icon-python', id: 'AUDIT_AUTO_SCRIPTS_03', title: '감사 자동화 스크립트' },
  ].map(transformReportItemHref),
  '/fund/overview/investment-portfolio': [
    { iconId: 'icon-dashboard', id: 'PORT_STOCKS_DASH_01', title: '주식 포트폴리오 현황' },
    { iconId: 'icon-dashboard', id: 'PORT_BONDS_DASH_02', title: '채권 포트폴리오 현황' },
    { iconId: 'icon-oz-report', id: 'PORT_ALT_OZ_RPT_03', title: '대체 투자 Oz 보고서' },
  ].map(transformReportItemHref),
  '/reports/templates': [
    { iconId: 'icon-report', id: 'TPL_WORD_01', title: '워드 템플릿' },
    { iconId: 'icon-report', id: 'TPL_EXCEL_02', title: '엑셀 템플릿' },
    { iconId: 'icon-oz-report', id: 'TPL_PPT_OZ_03', title: 'PPT 템플릿 (Oz)' },
  ].map(transformReportItemHref),
  '/data/status/categories': [ // This seems to be a duplicate of /reports/templates, check if intended
    { iconId: 'icon-report', id: 'CAT_TPL_WORD_01', title: '워드 템플릿 (카테고리)' }, // ID 및 title 수정하여 구분
    { iconId: 'icon-report', id: 'CAT_TPL_EXCEL_02', title: '엑셀 템플릿 (카테고리)' },
    { iconId: 'icon-oz-report', id: 'CAT_TPL_PPT_OZ_03', title: 'PPT 템플릿 (Oz, 카테고리)' },
  ].map(transformReportItemHref),
  '/reports/archive': [
    { iconId: 'icon-folder', title: '2023년 보고서', href: '/reports/archive/2023' }, // 폴더
    { iconId: 'icon-folder', title: '2022년 보고서', href: '/reports/archive/2022' }, // 폴더
    { iconId: 'icon-python', id: 'ARCHIVE_SEARCH_TOOL_01', title: '보고서 검색 도구' },
  ].map(transformReportItemHref),
  '/performance/analysis-docs': [
    { iconId: 'icon-report', id: 'ANALYSIS_2023_H1_01', title: '2023년 상반기 분석' },
    { iconId: 'icon-report', id: 'ANALYSIS_2023_H2_02', title: '2023년 하반기 분석' },
    { iconId: 'icon-oz-report', id: 'ANALYSIS_2024_Q1_OZ_03', title: '2024년 1분기 Oz 분석' },
    { iconId: 'icon-python', id: 'ANALYSIS_COMPETITOR_PY_04', title: '경쟁사 분석 (Python)' },
    { iconId: 'icon-folder', title: '과거 자료', href: '/performance/analysis/archive' }, // 폴더
  ].map(transformReportItemHref),
  '/sales/docs/branch-docs': [
    { iconId: 'icon-folder', title: '서울', href: '/sales/docs/seoul-report' }, // 폴더
    { iconId: 'icon-folder', title: '부산', href: '/sales/docs/busan-report' }, // 폴더
    { iconId: 'icon-folder', title: '인천', href: '/sales/docs/incheon-report' }, // 폴더
  ], // 폴더 자체는 변환 안 함. 하위 항목이 있다면 걔네는 변환 대상.
  '/evaluation/strategy-docs': [
    { iconId: 'icon-report', id: 'STRATEGY_MID_LONG_01', title: '중장기 전략 보고서' },
    { iconId: 'icon-oz-report', id: 'STRATEGY_KPI_OZ_02', title: 'KPI 설정 Oz 문서' },
    { iconId: 'icon-dashboard', id: 'STRATEGY_EXEC_DASH_03', title: '전략 실행 현황판' },
  ].map(transformReportItemHref),
  '/evaluation/methodology': [
    { iconId: 'icon-report', id: 'METHOD_QUANT_01', title: '정량 평가 기준' },
    { iconId: 'icon-report', id: 'METHOD_QUAL_02', title: '정성 평가 가이드라인' },
    { iconId: 'icon-python', id: 'METHOD_SIMULATOR_PY_03', title: '평가 점수 시뮬레이터 (Py)' },
  ].map(transformReportItemHref),
  '/evaluation/indicators': [ // '경영평가 > 평가 지표 관리'의 href
    { iconId: 'icon-report', id: 'INDICATORS_KPI_01', title: '핵심성과지표(KPI)' },
    { iconId: 'icon-oz-report', id: 'INDICATORS_WEIGHTS_OZ_02', title: '지표별 가중치 Oz' },
    { iconId: 'icon-folder', title: '지표 데이터 소스', href: '/evaluation/indicators/data-sources' }, // 폴더
  ].map(transformReportItemHref),
  '/evaluation/archive': [ // '경영평가 > 과거 평가 자료'의 href
    { iconId: 'icon-report', id: 'ARCHIVE_EVAL_2022_01', title: '2022년 경영평가 보고서' },
    { iconId: 'icon-report', id: 'ARCHIVE_EVAL_2021_02', title: '2021년 경영평가 보고서' },
  ].map(transformReportItemHref),
};

/**
 * @typedef {Object.<string, DrawerMenuItemConfig[]>} SubSubDrawerMenuGroups
 * @description 4뎁스 메뉴 그룹 데이터.
 * 각 키는 3뎁스 메뉴 중 폴더 아이템의 `href` 값과 일치해야 하며 (정규화된 경로),
 * 값은 해당 3뎁스 폴더 클릭 시 표시될 {@link DrawerMenuItemConfig} 배열임.
 * 모든 리프 노드는 `transformReportItemHref` 함수를 통해 `href`가 변환됨.
 */ // Note: transformReportItemHref mutates the original array items.
/** @type {SubSubDrawerMenuGroups} */
export const subSubDrawerMenuGroupsData = {
  '/fund/overview/docs/performance-reviews': [
    { iconId: 'icon-report', id: 'PERF_INDIVIDUAL_2023_01', title: '2023년 개인 평가' },
    { iconId: 'icon-folder', title: '2023년 팀 평가 상세', href: '/fund/overview/docs/perf/2023-team-details' }, // 폴더
  ].map(transformReportItemHref),
  '/reports/archive/2023': [
    { iconId: 'icon-folder', title: '1분기 보고서 상세', href: '/reports/archive/2023/q1-details' }, // 폴더
    { iconId: 'icon-report', id: 'ARCHIVE_2023_Q2_01', title: '2분기 보고서' },
    { iconId: 'icon-report', id: 'ARCHIVE_2023_Q3_02', title: '3분기 보고서' },
    { iconId: 'icon-report', id: 'ARCHIVE_2023_Q4_03', title: '4분기 보고서' },
  ].map(transformReportItemHref),
  '/evaluation/indicators/data-sources': [ // '경영평가 > 평가 지표 관리 > 지표 데이터 소스'의 href
    { iconId: 'icon-report', id: 'SOURCES_FINANCE_SYS_01', title: '재무 시스템 연동 현황' },
    { iconId: 'icon-report', id: 'SOURCES_HR_SYS_02', title: '인사 시스템 데이터' },
  ].map(transformReportItemHref),
};

/**
 * @typedef {Object.<string, DrawerMenuItemConfig[]>} SubSubSubDrawerMenuGroups
 * @description 5뎁스 메뉴 그룹 데이터.
 * 각 키는 4뎁스 메뉴 중 폴더 아이템의 `href` 값과 일치해야 하며 (정규화된 경로),
 * 값은 해당 4뎁스 폴더 클릭 시 표시될 {@link DrawerMenuItemConfig} 배열임.
 * 모든 리프 노드는 `transformReportItemHref` 함수를 통해 `href`가 변환됨.
 */ // Note: transformReportItemHref mutates the original array items.
/** @type {SubSubSubDrawerMenuGroups} */
export const subSubSubDrawerMenuGroupsData = {
  // 예시: '/fund/overview/docs/perf/2023-team-details' 키는 '2023년 팀 평가 상세' 4뎁스 폴더 메뉴에 연결됨
  '/fund/overview/docs/perf/2023-team-details': [
    { iconId: 'icon-report', id: 'TEAM_A_DETAIL_01', title: 'A팀 상세 평가' },
    { iconId: 'icon-report', id: 'TEAM_B_DETAIL_02', title: 'B팀 상세 평가' },
  ].map(transformReportItemHref),
  '/reports/archive/2023/q1-details': [
    { iconId: 'icon-report', id: 'Q1_JAN_DETAIL_01', title: '1월 상세 데이터' },
    { iconId: 'icon-report', id: 'Q1_FEB_DETAIL_02', title: '2월 상세 데이터' },
    { iconId: 'icon-report', id: 'Q1_MAR_DETAIL_03', title: '3월 상세 데이터' },
  ].map(transformReportItemHref),
};
