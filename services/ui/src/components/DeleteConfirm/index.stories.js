import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import DeleteConfirm, { DeleteConfirm as DeleteConfirmBaseComponent } from './index';

export default {
  component: DeleteConfirmBaseComponent,
  title: 'Components/Delete and Confirm',
  decorators: [
    storyFn => {
      const [open, setOpen] = useState(true);
      const actionOpen = action('open-modal');
      const actionClose = action('close-modal');
      return storyFn({
        openBoolean: open,
        openModalFunction: () => { actionOpen(); setOpen(true); },
        closeModalFunction: () => { actionClose(); setOpen( false); },
        onDeleteFunction: action('delete-button-pressed'),
        setInputValueFunction: action('input-value-update-requested'),
      });
    },
  ],
}

export const Default = ({ onDeleteFunction, setInputValueFunction }) => (
  <DeleteConfirm
    deleteType="environment"
    deleteName="Forty-two"
    onDelete={onDeleteFunction}
  />
);

export const WithConfirmationBlocked = ({ onDeleteFunction, setInputValueFunction, openBoolean, openModalFunction, closeModalFunction }) => (
  <DeleteConfirmBaseComponent
    deleteType="environment"
    deleteName="Forty-two"
    onDelete={onDeleteFunction}
    inputValue=""
    setInputValue={setInputValueFunction}
    open={openBoolean}
    openModal={openModalFunction}
    closeModal={closeModalFunction}
  />
);

export const WithConfirmationAllowed = ({ onDeleteFunction, setInputValueFunction, openBoolean, openModalFunction, closeModalFunction }) => (
  <DeleteConfirmBaseComponent
    deleteType="environment"
    deleteName="Forty-two"
    onDelete={onDeleteFunction}
    inputValue="Forty-two"
    setInputValue={setInputValueFunction}
    open={openBoolean}
    openModal={openModalFunction}
    closeModal={closeModalFunction}
  />
);
