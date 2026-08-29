import { addRecord, getAllRecords } from './db'
import { generateId } from '../utils/id'
import type { AuditLog, AuditAction } from '../types'

export async function logAudit(
  entityType: string,
  entityId: string,
  action: AuditAction,
  message: string,
  metadata?: Record<string, unknown>
) {
  const now = new Date().toISOString()
  const log: AuditLog = {
    id: generateId('audit'),
    entityType,
    entityId,
    action,
    message,
    metadata,
    createdAt: now,
    updatedAt: now,
  }
  await addRecord('auditLogs', log)
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return getAllRecords<AuditLog>('auditLogs')
}
