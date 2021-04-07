const { addColors, createLogger, format, transports } = require('winston');

export interface IUserReqHeader {
  user_agent?: string,
  host: string,
  origin?: string
}

interface IUserMetaLogger {
  id?: string,
  user: string,
  email?: string,
  group?: string,
  aud?: string,
  accessed: string,
  source?: string,
  roles?: string,
  headers?: IUserReqHeader
  payload?: {}
}

// Log levels
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

const formatMeta = (meta: IUserMetaLogger) => {
  if (meta) {
    Object.keys({...meta}).map(key => {
      if (meta[key].user) {
        const { id, username, email, source, iat, iss, sub, aud, role, permissions, access_token } = meta[key].user;

        if (access_token) {
          const { preferred_username, email, sub: id, azp: source, aud, iat, realm_access } = access_token.content;
          meta[key].user = {
            id,
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
          meta[key].user = { id, user: username, email, source, iss, aud, sub, iat, role, permissions }
        }
      }

      if (meta[key].headers) {
        const { 'user-agent': user_agent, host, origin } = meta[key].headers;
        meta[key].headers = { user_agent, host, origin }
      }
    });

    return JSON.stringify(meta);
  }
  return '';
};

const userActivityLogger = createLogger({
  exitOnError: false,
  levels: levels,
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => {
      let message, level: string;
      let meta: IUserMetaLogger;
      if (info.message !== undefined) {
        message = info.message;
      }

      if (info[Symbol.for('splat')] && Object.keys(info[Symbol.for('splat')]).length) {
        meta = info[Symbol.for('splat')];
      }

      level = info.level ? info.level : 'INFO';

      return `[${info.timestamp}] [${level}]: ${message}: ${meta ? formatMeta(meta) : ''}`
    })
  ),
  transports: [
    new transports.Console({
      level: 'user_action',
      handleExceptions: true,
      json: false
    })
  ]
});

module.exports = userActivityLogger;