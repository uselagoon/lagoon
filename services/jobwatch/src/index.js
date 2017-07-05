// @flow

require("babel-polyfill");

import amqp from 'amqp-connection-manager';
import jenkinsLib from 'jenkins'
import bodyParser from 'body-parser'
import expressValidator from 'express-validator'
import express from 'express'
import cors from 'cors'
import util from 'util'
import Transport from 'lokka-transport-http';
import Lokka from 'lokka';

import { logger, initLogger } from '@amazeeio/amazeeio-local-logging';

let myhash = {};

initLogger();

const amazeeioapihost = process.env.AMAZEEIO_API_HOST || "https://api.amazeeio.cloud"
const rabbitmqhost = process.env.RABBITMQ_HOST || "localhost"
const connection = amqp.connect([`amqp://${rabbitmqhost}`], {json: true});

const amazeeioAPI = new Lokka({
  transport: new Transport(`${amazeeioapihost}/graphql`)
});

connection.on('connect', ({ url }) => logger.verbose('Connected to %s', url));
connection.on('disconnect', params => logger.error('Not connected, error: %s', params.err.code, { reason: params }));

const channelWrapper = connection.createChannel({
    setup: function(channel) {
        return Promise.all([
            channel.assertQueue('amazeeio:jobwatch', {durable: true}),
            channel.prefetch(1),
            channel.consume('amazeeio:jobwatch', watch, {noAck: true}),
        ])
    }
});

// const CW: ChannelWrapper = connection.createChannel();
var mypush = async (payload): Promise<void> => {
    const buffer = new Buffer(JSON.stringify(payload));
await channelWrapper.sendToQueue('amazeeio:jobwatch', buffer, { persistent: true })
}


var watch = async function(message) {
  var payload = JSON.parse(message.content.toString())
  console.log('watch: got payload', payload)

}


const app = express()
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Listening on port ${server.address().port}`) // eslint-disable-line no-console
})

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(expressValidator());




app.get('/', (req, res) => {
  return res.status(200).send('welcome to jobwatch')
})

app.post('/job', async (req, res) => {

  var sitegroupname =  req.body.sitegroupname
  var branchname = req.body.branchname
  var jobevent =  req.body.jobevent

  const siteGroupOpenShift = await amazeeioAPI.query(`
    {
      siteGroup:siteGroupByName(name: "${sitegroupname}"){
        openshift
        client {
          deployPrivateKey
        }
        gitUrl
      }
    }
    `)



  var d = new Date();
  mypush( {
    'event' : jobevent,
    'when' :  d
  });

  let jenkinsUrl

  if (siteGroupOpenShift.siteGroup.openshift.jenkins) {
    jenkinsUrl = siteGroupOpenShift.siteGroup.openshift.jenkins
  } else {
    jenkinsUrl = process.env.JENKINS_URL || "https://amazee:amazee4ever$1@ci-popo.amazeeio.cloud"
  }


  var jenkins = require('jenkins')({ baseUrl: jenkinsUrl, crumbIssuer: true });

//   jenkins.job.list(function(err, data) {
//     if (err) throw err;
//
//     console.log('jobs', data);
//     for (var i in data) {
//       console.log(data[i].name)
//     }
//   });
console.log('------')
jenkins.job.get('ci-node_subfolder1', function(err, data) {
  if (err) throw err;

  //  console.log('job', data);
  console.log(data.jobs[0]);
});

  try {
    res.status(200).type('json').send({"ok":"true"})
    // const taskResult = await createDeployTask(data);
    // res.status(200).type('json').send({ "ok": "true", "message": taskResult})
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
