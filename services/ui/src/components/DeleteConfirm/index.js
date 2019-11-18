import React from 'react';
import Modal from 'components/Modal';
import { color, fontSize, bp } from 'lib/variables';
import withLogic from 'components/DeleteConfirm/logic';

const DeleteConfirm = ({
  deleteType,
  deleteName,
  onDelete,
  inputValue,
  setInputValue,
  open,
  openModal,
  closeModal
}) => {
  return (
    <React.Fragment>
      <button className="button--page" onClick={openModal}>
        Delete
      </button>
      <Modal
        isOpen={open}
        onRequestClose={closeModal}
        contentLabel={`Confirm delete ${deleteType}`}
      >
        <React.Fragment>
          <p>
            This will delete all resources associated with the {deleteType}{' '}
            <span className="delete-name">{deleteName}</span> and cannot be
            undone. Make sure this is something you really want to do!
          </p>
          <p>Type the name of the {deleteType} to confirm.</p>
          <div className="form-input">
            <input type="text" value={inputValue} onChange={setInputValue} />
            <a href="#" className="hover-state" onClick={closeModal}>
              cancel
            </a>
            <button
              className="button--modal"
              disabled={inputValue !== deleteName}
              onClick={() => onDelete()}
            >
              Delete
            </button>
          </div>
        </React.Fragment>
      </Modal>
      <style jsx>{`
        input {
          margin-right: 10px;
          width: 100%;
        }
        button {
          margin-right: 10px;
          cursor: pointer;
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
        }
        .button--page {
          align-self: flex-end;
          background-color: ${color.midGrey};
          border: none;
          border-radius: 20px;
          color: ${color.darkGrey};
          font-family: 'source-code-pro', sans-serif;
          ${fontSize(13)};
          padding: 3px 20px 2px;
          text-transform: uppercase;
          @media ${bp.tinyUp} {
            align-self: auto;
          }
        }
        .button--modal {
          align-self: flex-end;
          background-color: ${color.lightestGrey};
          border: none;
          border-radius: 20px;
          color: ${color.darkGrey};
          font-family: 'source-code-pro', sans-serif;
          ${fontSize(13)};
          padding: 3px 20px 2px;
          text-transform: uppercase;
          @media ${bp.tinyUp} {
            align-self: auto;
          }

          &:disabled {
            color: ${color.grey};
            cursor: default;
          }
        }
      `}</style>
    </React.Fragment>
  );
};

export default withLogic(DeleteConfirm);
