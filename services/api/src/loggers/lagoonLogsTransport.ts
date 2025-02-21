import Transport = require('winston-transport');
import { sendToLagoonLogs } from '@lagoon/commons/dist/logs/lagoon-logger';
import { parseAndCleanMeta } from './userActivityLogger';
import { Sql } from '../resources/audit/sql';
import { sqlClientPool } from '../clients/sqlClient';
import { query } from '../util/db';
import { logger } from './logger';
import { AuditSourceType } from '@lagoon/commons/dist/types';

export class LagoonLogsTransport extends Transport {
    constructor(options) {
      super(options);
    }

    private parseLagoonLogsPayload = (info) => {
      let message: string = '';
      if (info.message !== undefined) {
        message = info.message;
      }

      const level = info[Symbol.for('level')] || info.level;
      const formattedMessage = info[Symbol.for('message')];

      const meta = parseAndCleanMeta(Object.fromEntries(
        Object.entries(info).filter(([key]) => typeof key !== 'symbol')))

      return {
        severity: info.level,
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

      // USER ACTIVITY AUDIT LOGGING
      // only authenticated access_token requests, not internal tokens (aka legacy tokens)
      // saving internal tokens to the event log would result in massive amounts of logged data
      // ideally LEGACY_EXPIRY_MAX and LEGACY_EXPIRY_REJECT are tuned to ensure use of legacy tokens is useless outside
      // of internal systems
      if (info.event && info.event != "api:unknownEvent" && info.payload.resource && info.user.access_token) {
        // try and determine the user request from headers, fall back to api
        const requestSource = info.headers['referer'] ? AuditSourceType.UI : info.headers['user-agent'].includes("lagoon-client") ? AuditSourceType.CLI : AuditSourceType.API
        const aLog = {
          usid: info.user.access_token.content.sub,
          emailAddress: info.user.access_token ? info.user.access_token.content.email : info.user.iss,
          resourceId: info.payload.resource?.id || null,
          resourceType: info.payload.resource.type,
          resourceDetails: info.payload.resource.details,
          ipAddress: info.headers?.ipAddress || "null",
          linkedResourceId: info.payload.linkedResource?.id || null,
          linkedResourceType: info.payload.linkedResource?.type || null,
          linkedResourceDetails: info.payload.linkedResource?.details || null,
          impersonatorId: info.user.access_token.content.impersonator ? info.user.access_token.content.impersonator.id : null,
          impersonatorUsername: info.user.access_token.content.impersonator ? info.user.access_token.content.impersonator.username : null,
          source: requestSource,
          auditEvent: `${info.event}`,
        }
        try {
          // save the log
          query(
            sqlClientPool,
            Sql.insertAuditLog(aLog)
          );
        } catch (err) {
          logger.warn(`unable to save auditlog ${JSON.stringify(aLog)}`)
        }
      }

      // all user activity logs including legacy tokens are still shipped to the lagoon-logs queue
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
