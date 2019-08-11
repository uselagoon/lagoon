import React from 'react';
import ReactModal from 'react-modal';
import { color, bp } from 'lib/variables';

ReactModal.setAppElement('#__next');

const Modal = ({ isOpen, onRequestClose, contentLabel, children, ...rest }) => (
  <React.Fragment>
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
    <style jsx>{`
      :global(.modal__overlay) {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        /* color.almostWhite, 0.75 opacity */
        background-color: rgb(250, 250, 252, 0.75);
        z-index: 100;
      }
      :global(.modal__content) {
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
  </React.Fragment>
);

export default Modal;
