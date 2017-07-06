# amazeeio-logs

This is a nodejs helper called `amazeeio-logs` within the amazeeio lagoon deployment system.

It allows nodejs services to log messages to the `amazeeio-logs` rabbitmq exchange, which then are handled by other services like elasticsearch and slack.

## Usage

    import { sendToAmazeeioLogs, initSendToAmazeeioLogs } from '@amazeeio/amazeeio-logs';
    initSendToAmazeeioLogs();

    sendToAmazeeioLogs(severity: string, sitegroup: string, uuid: string, event: string, meta: object, message: string)

- `severity` - one of `error, warn, info, verbose, debug, silly` based on [winston log levels](https://github.com/winstonjs/winston#logging-levels)
- `sitegroup` -  sitegroup this log message belongs to, can be empty string
- `uuid` -  webhook uuid this log message belongs to, can be empty
- `event` - name of the event to be logged, is used to define were the log should be displayed later (like slack, hipchat, etc.)
- `meta` - additional information about the message in a javascript object
- `message` - human readable text of the log message, which will be used when the message is shown to humans (like slack)

## Hosting

Fully developed in Docker and hosted on amazee.io Openshift, see the `.openshift` folder. Deployed via Jenkinsfile.

Uses `amazeeio/centos7-node:node6` as base image.