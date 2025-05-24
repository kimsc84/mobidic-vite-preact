import { h } from 'preact';
import { Button } from '../../../common/Button/Button.jsx'; // Adjust path as needed
import { ICONS } from '../../iconUtils.js'; // Adjust path as needed

/**
 * @param {object} props
 * @param {object} props.field - The field definition from dialogTemplates.
 * @param {Array<object>} props.rows - Array of row data objects for the table.
 * @param {string} props.dialogType - The type of the dialog.
 * @param {function} props.onTableAction - Callback for table actions (e.g., button clicks in rows/header).
 * @param {function} props.mapButtonProps - Utility to map button definitions to Button component props.
 * @param {string} props.uniqueFieldId - The unique ID for this table instance.
 * @param {boolean} [props.disabled] - If the entire table field is disabled.
 */
const TableField = ({ field, rows = [], dialogType, onTableAction, mapButtonProps, uniqueFieldId, disabled }) => {
  const { columns = [], tableHeaderActions = [], allowFileUpload, editable } = field;

  const handleHeaderActionClick = (actionDef) => {
    if (onTableAction) {
      onTableAction(actionDef.action, { tableId: uniqueFieldId, dialogType });
    }
  };

  const handleCellActionClick = (actionName, rowId) => {
    if (onTableAction) {
      onTableAction(actionName, { tableId: uniqueFieldId, rowId, dialogType });
    }
  };
  
  const getCellContent = (row, col) => {
    const cellValue = row[col.key];
    let displayValue = cellValue;

    if (col.format) {
      // Basic formatting for now, can be expanded with a shared utility
      if (typeof cellValue === 'number' && col.format === 'currency') {
        displayValue = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(cellValue);
      } else if (cellValue instanceof Date && col.format === 'date') {
        displayValue = cellValue.toLocaleDateString('ko-KR');
      } else {
        displayValue = cellValue !== undefined && cellValue !== null ? String(cellValue) : '';
      }
    } else {
        displayValue = cellValue !== undefined && cellValue !== null ? String(cellValue) : '';
    }


    if (col.type === 'button' && editable && col.buttonAction) {
      const btnDef = {
        action: col.buttonAction,
        buttonIcon: col.buttonIcon,
        text: col.buttonText,
        class: col.buttonClass || 'button--text button--xsmall', // Default class for table cell buttons
        title: col.title || col.buttonText,
        disabled: disabled || row.disabled, // Individual row can also be disabled
      };
      // Note: The conceptual diff shows mapButtonProps taking two arguments,
      // but the existing mapButtonProps in DialogManager takes one.
      // For now, assuming mapButtonProps is flexible or we adapt its call.
      // The original code might have a different mapButtonProps specifically for table,
      // or the one in DialogManager is meant to be adapted.
      // Let's assume it can take a definition and an onClick separately for this context.
      const mappedProps = mapButtonProps(btnDef);
      mappedProps.onClick = () => handleCellActionClick(col.buttonAction, row.id);
      if (btnDef.disabled) mappedProps.disabled = true; // Ensure disabled state is respected

      return <Button {...mappedProps} />;
    }
    
    if (col.type === 'link' && row[col.linkHrefKey]) {
      return <a href={row[col.linkHrefKey]} title={displayValue}>{displayValue}</a>;
    }

    return displayValue;
  };

  const tableWrapperClasses = ['table-wrapper scroll--common'];
  if (disabled) {
    tableWrapperClasses.push('table-wrapper--disabled'); // For styling disabled table
  }
  
  // Rendering tableHeaderActions (e.g., "Add Row") typically happens outside the main table scrolling area.
  // For now, this component doesn't render `tableHeaderActions` directly.
  // This could be handled by FormFieldWrapper or an enhanced TableField in future.

  return (
    <div class={tableWrapperClasses.join(' ')}>
      <table class="table" id={uniqueFieldId} data-editable={editable === true}>
        <thead class="table__header">
          <tr class="table__row">
            {columns.map(col => (
              <th
                key={col.key}
                class={`table__head-cell ${col.align ? `table__head-cell--align-${col.align}` : ''}`}
                style={col.width ? { width: col.width } : {}}
                scope="col"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody class="table__body">
          {rows && rows.length > 0 ? (
            rows.map(row => (
              <tr key={row.id || JSON.stringify(row)} class="table__row" data-row-id={row.id}>
                {columns.map(col => (
                  <td
                    key={col.key}
                    class={`table__cell ${col.align ? `table__cell--align-${col.align}` : ''}`}
                    style={col.width ? { width: col.width } : {}}
                  >
                    {getCellContent(row, col)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr class="table__row table__row--no-data">
              <td class="table__cell" colSpan={columns.length || 1}>
                데이터가 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {allowFileUpload && !disabled && (
        <input
          type="file"
          class="file-input-hidden" // From global.css
          multiple
          data-target-table-id={uniqueFieldId} // Used by original event handler
          onChange={(e) => {
            if (onTableAction) {
              onTableAction('file-input-change', { tableId: uniqueFieldId, dialogType, files: e.target.files, event: e });
            }
          }}
        />
      )}
    </div>
  );
};

export default TableField;
