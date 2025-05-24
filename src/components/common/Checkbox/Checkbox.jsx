import { h } from 'preact';

/**
 * @param {object} props
 * @param {string} [props.id] - The ID of the checkbox.
 * @param {string} [props.name] - The name of the checkbox.
 * @param {boolean} [props.checked] - Whether the checkbox is checked.
 * @param {function} [props.onChange] - Callback function when the checkbox state changes.
 * @param {string} [props.label] - The label text for the checkbox.
 * @param {boolean} [props.disabled] - If the checkbox is disabled.
 * @param {boolean} [props.required] - If the checkbox is required (for styling/validation hint).
 * @param {string} [props.className] - Additional class names for the wrapper label.
 * @param {string} [props.inputClassName] - Additional class names for the input element itself.
 * @param {string} [props.labelClassName] - Additional class names for the label text span.
 * @param {string} [props.ariaDescribedby] -  ID of an element describing the input.
 */
const Checkbox = (props) => {
  const {
    id,
    name,
    checked,
    onChange,
    label,
    disabled,
    required,
    className = '',
    inputClassName = '',
    labelClassName = '',
    ariaDescribedby,
  } = props;

  // Combine classes for the main label wrapper
  const labelWrapperClasses = ['checkbox'];
  if (disabled) {
    labelWrapperClasses.push('checkbox--disabled');
  }
  if (className) {
    labelWrapperClasses.push(className);
  }

  return (
    <label class={labelWrapperClasses.join(' ')} for={id}>
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        disabled={disabled}
        required={required}
        onChange={onChange}
        class={`checkbox__input ${inputClassName}`.trim()}
        aria-describedby={ariaDescribedby}
      />
      {label && <span class={`checkbox__label-text ${labelClassName}`.trim()}>{label}</span>}
      {/* Required mark can be handled by FormFieldWrapper or CSS if needed, or added here */}
      {/* For now, 'required' prop is mainly for the input's own attribute */}
    </label>
  );
};

export default Checkbox;