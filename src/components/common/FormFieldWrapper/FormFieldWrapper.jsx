import { h } from 'preact';

/**
 * @param {object} props
 * @param {string} [props.label] - The label text for the field.
 * @param {string} [props.labelFor] - The 'for' attribute for the label, linking to the input.
 * @param {boolean} [props.required] - If the field is required (displays a mark).
 * @param {string} [props.errorMessage] - Error message to display.
 * @param {boolean} [props.isVertical] - If the field should be laid out vertically (label above input).
 * @param {string} [props.fieldId] - Original ID of the field from the template.
 * @param {string} [props.colSpan] - For grid layouts, the column span.
 * @param {object} [props.flexStyle] - For flex layouts, custom style object.
 * @param {string} [props.dialogLayout] - The layout type of the dialog ('2-column-grid', 'mixed-flex', etc.).
 * @param {import('preact').ComponentChildren} props.children - The actual input control.
 * @param {string} [props.className] - Additional class names for the wrapper.
 * @param {string} [props.uniqueErrorSpanId] - Unique ID for the error span.
 */
const FormFieldWrapper = (props) => {
  const {
    label,
    labelFor,
    required,
    errorMessage,
    isVertical, // True for table, image-upload, or field.layout === 'vertical'
    fieldId, // Original field ID
    colSpan,
    flexStyle,
    dialogLayout,
    children,
    className = '',
    uniqueErrorSpanId,
  } = props;

  const fieldContainerClasses = ['field'];
  if (isVertical) {
    fieldContainerClasses.push('field--vertical');
  }
  if (errorMessage) {
    fieldContainerClasses.push('field--invalid');
  }
  if (props.disabled) { // Assuming disabled might be passed for styling the wrapper
    fieldContainerClasses.push('field--disabled');
  }
  fieldContainerClasses.push(className);


  let fieldWrapperStyles = {};
  if (dialogLayout === '2-column-grid' && colSpan) {
    fieldWrapperStyles.gridColumn = `span ${colSpan}`;
  } else if (dialogLayout === 'mixed-flex' && flexStyle && typeof flexStyle === 'object') {
    fieldWrapperStyles = { ...flexStyle };
  }

  // Custom container fields (like table, image-upload) might not need field__control-wrapper
  // This will be handled by the specific field component structure.
  // This wrapper is more for standard input/label fields.

  return (
    <div
      class={fieldContainerClasses.join(' ').trim()}
      data-field-id={fieldId}
      style={fieldWrapperStyles}
    >
      {label && !isVertical && ( // For non-vertical, non-custom fields
        <label class="field__label" for={labelFor}>
          {label}
          {required && <span class="field__required-mark">*</span>}
        </label>
      )}
      {/* For vertical layouts, the label might be part of the children or handled by the specific component */}
      <div class="field__control-wrapper">
        {children}
        {uniqueErrorSpanId && errorMessage && (
          <span class="field__error-message" id={uniqueErrorSpanId} role="alert" aria-live="polite">
            {errorMessage}
          </span>
        )}
      </div>
    </div>
  );
};

export default FormFieldWrapper;
