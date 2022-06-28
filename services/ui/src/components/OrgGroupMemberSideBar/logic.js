import compose from 'recompose/compose';
import withState from 'recompose/withState';
import withHandlers from 'recompose/withHandlers';

const withInputValue = withState('inputValueEmail', 'setInputValue', '');
const withInputHandlers = withHandlers({
  setInputValue: ({ setInputValue }) => event =>
    setInputValue(event.target.value)
});

const withModalState = withState('open', 'setOpen', false);
const withModalHandlers = withHandlers({
  openModal: ({ setOpen }) => () => setOpen(true),
  closeModal: ({ setOpen }) => () => setOpen(false)
});

const withNewMemberHanders = withHandlers({
    onCompleted: ({ setSelectedTask }) => () => {
      setSelectedTask('Completed');
    },
    onError: ({ setSelectedTask }) => () => {
      setSelectedTask('Error');
    }
  });

const withSelectedRole = withState('selectedRole', 'setSelectedRole', null);

export default compose(
  withInputValue,
  withInputHandlers,
  withNewMemberHanders,
  withSelectedRole,
  withModalState,
  withModalHandlers
);
