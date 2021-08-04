import * as R from 'ramda';
import moment from 'moment';
import { useState, useEffect } from "react";


export const queryStringToObject = R.pipe(
  R.defaultTo(''),
  R.replace(/^\?/, ''),
  R.split('&'),
  R.map(R.split('=')),
  R.fromPairs
);

export const getLastCreatedDeployment = (deployments, unformatted = false) => {
  if (deployments.length === 0) {
    return null;
  }

  const sortCreated = deployments && deployments.filter(d => d.created).sort((a, b) => Date.parse(a.created) > Date.parse(b.created));
  const lastCreated = sortCreated && sortCreated.slice(0,1).shift() && sortCreated.slice(0,1).shift().created;

  if (unformatted) {
    return lastCreated
  }
  else {
    return <>{moment.utc(lastCreated).local().format('HH:mm:ss (DD-MM-YYYY)')}</>
  }
}

export const getLastCompletedDeployment = (deployments, unformatted = false) => {
  if (deployments.length === 0) {
    return null;
  }

  const sortCompleted = deployments && deployments.filter(d => d.completed).sort((a, b) => Date.parse(a.completed) > Date.parse(b.completed));
  const lastCompleted = sortCompleted && sortCompleted.slice(0,1).shift() && sortCompleted.slice(0,1).shift().completed;

  if (unformatted) {
    return lastCompleted
  }
  else {
    return <>{moment.utc(lastCompleted).local().format('HH:mm:ss (DD-MM-YYYY)')}</>
  }
}

export const getDeploymentIconFromStatus = (status) => {
    switch (status) {
    case "running":
      return {
        icon: "circle thin",
        color: "orange"
      }
      break;

    case "complete":
      return {
        icon: "circle thin",
        color: "green"
      }
      break;

    case "failed":
      return {
        icon: "circle thin",
        color: "red"
      }
      break;

    default:
      return {
        icon: "circle thhin",
        color: "grey"
      }
      break;
  }
}