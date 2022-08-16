import React, { useState, Fragment } from "react";
import PropTypes from "prop-types";
import { bp, color, fontSize } from 'lib/variables';

const LogAccordion = ({ children, defaultValue = false, header, className = "", onToggle }) => {
    const [visibility, setVisibility] = useState(defaultValue);

    return (
        <div className={className}>
            <div className={`accordion-heading`} onClick={(e) => {
                setVisibility(!visibility);
                if (onToggle) onToggle(!visibility);
            }}>

              <div key="1" className={ "log-header" + (visibility ? " visible" : "")} >{header}</div>
            </div>

            {visibility ? <Fragment>{children}</Fragment> : null}
            <style jsx>{`
                .accordion-meta-heading {
                    display: flex;
                    justify-content: flex-start;
                    background: ${color.lightestGrey};
                    padding: 5px 20px 5px 0;
                }
                .accordion-heading {
                    display: flex;
                    justify-content: space-between;
                    border: 1px solid ${color.lightestGrey};
                    background: ${color.white};
                    cursor: pointer;
                    word-break: break-word;

                    > div {
                      padding: 0 6px;
                    }
                }
                //Log accordion content styling

                .accordion-heading {

                  color: black;
                  border-color: lightgrey;
                  .log-header {
                    ::before {
                      background-image: url('/static/images/logs-closed.png');
                      background-size: 15px 15px;
                      background-color: #497ffa;
                      content: " ";
                      background-position: center;
                      padding: 22px 16px;
                      background-repeat: no-repeat;
                      margin: 0 10px 0 0;
                    }
                    &.visible {
                      ::before {
                        background-image: url('/static/images/logs-opened.png');
                      }
                    }
                    margin: 20px 12px 20px 0;
                    padding: 0;
                  }
                }
            `}</style>
            <style jsx global>{`
                .log-text {
                  padding: 30px;
                }
            `}</style>
        </div>
    );
};

LogAccordion.propTypes = {
    children: PropTypes.any.isRequired,
    defaultValue: PropTypes.bool,
    className: PropTypes.string,
    onToggle: PropTypes.func,
    header: PropTypes.string,
};

export default LogAccordion;
