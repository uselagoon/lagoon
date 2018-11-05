import React from 'react';
import withHandlers from 'recompose/withHandlers';
import withState from 'recompose/withState';
import compose from 'recompose/compose';

const withFormState = withState('formValues', 'setFormValue', '');
const withSubmitForm = withHandlers({
  onSubmit: ({
    formValues,
    addTask,
  }) => e => {
    addTask(
      formValues.name,
      formValues.environment,
      formValues.service,
      formValues.command,
      formValues.created,
      formValues.status,
    );
  },
});

export default compose(
  withFormState,
  withSubmitForm,
);
