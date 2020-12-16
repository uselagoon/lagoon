const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const express = require('express');
const cors = require('cors');
const util = require('util');

import { createDeployTask, createPromoteTask, createRemoveTask, initSendToLagoonTasks } from '@lagoon/commons/dist/tasks';
import { logger } from '@lagoon/commons/dist/local-logging';
import { sendToLagoonLogs, initSendToLagoonLogs } from '@lagoon/commons/dist/logs';

initSendToLagoonTasks();
initSendToLagoonLogs();

const app = express()
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Listening on port ${server.address().port}`) // eslint-disable-line no-console
})

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressValidator());

const deprecationMessage = 'Deprecated API - This will be removed in the future, use GraphQL API instead.'

app.use(function(req, res, next) {
  res.setHeader('Warning', '299 - "' + deprecationMessage + '"');
  next();
})

app.get('/', (req, res) => {
  return res.status(200).send('welcome to rest2tasks - ' + deprecationMessage)
})

app.post('/pullrequest/deploy', async (req, res) => {

  req.checkBody({
    'projectName': {
      notEmpty: true,
      matches: {
        options: [/^[a-zA-Z0-9-_]+$/],
        errorMessage: 'projectName must be defined and must only contain alphanumeric, dashes and underline'
      },
    },
    'headBranchName': {
      notEmpty: true,
      matches: {
        options: [/^[a-zA-Z0-9-._\/]+$/],
        errorMessage: 'headBranchName must be defined and must only contain alphanumeric, dashes, underline, dots and slashes'
      },
    },
    'baseBranchName': {
      notEmpty: true,
      matches: {
        options: [/^[a-zA-Z0-9-._\/]+$/],
        errorMessage: 'baseBranchName must be defined and must only contain alphanumeric, dashes, underline, dots and slashes'
      },
    },
    'pullrequestTitle': {
      notEmpty: true,
      matches: {
        errorMessage: 'pullrequestTitle must be defined'
      },
    },
    'pullrequestNumber': {
      notEmpty: true,
      isInt: {},
      matches: {
        errorMessage: 'pullrequestNumber must be defined and a number'
      },
    },
    'headSha': { //
      notEmpty: true,
      isLength: {
        options: [{ min: 40, max: 40 }],
        errorMessage: 'Must be 40 chars long' // Error message for the validator, takes precedent over parameter message
      },
      matches: {
        options: [/^[a-f0-9]+$/],
        errorMessage: 'headSha needs to be a valid GIT SHA1'
      }
    },
    'baseSha': { //
      notEmpty: true,
      isLength: {
        options: [{ min: 40, max: 40 }],
        errorMessage: 'Must be 40 chars long' // Error message for the validator, takes precedent over parameter message
      },
      matches: {
        options: [/^[a-f0-9]+$/],
        errorMessage: 'baseSha needs to be a valid GIT SHA1'
      }
    }
  });

  const result = await req.getValidationResult()

  if (!result.isEmpty()) {
    res.status(400).send('There have been validation errors: ' + util.inspect(result.mapped()) + ' - ' + deprecationMessage);
    return;
  }

  const data = {
    pullrequestTitle: req.body.pullrequestTitle,
    pullrequestNumber: req.body.pullrequestNumber,
    projectName: req.body.projectName,
    type: 'pullrequest',
    headBranchName: req.body.headBranchName,
    headSha: req.body.headSha,
    baseBranchName: req.body.baseBranchName,
    baseSha: req.body.baseSha,
    branchName: `pr-${req.body.pullrequestNumber}`,
  }

  var meta = {
    projectName: data.projectName,
    pullrequestTitle: data.pullrequestTitle,
  }

  try {
    const taskResult = await createDeployTask(data);

    sendToLagoonLogs('info', data.projectName, '', `rest:pullrequest:deploy`, meta,
      `*[${data.projectName}]* REST deploy trigger \`${data.pullrequestTitle}\``
    )
    res.status(200).type('json').send({ "ok": "true", "message": taskResult, "warning": deprecationMessage})
    return;
  } catch (error) {
    switch (error.name) {
      case "ProjectNotFound":
      case "ActiveSystemsNotFound":
          res.status(404).type('json').send({ "ok": "false", "message": error.message, "warning": deprecationMessage})
          return;
        break;

      case "NoNeedToDeployBranch":
          res.status(501).type('json').send({ "ok": "false", "message": error.message, "warning": deprecationMessage})
          return;
        break;

      default:
          logger.error(error)
          res.status(500).type('json').send({ "ok": "false", "message": `Internal Error: ${error}`, "warning": deprecationMessage})
          return;
        break;
    }
  }

})

app.post('/deploy', async (req, res) => {

  req.checkBody({
    'projectName': {
      notEmpty: true,
      matches: {
        options: [/^[a-zA-Z0-9-_]+$/],
        errorMessage: 'projectName must be defined and must only contain alphanumeric, dashes and underline'
      },
    },
    'branchName': {
      notEmpty: true,
      matches: {
        options: [/^[a-zA-Z0-9-._\/]+$/],
        errorMessage: 'branchName must be defined and must only contain alphanumeric, dashes, underline, dots and slashes'
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
    res.status(400).send('There have been validation errors: ' + util.inspect(result.mapped()) + ' - ' + deprecationMessage);
    return;
  }

  const data = {
    projectName: req.body.projectName,
    branchName: req.body.branchName,
    sha: req.body.sha,
    type: 'branch'
  }

  try {
    const taskResult = await createDeployTask(data);

    const meta = {
      projectName: data.projectName,
      branchName: data.branchName,
      sha: ''
    }

    let logMessage = ''
    if (data.sha) {
      logMessage = `\`${data.branchName}\` (${data.sha.substring(0, 7)})`
      meta.sha = data.sha.substring(0, 7)
    } else {
      logMessage = `\`${data.branchName}\``
    }

    sendToLagoonLogs('info', data.projectName, '', `rest:deploy:receive`, meta,
      `*[${data.projectName}]* REST deploy trigger ${logMessage}`
    )
    res.status(200).type('json').send({ "ok": "true", "message": taskResult, "warning": deprecationMessage})
    return;
  } catch (error) {
    switch (error.name) {
      case "ProjectNotFound":
      case "ActiveSystemsNotFound":
          res.status(404).type('json').send({ "ok": "false", "message": error.message, "warning": deprecationMessage})
          return;
        break;

      case "NoNeedToDeployBranch":
          res.status(501).type('json').send({ "ok": "false", "message": error.message, "warning": deprecationMessage})
          return;
        break;

      default:
          logger.error(error)
          res.status(500).type('json').send({ "ok": "false", "message": `Internal Error: ${error}`, "warning": deprecationMessage})
          return;
        break;
    }
  }

})

app.post('/promote', async (req, res) => {

  req.checkBody({
    'projectName': {
      notEmpty: true,
      matches: {
        options: [/^[a-zA-Z0-9-_]+$/],
        errorMessage: 'projectName must be defined and must only contain alphanumeric, dashes and underline'
      },
    },
    'sourceEnvironmentName': {
      notEmpty: true,
      matches: {
        options: [/^[a-zA-Z0-9-._\/]+$/],
        errorMessage: 'sourceEnvironmentName must be defined and must only contain alphanumeric, dashes, underline, dots and slashes'
      },
    },
    'branchName': {
      notEmpty: true,
      matches: {
        options: [/^[a-zA-Z0-9-._\/]+$/],
        errorMessage: 'branchName must be defined and must only contain alphanumeric, dashes, underline, dots and slashes'
      },
    },
  });

  const result = await req.getValidationResult()

  if (!result.isEmpty()) {
    res.status(400).send('There have been validation errors: ' + util.inspect(result.mapped()) + ' - ' + deprecationMessage);
    return;
  }

  const data = {
    projectName: req.body.projectName,
    branchName: req.body.branchName,
    promoteSourceEnvironment: req.body.sourceEnvironmentName,
    type: 'promote'
  }

  const meta = {
    projectName: data.projectName,
    branchName: data.branchName,
    promoteSourceEnvironment: data.promoteSourceEnvironment
  }

  try {
    const taskResult = await createPromoteTask(data);

    const logMessage = `\`${data.branchName}\` -> \`${data.promoteSourceEnvironment}\``

    sendToLagoonLogs('info', data.projectName, '', `rest:promote:receive`, meta,
      `*[${data.projectName}]* REST promote trigger ${logMessage}`
    )
    res.status(200).type('json').send({ "ok": "true", "message": taskResult, "warning": deprecationMessage})
    return;
  } catch (error) {
    switch (error.name) {
      case "ProjectNotFound":
      case "ActiveSystemsNotFound":
          res.status(404).type('json').send({ "ok": "false", "message": error.message, "warning": deprecationMessage})
          return;
        break;

      case "NoNeedToDeployBranch":
          res.status(501).type('json').send({ "ok": "false", "message": error.message, "warning": deprecationMessage})
          return;
        break;

      default:
          logger.error(error)
          res.status(500).type('json').send({ "ok": "false", "message": `Internal Error: ${error}`, "warning": deprecationMessage})
          return;
        break;
    }
  }

})
