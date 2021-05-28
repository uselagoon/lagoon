import React, { useState, useEffect, Suspense } from "react";
import css from 'styled-jsx/css';
import { bp, color, fontSize } from 'lib/variables';

import SelectFilter from 'components/Filters';
import ToggleDisplay from 'components/ToggleDisplay';

import { LazyLoadingSpinner, LoadingRowsContent, LazyLoadingContent } from 'components/Loading';


const ProjectsHeader = ({
    searchInput,
    onSearchInputChange,
    onToggleChange,
    onSort,
    display
}) => {

  const handleSearchInputCallback = (value) => {
    onSearchInputChange(value);
  };

  const handleToggleChangeCallback = () => {
    onToggleChange();
  };

  const handleSort = (values) => {
    onSort(values);
  }

  return (
    <div className="header">
        <SelectFilter
            title="Sort"
            defaultValue={{value: 'name', label: 'Project name'}}
            options={[
                {value: 'name', label: 'Project name'},
                {value: 'created', label: 'Recently created'},
                {value: 'id', label: 'Project ID'}
            ]}
            onFilterChange={handleSort}
        />
        <label></label>
        <ToggleDisplay
            action={handleToggleChangeCallback}
            disabled={display === 'list'}
        >
            L
        </ToggleDisplay>
        <ToggleDisplay
            action={handleToggleChangeCallback}
            disabled={display === 'detailed'}
        >
            D
        </ToggleDisplay>
        <input
            aria-labelledby="search"
            className="searchInput"
            type="text"
            value={searchInput}
            onChange={e => handleSearchInputCallback(e.target.value)}
            placeholder="Type to search"
            // disabled={projects.length === 0}
        />
        {/* <label>Showing {projects.length} project{projects.length == 1 ? "" : "s"}</label> */}
        <style jsx>{`
        .header {
            position: relative;
            // z-index: 15;

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
                background: url('/static/images/search.png') 12px center no-repeat ${color.white};
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
                // width: 50%;
                font-size: 12px;

                @media ${bp.tinyUp} {
                    display: block;
                }
                &:nth-child(2) {
                    @media ${bp.tabletUp} {
                    // width: 20%;
                    }
                }
            }
        }
    `}</style>
    </div>
   )
}

export default ProjectsHeader;
