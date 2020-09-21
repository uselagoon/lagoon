import React, { useState, Fragment } from "react";
import PropTypes from "prop-types";
import { bp, color, fontSize } from 'lib/variables';

const Accordion = ({ children, defaultValue = true, minified = false, className = "", onToggle, columns }) => {
    const [visibility, setVisibility] = useState(defaultValue);
    const accordionType = minified ? 'minified' : 'wide';
    const colCountClass = columns && 'cols-'+Object.keys(columns).length;

    return (
        <div className={className}>
            <div className={`accordion-heading ${accordionType} ${colCountClass}`} onClick={() => {
                setVisibility(!visibility);
                if (onToggle) onToggle(!visibility);
            }}>
                {Object.keys(columns).map((item, i) => <div key={i} className={item}>{columns[item]}</div>)}
            </div>

            {visibility ? <Fragment>{children}</Fragment> : null}
            <style jsx>{`
                .accordion-meta-heading {
                    display: flex;
                    justify-content: space-between;
                    background: ${color.lightestGrey};
                    padding: 5px 20px;
                }
                .accordion-heading {
                    display: flex;
                    justify-content: space-between;
                    padding: 20px 12px;
                    border: 1px solid ${color.lightestGrey};
                    background: ${color.white};
                    cursor: pointer;
                    word-break: break-word;

                    &.minified {
                      padding: 1em;
                    }

                    > div {
                      padding: 0 6px;
                    }

                    &.cols-6 {
                      > div {
                        width: calc(100%/6);
                        text-align: center;
                      }

                      .identifier {
                        text-align: left;
                      }
                    }

                    .identifier {
                      width: 40%;
                    }
                    .source {
                      width: 15%;
                    }
                    .associatedPackage {
                      width: 15%;
                    }
                    .severity {
                      width: 12.5%;
                    }
                    .created {
                      width: 20%;
                    }
                    .severityScore {
                      width: 10%;
                    }
                    .projectsAffected {
                      width: 17.5%;
                      text-align: right;
                    }
                }
            `}</style>
        </div>
    );
};

Accordion.propTypes = {
    children: PropTypes.any.isRequired,
    defaultValue: PropTypes.bool,
    className: PropTypes.string,
    onToggle: PropTypes.func,
    columns: PropTypes.any.isRequired
};

export default Accordion;
