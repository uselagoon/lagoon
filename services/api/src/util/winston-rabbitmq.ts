import Transport = require('winston-transport');
import rabbitChatter = require('rabbit-chatter');

export interface RabbitMQTransportOptions extends Transport.TransportStreamOptions {
  appId?: string;
  durable?: boolean;
  exchangeName?: string;
  exchangeType: string;
  host?: string;
  password?: string;
  port?: number;
  protocol?: string;
  routingKey?: string;
  timeout?: number;
  username?: string;
  virtualHost?: string;

  handleError?(err: any): void;
}

export class RabbitMQTransport extends Transport {
    private _rabbit: any;

    constructor(options: RabbitMQTransportOptions) {
      super(options);
      this.initializeRabbitMQConnection(options);
    }

    private initializeRabbitMQConnection(options: RabbitMQTransportOptions): void {
      const rabbitOptions = {
        appId: options.appId,
        silent: options.silent,
        exchangeType: options.exchangeType,
        exchangeName: options.exchangeName || 'lagoon-logs',
        durable: options.durable,
        protocol: options.protocol || 'amqp',
        username: options.username || 'guest',
        password: options.password || 'guest',
        host: options.host || 'localhost',
        virtualHost: options.virtualHost ? options.virtualHost : '',
        port: options.port || 5672,
        routingKey: options.routingKey || '',
        timeout: options.timeout || 1000,
        handleError: options.handleError,
      };
      this._rabbit = rabbitChatter.rabbit(rabbitOptions);
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
        severity: info.level ? info.level : 'info',
        project: info.project ? info.project : "",
        uuid: info.uuid ? info.uuid : "",
        event: info.event ? info.event : "api:unknownEvent",
        level: level,
        meta: meta ? meta : {},
        message: formattedMessage ? formattedMessage : message
      };
    }

    log(info: any, next: () => void): any {
      const lagoonLogs = this.parseLagoonLogsPayload(info);
      setImmediate(() => this.emit('logged', lagoonLogs));
      this._rabbit.chat(JSON.stringify(lagoonLogs))
      next();
    }
}

// @ts-ignore
// winston.transports.RabbitMQ = RabbitMQTransport;