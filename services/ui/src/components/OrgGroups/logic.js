import compose from 'recompose/compose';
import withState from 'recompose/withState';
import withHandlers from 'recompose/withHandlers';

const withInputValue = withState('inputValueGroup', 'setInputValue', '');
const withInputHandlers = withHandlers({
  setInputValue: ({ setInputValue }) => event =>
    setInputValue(event.target.value)
});

export default compose(
  withInputValue,
  withInputHandlers,
);
