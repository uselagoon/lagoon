import React, { useEffect } from 'react';
import css from 'styled-jsx/css';
import moment from 'moment';
import RestoreButton from 'components/RestoreButton';
import { bp, color, fontSize } from 'lib/variables';

const Backups = ({ backups, fetchMore }) => {

  useEffect(() => {
    if (fetchMore) {
      fetchMore();
    }
  }, [fetchMore]);

  return (
    <div className="backups">
      <div className="header">
        <label className="source">Source</label>
        <label className="created">Created</label>
        <label className="backupid">Backup id</label>
      </div>
      <div className="data-table">
        {!backups.length && <div className="data-none">No Backups</div>}
        {backups.map(backup => (
          <div className="data-row" key={backup.id}>
            <div className="source">{backup.source}</div>
            <div className="created">
              {moment
                .utc(backup.created)
                .local()
                .format('DD MMM YYYY, HH:mm:ss (Z)')}
            </div>

            <div className="backupid">{backup.backupId}</div>
            <div className="download">
              <RestoreButton backup={backup} />
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
      .header {
        @media ${bp.wideUp} {
          align-items: center;
          display: flex;
          margin: 0 0 14px;
          padding-right: 40px;
        }
        @media ${bp.smallOnly} {
          flex-wrap: wrap;
        }
        @media ${bp.tabletUp} {
          margin-top: 40px;
        }

        label {
          display: none;
          padding-left: 20px;
          @media ${bp.wideUp} {
            display: block;
          }

          &.source {
            width: 15%;
            @media ${bp.extraWideUp} {
              width: 10%;
            }
          }

          &.created {
            width: 25%;
            @media ${bp.extraWideUp} {
              width: 20%;
            }
          }

          &.backupid {
            width: 45%;
            @media ${bp.extraWideUp} {
              width: 55%;
            }
          }
        }
      }

      .data-table {
        background-color: ${color.white};
        border: 1px solid ${color.lightestGrey};
        border-radius: 3px;
        box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);

        .data-none {
          border: 1px solid ${color.white};
          border-bottom: 1px solid ${color.lightestGrey};
          border-radius: 3px;
          line-height: 1.5rem;
          padding: 8px 0 7px 0;
          text-align: center;
        }

        .data-row {
          border: 1px solid ${color.white};
          border-bottom: 1px solid ${color.lightestGrey};
          border-radius: 0;
          line-height: 1.5rem;
          padding: 8px 0 7px 0;
          @media ${bp.wideUp} {
            display: flex;
            justify-content: space-between;
            padding-right: 15px;
          }

          & > div {
            padding-left: 20px;
            @media ${bp.wideDown} {
              padding-right: 40px;
            }
            @media ${bp.wideUp} {
              &.source {
                width: 10%;
              }

              &.created {
                width: 20%;
              }

              &.download {
                align-self: center;
                width: 25%;
                @media ${bp.extraWideUp} {
                  width: 20%;
                }
              }
            }

            &.backupid {
              word-break: break-word;
              overflow: hidden;
              text-overflow: ellipsis;
              @media ${bp.wideUp} {
                width: 45%;
              }
              @media ${bp.extraWideUp} {
                width: 50%;
              }
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
      }
    `}</style>
  </div>
  )
};

export default Backups;
