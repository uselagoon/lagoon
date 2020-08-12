import React, { useState, Fragment } from "react";
import PropTypes from "prop-types";
import moment from 'moment';

const Accordion = ({ children, defaultValue = true, className = "", onToggle, heading }) => {
    const [visibility, setVisibility] = useState(defaultValue);
    return (
        <div className={className}>
            <div className="accordion-heading" onClick={() => {
                setVisibility(!visibility);
                if (onToggle) onToggle(!visibility);
            }}>
                <div className="problemid">{heading.identifier}</div>
                <div className="service">{heading.service}</div>
                <div className="associatedPackage">{heading.associatedPackage || 'UNSET'}</div>
                <div className="source">{heading.source}</div>
                <div className="severity">{heading.severity}</div>
                <div className="severityscore">{heading.severityScore}</div>
            </div>

            {visibility ? <Fragment>{children}</Fragment> : null}
            <style jsx>{`
                .accordion-heading {
                    display: flex;
                    justify-content: space-between;
                    padding: 20px;
                    background: #fff;
                    border: 1px solid #efefef;
                    cursor: pointer;
                    div {
                        width: 15%;
                    }
                    .problemid {
                        width: 40%
                    }
                }
            `}</style>
        </div>
    );
};

Accordion.propTypes = {
    className: PropTypes.string,
    children: PropTypes.any.isRequired,
    onToggle: PropTypes.func,
};

export default Accordion;