import React from 'react';
import ActiveStandby from './index';

export default {
  component: ActiveStandby,
  title: 'Components/ActiveStandby',
}

export const Default = () => (
  <ActiveStandby activeBranch="Master" standbyBranch="test" toggleHandler={()=> {console.log('you clicked me')}}/>
);
