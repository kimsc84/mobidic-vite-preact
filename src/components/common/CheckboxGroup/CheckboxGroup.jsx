import { h } from 'preact';

/**
 * @typedef CheckboxOption
 * @property {string} value - The value of the checkbox option.
 * @property {string} label - The display label for the checkbox option.
 * @property {boolean} [disabled] - If this specific option is disabled.
 */

/**
 * @param {object} props
 * @param {string} [props.id] - Base ID for the group (individual checkbox IDs will be derived).
 * @param {string} props.name - A common prefix for names if needed, though individual checkboxes in a group often don't share a name attribute in HTML the same way radios do. Can be used for grouping form data.
 * @param {Array<string>} [props.selectedValues] - Array of values of the currently selected checkboxes.
 * @param {function} props.onChange - Callback function when a checkbox state changes. It should receive the event and the specific checkbox's value.
 * @param {Array<CheckboxOption>} props.options - Array of checkbox options.
 * @param {boolean} [props.disabled] - If the entire checkbox group is disabled.
 * @param {string} [props.className] - Additional class names for the group container.
 * @param {string} [props.ariaDescribedby] - ID of an element describing the checkbox group.
 */
const CheckboxGroup = (props) => {
  const {
    id,
    name, // Name can be used as a prefix or for context
    selectedValues = [],
    onChange,
    options = [],
    disabled,
    className = '',
    ariaDescribedby,
  } = props;

  const groupClasses = ['control-group', 'control-group--checkbox'];
  if (className) {
    groupClasses.push(className);
  }

  const handleChange = (event) => {
    if (onChange) {
      onChange(event, event.target.value, event.target.checked);
    }
  };

  return (
    <div
      class={groupClasses.join(' ')}
      id={id}
      role="group" // ARIA role for a generic group; can also be region if labelled
      aria-describedby={ariaDescribedby}
    >
      {options.map((option, index) => {
        const optionId = id ? `${id}_${option.value}_${index}` : `${name || 'cbgroup'}_${option.value}_${index}`;
        const isChecked = selectedValues.includes(option.value);
        const isDisabled = disabled || option.disabled;

        const itemClasses = ['control-group__item'];
        if (isDisabled) {
          itemClasses.push('control-group__item--disabled');
        }

        return (
          <label class={itemClasses.join(' ')} for={optionId} key={optionId}>
            <input
              type="checkbox"
              id={optionId}
              // Checkboxes in a group don't typically share a 'name' attribute for selection purposes,
              // but can have it for form submission. Let's use a unique name or a common one if desired for data structure.
              // For now, let's make it unique to avoid unintended grouping by native browser form submission.
              name={`${name || 'cb'}_${option.value}`} // Or just option.name if that's preferred
              value={option.value}
              checked={isChecked}
              disabled={isDisabled}
              onChange={handleChange}
              class="control-group__input"
            />
            <span class="control-group__label-text">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
};

export default CheckboxGroup;
