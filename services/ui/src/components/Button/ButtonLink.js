import React from 'react';
import ButtonStyles from './ButtonStyles';

const ButtonLink = ({ href, disabled, children }) => (
  <ButtonStyles
    href={href}
    disabled={disabled}
    element="a"
    onClick={e => {
      if (disabled) {
        e.preventDefault();
        return false;
      }
    }}
  >
    {children}
  </ButtonStyles>
);

export default ButtonLink;
