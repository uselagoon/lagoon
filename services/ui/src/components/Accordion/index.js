import React, { useState, Fragment } from "react";
import PropTypes from "prop-types";
import moment from 'moment';

const Accordion = ({ children, defaultValue = true, className = "", onToggle, headings, meta }) => {
    const [visibility, setVisibility] = useState(defaultValue);

//console.log(meta);

    return (
        <div className={className}>
            {meta &&
            <div className="accordion-meta-heading">
                <span>Project: {meta.project.name}</span>
                <span>Openshift: {meta.openshiftProjectName}:{meta.name}</span>
            </div>
            }
            <div className="accordion-heading" onClick={() => {
                setVisibility(!visibility);
                if (onToggle) onToggle(!visibility);
            }}>
                <div className="problemid">{headings.identifier}</div>
                <div className="created">
                    {moment
                        .utc(headings.created)
                        .local()
                        .format('DD MM YYYY, HH:mm:ss')}
                </div>
                <div className="associatedPackage">{headings.associatedPackage}</div>
                <div className="source">{headings.source}</div>
                <div className="severity">{headings.severity}</div>
                <div className="severityscore">{headings.severityScore}</div>
            </div>

            {visibility ? <Fragment>{children}</Fragment> : null}
            <style jsx>{`
                .accordion-meta-heading {
                    display: flex;
                    justify-content: space-between;
                    background: #f2f2f2;
                    padding: 5px 20px;
                }
                .accordion-heading {
                    display: flex;
                    justify-content: space-between;
                    padding: 20px;
                    border: 1px solid #efefef;
                    cursor: pointer;
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