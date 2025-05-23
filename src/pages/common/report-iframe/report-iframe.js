/**
 * @file report-iframe.js
 * @description report-iframe.html 페이지의 동작을 담당.
 *              history.state로부터 리포트 경로와 제목을 받아 표시.
 */

/**
 * report-iframe 페이지를 초기화합니다.
 * history.state에서 reportTitle을 가져와 h3 태그로 표시하고,
 * reportPath를 콘솔에 로깅합니다. (향후 iframe src 등으로 활용 가능)
 * @exports initializePage
 */


/**
 * 임시 프롬프트 템플릿 정의.
 * 실제로는 menuConfig.js 등 외부 설정에서 가져와야 함.
 * 키는 리포트 제목(leaf.title)과 일치해야 함.
 * menuConfig.js의 2~5뎁스 모든 리프 노드들의 ID를 키로 사용.
 * @constant {object}
 */

/**
 * 주어진 리포트 ID에 대해 다양한 프롬프트 필드 세트를 생성합니다.
 * @param {string} reportId - 프롬프트 필드를 생성할 리포트의 ID.
 * @returns {Array<object>} 생성된 프롬프트 필드 정의 배열.
 */
function generateDiversePromptFields(reportId) {
  // reportId에서 특수문자를 제거하고, 너무 길 경우 잘라내어 안전한 접미사 생성
  const suffix = `_${reportId.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15)}`;
  const fields = [
    {
      label: "조회 기간 구분",
      id: `periodType${suffix}`,
      type: "select",
      shareWidth: Math.random() > 0.5 ? 25 : 30, // 25% or 30%
      options: [
        { value: "", text: "기간 선택" },
        { value: "daily", text: "일별" },
        { value: "weekly", text: "주별" },
        { value: "monthly", text: "월별" },
        { value: "quarterly", text: "분기별" },
        { value: "yearly", text: "연간" },
      ],
      required: true,
    },
    {
      label: '시작일',
      id: `startDate${suffix}`,
      type: 'date',
      required: true,
      shareWidth: Math.random() > 0.5 ? 25 : 30,
    },
    {
      label: '종료일',
      id: `endDate${suffix}`,
      type: 'date',
      required: Math.random() > 0.3, // 70% 확률로 필수
      shareWidth: Math.random() > 0.5 ? 25 : 30,
    },
    {
      label: "출력 형식",
      id: `outputFormat${suffix}`,
      type: "radio-group",
      shareWidth: 30,
      value: "pdf",
      options: [
        { value: "pdf", label: "PDF" },
        { value: "excel", label: "Excel" },
        { value: "csv", label: "CSV", disabled: Math.random() > 0.3 },
      ],
    },
    {
      label: "상세 수준",
      id: `detailLevel${suffix}`,
      type: "select",
      shareWidth: Math.random() > 0.5 ? 40 : 60,
      options: [
        { value: "summary", text: "요약" },
        { value: "detailed", text: "상세" },
        { value: "full", text: "전체 상세", disabled: Math.random() > 0.3 },
      ],
    },
    {
      label: "데이터 필터 (선택)",
      id: `dataFilter${suffix}`,
      type: "text",
      placeholder: "예: KRW, USD (선택 입력)",
      shareWidth: Math.random() > 0.5 ? 40 : 100,
    },
    {
      label: "추가 옵션",
      id: `extraOptions${suffix}`,
      type: "checkbox-group",
      shareWidth: 50,
      value: ["includeCharts"],
      required: false,
      options: [
        { value: "includeCharts", label: "차트 포함" },
        { value: "showTrendline", label: "추세선 표시" },
        { value: "anonymizeData", label: "데이터 익명화", disabled: Math.random() > 0.9 },
        { value: "exportRaw", label: "원본 데이터 내보내기" },
      ],
    },
  ];
  // 필드가 3개 이상일 경우, 랜덤하게 일부 필드의 shareWidth를 제거하여 flex-grow 테스트
  if (fields.length > 3 && Math.random() < 0.3) {
    const randomIndex = Math.floor(Math.random() * (fields.length -1)) + 1; // 첫 필드 제외
    delete fields[randomIndex].shareWidth;
  }
  return fields;
}

const promptTemplate = {
  "SAMPLE_REPORT_ID": [ // "샘플 리포트"에 대한 임시 ID
    {
      label: "기간 구분",
      id: "periodType",
      type: "select",
      shareWidth: 25, // 이 필드는 줄 너비의 25% 차지
      options: [
        { value: "", text: "기간 구분을 선택" },
        { value: "day", text: "일" },
        { value: "week", text: "주" },
        { value: "month", text: "월" },
        { value: "quater", text: "분기" },
        { value: "half", text: "반기", disabled: true },
        { value: "year", text: "년간" },
      ],
    },
    {
      label: '시작일',
      id: 'startDate',
      type: 'date',
      required: true,
      shareWidth: 25,
    },
    {
      label: '종료일',
      id: 'endDate',
      type: 'date',
      required: true,
      shareWidth: 25,
    },
    {
      id: "options_check", // label이 없는 경우
      label: "조회 옵션",
      type: "checkbox-group",
      // shareWidth가 없으면 flex: 1 적용 (남은 공간 차지)
      // 이 필드는 shareWidth가 없으므로 남은 25%를 차지하거나, 다른 shareWidth 없는 필드와 공간을 나눔
      value: ["weekly"], // 초기 선택값
      required: true,
      options: [
        { value: "daily", label: "일간 집계", disabled: true },
        { value: "weekly", label: "주간 집계" },
        { value: "monthly", label: "월간 집계" },
      ],
    },
    {
      label: "검색어",
      id: "searchTerm",
      type: "text",
      placeholder: "검색어를 입력하세요...",
      shareWidth: 100, // 한 줄 전체 차지
    }
  ],
  // --- menuConfig.js의 2~5뎁스 모든 리프 노드 ID에 대한 프롬프트 자동 생성 ---
  // 2뎁스 리프 노드
  "DAILY_FUND_REPORT_01": generateDiversePromptFields("DAILY_FUND_REPORT_01"),
  "OZ_FUND_DETAIL_003": generateDiversePromptFields("OZ_FUND_DETAIL_003"),
  "PY_FUND_ANALYSIS_004": generateDiversePromptFields("PY_FUND_ANALYSIS_004"),
  "MONTHLY_PERF_RPT_005": generateDiversePromptFields("MONTHLY_PERF_RPT_005"),
  "RISK_MGMT_DASH_006": generateDiversePromptFields("RISK_MGMT_DASH_006"),
  "OZ_RETURNS_RPT_007": generateDiversePromptFields("OZ_RETURNS_RPT_007"),
  "QUARTERLY_OPS_RPT_008": generateDiversePromptFields("QUARTERLY_OPS_RPT_008"),
  "ASSET_ALLOC_DASH_009": generateDiversePromptFields("ASSET_ALLOC_DASH_009"),
  "PY_MARKET_FORECAST_010": generateDiversePromptFields("PY_MARKET_FORECAST_010"),
  "ANNUAL_CLOSING_RPT_011": generateDiversePromptFields("ANNUAL_CLOSING_RPT_011"),
  "OZ_SPECIAL_AUDIT_012": generateDiversePromptFields("OZ_SPECIAL_AUDIT_012"),
  "LIQUIDITY_DASH_013": generateDiversePromptFields("LIQUIDITY_DASH_013"),
  "DAILY_WORK_RPT_01": generateDiversePromptFields("DAILY_WORK_RPT_01"),
  "WEEKLY_PERF_RPT_02": generateDiversePromptFields("WEEKLY_PERF_RPT_02"),
  "MONTHLY_CLOSING_RPT_03": generateDiversePromptFields("MONTHLY_CLOSING_RPT_03"),
  "REGULAR_OZ_RPT_04": generateDiversePromptFields("REGULAR_OZ_RPT_04"),
  "REPORT_STATS_DASH_05": generateDiversePromptFields("REPORT_STATS_DASH_05"),
  "DB_STATUS_DASH_01": generateDiversePromptFields("DB_STATUS_DASH_01"),
  "DATA_QUALITY_RPT_02": generateDiversePromptFields("DATA_QUALITY_RPT_02"),
  "DATA_USAGE_DASH_03": generateDiversePromptFields("DATA_USAGE_DASH_03"),
  "DATA_CATALOG_SEARCH_04": generateDiversePromptFields("DATA_CATALOG_SEARCH_04"),
  "DATA_HISTORY_RPT_05": generateDiversePromptFields("DATA_HISTORY_RPT_05"),
  "PERF_MAIN_DASH_01": generateDiversePromptFields("PERF_MAIN_DASH_01"),
  "PERF_DEPT_RPT_02": generateDiversePromptFields("PERF_DEPT_RPT_02"),
  "PERF_OZ_RPT_03": generateDiversePromptFields("PERF_OZ_RPT_03"),
  "PERF_TREND_ANALYSIS_04": generateDiversePromptFields("PERF_TREND_ANALYSIS_04"),
  "PERF_TARGET_VS_ACTUAL_05": generateDiversePromptFields("PERF_TARGET_VS_ACTUAL_05"),
  "SALES_DAILY_RPT_01": generateDiversePromptFields("SALES_DAILY_RPT_01"),
  "SALES_CUSTOMER_SEARCH_02": generateDiversePromptFields("SALES_CUSTOMER_SEARCH_02"),
  "SALES_BRANCH_LOC_03": generateDiversePromptFields("SALES_BRANCH_LOC_03"),
  "SALES_OZ_RPT_04": generateDiversePromptFields("SALES_OZ_RPT_04"),
  "SALES_PERF_DASH_05": generateDiversePromptFields("SALES_PERF_DASH_05"),
  "EVAL_2023_RESULTS_01": generateDiversePromptFields("EVAL_2023_RESULTS_01"),
  "EVAL_DEPT_OZ_RPT_02": generateDiversePromptFields("EVAL_DEPT_OZ_RPT_02"),
  "EVAL_PROGRESS_DASH_03": generateDiversePromptFields("EVAL_PROGRESS_DASH_03"),
  "EVAL_DATA_ANALYSIS_PY_04": generateDiversePromptFields("EVAL_DATA_ANALYSIS_PY_04"),

  // 3뎁스 리프 노드
  "DOCS_INTERNAL_AUDIT_01": generateDiversePromptFields("DOCS_INTERNAL_AUDIT_01"),
  "DOCS_EXTERNAL_REPORTS_02": generateDiversePromptFields("DOCS_EXTERNAL_REPORTS_02"),
  "AUDIT_2023_REPORT_01": generateDiversePromptFields("AUDIT_2023_REPORT_01"),
  "AUDIT_LEGAL_DOCS_02": generateDiversePromptFields("AUDIT_LEGAL_DOCS_02"),
  "AUDIT_AUTO_SCRIPTS_03": generateDiversePromptFields("AUDIT_AUTO_SCRIPTS_03"),
  "PORT_STOCKS_DASH_01": generateDiversePromptFields("PORT_STOCKS_DASH_01"),
  "PORT_BONDS_DASH_02": generateDiversePromptFields("PORT_BONDS_DASH_02"),
  "PORT_ALT_OZ_RPT_03": generateDiversePromptFields("PORT_ALT_OZ_RPT_03"),
  "TPL_WORD_01": generateDiversePromptFields("TPL_WORD_01"),
  "TPL_EXCEL_02": generateDiversePromptFields("TPL_EXCEL_02"),
  "TPL_PPT_OZ_03": generateDiversePromptFields("TPL_PPT_OZ_03"),
  "CAT_TPL_WORD_01": generateDiversePromptFields("CAT_TPL_WORD_01"),
  "CAT_TPL_EXCEL_02": generateDiversePromptFields("CAT_TPL_EXCEL_02"),
  "CAT_TPL_PPT_OZ_03": generateDiversePromptFields("CAT_TPL_PPT_OZ_03"),
  "ARCHIVE_SEARCH_TOOL_01": generateDiversePromptFields("ARCHIVE_SEARCH_TOOL_01"),
  "ANALYSIS_2023_H1_01": generateDiversePromptFields("ANALYSIS_2023_H1_01"),
  "ANALYSIS_2023_H2_02": generateDiversePromptFields("ANALYSIS_2023_H2_02"),
  "ANALYSIS_2024_Q1_OZ_03": generateDiversePromptFields("ANALYSIS_2024_Q1_OZ_03"),
  "ANALYSIS_COMPETITOR_PY_04": generateDiversePromptFields("ANALYSIS_COMPETITOR_PY_04"),
  "STRATEGY_MID_LONG_01": generateDiversePromptFields("STRATEGY_MID_LONG_01"),
  "STRATEGY_KPI_OZ_02": generateDiversePromptFields("STRATEGY_KPI_OZ_02"),
  "STRATEGY_EXEC_DASH_03": generateDiversePromptFields("STRATEGY_EXEC_DASH_03"),
  "METHOD_QUANT_01": generateDiversePromptFields("METHOD_QUANT_01"),
  "METHOD_QUAL_02": generateDiversePromptFields("METHOD_QUAL_02"),
  "METHOD_SIMULATOR_PY_03": generateDiversePromptFields("METHOD_SIMULATOR_PY_03"),
  "INDICATORS_KPI_01": generateDiversePromptFields("INDICATORS_KPI_01"),
  "INDICATORS_WEIGHTS_OZ_02": generateDiversePromptFields("INDICATORS_WEIGHTS_OZ_02"),
  "ARCHIVE_EVAL_2022_01": generateDiversePromptFields("ARCHIVE_EVAL_2022_01"),
  "ARCHIVE_EVAL_2021_02": generateDiversePromptFields("ARCHIVE_EVAL_2021_02"),

  // 4뎁스 리프 노드
  "PERF_INDIVIDUAL_2023_01": generateDiversePromptFields("PERF_INDIVIDUAL_2023_01"),
  "ARCHIVE_2023_Q2_01": generateDiversePromptFields("ARCHIVE_2023_Q2_01"),
  "ARCHIVE_2023_Q3_02": generateDiversePromptFields("ARCHIVE_2023_Q3_02"),
  "ARCHIVE_2023_Q4_03": generateDiversePromptFields("ARCHIVE_2023_Q4_03"),
  "SOURCES_FINANCE_SYS_01": generateDiversePromptFields("SOURCES_FINANCE_SYS_01"),
  "SOURCES_HR_SYS_02": generateDiversePromptFields("SOURCES_HR_SYS_02"),

  // 5뎁스 리프 노드
  "TEAM_A_DETAIL_01": generateDiversePromptFields("TEAM_A_DETAIL_01"),
  "TEAM_B_DETAIL_02": generateDiversePromptFields("TEAM_B_DETAIL_02"),
  "Q1_JAN_DETAIL_01": generateDiversePromptFields("Q1_JAN_DETAIL_01"),
  "Q1_FEB_DETAIL_02": generateDiversePromptFields("Q1_FEB_DETAIL_02"),
  "Q1_MAR_DETAIL_03": generateDiversePromptFields("Q1_MAR_DETAIL_03"),

  // 기존 B19DEDCC11D4E0EFC000EB9495D0F44F ("종합 현황 대시보드")는 위에서 자동 생성되므로,
  // 아래 수동 정의된 것은 덮어쓰이거나, 필요하다면 자동 생성 로직에서 제외하고 유지할 수 있습니다.
  // 여기서는 자동 생성된 것으로 대체된다고 가정합니다. (만약 수동 정의를 유지하고 싶다면,
  // generateDiversePromptFields 호출 전에 해당 ID를 체크하여 건너뛰도록 할 수 있습니다.)
  "B19DEDCC11D4E0EFC000EB9495D0F44F": [ // "종합 현황 대시보드"
    {
      label: "조회 기간",
      id: "periodType_fund_dashboard",
      type: "select",
      shareWidth: 20,
      options: [
        { value: "", text: "기간 선택" }, { value: "daily", text: "일별" }, { value: "weekly", text: "주별" }, { value: "monthly", text: "월별" }
      ],
      required: true,
    },
    {
      label: '시작일',
      id: 'startDate_fund_dashboard',
      type: 'date',
      required: true,
      shareWidth: 20,
    },
    {
      label: '종료일',
      id: 'endDate_fund_dashboard',
      type: 'date',
      required: true,
      shareWidth: 20,
    },
    {
      label: "통화",
      id: "currency_fund_dashboard",
      type: "radio-group",
      shareWidth: 40, // 나머지 40%
      value: "KRW",
      options: [
        { value: "KRW", label: "원화(KRW)" },
        { value: "USD", label: "달러(USD)" },
        { value: "EUR", label: "유로(EUR)", disabled: true },
      ],
    },
    {
      label: "주요 지표 필터",
      id: "indicator_filter_fund_dashboard",
      type: "text",
      placeholder: "예: 수익률, 거래량 (쉼표로 구분)",
      shareWidth: 60,
    },
    {
      label: "데이터 집계 방식",
      id: "aggregation_fund_dashboard",
      type: "select",
      shareWidth: 40,
      options: [
        { value: "sum", text: "합계" },
        { value: "avg", text: "평균" },
        { value: "max", text: "최대값" },
      ],
    },
    {
      label: "비교 대상 기간 (선택)",
      id: "comparison_period_fund_dashboard",
      type: "date-range",
      granularity: "month", // 월 단위로 비교
      shareWidth: 100,
    },
    {
      label: "추가 조회 옵션",
      id: "options_fund_dashboard",
      type: "checkbox-group",
      shareWidth: 100,
      value: ["showTrend", "includeForecast"],
      options: [
        { value: "showTrend", label: "추세선 표시" },
        { value: "includeForecast", label: "예측치 포함" },
        { value: "showDetails", label: "세부 항목 표시" },
        { value: "exportEnabled", label: "내보내기 허용", disabled: true },
      ],
      required: false,
    },
    {
      label: "보고서 설명 (선택)",
      id: "report_description_fund_dashboard",
      type: "textarea",
      placeholder: "이 보고서에 대한 간략한 설명을 입력하세요 (최대 200자).",
      shareWidth: 100,
      rows: 3,
    },
    {
      label: "알림 수신 설정",
      id: "notification_settings_fund_dashboard",
      type: "input-group",
      shareWidth: 100,
      items: [
        { type: "input", inputType: "email", id: "email", name: "email", placeholder: "알림 받을 이메일", style: "flex: 2;" },
        { type: "separator", text: "또는" },
        { type: "input", inputType: "tel", id: "phone", name: "phone", placeholder: "알림 받을 전화번호", style: "flex: 1.5;" },
        { type: "select", id: "frequency", name: "frequency", value: "daily", style: "flex: 1;", options: [{value: "daily", text: "매일"}, {value: "weekly", text: "매주"}] }
      ]
    },
  ],
}

/**
 * 프롬프트 필드 정의를 DialogManager가 이해할 수 있는 flexStyle로 변환합니다.
 * @param {Array<object>} fields - 원본 필드 정의 배열.
 * @returns {Array<object>} flexStyle이 추가된 필드 정의 배열.
 */
function transformPromptFields(fields) {
  if (!fields || !Array.isArray(fields)) return [];
  return fields.map(field => {
    const newField = { ...field };
    if (typeof field.shareWidth === 'number' && field.shareWidth > 0 && field.shareWidth <= 100) {
      newField.flexStyle = {
        'flex-grow': 0,
        'flex-shrink': 0,
        'flex-basis': `${field.shareWidth}%`
      };
    } else {
      // shareWidth가 없거나 유효하지 않으면, 다른 필드들과 공간을 동일하게 나눠 가짐
      newField.flexStyle = {
        'flex-grow': 1,
        'flex-shrink': 1,
        'flex-basis': '0%', // 또는 'auto'와 함께 min-width 설정
        'min-width': '120px' // 최소 너비, 필요에 따라 조절
      };
    }
    delete newField.shareWidth; // 원본 shareWidth 속성은 제거
    return newField;
  });
}

// prompt.html에서 사용할 수 있도록 주요 구성 요소 export
export { promptTemplate, generateDiversePromptFields, transformPromptFields };

export function initializePage() {
  console.log('[ReportIframe] 페이지 초기화 시작');

  const urlParams = new URLSearchParams(window.location.search);
  const reportId = urlParams.get('id'); // 리포트 ID 가져오기
  const titleFromQuery = urlParams.get('title');
  const originalPathFromQuery = urlParams.get('originalPath');

  const finalReportTitle = titleFromQuery || history.state?.reportTitle;

  if (document.title && finalReportTitle) {
    document.title = `${finalReportTitle} - 리포트`;
  }

  const iframeElement = document.getElementById('report-frame');
  let titleH3Element = null;

  if (finalReportTitle) {
    titleH3Element = document.createElement('h3');
    titleH3Element.className = 'report-title';
    titleH3Element.style.marginLeft = '1rem';
    titleH3Element.textContent = finalReportTitle;
    iframeElement?.before(titleH3Element);
    console.log(`[ReportIframe] 제목 설정: ${finalReportTitle}`);
  }

  // --- URL 파라미터 표시 로직 (기존 코드 유지) ---
  const paramsDisplayContainer = document.createElement('div');
  paramsDisplayContainer.className = 'report-parameters-display';
  paramsDisplayContainer.style.marginTop = '15px';
  paramsDisplayContainer.style.padding = '10px';
  paramsDisplayContainer.style.border = '1px dashed #ccc';
  paramsDisplayContainer.style.backgroundColor = '#f9f9f9';
  paramsDisplayContainer.style.fontSize = '0.9em'; // 기본값, 제목 옆에 붙을 때 오버라이드됨

  let paramString = '';
  // paramsContentDiv.style.whiteSpace = 'nowrap'; // 한 줄로 강제. 내용 길면 overflow 처리 필요
  // paramsContentDiv.style.overflow = 'hidden';
  // paramsContentDiv.style.textOverflow = 'ellipsis';
  if (urlParams.size > 0) {
    const paramEntries = [];
    for (const [key, value] of urlParams) {
      // 키와 값 모두 디코딩하여 가독성 향상
      paramEntries.push(`<strong>${decodeURIComponent(key)}:</strong> ${decodeURIComponent(value)}`);
    }
    paramString = paramEntries.join(' | ');
  } else {
    paramString = '전달된 파라미터가 없습니다.';
  }

  if (titleH3Element && titleH3Element.parentNode) {
    // 리포트 제목 옆에 한 줄로 표시
    paramsDisplayContainer.innerHTML = `(${paramString})`; // 괄호로 감싸줌
    // paramsDisplayContainer.className = 'report-title-parameters'; // 필요시 CSS 클래스 지정
    paramsDisplayContainer.style.display = 'inline-block'; // 제목과 같은 줄에 배치
    paramsDisplayContainer.style.marginLeft = '12px';      // 제목과의 간격
    paramsDisplayContainer.style.fontSize = '0.8em';       // 제목보다 약간 작은 글꼴
    paramsDisplayContainer.style.fontWeight = 'normal';    // 일반 굵기
    paramsDisplayContainer.style.color = '#555';           // 약간 흐린 색상
    // 기존 블록 스타일 초기화
    paramsDisplayContainer.style.border = 'none';
    paramsDisplayContainer.style.padding = '0';
    paramsDisplayContainer.style.backgroundColor = 'transparent';
    paramsDisplayContainer.style.marginTop = '0'; // 상단 마진 제거

    titleH3Element.after(paramsDisplayContainer);
  } else if (iframeElement && iframeElement.parentNode) {
    // 제목이 없을 경우, 기존처럼 블록 형태로 표시
    const paramsHeader = document.createElement('h4');
    paramsHeader.textContent = '페이지 호출 시 전달된 파라미터:';
    paramsHeader.style.marginTop = '0';
    paramsHeader.style.marginBottom = '8px';
    paramsDisplayContainer.appendChild(paramsHeader);
    const paramsContentDiv = document.createElement('div');
    paramsContentDiv.className = 'report-parameters-content';
    paramsContentDiv.innerHTML = paramString; // 괄호 없이 내용만 표시
    paramsDisplayContainer.appendChild(paramsContentDiv);
    iframeElement.before(paramsDisplayContainer);
  } else {
    // 위와 동일하게 처리 (제목 없고, iframe도 없을 시 body 최상단)
    const paramsHeader = document.createElement('h4');
    paramsHeader.textContent = '페이지 호출 시 전달된 파라미터:';
    paramsHeader.style.marginTop = '0';
    paramsHeader.style.marginBottom = '8px';
    paramsDisplayContainer.appendChild(paramsHeader);
    const paramsContentDiv = document.createElement('div');
    paramsContentDiv.className = 'report-parameters-content';
    paramsContentDiv.innerHTML = paramString;
    paramsDisplayContainer.appendChild(paramsContentDiv);
    document.body.insertBefore(paramsDisplayContainer, document.body.firstChild);
  }
  // --- URL 파라미터 표시 로직 끝 ---


  // --- 프롬프트 영역 생성 로직 ---
  const promptContainerElement = document.getElementById('prompt-container');
  const runReportButtonContainer = document.getElementById('run-report-button-container');
  const runReportButton = document.getElementById('run-report-button');

  if (reportId && promptTemplate[reportId] && promptContainerElement && window.dialogManager && runReportButtonContainer && runReportButton) {
    console.log(`[ReportIframe] 리포트 ID(${reportId})에 대한 프롬프트 템플릿 발견.`);
    promptContainerElement.style.display = 'block'; // 프롬프트 컨테이너 보이기
    runReportButtonContainer.style.display = 'block'; // 실행 버튼 컨테이너 보이기

    const originalPromptFields = promptTemplate[reportId];
    const transformedPromptFields = transformPromptFields(originalPromptFields);

    const templateForPrompt = {
      fields: transformedPromptFields,
      dialogLayout: "mixed-flex" // dialogManager가 form에 display:flex, flex-wrap:wrap 스타일 적용
    };

    // 초기 프롬프트 데이터 (필요시 URL 파라미터 등에서 가져와 설정)
    const initialPromptData = {};
    // 예: urlParams.forEach((value, key) => { if (key.startsWith('prompt_')) initialPromptData[key.substring(7)] = value; });

    const promptFormControls = window.dialogManager.renderFormInContainer(
      promptContainerElement, // 폼을 그릴 실제 div 요소
      templateForPrompt,
      initialPromptData
    );

    if (promptFormControls) {
      runReportButton.addEventListener('click', () => {
        if (promptFormControls.validate()) {
          const promptData = promptFormControls.getFormData();
          console.log('[ReportIframe] 리포트 실행 버튼 클릭. 프롬프트 데이터:', promptData);
          // TODO: 수집된 promptData를 사용하여 iframe의 src를 업데이트하거나 API 호출
          // 예: iframeElement.src = `/actual-report-url?${new URLSearchParams(promptData).toString()}`;
          alert('프롬프트 데이터가 수집되었습니다. 콘솔을 확인하세요.\n' + JSON.stringify(promptData, null, 2));
        } else {
          console.log('[ReportIframe] 프롬프트 유효성 검사 실패.');
          alert('입력값을 확인해주세요.');
        }
      });
    } else {
      console.error('[ReportIframe] 프롬프트 폼 생성 실패.');
      promptContainerElement.style.display = 'none';
      runReportButtonContainer.style.display = 'none';
    }
  } else {
    if (!reportId) console.log('[ReportIframe] URL에서 리포트 ID를 찾을 수 없습니다.');
    else if (!promptTemplate[reportId]) console.log(`[ReportIframe] 리포트 ID(${reportId})에 대한 프롬프트 템플릿이 없습니다.`);
    else if (!promptContainerElement) console.error('[ReportIframe] 프롬프트 컨테이너(#prompt-container)를 찾을 수 없습니다.');
    else if (!window.dialogManager) console.error('[ReportIframe] DialogManager를 찾을 수 없습니다.');
    
    if (promptContainerElement) promptContainerElement.style.display = 'none'; // 프롬프트 컨테이너 숨기기
    if (runReportButtonContainer) runReportButtonContainer.style.display = 'none'; // 실행 버튼 컨테이너 숨기기
  }
  // --- 프롬프트 영역 생성 로직 끝 ---


  console.log(`[ReportIframe] 전달된 원래 경로 (originalPath): ${originalPathFromQuery || '없음'}`);
  
  // TODO: originalPathFromQuery를 사용하여 iframe의 src를 설정하거나,
  //       해당 경로에 맞는 실제 리포트 내용을 동적으로 불러와서 #report-frame 대신 채워 넣는 등의 작업 수행.
  //       지금은 #report-frame이 비어있을 것임.
  if (originalPathFromQuery && iframeElement) {
     // iframeElement.src = originalPathFromQuery; // 실제 리포트 경로로 iframe src 설정
     console.log(`[ReportIframe] iframe src를 ${originalPathFromQuery}(으)로 설정해야 함 (현재는 주석 처리됨).`);
  }
}