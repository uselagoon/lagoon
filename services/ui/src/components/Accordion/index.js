import React, { useState, Fragment } from "react";
import PropTypes from "prop-types";
import moment from 'moment';

const Accordion = ({ children, defaultValue = true, className = "", onToggle, columns }) => {
    const [visibility, setVisibility] = useState(defaultValue);

    return (
        <div className={className}>
            <div className="accordion-heading" onClick={() => {
                setVisibility(!visibility);
                if (onToggle) onToggle(!visibility);
            }}>
                {Object.keys(columns).map((item, i) => {
                    if (item === 'created') {
                        return (<div key={i} className="created">
                            {moment
                                .utc(columns[item])
                                .local()
                                .format('DD MM YYYY, HH:mm:ss')}
                        </div>)
                    }
                    else if (item === 'projects') {
                        return <div key={i} className="environmentsAffected">{columns[item].length}</div>
                    }
                    else {
                        return <div key={i} className={item}>{columns[item]}</div>
                    }
                })}
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
                    padding: 20px 12px;
                    border: 1px solid #efefef;
                    cursor: pointer;

                    > div {
                      padding: 0 6px;
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