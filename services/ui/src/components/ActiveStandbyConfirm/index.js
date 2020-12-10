import React from 'react';
import Modal from 'components/Modal';
import Button from 'components/Button';
import { bp, color } from 'lib/variables';
// @TODO: add this once the logic exists
import withLogic from 'components/ActiveStandbyConfirm/logic';
import ActiveStandby from 'components/ActiveStandbyConfirm';

/**
 * Confirms the deletion of the specified name and type.
 */
export const ActiveStandbyConfirm = ({
  activeEnvironment,
  standbyEnvironment,
  onProceed,
  open,
  openModal,
  closeModal
}) => {
  return (
    <React.Fragment>
      <div className="margins"><Button action={openModal}>
        Switch Active/Standby environments
      </Button></div>
      <Modal
        isOpen={open}
        onRequestClose={closeModal}
        contentLabel={`Confirm`}
      >
        <React.Fragment>
          <p>
            This will replace the current active environment <span className="environment-name">{activeEnvironment}</span><br/>
            with the selected standby environment <span className="environment-name">{standbyEnvironment}</span>.<br/><br/>
            Are you sure you want to do this?<br/><br/>
            Upon confirmation you will be taken to the task page to monitor execution.
          </p>

          <div className="form-input">
            <a href="#" className="hover-state margins" onClick={closeModal}>cancel</a>
            <Button action={onProceed}>Confirm</Button>
          </div>
        </React.Fragment>
      </Modal>
      <style jsx>{`
        .margins{
          margin-right: 10px;
        }
        input {
          margin-right: 10px;
          width: 100%;
        }
        .environment-name {
          font-weight: bold;
          color: ${color.lightBlue};
        }
        a.hover-state {
          margin-right: 10px;
          color: ${color.blue};
        }
        .form-input {
          display: flex;
          align-items: center;
        }
      `}</style>
    </React.Fragment>
  );
};

export default withLogic(ActiveStandbyConfirm);
