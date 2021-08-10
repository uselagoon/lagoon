import winston, { Logger } from 'winston';
const { addColors, createLogger, format, transports } = require('winston');
import { RabbitMQTransport } from '../util/winstonRabbitmqTransport';

export interface IUserActivityLogger extends winston.Logger {
  user_info: winston.LeveledLogMethod;
  user_auth: winston.LeveledLogMethod;
  user_action: winston.LeveledLogMethod;
}

export interface IUserReqHeader {
  'user-agent'?: string,
  host?: string,
  origin?: string,
  referer?: string
}

export interface IMetaLogger {
  project?: string,
  uuid?: string,
  event?: string,
  user?: {
    id?: string
    user: string,
    sub?: string,
    email?: string,
    group?: string,
    aud?: string,
    iss?: string,
    iat?: string,
    accessed?: Date,
    access_token?: any,
    source?: string,
    roles?: string,
  },
  headers?: IUserReqHeader
  payload?: {}
}

export const getUserActivityLogger = (user: any, headers?: any): IUserActivityLogger => {
  if (user) {
    userActivityLogger.defaultMeta = { user, headers }
  }

  return userActivityLogger;
}

const { colors, levels } = {
  levels: {
    user_info: 1,
    user_auth: 2,
    user_action: 3,
  },
  colors: {
    user_info: 'cyan',
    user_auth: 'cyan',
    user_action: 'green',
  }
};

addColors(colors);

const parseMeta = (meta: IMetaLogger) => {
  if (meta) {
    Object.keys(meta).map(key => {
      if (meta[key] != undefined) {
        if (key === 'user') {
          const { user: username, email, source, iat, iss, sub, aud, access_token } = meta[key];

          if (access_token) {
            const { preferred_username, email, sub, azp: source, aud, iat, realm_access } = access_token.content;
            meta[key] = {
              id: sub,
              user: preferred_username,
              email,
              aud,
              accessed: new Date(iat * 1000),
              source,
              roles: realm_access.roles,
            }
          }
          else {
            // Legacy token
            meta[key] = { id: sub, user: username, email, source, iss, aud, iat }
          }
        }

        if (key === 'headers') {
          const { 'user-agent': user_agent, host, origin, referer } = meta[key];
          meta[key] = { 'user-agent': user_agent, host, origin, referer }
        }
      }
    });

    return JSON.stringify(meta);
  }
  return '';
};

const parseMessage = (info) => {
  let message, level: string;
  let meta: IMetaLogger;
  if (info.message !== undefined) {
    message = info.message;
  }

  if (info.user) {
    meta = { user: {...info.user}, headers: info.headers, payload: info.payload };
  }

  level = info.level ? info.level : 'info';
  return `[${info.timestamp}] [${level}]: ${message}: ${meta ? parseMeta(meta) : ''}`
}

const userActivityLogger: IUserActivityLogger = createLogger({
  exitOnError: false,
  levels: levels,
  format: format.combine(
    format.splat(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  ),
  transports: [
    new transports.Console({
      level: 'user_action',
      format: format.combine(
        format.colorize(),
        format.printf(info => parseMessage(info))
      ),
      handleExceptions: true,
      json: true
    }),
    new RabbitMQTransport({
      level: 'user_action',
      json: true
    })
  ]
});

export default userActivityLogger;
