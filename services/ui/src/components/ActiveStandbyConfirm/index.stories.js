import React, { useState } from 'react';
import { action } from '@storybook/addon-actions';
import ActiveStandby, { ActiveStandbyConfirm as ActiveStandbyBaseComponent } from './index';

export default {
  component: ActiveStandbyBaseComponent,
  title: 'Components/ActiveStandby and Confirm',
  decorators: [
    storyFn => {
      const [open, setOpen] = useState(true);
      const actionOpen = action('open-modal');
      const actionClose = action('close-modal');
      return storyFn({
        openBoolean: open,
        openModalFunction: () => { actionOpen(); setOpen(true); },
        closeModalFunction: () => { actionClose(); setOpen( false); },
        onProceedFunction: action('active-standby-button-pressed'),
      });
    },
  ],
}

export const Default = ({ onProceedFunction, setInputValueFunction }) => (
  <ActiveStandby
    activeEnvironment="Master-a"
    standbyEnvironment="Master-b"
    onProceed={onProceedFunction}
  />
);

export const WithConfirmationBlocked = ({ onProceedFunction, setInputValueFunction, openBoolean, openModalFunction, closeModalFunction }) => (
  <ActiveStandbyBaseComponent
    deleteType="environment"
    deleteName="Forty-two"
    onProceed={onProceedFunction}
    open={openBoolean}
    openModal={openModalFunction}
    closeModal={closeModalFunction}
  />
);

export const WithConfirmationAllowed = ({ onProceedFunction, setInputValueFunction, openBoolean, openModalFunction, closeModalFunction }) => (
  <ActiveStandbyBaseComponent
    deleteType="environment"
    deleteName="Forty-two"
    onProceed={onProceedFunction}
    open={openBoolean}
    openModal={openModalFunction}
    closeModal={closeModalFunction}
  />
);
