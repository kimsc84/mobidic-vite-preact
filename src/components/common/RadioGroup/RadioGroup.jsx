import { h } from 'preact';

/**
 * @typedef RadioOption
 * @property {string} value - The value of the radio option.
 * @property {string} label - The display label for the radio option.
 * @property {boolean} [disabled] - If this specific option is disabled.
 */

/**
 * @param {object} props
 * @param {string} [props.id] - Base ID for the group (individual radio IDs will be derived).
 * @param {string} props.name - The common name for all radio buttons in the group.
 * @param {string} [props.selectedValue] - The value of the currently selected radio button.
 * @param {function} props.onChange - Callback function when the selection changes.
 * @param {Array<RadioOption>} props.options - Array of radio button options.
 * @param {boolean} [props.disabled] - If the entire radio group is disabled.
 * @param {boolean} [props.required] - If selection is required (for styling/validation hint).
 * @param {string} [props.className] - Additional class names for the group container.
 * @param {string} [props.ariaDescribedby] - ID of an element describing the radio group.
 */
const RadioGroup = (props) => {
  const {
    id,
    name,
    selectedValue,
    onChange,
    options = [],
    disabled,
    required, // For the group, not individual inputs for now
    className = '',
    ariaDescribedby,
  } = props;

  const groupClasses = ['control-group', 'control-group--radio'];
  if (className) {
    groupClasses.push(className);
  }
  // If required, FormFieldWrapper will typically handle the indicator.
  // aria-required can be set on the group if needed.

  return (
    <div
      class={groupClasses.join(' ')}
      id={id}
      role="radiogroup" // ARIA role for the group
      aria-describedby={ariaDescribedby}
      // aria-required={required ? 'true' : undefined} // If we want to mark the group itself as required
    >
      {options.map((option, index) => {
        const optionId = id ? `${id}_${option.value}_${index}` : `${name}_${option.value}_${index}`; // Ensure unique ID
        const isChecked = selectedValue === option.value;
        const isDisabled = disabled || option.disabled;

        const itemClasses = ['control-group__item'];
        if (isDisabled) {
          itemClasses.push('control-group__item--disabled');
        }

        return (
          <label class={itemClasses.join(' ')} for={optionId} key={optionId}>
            <input
              type="radio"
              id={optionId}
              name={name}
              value={option.value}
              checked={isChecked}
              disabled={isDisabled}
              onChange={onChange} // onChange on the input will bubble up if needed, or directly use it
              class="control-group__input"
              // required={required && index === 0} // Only one radio in a group can be marked required for native validation, usually not done this way.
            />
            <span class="control-group__label-text">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
};

export default RadioGroup;
