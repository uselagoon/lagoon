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
const { Jenkins } = require('jenkins');
import { sendToAmazeeioLogs, initSendToAmazeeioLogs } from '@amazeeio/amazeeio-logs';
initSendToAmazeeioLogs();

import { logger, initLogger } from '@amazeeio/amazeeio-local-logging';

var jobdata = Object();

initLogger();

const crypto = require('crypto');
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

var upload_logs = async function(path, log, callback) {
  var accesskeyid =  process.env.AWS_KEY_ID
  var secretaccesskey =  process.env.AWS_SECRET_ACCESS_KEY
  var region = process.env.AWS_REGION || 'us-east-2'
  var bucket = process.env.AWS_BUCKET || 'jobs.amazeeio.services'


  if ( !accesskeyid || !secretaccesskey) {
    console.log('s3 credentials not set.')
  }

  var AWS = require('aws-sdk');
  AWS.config.update({accessKeyId: accesskeyid, secretAccessKey: secretaccesskey, region: region});
  var s3 = new AWS.S3();

  var params = {
    Bucket: bucket,
    Key:    path,
    Body:   log,
    ACL:    'public-read',
    ContentType: 'text/plain',
  };

  s3.upload(params, callback);

};


var watch = async function(message) {
  var payload = JSON.parse(message.content.toString())
  console.log('watch: got payload', payload)
}


var update_job = function( name, data ) {
  jobdata[name] =  Object.assign({},  jobdata[name], data);
  console.log( "adding ", name, " to array with ", data)
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

  var jenkinsUrl = process.env.JENKINS_URL || "https://amazee:amazee4ever$1@ci-popo.amazeeio.cloud"
  var jenkins = require('jenkins')({ baseUrl: jenkinsUrl, crumbIssuer: true });


  jenkins.job.get('ci-node_subfolder1/deploy-branch1', function(err, data) {
  if (err) throw err;

  console.log('job', data);
});

  return res.status(200).send('welcome to jobwatch')
})

// this function takes headers as it's easier for jenkins to send items that way.
app.post('/job', async (req, res) => {
  let jobname;
  let buildnumber;
  let jobevent;
  let jenkinsUrl;
  let path;
  let sitegroup;

  jobname = req.headers.jobname
  buildnumber = req.headers.buildnumber
  jobevent    = req.headers.jobevent || "ok"
  path        = req.headers.path
  sitegroup   = req.headers.sitegroup

  console.log("received update ", buildnumber , " for job ", jobname)

if (parseInt(buildnumber) > 0 ) {
  update_job( jobname, {
    'event' : jobevent,
    'path':  path,
    'sitegroup': sitegroup,
    'created' :  new Date(),
    'updated' : 0,
    'buildnumber': buildnumber
  });
  }

  res.status(200).type('json').send({"ok":"true"})

});


var jobcheck = function() {
  console.log("jobcheck firing with ", Object.keys(jobdata).length, " builds.")
  var jenkinsUrl = process.env.JENKINS_URL || "https://amazee:amazee4ever$1@ci-popo.amazeeio.cloud"
  var jenkins = require('jenkins')({ baseUrl: jenkinsUrl, crumbIssuer: true });

  var d = new Date()
  for (let build in jobdata) {
    if (build == undefined ){
      console.log( "undefined build: ", build)
      continue;
    }
    var job = jobdata[build]
    let w = job['created']
    let diff = (d - w) / 1000


    if (diff > 5 && job.buildnumber) {

      jenkins.build.get(build, parseInt(job.buildnumber), function(err, data) {
        if (err) throw err;

        if (data.building) {
          jobdata[build]['updated'] = new Date()
        }  else {

          const entropy = job.buildnumber +  job.created + job.path
          const hash = crypto.createHash('sha256', entropy).digest('hex');

          let log_path = job.path[0] + '/' + job.path + '/' + hash + '/' + job.buildnumber + '.txt'

          jenkins.build.log(build, parseInt(job.buildnumber), function(err, buildlogdata) {

             let uri = upload_logs(log_path, "build finished after " + diff + " seconds.\n" + buildlogdata,
                function(err,data) {

                  let uri = data.Location
                  sendToAmazeeioLogs('start', job.sitegroup, "", "task:jobwatch:finished", {}, uri )
                  delete jobdata[build]
                }) // upload_logs

          }) // jenkins.build.log




        }
      }); // jenkins.build.get



    }
  }
}


setInterval(jobcheck, 10000);
