import React from "react";
import { bp, color, fontSize } from 'lib/variables';
import { getCreatedDate } from "components/Dates";

const DefaultDisplay = ({ problem }) => {
    const createdDate = getCreatedDate(problem.created);
    const data = JSON.parse(problem.data) || "";

    return (
        <div className="content-display-wrapper">
            {problem.description && problem.description.length > 0 && (<div className="field-wrapper">
                <label>Description</label>
                <div className="description">{problem.description}</div>
            </div>)}
            {createdDate && (<div className="field-wrapper">
                <label>Created</label>
                <div className="created">{createdDate}</div>
            </div>)}
            {problem.version && problem.version.length > 0 && (<div className="field-wrapper">
                <label>Version</label>
                <div className="version">{problem.version}</div>
            </div>)}
            {problem.fixedVersion && problem.fixedVersion.length > 0 && (<div className="field-wrapper">
                <label>Fixed in Version</label>
                <div className="fixed-version">{problem.fixedVersion}</div>
            </div>)}
            {problem.links && problem.links.length > 0 && (<div className="field-wrapper">
                <label>Associated link (CVE)</label>
                <div className="links"><a href={problem.links} target="_blank">{problem.links}</a></div>
            </div>)}
            {problem.service && problem.service.length > 0 && (<div className="field-wrapper">
                <label>Service</label>
                <div className="service">{problem.service}</div>
            </div>)}
            <div className="rawdata">
                <label>Data</label>
                <div className="rawdata-elements">
                    {Object.entries(data).map(([a, b]) => {
                        if (b) {
                            return (
                                <div key={`${a.toLowerCase()}-${problem.id}`} className="rawdata-element">
                                    <label>{a}</label>
                                    <div className="data">
                                        <pre>{b}</pre>
                                    </div>
                                </div>
                            );
                        }
                    })}
                </div>
            </div>
            <style jsx>{`
                .field-wrapper {
                    flex-direction: column;
                }
                .rawdata {
                    max-width: 100%;
                    .rawdata-elements {
                      border: 1px solid ${color.white};
                      border-bottom: 1px solid ${color.lightestGrey};
                      border-radius: 0;
                      line-height: 1.5rem;
                      padding: 8px 0 7px 0;
                      background-color: ${color.white};
                      border: 1px solid ${color.lightestGrey};
                      width: 100%;
                      @media ${bp.wideUp} {
                        display: flex;
                        justify-content: space-between;
                        flex-direction: column;
                      }
                      & > div {
                        padding-left: 20px;
                        @media ${bp.wideDown} {
                          padding-right: 40px;
                        }
                      }
                      &:hover {
                        border: 1px solid ${color.brightBlue};
                      }
                      &:first-child {
                        border-top-left-radius: 3px;
                        border-top-right-radius: 3px;
                      }
                      &:last-child {
                        border-bottom-left-radius: 3px;
                        border-bottom-right-radius: 3px;
                      }
                    }
                    pre {
                      font-family: monospace, monospace;
                      font-size: 1em;
                      width: 100%;
                      white-space: pre-wrap;
                      overflow-y: scroll;
                    }
                    .row-heading {
                      cursor: pointer;
                    }
                    .row-data {
                      padding: 0;
                      margin: 0;
                      background: #2d2d2d;
                      color: white;
                      font: 0.8rem Inconsolata, monospace;
                      line-height: 2;
                      transition: all 0.6s ease-in-out;
                    }
                }
            `}</style>
        </div>
    );
};

export default DefaultDisplay;
