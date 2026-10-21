import { base44 } from '@/api/base44Client';
import { getDisplayName } from '@/lib/displayName';

export async function logAudit({ action, entityName, entityId = null, entityLabel = null, details = null, user }) {
  try {
    await base44.entities.AuditLog.create({
      action,
      entity_name: entityName,
      entity_id: entityId,
      entity_label: entityLabel,
      details,
      actor_email: user?.email || null,
      actor_name: getDisplayName(user?.full_name) || null
    });
  } catch (error) {
    // An audit trail failure must never roll back the administrative action itself.
    console.warn('Audit log write failed', error);
  }
}