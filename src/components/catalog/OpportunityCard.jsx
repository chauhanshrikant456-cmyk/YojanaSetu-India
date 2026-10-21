import { Link } from 'react-router-dom';
import { ArrowUpRight, FileWarning } from 'lucide-react';
import { OpportunityStatusBadge } from '@/components/common/Badges';
import { CATEGORY_META } from '@/lib/constants';
import { deadlinePhrase } from '@/lib/format';

export default function OpportunityCard({ opportunity, verdict, footer }) {
  const category = CATEGORY_META[opportunity.category] || CATEGORY_META.scholarship;
  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${category.className}`}>{category.label}</span>
        <OpportunityStatusBadge status={opportunity.status} />
        {verdict ? verdict : null}
      </div>

      <Link to={`/opportunities/${opportunity.id}`} className="mt-4 block">
        <h3 className="font-heading text-base font-semibold leading-snug tracking-tight hover:text-primary">
          {opportunity.title}
        </h3>
      </Link>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{opportunity.short_description}</p>

      <dl className="mt-4 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex gap-2">
          <dt className="font-medium text-foreground/70">Authority</dt>
          <dd className="truncate">{opportunity.authority || 'Not recorded'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-foreground/70">Region</dt>
          <dd>{opportunity.state || opportunity.region || 'All India'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="font-medium text-foreground/70">Deadline</dt>
          <dd>{deadlinePhrase(opportunity.application_deadline)}</dd>
        </div>
      </dl>

      {opportunity.source_verified === false ? (
        <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-warning/10 px-3 py-2 text-xs leading-relaxed text-warning">
          <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Details awaiting verification against the official source.
        </p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <Link
          to={`/opportunities/${opportunity.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View details
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        {footer}
      </div>
    </article>
  );
}