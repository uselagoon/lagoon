import { AuditType } from "@lagoon/commons/src/types"

export interface AuditLog {
    resource: AuditResource
    linkedResource?: AuditResource
}

export interface AuditResource {
    id?: string
    type: AuditType
    details?: string
}