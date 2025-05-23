// src/components/common/DateRange/DateRange.jsx
import { h, Fragment } from 'preact';
import { DateInput } from '@/components/common/DateInput/DateInput'; // DateInput 컴포넌트 임포트

/**
 * @param {object} props
 * @param {string} [props.startDateId] - 시작 날짜 input ID
 * @param {string} [props.startDateName] - 시작 날짜 input name
 * @param {string} [props.startDateValue] - 시작 날짜 값 (YYYY-MM-DD)
 * @param {function(string): void} [props.onStartDateChange] - 시작 날짜 변경 시 콜백
 * @param {string} [props.endDateId] - 종료 날짜 input ID
 * @param {string} [props.endDateName] - 종료 날짜 input name
 * @param {string} [props.endDateValue] - 종료 날짜 값 (YYYY-MM-DD)
 * @param {function(string): void} [props.onEndDateChange] - 종료 날짜 변경 시 콜백
 * @param {boolean} [props.disabled] - 전체 비활성화 여부
 * @param {string} [props.className] - 컴포넌트 전체에 적용될 추가 클래스
 * @param {string} [props.separatorText='~'] - 시작/종료 날짜 사이 구분자 텍스트
 * @param {string} [props.minDate] - 선택 가능한 최소 날짜 (두 input 모두 적용)
 * @param {string} [props.maxDate] - 선택 가능한 최대 날짜 (두 input 모두 적용)
 * @returns {import("preact").JSX.Element} DateRange 컴포넌트
 */
export function DateRange({
  startDateId,
  startDateName,
  startDateValue,
  onStartDateChange,
  endDateId,
  endDateName,
  endDateValue,
  onEndDateChange,
  disabled,
  className = '',
  separatorText = '~',
  minDate,
  maxDate,
  ...restProps
}) {
  // global.css의 .control-group--date-range 클래스를 기본으로 사용
  const combinedClassName = `control-group control-group--date-range ${className}`.trim();

  return (
    <div class={combinedClassName} {...restProps}>
      <DateInput id={startDateId} name={startDateName} value={startDateValue} onChange={(e) => onStartDateChange && onStartDateChange(e.target.value)} disabled={disabled} min={minDate} max={maxDate} />
      <span class="control-group__separator">{separatorText}</span>
      <DateInput id={endDateId} name={endDateName} value={endDateValue} onChange={(e) => onEndDateChange && onEndDateChange(e.target.value)} disabled={disabled} min={minDate} max={maxDate} />
    </div>
  );
}

// 사용 예시:
// const [startDate, setStartDate] = useState('');
// const [endDate, setEndDate] = useState('');
// <DateRange startDateValue={startDate} onStartDateChange={setStartDate} endDateValue={endDate} onEndDateChange={setEndDate} />