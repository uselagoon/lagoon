import React, { useState, useEffect, Suspense } from "react";
import css from 'styled-jsx/css';
import { bp, color, fontSize } from 'lib/variables';
import { Grid } from 'semantic-ui-react';

import SelectFilter from 'components/Filters';
import ToggleDisplay from 'components/ToggleDisplay';

import { LazyLoadingSpinner, LoadingRowsContent, LazyLoadingContent } from 'components/Loading';

const TableHeader = ({
  searchInput,
  onSearchInputChange,
  onDisplayToggleChange,
  onSort,
  display
}) => {

  const handleSearchInputCallback = (value) => {
    onSearchInputChange(value);
  };

  const handleDisplayToggleChangeCallback = () => {
    onDisplayToggleChange();
  };

  const handleSort = (values) => {
    onSort(values);
  }

  return (
    <div className="table-header">
      <Grid columns={3} stackable>
        <Grid.Column>
          <SelectFilter
            title="Sort"
            placeholder={"Sort by..."}
            options={[
              {value: 'name', label: 'Name'},
              {value: 'created', label: 'Recently created'},
              {value: 'last-deployed', label: 'Last deployed'}
            ]}
            onFilterChange={handleSort}
          />
        </Grid.Column>
        <Grid.Column>
          <ToggleDisplay
            action={handleDisplayToggleChangeCallback}
            variant={display}
            icon={'list'}
            disabled={display === 'list'}
          />
          <ToggleDisplay
            action={handleDisplayToggleChangeCallback}
            variant={display}
            icon={'th list'}
            disabled={display === 'detailed'}
          />
        </Grid.Column>
        <Grid.Column>
          <input
            aria-labelledby="search"
            className="searchInput"
            type="text"
            value={searchInput}
            onChange={e => handleSearchInputCallback(e.target.value)}
            placeholder="Type to search"
          />
        </Grid.Column>
      </Grid>
      <style jsx>{`
        .table-header {
          .searchInput {
            background: url('/static/images/search.png') 12px center no-repeat ${color.white};
            background-size: 14px;
            border: 1px solid ${color.midGrey};
            height: 40px;
            padding: 0 12px 0 34px;
            transition: border 0.5s ease;
            width: 100%;

            @media ${bp.smallOnly} {
              margin-bottom: 20px;
              order: -1;
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
            font-size: 12px;

            @media ${bp.tinyUp} {
              display: block;
            }
          }
        }
      `}</style>
    </div>
  )
}

export default TableHeader;
