// @flow

require("babel-polyfill");

import bodyParser from 'body-parser'
import expressValidator from 'express-validator'
import express from 'express'
import cors from 'cors'
import util from 'util'

import { createDeployTask, createRemoveTask, initSendToAmazeeioTasks } from '@amazeeio/amazeeio-tasks';
import { logger, initLogger } from '@amazeeio/amazeeio-local-logging';

initLogger();
initSendToAmazeeioTasks();

const app = express()
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Listening on port ${server.address().port}`) // eslint-disable-line no-console
})

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressValidator());

app.get('/', (req, res) => {
  return res.status(200).send('welcome to rest2tasks')
})

app.post('/deploy', async (req, res) => {

  req.checkBody({
    'siteGroupName': {
      notEmpty: true,
      matches: {
        options: [/^[a-zA-Z0-9-_]+$/],
        errorMessage: 'siteGroupName must be defined and must only contain alphanumeric, dashes and underline'
      },
    },
    'branchName': {
      notEmpty: true,
      matches: {
        options: [/^[a-zA-Z0-9-_\/]+$/],
        errorMessage: 'branchName must be defined and must only contain alphanumeric, dashes, underline and slashes'
      },
    },
    'sha': { //
      optional: {
        options: { checkFalsy: true } // or: [{ checkFalsy: true }]
      },
      isLength: {
        options: [{ min: 40, max: 40 }],
        errorMessage: 'Must be 40 chars long' // Error message for the validator, takes precedent over parameter message
      },
      matches: {
        options: [/^[a-f0-9]+$/],
        errorMessage: 'sha needs to be a valid GIT SHA1'
      }
    }
  });

  const result = await req.getValidationResult()

  if (!result.isEmpty()) {
    res.status(400).send('There have been validation errors: ' + util.inspect(result.mapped()));
    return;
  }

  const data = {
    siteGroupName: req.body.siteGroupName,
    branchName: req.body.branchName,
    sha: req.body.sha
  }

  try {
    const taskResult = await createDeployTask(data);
    res.status(200).type('json').send({ "ok": "true", "message": taskResult})
    return;
  } catch (error) {
    switch (error.name) {
      case "SiteGroupNotFound":
      case "ActiveSystemsNotFound":
          res.status(404).type('json').send({ "ok": "false", "message": error.message})
          return;
        break;

      default:
          res.status(500).type('json').send({ "ok": "false", "message": `Internal Error: ${error}`})
          return;
        break;
    }
  }

})

app.post('/remove', async (req, res) => {

  req.checkBody({
    'siteGroupName': {
      notEmpty: true,
      matches: {
        options: [/^[a-zA-Z0-9-_]+$/],
        errorMessage: 'siteGroupName must be defined and must only contain alphanumeric, dashes and underline'
      },
    },
    'openshiftRessourceAppName': {
      notEmpty: true,
      matches: {
        options: [/^[a-zA-Z0-9-]+$/],
        errorMessage: 'openshiftRessourceAppName must be defined and must only contain alphanumeric and dashes'
      },
    }
  });

  const result = await req.getValidationResult()

  if (!result.isEmpty()) {
    res.status(400).send('There have been validation errors: ' + util.inspect(result.mapped()));
    return;
  }

  const data = {
    siteGroupName: req.body.siteGroupName,
    openshiftRessourceAppName: req.body.openshiftRessourceAppName
  }

  try {
    const taskResult = await createRemoveTask(data);
    res.status(200).type('json').send({ "ok": "true", "message": taskResult})
    return;
  } catch (error) {
    switch (error.name) {
      case "SiteGroupNotFound":
      case "ActiveSystemsNotFound":
          res.status(404).type('json').send({ "ok": "false", "message": error.message})
          return;
        break;

      default:
          res.status(500).type('json').send({ "ok": "false", "message": `Internal Error: ${error}`})
          return;
        break;
    }
  }

})
