// @flow

import winston from 'winston';

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      timestamp: true,
      colorize: true,
    }),
  ],
});

// Interestingly, webpack doesn't detect and replace process.env if
// you use the 'global' prefix. That way we can get the runtime env
// variables without having them replaced by webpack.
if (typeof global.process.env.HOSTNAME !== 'undefined') {
  // Use the host name of the OpenShift pod (generated on deploy) to
  // identify the pod that the logging originates from.
  const addHostname = (level, message, metadata) => ({
    ...metadata,
    hostname: global.process.env.HOSTNAME,
  });

  logger.rewriters.push(addHostname);
}

export default logger;
