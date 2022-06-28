import compose from 'recompose/compose';
import withState from 'recompose/withState';
import withHandlers from 'recompose/withHandlers';

const withInputValue = withState('inputProjectName', 'setProjectName', '');
const withInputHandlers = withHandlers({
  setProjectName: ({ setProjectName }) => event =>
    setProjectName(event.target.value)
});
const withInputGitURL = withState('inputGitURL', 'setGitURL', '');
const withInputHandlersGitURL = withHandlers({
  setGitURL: ({ setGitURL }) => event =>
    setGitURL(event.target.value)
});
const withInputProdEnv = withState('inputProdEnv', 'setProdEnv', '');
const withInputHandlersProdEnv = withHandlers({
  setProdEnv: ({ setProdEnv }) => event =>
  setProdEnv(event.target.value)
});
const withInputDeployTarget = withState('inputKubernetes', 'setKubernetes', '');
const withInputHandlersDeployTarget = withHandlers({
  setKubernetes: ({ setKubernetes }) => event =>
  setKubernetes(event.target.value)
});
const withInputBranches = withState('inputBranches', 'setBranches', '');
const withInputHandlersBranches = withHandlers({
  setBranches: ({ setBranches }) => event =>
  setBranches(event.target.value)
});
const withInputPRs = withState('inputPRs', 'setPRs', '');
const withInputHandlersPRs = withHandlers({
  setPRs: ({ setPRs }) => event =>
  setPRs(event.target.value)
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

const withSelectedDeployTarget = withState('selectedDeployTarget', 'setSelectedDeployTarget', null);

export default compose(
  withInputValue,
  withInputHandlers,
  withInputGitURL,
  withInputHandlersGitURL,
  withInputProdEnv,
  withInputHandlersProdEnv,
  withInputDeployTarget,
  withInputHandlersDeployTarget,
  withInputBranches,
  withInputHandlersBranches,
  withInputPRs,
  withInputHandlersPRs,
  withNewMemberHanders,
  withSelectedDeployTarget,
  withModalState,
  withModalHandlers
);
