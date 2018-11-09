import React from 'react';
import withHandlers from 'recompose/withHandlers';
import withState from 'recompose/withState';
import compose from 'recompose/compose';
import moment from 'moment';

const withFormState = withState('formValues', 'setFormValues', {});
const withSubmitForm = withHandlers({
  onSubmit: ({
    environmentId,
    formValues,
    addTask,
  }) => e => {
    addTask(
      formValues.name,
      environmentId,
      formValues.service,
      formValues.command,
      moment.utc().format('YYYY-MM-DD HH:mm:ss'),
      'ACTIVE',
    );
  },
});

export default compose(
  withFormState,
  withSubmitForm,
);
