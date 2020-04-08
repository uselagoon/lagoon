import React from 'react';
import Modal from 'components/Modal';
import Button from 'components/Button';
import { color } from 'lib/variables';
import withLogic from 'components/ActiveStandbyConfirm/logic';
import ActiveStandby from 'components/ActiveStandby';

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
      <ActiveStandby activeEnvironment={activeEnvironment} standbyEnvironment={standbyEnvironment} changeHandler={openModal}/>
      <Modal
        isOpen={open}
        onRequestClose={closeModal}
        contentLabel={`Confirm`}
      >
        <React.Fragment>
          <p>
            Are you sure you want to switch the "{standbyEnvironment}" environment to active?<br/>
            Upon confirmation you will be taken to the task page to monitor execution. 
          </p>

          <div className="form-input">
            <a href="#" className="hover-state" onClick={closeModal}>cancel</a>
            <Button action={onProceed}>Confirm</Button>
          </div>
        </React.Fragment>
      </Modal>
      <style jsx>{`
        input {
          margin-right: 10px;
          width: 100%;
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
