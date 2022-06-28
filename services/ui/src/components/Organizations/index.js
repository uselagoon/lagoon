import React, { useState } from 'react';
import Link from 'next/link';
import css from 'styled-jsx/css';
import Highlighter from 'react-highlight-words';
import OrganizationLink from 'components/link/Organization';
import Box from 'components/Box';
import { bp, color, fontSize } from 'lib/variables';

const { className: boxClassName, styles: boxStyles } = css.resolve`
  .box {
    margin-bottom: 7px;

    .content {
      padding: 9px 20px 14px;
      @media ${bp.tinyUp} {
        display: flex;
      }
    }
  }
`;

/**
 * The primary list of organizations.
 */
const Organizations = ({ organizations = [] }) => {
  const [searchInput, setSearchInput] = useState('');

  const filteredOrganizations = organizations.filter(key => {
    const sortByName = key.name
      .toLowerCase()
      .includes(searchInput.toLowerCase());
    let sortByUrl = '';
    return ['name', 'environments', '__typename'].includes(key)
      ? false
      : (true && sortByName) || sortByUrl;
  });

  return (
    <>
      <div className="header">
        <label>Organizations</label>
        <label></label>
        <input
          aria-labelledby="search"
          className="searchInput"
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Type to search"
          disabled={organizations.length === 0}
        />
      </div>
      {!organizations.length && (
        <Box>
          <div className="organization">
            <h4>No organizations</h4>
          </div>
        </Box>
      )}
      {(searchInput && !filteredOrganizations.length) && (
        <Box>
          <div className="organization">
            <h4>No organizations matching "{searchInput}"</h4>
          </div>
        </Box>
      )}
      {filteredOrganizations.map(organization => (
        <OrganizationLink organizationSlug={organization.id} organizationName={organization.name} key={organization.id}>
          <Box className={boxClassName} >
            <div className="organization">
              <h4>
                <Highlighter
                  searchWords={[searchInput]}
                  autoEscape={true}
                  textToHighlight={organization.name}
                />
              </h4>
              <div className="description">
                  <Highlighter
                    searchWords={[searchInput]}
                    autoEscape={true}
                    textToHighlight={organization.description}
                  />
              </div>
            </div>
            <div className="customer">

            </div>
          </Box>
        </OrganizationLink>
      ))}
      <style jsx>{`
        .header {
          @media ${bp.tinyUp} {
            align-items: center;
            display: flex;
            justify-content: flex-end;
            margin: 0 0 14px;
          }
          @media ${bp.smallOnly} {
            flex-wrap: wrap;
          }
          @media ${bp.tabletUp} {
            margin-top: 40px;
          }
          .searchInput {
            background: url('/static/images/search.png') 12px center no-repeat
              ${color.white};
            background-size: 14px;
            border: 1px solid ${color.midGrey};
            height: 40px;
            padding: 0 12px 0 34px;
            transition: border 0.5s ease;
            @media ${bp.smallOnly} {
              margin-bottom: 20px;
              order: -1;
              width: 100%;
            }
            @media ${bp.tabletUp} {
              width: 30%;
            }
            &::placeholder {
              color: ${color.midGrey};
            }
            &:focus {
              border: 1px solid ${color.brightBlue};
              outline: none;
            }
          }
          label {
            display: none;
            padding-left: 20px;
            width: 50%;
            @media ${bp.tinyUp} {
              display: block;
            }
            &:nth-child(2) {
              @media ${bp.tabletUp} {
                width: 20%;
              }
            }
          }
        }
        .organization {
          font-weight: normal;

          @media ${bp.tinyUp} {
            width: 50%;
          }
        }
        .description {
          // color: ${color.darkGrey};
          line-height: 24px;
        }
        .customer {
          color: ${color.darkGrey};
          padding-top: 16px;
          @media ${bp.tinyUp} {
            padding-left: 20px;
          }
          @media ${bp.wideUp} {
            width: calc((100vw / 16) * 7);
          }
          @media ${bp.extraWideUp} {
            width: calc((100vw / 16) * 6);
          }
        }
      `}</style>
      {boxStyles}
    </>
  );
};

export default Organizations;
