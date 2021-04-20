import React from "react";
import { bp, color, fontSize } from 'lib/variables';
import { getCreatedDate } from "components/Dates";
import TableDisplay from "components/TableDisplay";

const DrutinyDisplay = ({ problem }) => {

    const createdDate = getCreatedDate(problem.created);
    const data = JSON.parse(problem.data) || "";
    const environment = problem.environment;
    const source = problem.source || "";
    const columns = ['Module', 'Version', 'Latest'];

    return (
        <div className="content-display-wrapper">
            {data.title && (<div className="field-wrapper">
                <label>Title</label>
                <div className="title">{data.title}</div>
            </div>)}
            {data.description && data.description.length > 0 && (<div className="field-wrapper">
                <label>Description</label>
                <div className="description">{data.description}</div>
            </div>)}
            {data.remediation && (<div className="field-wrapper">
                <label>Remediation</label>
                <div className="remediation">{data.remediation}</div>
            </div>)}
            {source === "Drutiny-algm:D8ModuleUpdates" ? (
              <div className="data-wrapper">
                <label>Module Updates</label>
                <div className="table">
                  <TableDisplay columns={columns} data={JSON.parse(data.failure)}/>
                </div>
              </div>
            ) : (
              <div className="data-wrapper">
                <label>{data.type ? data.type : 'Results'}</label>
                <div className="data"><pre>{data.failure}</pre></div>
              </div>
            )}
            {data.severity && (<div className="field-wrapper">
                <label>Severity</label>
                <div className="severity">{data.severity}</div>
            </div>)}
            {data.service && (<div className="field-wrapper">
                <label>Service</label>
                <div className="service">{data.service}</div>
            </div>)}
            {data.created && (<div className="field-wrapper">
                <label>Last detected</label>
                <div className="time-ago">{data.created}</div>
            </div>)}
            {data.type && (<div className="field-wrapper">
                <label>Type</label>
                <div className="type">{data.type}</div>
            </div>)}
            {createdDate && (<div className="field-wrapper">
                <label>Created</label>
                <div className="created">{createdDate}</div>
            </div>)}
            <style jsx>{`
               .field-wrapper {
                    flex-direction: column;
                }
                .failure-result {
                    white-space: pre-wrap;
                }
                .data-wrapper {
                    margin-bottom: 30px;
                }
                .table {
                  display: flex;
                  flex-direction: column;
                }
                .data {
                    background: #2d2d2d;
                    padding: 20px;
                    color: white;
                    font: 0.8rem Inconsolata, monospace;
                    line-height: 2;
                    transition: all 0.6s ease-in-out;
                    padding: 20px;
                    width: 100%;
                    .key {
                      color: ${color.brightBlue};
                    }
                }
            `}</style>
        </div>
    );
};

export default DrutinyDisplay;
