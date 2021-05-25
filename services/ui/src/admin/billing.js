import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import * as R from 'ramda';
import moment from 'moment';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';

import BillingGroupCostsQuery from 'lib/query/BillingGroupCosts';
import AllBillingModifiersQuery from 'lib/query/AllBillingModifiers';
import GroupByName from 'lib/query/GroupByName';

import BarChart from "components/BillingGroupBarChart";
import BillingGroup from "components/BillingGroup";
import Projects from "components/BillingGroupProjects";
import Invoice from "components/BillingGroupInvoice";
import AllBillingModifiers from "components/BillingModifiers/AllBillingModifiers";
import AddBillingModifier from "components/BillingModifiers/AddBillingModifier";

import Breadcrumbs from 'components/Breadcrumbs';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';

import { AuthContext, adminAuthChecker } from 'lib/Authenticator';

import { bp, color } from 'lib/variables';
import Button from 'components/Button';


const yearsToShow = 2;
const currMonth = moment().format('MM').toString();
const currYear = parseInt(moment().format('YYYY'), 10);
const years = Array.from({length: yearsToShow}, (v, k) => (currYear - yearsToShow) + k + 1).sort((a, b) => b - a);

const monthsToGraph = 2;

const months = [
  {name: "January", value: "01"},
  {name: "February", value: "02"},
  {name: "March", value: "03"},
  {name: "April", value: "04"},
  {name: "May", value: "05"},
  {name: "June", value: "06"},
  {name: "July", value: "07"},
  {name: "Aug", value: "08"},
  {name: "Sept", value: "09"},
  {name: "Oct", value: "10"},
  {name: "Nov", value: "11"},
  {name: "Dec", value: "12"},
];

export const AvailabilityError = ({group}) => {
  const {loading, error, data} = useQuery(GroupByName, {variables: {name: group}});

  if (loading) {
    return <div>Loading...</div>
  }

  const { groupByName: { projects }} = data

  return (
    <div className="content-wrapper">
      <div className="content">
        <h1>Error: All projects in this billing group do not have the same availability.</h1>
        <p>Unfortunately we can't yet generate billing costs with mixed availability.</p>
        <p>Please pass along the following information to one of your friendly billing engineers.</p>

        <div className="data-table">
          <div className="data-heading">
            <div className="data-head">ID</div>
            <div className="data-head">NAME</div>
            <div className="data-head">AVAILABILITY</div>
          </div>
          {
            projects.map(project => {
              const {id, name, availability} = project;
              return(
                <div className="data-row" key={`${id}-${name}`}>
                  <div className="data-cell id">{id}</div>
                  <div className="data-cell name">{name}</div>
                  <div className="data-cell availability">{availability}</div>
                </div>
              );
            })
          }
        </div>
      </div>
      <style jsx>{`
        h1{
          line-height: normal;
        }
        .data-table {
          display: table;
          background-color: ${color.white};
          border: 1px solid ${color.lightestGrey};
          border-radius: 3px;
          box-shadow: 0px 4px 8px 0px rgba(0, 0, 0, 0.03);

          .data-row {
            display: table-row;
            width: 100%;
          }

          .data-heading {
            display: table-header-group;
            background-color: #ddd;
          }

          .data-cell, .data-head {
            display: table-cell;
            text-align: left;
            padding: 15px;
            width: 100%;
          }


          .name {
            font-weight: bold;
            margin-left: 15px;
            white-space: nowrap;
          }

        }
        .content-wrapper {
          @media ${bp.desktopUp} {
            display: flex;
            justify-content: space-between;
          }
        }
        .content {
          padding: 32px calc((100vw / 16) * 1);
          width: 100%;
        }
      `}</style>
    </div>
  );
}

/**
 * Displays a billingGroupCost page, given the billingGroupCost name.
 */
export const PageBillingGroup = ({ router }) => {

  const { billingGroupName: group, year: yearSlug, month: monthSlug, lang } = router.query;
  const [costs, setCosts] = useState([]);

  const queries = [];
  for (let i = monthsToGraph; i >= 0; i--) {
    queries.push(useQuery(BillingGroupCostsQuery, { variables: { input: { name: group }, month: moment().subtract(i, 'M').format('YYYY-MM').toString() } }))
  }

  const [editModifier, setEditModifier] = useState({ });

  useEffect(() => {
    const result = queries.map(({loading, error, data}) => {
      if (error) {
        return {error};
      }

      if (loading){
        return {loading};
      }

      if (data && data.costs) {
        return (data.costs)
      }
      return {};
    });

    // for (let i = 0; i <= 5; i++) {
    //   if(queries[i].data && queries[i].data.costs) {
    //     setCosts([...costs, queries[i].data.costs]);
    //   }
    // }
    setCosts(result);
  }, queries)

  const [values, setValues] = useState({ month: monthSlug ? monthSlug: currMonth, year: yearSlug? yearSlug : currYear });
  const {month, year} = values;
  const handleChange = e => {
    const {name, value} = e.target;
    setValues({...values, [name]: value});
  }

  const prevSubmitHandler = () => {
    //currently we can't go back more than 2 months
      const dateTime = `${values.year}-${values.month}-01 0:00:00.000`;
      const date = new Date(dateTime);

      // const monthDifference =  Math.round(moment(new Date()).diff(date, 'months', true));
      // if(monthDifference < 3){
        const [year, month] = moment(date).subtract(1, 'M').format('YYYY-MM').toString().split('-');
        setValues({month, year});
      // }
  }



  const nextSubmitHandler = () => {
    const dateTime = `${values.year}-${values.month}-01 0:00:00.000`;
    const date = new Date(dateTime);
    const [year, month] = moment(date).add(1, 'M').format('YYYY-MM').toString().split('-');
    setValues({month, year});
  }

  const editModifierHandler = (modifier) => {
    setEditModifier(modifier)
  }

  return(
  <>
    <Head>
      <title>{`${router.query.billingGroupName} | Project`}</title>
    </Head>
    <MainLayout>

      <AuthContext.Consumer>
        {auth => {
          if (!adminAuthChecker(auth)) {
            return (<div className="content-wrapper"><div className="content">Seems that you do not have permissions to access this resource.</div></div>);
          }

          if (costs.length > 0 && costs[0].loading){
            return (<div className="content-wrapper"><div className="content"><h3>Loading...</h3></div></div>);
          }

          if (costs.length > 0 && costs[0].error){
            if (costs[0].error.message.includes("Projects must have the same availability") ){
              return (<AvailabilityError group={group} />);
            }

            if (costs[0].error.message.includes("Cannot read property 'availability' of undefined")){
              return (<div className="content-wrapper"><div className="content"><div>This billing group does not seem to have any projedcts.</div></div></div>);
            }

            return (<div className="content-wrapper"><div className="content"><div>{costs[0].error.message}</div></div></div>);
          }

          const selectedMonthCosts = costs.find(o => o.yearMonth === `${values.year}-${values.month}`);

            return (
              <div>
                <div className="barChart-wrapper">
                  { selectedMonthCosts && <BarChart data={costs} /> }
                </div>

                <div className="monthYear-wrapper">
                  <div className="month">
                    <label htmlFor="month">Month</label>
                    <select
                      id="month"
                      name="month"
                      onChange={handleChange}
                      aria-labelledby="Month"
                      label='Month'
                      className="selectMonth"
                      value={values.month}
                    >
                      {months.map(m => (
                        <option key={`${m.name}-${m.value}`} value={m.value}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="year">
                    <label htmlFor="Year">Year</label>
                    <select
                      id="year"
                      name="year"
                      onChange={handleChange}
                      aria-labelledby="year"
                      label='Year'
                      className="selectYear"
                      value={values.year}
                    >
                      {years.map(year => (
                        <option key={`${year}`} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="content-wrapper">
                  <div className="leftColumn">
                    <div>
                      { selectedMonthCosts &&  <BillingGroup billingGroupCosts={selectedMonthCosts} /> }
                      { !selectedMonthCosts && <div>Sorry, we don't have billing data for this month.</div>}
                      <div className="btnWrapper">
                        <Button action={prevSubmitHandler}>Previous Month</Button>
                        <Button disabled={(values.year >= currYear && values.month >= currMonth) ? true: false} action={nextSubmitHandler}>Next Month</Button>
                      </div>
                      { selectedMonthCosts && <Projects projects={selectedMonthCosts.projects} /> }
                    </div>
                  </div>
                  <div className="rightColumn">
                    {
                      <Query query={AllBillingModifiersQuery} variables={{ input: { name: group } }} >
                        {R.compose(withQueryLoading, withQueryError)(
                          ({ data: { allBillingModifiers: modifiers } }) => <AllBillingModifiers group={group} modifiers={modifiers} month={`${year}-${month}`} editHandler={editModifierHandler} />
                        )}
                      </Query>
                    }
                    <AddBillingModifier group={group} month={`${year}-${month}`} editBillingModifier={editModifier} editHandler={editModifierHandler} />
                  </div>
                </div>
                <div className="content-wrapper">
                  { selectedMonthCosts && <Invoice cost={selectedMonthCosts} language={lang} /> }
                </div>

              </div>
            );

        }}
      </AuthContext.Consumer>

    </MainLayout>
    <style jsx>{`

      .btnWrapper {
        padding: 20px 0 0 0;
        display: flex;
        justify-content: space-between;
        .btn {
          padding: 0 10px 0;
        }
      }

      .error {
        margin: 1rem;
      }

      .barChart-wrapper {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: center;
        height: 250px;
        padding: 0 40px 0 15px;
        margin: 0 0 10px;
        min-height: 150px;
        @media ${bp.tabletUp} {
          margin: 15px 0 10px;
        }
      }

      .monthYear-wrapper {
        display: flex;
        width: 100%;
        margin: 0 10px;
        @media ${bp.tabletUp} {
          margin: 0 1rem;
          width: 75%;
        }
        @media ${bp.wideUp} {
          margin: 0 1rem;
          width: 50%;
        }
      }

      .content-wrapper {
        @media ${bp.desktopUp} {
          display: flex;
          justify-content: space-between;
        }
      }
      .content {
        padding: 32px calc((100vw / 16) * 1);
        width: 100%;
      }

      .leftColumn, .rightColumn {
        width: 100%;
        @media ${bp.tabletUp} {
          margin: 1rem;
        }
      }

      .invoiceContainer {
        width: 100%;
      }

      .monthYearContainer {
        display: flex;
        justify-content: space-between;
      }
      .month {
        width: 50%;
      }
      .year {
        width: 50%;
      }
      select {
        margin: 5px;
        width: 80%;
      }
    `}</style>
  </>
)};

export default withRouter(PageBillingGroup);
