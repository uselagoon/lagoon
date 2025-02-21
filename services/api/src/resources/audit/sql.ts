import { knex } from '../../util/db';

export interface AuditLog {
    id?: number;
    usid: string;
    emailAddress: string;
    resourceId?: number;
    resourceType: string;
    resourceDetails: string;
    linkedResourceId?: number;
    linkedResourceType?: string;
    linkedResourceDetails?: string;
    auditEvent: string;
    ipAddress: string;
    impersonatorId?: string;
    impersonatorUsername?: string;
    created?: string;
  }

  export const Sql = {
    insertAuditLog: (auditLog: AuditLog) =>
      knex('audit_log')
        .insert(auditLog)
        .toString(),
    selectAuditLog: () =>
      knex('audit_log')
        .toString(),
    deleteAuditLog: (id: string) =>
      knex('audit_log')
        .where('id', id)
        .delete()
        .toString(),
  };