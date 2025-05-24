import { h } from 'preact';

const Textarea = (props) => {
  const { className, value, ...rest } = props;
  return <textarea class={`textarea ${className || ''}`.trim()} {...rest}>{value}</textarea>;
};

export default Textarea;