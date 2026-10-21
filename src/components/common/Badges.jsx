import {
  Archive, Ban, CheckCircle2, CircleDashed, Clock, Eye, FileWarning, HelpCircle,
  Pencil, ShieldCheck, ThumbsDown, Upload, XCircle, AlertTriangle
} from 'lucide-react';
import { APPLICATION_STATUS_META, DOC_STATUS_META, OPPORTUNITY_STATUS_META, VERDICT_META } from '@/lib/constants';

export function StatusBadge({ label, className = '', icon: Icon }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {label}
    </span>
  );
}

const VERDICT_ICONS = {
  eligible: CheckCircle2,
  potentially_eligible: AlertTriangle,
  ineligible: XCircle,
  needs_info: HelpCircle
};

const OPPORTUNITY_ICONS = {
  draft: Pencil,
  published: CheckCircle2,
  closing_soon: Clock,
  closed: Ban,
  archived: Archive,
  needs_verification: FileWarning
};

const DOCUMENT_ICONS = {
  missing: CircleDashed,
  uploaded: Upload,
  pending_verification: Clock,
  verified: ShieldCheck,
  expired: Clock,
  rejected: XCircle
};

const APPLICATION_ICONS = {
  interested: Eye,
  preparing_documents: Pencil,
  ready_to_apply: CheckCircle2,
  applied: Upload,
  under_review: Clock,
  approved: ShieldCheck,
  rejected: ThumbsDown,
  withdrawn: Ban
};

export function VerdictBadge({ verdict }) {
  const meta = VERDICT_META[verdict] || VERDICT_META.needs_info;
  return <StatusBadge label={meta.label} className={meta.className} icon={VERDICT_ICONS[verdict] || HelpCircle} />;
}

export function OpportunityStatusBadge({ status }) {
  const meta = OPPORTUNITY_STATUS_META[status] || OPPORTUNITY_STATUS_META.draft;
  return <StatusBadge label={meta.label} className={meta.className} icon={OPPORTUNITY_ICONS[status] || Pencil} />;
}

export function DocumentStatusBadge({ status }) {
  const meta = DOC_STATUS_META[status] || DOC_STATUS_META.missing;
  return <StatusBadge label={meta.label} className={meta.className} icon={DOCUMENT_ICONS[status] || CircleDashed} />;
}

export function ApplicationStatusBadge({ status }) {
  const meta = APPLICATION_STATUS_META[status] || APPLICATION_STATUS_META.interested;
  return <StatusBadge label={meta.label} className={meta.className} icon={APPLICATION_ICONS[status] || Eye} />;
}

export default StatusBadge;