import React, { useState, useEffect } from 'react';
import * as R from 'ramda';
import moment from 'moment';
import { withRouter } from 'next/router';
import Head from 'next/head';
import { Query } from 'react-apollo';
import MainLayout from 'layouts/MainLayout';
import css from 'styled-jsx/css';

import { format } from 'date-fns'
import { enGB } from 'date-fns/locale'
import { DatePicker, useDateInput } from 'react-nice-dates'

import 'react-nice-dates/build/style.css'

import AllProjectsAfterDateQuery from 'lib/query/AllProjectsAfterDate';

import Highlighter from 'react-highlight-words';

import Box from 'components/Box';
import Breadcrumbs from 'components/Breadcrumbs';

import renderWhile from 'lib/renderWhile';

import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';

import { AuthContext, adminAuthChecker } from 'lib/Authenticator';

import { bp, color } from 'lib/variables';
import { LoadingPageNoHeader } from 'pages/_loading';
import Button from 'components/Button';

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

export const PageProjects = ({ router }) => {

  const seedDate = new Date(moment().startOf('month').format('YYYY-MM-DD'));
  const [date, setDate] = useState(seedDate);

  const inputProps = useDateInput({
    date,
    format: 'yyyy-MM-dd',
    locale: enGB,
    onDateChange: setDate
  })

  return(
  <>
    <Head>
      <title>{`Admin | Projects`}</title>
    </Head>
    <MainLayout>
      <div className="content-wrapper">
        <div className="content">
          <AuthContext.Consumer>
            {auth => {
              if (adminAuthChecker(auth)) {
                return (
                  <div>
                    New projects after date:
                    <DatePicker date={date} onDateChange={setDate} locale={enGB}>
                      {({ inputProps, focused }) => (
                        <input className={'input' + (focused ? '-focused' : '')} {...inputProps} />
                      )}
                    </DatePicker>
                    <Query query={AllProjectsAfterDateQuery} variables={{ createdAfter: `${moment(date).format('YYYY-MM-DD').toString()}` }} >

                      {R.compose(renderWhile(
                          ({ loading }) => loading,
                          LoadingPageNoHeader
                        ), withQueryError)(
                        ({data: { allProjects: projects}} ) => {


                          return(
                            <div className="projects">

                            {(!projects.length) && (
                              <Box>
                                <div className="project">
                                  <h4>No projects After Date</h4>
                                </div>
                              </Box>
                            )}
                            {projects.map((project, index) => {

                              // const billingGroup = project.groups.find(group => group.type === "billing");

                              return(
                                <Box className={boxClassName} key={`${project.name}-${index}`} >
                                  <div className="project">
                                    <h2> {project.name} </h2>
                                    <div> Created: {project.created} </div>
                                    <div> Availability: {project.availability} </div>
                                    {/* { billingGroup ? <div> Billing Group: {billingGroup.name} </div> : null } */}
                                    <div className="environments">
                                      { project.environments.length > 0 ? <h5>Environments</h5> : null }
                                      { project.environments.map((environment, index) => (
                                        <div key={`${environment.name}-${index}`}>{environment.name}</div>
                                      ))}
                                    </div>
                                  </div>
                                </Box>

                            )}
                            )}



                            </div>
                          );
                        }
                      )}
                    </Query>
                  </div>
                );
              }

              return (<div className="content-wrapper"><div className="content">Seems that you do not have permissions to access this resource.</div></div>);
            }}
      </AuthContext.Consumer>
        </div>
      </div>
    </MainLayout>
    <style jsx>{`

      .projects {
        padding: 20px 0 20px 0;
      }

      .environments {
        padding: 20px 0 0 0;
      }

      .btnWrapper {
        padding: 20px 0 0 0;
        display: flex;
        justify-content: space-between;
        .btn {
          padding: 0 10px 0;
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
        @media ${bp.tabletUp} {
          display: flex;
          justify-content: space-between;
        }
      }
      .content {
        padding: 32px calc((100vw / 16) * 1);
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

export default withRouter(PageProjects);
