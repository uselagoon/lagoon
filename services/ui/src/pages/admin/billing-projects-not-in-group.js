import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import * as R from 'ramda';
import moment from 'moment';
import { withRouter } from 'next/router';
import Head from 'next/head';
import MainLayout from 'layouts/MainLayout';
import css from 'styled-jsx/css';

import AllBillingGroupsQuery from 'lib/query/AllBillingGroups';
import AllProjectsAfterDateQuery from 'lib/query/AllProjectsAfterDate';
import ProjectGroupsByProjectNameQuery from 'lib/query/ProjectGroupsByProjectName';
import AddProjectToBillingGroupMutation from 'lib/mutation/AddProjectToBillingGroup';
import UpdateProjectBillingGroupMutation from 'lib/mutation/UpdateProjectBillingGroup';

import Box from 'components/Box';
import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';

import { AuthContext, adminAuthChecker } from '../../lib/Authenticator';

import { bp, color } from 'lib/variables';
import Button from 'components/Button';
import { database } from 'faker';



const BillingGroupSelect = ({billingGroups, project, activeBillingGroup}) => {

  const [values, setValues] = useState({billingGroup: activeBillingGroup ? activeBillingGroup : 'UNDEFINED'});
  const [addProjectToBillingGroup] = useMutation(AddProjectToBillingGroupMutation);

  const [updateProjectBillingGroup] = useMutation(UpdateProjectBillingGroupMutation);

  const handleChange = e => {
    const {name, value} = e.target;
    setValues({...values, [name]: value});

    const variables = { input: { project: { id: project.id }, group: { name: value } } };

    if (activeBillingGroup){
      updateProjectBillingGroup({ variables })
    }else {
      addProjectToBillingGroup({ variables })
    }
  }



  return (
    <div>
        {
          billingGroups &&
          <div>
            <div>
              Billing Group: &nbsp;
              <select
                id="billingGroup"
                name="billingGroup"
                onChange={handleChange}
                className="selectBillingGroup"
                value={values.billingGroup}
              >
                <option>No Billing Group</option>
                { billingGroups && billingGroups.map(g => (
                  <option key={`${g.name}-${g.value}`} value={g.value}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
        }
    </div>
  );
}


const Project = ({ project, allBillingGroups }) => {

  const {loading, error, data} = useQuery(ProjectGroupsByProjectNameQuery, { variables: { name: project.name }})

  if (error) {
    return {error};
  }

  if (loading){
    return null;
  }

  const billingGroups = data.project.groups.filter((group) => (group.type === 'billing') ? true : false);

  return(
    <>
    <Box>
      <div >
        <h2> {project.name} </h2>
        <div> Created: {project.created} </div>
        <div> Availability: {project.availability} </div>
        <div>Git URL: {data.project.gitUrl}</div>
        {
          <div className={billingGroups.length > 0 ? "hasBillingGroup" : "noBillingGroup"}>
            { <BillingGroupSelect billingGroups={allBillingGroups} project={project} activeBillingGroup={billingGroups.length > 0 ? billingGroups[0].name : null}/> }
          </div>
        }
      </div>
    </Box>
    <style jsx>{`
      h2 {
        margin-bottom: 0.25em;
      }
      .hasBillingGroup {
        background: lawngreen;
      }
      .noBillingGroup {
        background: lightpink;
      }
    `}</style>
    </>
  )
};


const ProjectsAfterDate = ({date, allBillingGroups}) => {

  const {loading, error, data}  = useQuery(AllProjectsAfterDateQuery, { variables: { createdAfter: `${moment(date).format('YYYY-MM-DD').toString()}` }})

  if (error) {
    return {error};
  }

  if (loading){
    return null;
  }

  const { allProjects: projects } = data;

  return (
    <div className="projects">
      {(!projects.length) && (
        <Box>
          <div className="project">
            <h4>No projects After Date</h4>
          </div>
        </Box>
      )}

      { projects.map((project, index) => <Project project={project} key={`${project.name}-${index}`} allBillingGroups={allBillingGroups} />)}

    </div>
  )
}

/**
 * Displays a billingGroupCost page, given the billingGroupCost name.
 */
export const BillingProjectsNotInBillingGroups = ({ router }) => {


  const seedDate = moment().startOf('month').subtract(2, 'month').format('YYYY-MM');

  const [values, setValues] = useState({afterDate: seedDate});

  const handleChange = e => {
    const {name, value} = e.target;
    setValues({...values, [name]: value});
  }

  const {data } = useQuery(AllBillingGroupsQuery)

  return (
    <>
      <Head>
        <title>Projects Not In Billing Groups</title>
      </Head>
      <MainLayout>

        <AuthContext.Consumer>
          {auth => {
            if (!adminAuthChecker(auth)) {
              return (<div className="content-wrapper"><div className="content">Seems that you do not have permissions to access this resource.</div></div>);
            }

            return (
              <div className="content-wrapper">
                <Box >
                  <label htmlFor="afterDate">Projects After </label>
                  <input
                    id="afterDate"
                    name="afterDate"
                    placeholder='Start date (YYYY-MM-DD)'
                    onChange={handleChange}
                    value={values.afterDate}
                  />
                  <ProjectsAfterDate date={values.afterDate} allBillingGroups={ data && data.allGroups ? data.allGroups : null } />
                </Box>
              </div>
            );

          }}
        </AuthContext.Consumer>

      </MainLayout>
      <style jsx>{`
        .error {
          margin: 1rem;
        }

        .noBillingGroup {
          background: #FF00;
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

        select {
          margin: 5px;
          width: 80%;
        }
      `}</style>
    </>
  );
};

export default withRouter(BillingProjectsNotInBillingGroups);
