import winston, { Logger } from 'winston';
const { addColors, createLogger, format, transports } = require('winston');
import { RabbitMQTransport } from '../util/winstonRabbitmqTransport';

export interface IUserActivityLogger extends winston.Logger {
  user_info: winston.LeveledLogMethod;
  user_auth: winston.LeveledLogMethod;
  user_action: winston.LeveledLogMethod;
  defaultMeta: Object
}
export interface IUserReqHeader {
  'user-agent'?: string,
  'accept-language'?: string,
  'content-type'?: string,
  'content-length'?: string,
  host?: string,
  ipAddress?: string,
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
  headers?: IUserReqHeader,
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

export const parseAndCleanMeta = (meta: IMetaLogger) => {
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

        if (key === 'payload') {
          const sensitive_fields = ['privateKey', 'token', 'access_token', 'authorization'];
          meta[key] = findAndRemoveSensitiveFieldsFromNestedObj(meta[key], sensitive_fields);
        }

        if (key === 'headers') {
          const { 'user-agent': user_agent, 'accept-language': accept_language, 'content-type': content_type, 'content-length': content_length, host, origin, referer, ipAddress } = meta[key];
          meta[key] = { 'user-agent': user_agent, 'accept-language': accept_language, 'content-type': content_type, 'content-length': content_length, host, origin, referer, ipAddress }
        }
      }
    });

    return JSON.stringify(meta);
  }
  return '';
};

export const findAndRemoveSensitiveFieldsFromNestedObj = (obj, keys) =>  {
  return (obj !== Object(obj)
    ? obj
    : Array.isArray(obj)
    ? obj.map((item) => findAndRemoveSensitiveFieldsFromNestedObj(item, keys))
    : Object.keys(obj)
      .filter((k) => !keys.includes(k))
      .reduce(
        (acc, x) => Object.assign(acc, { [x]: findAndRemoveSensitiveFieldsFromNestedObj(obj[x], keys) }),
        {}
      )
  )
};

const parseMessage = (info) => {
  let message, level: string;
  let meta: IMetaLogger;
  if (info.message !== undefined) {
    message = info.message;
  }

  if (info.user) {
    meta = {
      user: { ...info.user },
      headers: info.headers ? info.headers : null,
      payload: info.payload ? info.payload : null
    };
  }

  level = info.level ? info.level : 'info';
  return `[${info.timestamp}] [${level}]: ${message}: ${meta ? parseAndCleanMeta(meta) : ''}`
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
