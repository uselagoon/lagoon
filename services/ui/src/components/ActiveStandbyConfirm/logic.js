import compose from 'recompose/compose';
import withState from 'recompose/withState';
import withHandlers from 'recompose/withHandlers';

const withInputValue = withState('inputValue', 'setInputValue', '');
const withInputHandlers = withHandlers({
  setInputValue: ({ setInputValue }) => event =>
    setInputValue(event.target.value)
});

const withModalState = withState('open', 'setOpen', false);
const withModalHandlers = withHandlers({
  openModal: ({ setOpen }) => () => setOpen(true),
  closeModal: ({ setOpen }) => () => setOpen(false)
});

export default compose(
  withInputValue,
  withInputHandlers,
  withModalState,
  withModalHandlers
);
