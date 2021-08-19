import Transport = require('winston-transport');
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs';

export class RabbitMQTransport extends Transport {
    constructor(options) {
      super(options);
    }

    private parseLagoonLogsPayload = (info) => {
      let message: string;
      if (info.message !== undefined) {
        message = info.message;
      }

      const level = info[Symbol.for('level')] || info.level;
      const formattedMessage = info[Symbol.for('message')];

      const meta = Object.fromEntries(
        Object.entries(info).filter(([key]) => typeof key !== 'symbol'))

      return {
        severity: 'info',
        project: info.project ? info.project : "",
        uuid: info.uuid ? info.uuid : "",
        event: info.event ? info.event : "api:unknownEvent",
        meta: meta ? meta : {},
        message: formattedMessage ? formattedMessage : message,
        level: level ? level : ""
      };
    }

    log(info: any, next: () => void): any {
      const lagoonLogsPayload = this.parseLagoonLogsPayload(info);
      setImmediate(() => this.emit('logged', lagoonLogsPayload));

      sendToLagoonLogs(
        lagoonLogsPayload.severity,
        lagoonLogsPayload.project,
        lagoonLogsPayload.uuid,
        lagoonLogsPayload.event,
        lagoonLogsPayload.meta,
        lagoonLogsPayload.message
      );
      next();
    }
}

// @ts-ignore
// winston.transports.RabbitMQ = RabbitMQTransport;