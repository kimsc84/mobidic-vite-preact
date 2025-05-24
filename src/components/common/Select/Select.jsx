import { h } from 'preact';

const Select = (props) => {
  const { className, options, value, ...rest } = props;
  return (
    <select class={`select ${className || ''}`.trim()} value={value} {...rest}>
      {(options || []).map(opt => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.text}
        </option>
      ))}
    </select>
  );
};

export default Select;