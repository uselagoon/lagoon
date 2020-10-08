import React from 'react';
import { bp, color, fontSize } from 'lib/variables';
import Accordion from 'components/Accordion';
import { getFromNowTime } from "components/Dates";
import ContentDisplay from "components/Problem/ContentDisplay";

const Problem = ({ problem, display }) => {
    const fromNowDate = getFromNowTime(problem.created);
    const columns = {
        identifier: problem.identifier,
        severity: problem.severity,
        source: problem.source,
        created: fromNowDate,
        severityScore: problem.severityScore,
        associatedPackage: problem.version ? `${problem.associatedPackage}:${problem.version}` : problem.associatedPackage
    };

    return (
        <>
            {!display && (
                <Accordion
                    key={problem.id}
                    columns={columns}
                    meta={problem.project}
                    defaultValue={false}
                    className="data-row row-heading">
                    <div className="problem-wrapper">
                        <ContentDisplay problem={problem} />
                    </div>
                </Accordion>
            )}
            {display === "slug" && (
                <div className="problem-wrapper">
                    <div className="problem-header details">
                        <div>
                            <label>ID</label>
                            <p>{problem.id}</p>
                        </div>
                        <div>
                            <label>Created</label>
                            <p>{problem.created}</p>
                        </div>
                        <div>
                            <label>Status</label>
                            <p>-</p>
                        </div>
                    </div>
                </div>
            )}
            <style jsx>{`
            .problem-header {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                padding: 20px;
                background: ${color.white};
                p {
                    margin-bottom: 0;
                }
            }
            .problem-wrapper {
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 20px;
                background: ${color.lightestGrey};
            }
        `}
            </style>
        </>
    );
};

export default Problem;
