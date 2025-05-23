// src/components/common/Table/Table.jsx
import { h } from 'preact';
import { useState, useMemo } from 'preact/hooks';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel, // 정렬 기능을 위해 추가
  useReactTable,
  // createColumnHelper는 이제 이 컴포넌트 외부에서 사용됩니다.
} from '@tanstack/react-table';

/**
 * @typedef Person
 * @property {string} firstName
 * @property {string} lastName
 * @property {number} age
 * @property {number} visits
 * @property {string} status
 * @property {number} progress
 */

/**
 * @param {object} props
 * @param {Array<object>} props.data - 테이블에 표시할 데이터 배열 (Person[] 대신 일반 객체 배열로 변경)
 * @param {Array<import('@tanstack/react-table').ColumnDef<any, any>>} props.columns - 테이블 컬럼 정의 배열
 * @returns {import("preact").JSX.Element} 테이블 컴포넌트
 */
export function Table({ data: defaultData, columns: propColumns }) {
  const [data, setData] = useState(() => [...defaultData]); // 예시 데이터 상태 관리
  const [sorting, setSorting] = useState([]); // 정렬 상태 관리

  // useMemo를 사용하여 컬럼 정의가 리렌더링 시마다 재생성되지 않도록 최적화
  const memoizedColumns = useMemo(() => propColumns, [propColumns]);

  const table = useReactTable({
    data,
    columns: memoizedColumns,
    state: {
      sorting,
    },
    onSortingChange: setSorting, // 정렬 변경 핸들러
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // 정렬 모델 가져오기
    // debugTable: true, // 개발 중 디버깅에 유용
  });

  return (
    <div class="table-wrapper scroll--common"> {/* global.css의 스크롤 유틸리티 적용 */}
      <table class="table"> {/* global.css의 .table 클래스 사용 */}
        <thead class="table__header">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id} class="table__row">
              {headerGroup.headers.map(header => (
                <th key={header.id} colSpan={header.colSpan} class="table__head-cell"
                  // 정렬 기능 추가
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  {{
                    asc: ' 🔼',
                    desc: ' 🔽',
                  }[header.column.getIsSorted()] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody class="table__body">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} class="table__row">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} class="table__cell"> {/* global.css의 .table__cell 클래스 사용 */}
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {/* 푸터가 필요하다면 여기에 추가 */}
      </table>
    </div>
  );
}

// 사용 예시 (다른 컴포넌트에서):
// import { Table } from '@/components/common/Table/Table';
// import { createColumnHelper } from '@tanstack/react-table'; // 컬럼 정의를 위해 import
//
// /**
//  * @typedef MyCustomData
//  * @property {string} id
//  * @property {string} name
//  * @property {number} value
//  */
//
// const columnHelper = createColumnHelper(); // 사용하는 곳에서 columnHelper 생성
//
// const myTableColumns = [
//   columnHelper.accessor('id', {
//     header: '아이디',
//     cell: info => info.getValue(),
//   }),
//   columnHelper.accessor('name', {
//     header: '항목명',
//     cell: info => <strong>{info.getValue()}</strong>,
//   }),
//   columnHelper.accessor('value', {
//     header: '값',
//     cell: info => `${info.getValue()} 원`,
//   }),
// ];
//
// const sampleData = [
//   { id: 'item1', name: '첫번째 항목', value: 1000 },
//   { id: 'item2', name: '두번째 항목', value: 2500 },
//   // ... more data
// ];
//
// function MyPage() {
//   return <Table data={sampleData} columns={myTableColumns} />;
// }