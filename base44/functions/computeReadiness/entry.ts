import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { profileCompleteness } from '../../shared/eligibility.ts';

function daysUntil(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

function niceDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [profilePage, savedPage, trackedPage, docsPage, notificationsPage] = await Promise.all([
      base44.entities.UserProfile.filter({}, { sort: '-updated_date', limit: 1 }),
      base44.entities.SavedOpportunity.list({ limit: 50 }),
      base44.entities.TrackedApplication.list({ limit: 50 }),
      base44.entities.UserDocument.list({ limit: 100 }),
      base44.entities.Notification.list({ sort: '-created_date', limit: 200 })
    ]);

    const profile = (profilePage.items && profilePage.items[0]) || {};
    const saved = savedPage.items || [];
    const tracked = trackedPage.items || [];
    const documents = docsPage.items || [];
    const existing = notificationsPage.items || [];

    const opportunityIds = [...new Set(saved.map((item) => item.opportunity_id).concat(tracked.map((item) => item.opportunity_id)).filter(Boolean))];
    let opportunities = [];
    if (opportunityIds.length > 0) {
      const page = await base44.entities.Opportunity.filter({ id: { $in: opportunityIds.slice(0, 100) } }, { limit: 100 });
      opportunities = page.items || [];
    }

    const existingKeys = new Set(existing.map((item) => item.dedupe_key).filter(Boolean));
    const candidates = [];

    if (profile.notify_deadlines !== false) {
      opportunities.forEach((opportunity) => {
        const remaining = daysUntil(opportunity.application_deadline);
        if (remaining === null) return;
        if (remaining < 0) {
          candidates.push({
            dedupe_key: 'deadline-passed:' + opportunity.id + ':' + opportunity.application_deadline,
            title: 'Deadline passed: ' + opportunity.title,
            message: 'The published deadline (' + niceDate(opportunity.application_deadline) + ') has passed. Check the official notification for the next cycle.',
            type: 'deadline',
            link: '/opportunities/' + opportunity.id
          });
        } else if (remaining <= 45) {
          candidates.push({
            dedupe_key: 'deadline:' + opportunity.id + ':' + opportunity.application_deadline,
            title: 'Deadline in ' + remaining + ' day' + (remaining === 1 ? '' : 's') + ': ' + opportunity.title,
            message: 'Closes on ' + niceDate(opportunity.application_deadline) + '. Keep your documents ready.',
            type: 'deadline',
            link: '/opportunities/' + opportunity.id
          });
        }
      });
    }

    if (profile.notify_documents !== false) {
      documents.forEach((document) => {
        const documentLabel = document.document_name || document.document_code;
        if (document.status === 'rejected') {
          candidates.push({
            dedupe_key: 'doc-rejected:' + document.id,
            title: 'Document rejected: ' + documentLabel,
            message: document.rejection_reason ? 'Reason: ' + document.rejection_reason : 'Please upload a clearer or valid copy.',
            type: 'document',
            link: '/documents'
          });
        }
        const expiryRemaining = daysUntil(document.expiry_date);
        if (expiryRemaining === null) return;
        if (expiryRemaining < 0) {
          candidates.push({
            dedupe_key: 'doc-expired:' + document.id + ':' + document.expiry_date,
            title: 'Document expired: ' + documentLabel,
            message: 'Expired on ' + niceDate(document.expiry_date) + '. Renew it before applying.',
            type: 'document',
            link: '/documents'
          });
        } else if (expiryRemaining <= 30) {
          candidates.push({
            dedupe_key: 'doc-expiring:' + document.id + ':' + document.expiry_date,
            title: 'Document expiring soon: ' + documentLabel,
            message: 'Expires on ' + niceDate(document.expiry_date) + '.',
            type: 'document',
            link: '/documents'
          });
        }
      });
    }

    if (profile.notify_readiness !== false) {
      const completeness = profileCompleteness(profile);
      if (completeness.missing.length > 0) {
        candidates.push({
          dedupe_key: 'profile-incomplete',
          title: 'Complete your profile to confirm eligibility',
          message: 'Still missing: ' + completeness.missing_labels.slice(0, 6).join(', ') + '. Missing details are never counted as eligible.',
          type: 'readiness',
          link: '/profile'
        });
      }
    }

    const toCreate = candidates.filter((candidate) => !existingKeys.has(candidate.dedupe_key));
    let created = [];
    if (toCreate.length > 0) {
      created = await base44.entities.Notification.bulkCreate(toCreate.slice(0, 25));
    }

    const all = existing.concat(Array.isArray(created) ? created : []);
    const items = all.sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')));

    return Response.json({
      created: toCreate.length,
      unread: items.filter((item) => item.is_read !== true).length,
      items: items.slice(0, 50)
    });
  } catch (error) {
    const message = String(error?.message || '');
    if (/rate limit/i.test(message)) {
      return Response.json({ error: 'rate_limited', message: 'Too many requests right now — retry in a moment.' }, { status: 429 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}