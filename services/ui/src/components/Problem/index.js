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
        associatedPackage: problem.associatedPackage
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
