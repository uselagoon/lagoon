import React from 'react';
import Modal from 'components/Modal';
import Button from 'components/Button';
import { bp, color } from 'lib/variables';

import ReactMarkdown from 'react-markdown';

/**
 * Confirm custom task
 */
 export const CustomTaskConfirm = ({
    taskText,
    onProceed,
    open,
    openModal,
    closeModal,
    disabled,
  }) => {
    return (
      <React.Fragment>
        <div className="margins">
          <Button disabled={disabled} action={openModal}>Confirm Task</Button>
        </div>
        <Modal
          isOpen={open}
          onRequestClose={closeModal}
          contentLabel={`Confirm`}
        >
          <React.Fragment>
            <ReactMarkdown>
              {taskText}
            </ReactMarkdown>
            <div className="form-input">
              <a href="#" className="hover-state margins" onClick={closeModal}>Cancel</a>
              <Button action={onProceed}>Confirm</Button>
            </div>
          </React.Fragment>
        </Modal>
        <style jsx>{`
          .margins {
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
            justify-content: space-between;
          }
        `}</style>
      </React.Fragment>
    );
  };