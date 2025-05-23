// src/components/common/Tree/Tree.jsx
import { h } from 'preact';
import RcTree from 'rc-tree';
import 'rc-tree/assets/index.css'; // rc-tree 기본 스타일 (필요시 커스텀 CSS로 덮어쓰기)

/**
 * @typedef {object} TreeNodeData
 * @property {string | number} key - 각 노드의 고유 키 (필수)
 * @property {import("preact").ComponentChildren} title - 노드에 표시될 내용 (문자열, JSX 등)
 * @property {TreeNodeData[]} [children] - 자식 노드 배열
 * @property {boolean} [disabled] - 노드 비활성화 여부
 * @property {boolean} [disableCheckbox] - 노드 체크박스 비활성화 여부
 * @property {boolean} [isLeaf] - 리프 노드 여부 (자식이 없어도 강제로 리프 노드로 처리)
 * @property {string} [className] - 노드에 적용할 추가 CSS 클래스
 * // rc-tree에서 지원하는 다른 TreeNode props도 사용 가능
 */

/**
 * @param {object} props
 * @param {TreeNodeData[]} props.treeData - 트리에 표시할 데이터 배열
 * @param {boolean} [props.checkable=false] - 체크박스 표시 여부
 * @param {string[] | number[]} [props.expandedKeys] - 확장된 노드의 키 배열 (제어 컴포넌트용)
 * @param {string[] | number[]} [props.defaultExpandedKeys] - 기본으로 확장될 노드의 키 배열
 * @param {boolean} [props.defaultExpandAll=false] - 모든 노드를 기본으로 확장할지 여부
 * @param {string[] | number[]} [props.checkedKeys] - 체크된 노드의 키 배열 (제어 컴포넌트용)
 * @param {object} [props.defaultCheckedKeys] - 기본으로 체크될 노드의 키 배열 또는 객체 {checked: string[], halfChecked: string[]}
 * @param {string[] | number[]} [props.selectedKeys] - 선택된 노드의 키 배열 (제어 컴포넌트용)
 * @param {string[] | number[]} [props.defaultSelectedKeys] - 기본으로 선택될 노드의 키 배열
 * @param {boolean} [props.multiple=false] - 다중 선택 가능 여부
 * @param {function} [props.onExpand] - 노드 확장/축소 시 호출될 콜백 (expandedKeys, {expanded, node})
 * @param {function} [props.onCheck] - 체크박스 체크/해제 시 호출될 콜백 (checkedKeys, e:{checked, halfCheckedKeys, node, event})
 * @param {function} [props.onSelect] - 노드 선택 시 호출될 콜백 (selectedKeys, e:{selected, selectedNodes, node, event})
 * @param {function} [props.loadData] - 비동기 데이터 로딩 함수 (node) => Promise
 * @param {string} [props.className] - Tree 컴포넌트 전체에 적용될 추가 CSS 클래스
 * @param {object} [props.icon] - 아이콘 커스텀 렌더링 함수 또는 JSX (props => JSX)
 * @param {object} [props.switcherIcon] - 확장/축소 스위처 아이콘 커스텀 렌더링 함수 또는 JSX (props => JSX)
 * @param {boolean} [props.showLine] - 연결선 표시 여부 (rc-tree v4에서는 기본적으로 라인 스타일이 약함, CSS 추가 필요)
 * @returns {import("preact").JSX.Element} Tree 컴포넌트
 */
export function Tree({
  treeData,
  checkable = false,
  className = '',
  // rc-tree에서 지원하는 다양한 props들을 여기에 추가하고 전달할 수 있습니다.
  // 예: expandedKeys, defaultExpandedKeys, checkedKeys, onExpand, onCheck, onSelect 등
  ...restProps
}) {
  // rc-tree의 기본 스타일을 사용하되, 추가적인 커스텀 클래스를 적용할 수 있도록 함.
  // 필요하다면 global.css나 별도의 Tree.module.css 파일에서 rc-tree 스타일을 덮어쓰거나 확장합니다.
  const combinedClassName = `custom-tree-component ${className}`.trim();

  return (
    <div class={combinedClassName}>
      <RcTree
        treeData={treeData}
        checkable={checkable}
        // prefixCls="rc" // 기본 prefixCls, 필요시 변경하여 CSS 충돌 방지 또는 커스텀 스타일링 용이하게
        // showIcon={false} // 기본 아이콘 표시 여부
        {...restProps}
      />
    </div>
  );
}

// 사용 예시 (다른 컴포넌트에서):
// import { Tree } from '@/components/common/Tree/Tree';
// import { useState } from 'preact/hooks';
//
// const sampleTreeData = [
//   {
//     key: '0',
//     title: '문서',
//     children: [
//       {
//         key: '0-0',
//         title: '기술 문서',
//         children: [
//           { key: '0-0-0', title: 'mobidic-vite-preact-guide.md' },
//           { key: '0-0-1', title: 'architecture.png', isLeaf: true, className: 'file-node' },
//         ],
//       },
//       {
//         key: '0-1',
//         title: '디자인 가이드',
//         children: [
//           { key: '0-1-0', title: 'style-guide.fig', isLeaf: true, disableCheckbox: true },
//         ],
//       },
//     ],
//   },
//   { key: '1', title: '다운로드', disabled: true },
// ];
//
// function MyExplorer() {
//   const [expandedKeys, setExpandedKeys] = useState(['0', '0-0']);
//   const [checkedKeys, setCheckedKeys] = useState([]);
//
//   const handleExpand = (keys) => setExpandedKeys(keys);
//   const handleCheck = (keys) => setCheckedKeys(keys);
//
//   return (
//     <Tree
//       treeData={sampleTreeData}
//       checkable
//       defaultExpandAll={false}
//       expandedKeys={expandedKeys}
//       checkedKeys={checkedKeys}
//       onExpand={handleExpand}
//       onCheck={handleCheck}
//       onSelect={(selectedKeys, info) => console.log('selected', selectedKeys, info.node.title)}
//       className="my-custom-file-tree"
//     />
//   );
// }