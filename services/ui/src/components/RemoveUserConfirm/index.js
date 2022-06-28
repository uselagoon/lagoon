import React from 'react';
import Modal from 'components/Modal';
import Button from 'components/Button';
import { color } from 'lib/variables';
import withLogic from 'components/RemoveUserConfirm/logic';

/**
 * Confirms the removal of the specified email from group
 */
export const RemoveUserConfirm = ({
  removeName,
  onRemove,
  open,
  openModal,
  closeModal
}) => {
  return (
    <React.Fragment>
      <Button variant='red' action={openModal}>
        Remove
      </Button>
      <Modal
        isOpen={open}
        onRequestClose={closeModal}
        contentLabel={`Confirm removal`}
      >
        <React.Fragment>
          <p>
            This will remove access for <b>{removeName}</b> from this group and all associated projects of this group.
          </p>
          <p>
            Are you sure?
          </p>
          <div className="form-input">
            <a href="#" className="hover-state" onClick={closeModal}>cancel</a>
            <Button action={onRemove} variant='red'>Remove</Button>
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
        .delete-name {
          font-weight: bold;
          color: ${color.lightBlue};
        }
        .form-input {
          display: flex;
          align-items: center;
        }
      `}</style>
    </React.Fragment>
  );
};

export default withLogic(RemoveUserConfirm);
