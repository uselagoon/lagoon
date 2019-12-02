import React from 'react';
import ButtonStyles from './ButtonStyles';

const ButtonAction = ({ action, disabled, children }) => (
  <ButtonStyles onClick={action} disabled={disabled} element="button">
    {children}
  </ButtonStyles>
);

export default ButtonAction;
