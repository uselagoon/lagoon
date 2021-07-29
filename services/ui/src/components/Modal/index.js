import React from 'react';
import PropTypes from 'prop-types';
import ReactModal from 'react-modal';
import { color, bp } from 'lib/variables';

/**
 * A styled modal dialog.
 */
const Modal = ({ isOpen, onRequestClose, contentLabel, children, ...rest }) => {
  // ReactModal throws an error in environments where the document isn't loaded.
  try {
    ReactModal.setAppElement('#__next');
  }
  catch {}

  return (
    <>
      <ReactModal
        className="modal__content"
        overlayClassName="modal__overlay"
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel={contentLabel}
        {...rest}
      >
        {children}
      </ReactModal>
      <style jsx global>{`
        .modal__overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          /* color.almostWhite, 0.75 opacity */
          background-color: rgba(250, 250, 252, 0.75);
          z-index: 100;
        }

        .modal__content {
          position: absolute;
          top: 50%;
          left: 50%;
          right: auto;
          bottom: auto;
          margin-right: -50%;
          transform: translate(-50%, -50%);
          border: 1px solid ${color.midGrey};
          background: ${color.white};
          overflow: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 4px;
          outline: none;
          padding: 20px;
          color: ${color.black};
          max-width: 90vw;

          @media ${bp.desktopUp} {
            max-width: 60vw;
          }

          @media ${bp.extraWideUp} {
            max-width: 40vw;
          }
        }
      `}</style>
    </>
  );
};

if (process.env.NODE_ENV !== 'production') {
  Modal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onRequestClose: PropTypes.func,
    contentLabel: PropTypes.string,
    children: PropTypes.any,
  };
}

export default Modal;
