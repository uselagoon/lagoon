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

var jobdata = Object();

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


var update_job = function( name, data ) {
  jobdata[name] = data;
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

// this function takes headers as it's easier for jenkins to send items that way.
app.post('/job', async (req, res) => {
  let jobname;
  let buildnumber;
  let jobevent;
  let jenkinsUrl;

  jobname = req.headers.jobname
  buildnumber = req.headers.buildnumber
  jobevent    = req.headers.jobevent || "ok"


  update_job( jobname, {
    'event' : jobevent,
    'when' :  new Date(),
    'buildnumber': buildnumber
  });



//  var jenkinsUrl = process.env.JENKINS_URL || "https://amazee:amazee4ever$1@ci-popo.amazeeio.cloud"
//  var jenkins = require('jenkins')({ baseUrl: jenkinsUrl, crumbIssuer: true });

   // jenkins.job.get(jobname, function(err, data) { console.log('job', data); });

//  jenkins.build.log(jobname, buildnumber, function(err, data) {
//   if (err) {
//     console.log('buildlog error', err) }
//      else {
//         console.log('build', data);  }
//  });


  res.status(200).type('json').send({"ok":"true"})


//  if (siteGroupOpenShift.siteGroup.openshift.jenkins) {
//    jenkinsUrl = siteGroupOpenShift.siteGroup.openshift.jenkins
//  } else {
//    jenkinsUrl = process.env.JENKINS_URL || "https://amazee:amazee4ever$1@ci-popo.amazeeio.cloud"
//  }


  // var jenkins = require('jenkins')({ baseUrl: jenkinsUrl, crumbIssuer: true });

});


var jobcheck = function() {
  console.log('jobcheck:')
  var d = new Date()
  for (let build in jobdata) {
    let job = jobdata[build]
    let w = job['when']
    let diff = (d - w) / 1000
    if (diff > 10) {
      console.log(" last update " + diff + " seconds ago.")
      console.log("build:", build)
      console.log(job)

      var jenkinsUrl = process.env.JENKINS_URL || "https://amazee:amazee4ever$1@ci-popo.amazeeio.cloud"
      var jenkins = require('jenkins')({ baseUrl: jenkinsUrl, crumbIssuer: true });


      jenkins.build.log(build, job.buildnumber, function(err, data) {
       if (err) {
         console.log('buildlog error', err) }
          else {
             console.log('build', data);  }
      });

    }

  }

}


setInterval(jobcheck, 2000);
