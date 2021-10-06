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
    id?: string,
    access_token?: any,
    jti?: string,
    sub?: string,
    username?: string,
    email?: string,
    email_verified?: string,
    preferred_username?: string,
    group?: string,
    aud?: string,
    azp?: string,
    iss?: string,
    typ?: string,
    auth_time?: string,
    scope?: string,
    iat?: string,
    accessed?: Date,
    realm_access? : any,
    source?: string,
    role?: string,
    roles?: string,
    permissions?: any,
    comment?: string,
    gitlabId?: string
  },
  headers?: IUserReqHeader,
  payload?: {}
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
          const { access_token, username, email, iat, iss, sub, aud, source, gitlabId, role, permissions } = meta[key];

          if (access_token) {
            const { jti, email, email_verified, preferred_username, azp, typ, auth_time, iat, iss, sub, aud, realm_access, scope } = access_token.content;
            meta[key] = {
              ...(sub && { id: sub }),
              ...(jti && { jti: jti }),
              ...(preferred_username && { preferred_username: preferred_username }),
              ...(email && { email: email }),
              ...(email_verified && { email_verified: email_verified }),
              ...(azp && { azp: azp }),
              ...(typ && { typ: typ }),
              ...(auth_time && { auth_time: auth_time }),
              ...(iat && { iat: iat }),
              ...(iss && { iss: iss }),
              ...(scope && { scope: scope }),
              ...(aud && { aud: aud }),
              ...(source && { source: source }),
              ...(realm_access && { roles: realm_access.roles }),
              ...(gitlabId && { gitlabId: gitlabId })
            }
          }
          else {
            // Legacy token
            meta[key] = { id: sub, username, email, role, source, iss, aud, iat, permissions }
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

    return meta;
  }
  return {};
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
  return `[${info.timestamp}] [${level}]: ${message}: ${meta ? JSON.stringify(parseAndCleanMeta(meta)) : ''}`
}

export const userActivityLogger: IUserActivityLogger = createLogger({
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
