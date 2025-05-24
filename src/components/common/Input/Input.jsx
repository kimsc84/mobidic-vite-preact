import { h } from 'preact';

const Input = (props) => {
  const { className, ...rest } = props;
  return <input class={`input ${className || ''}`.trim()} {...rest} />;
};

export default Input;
