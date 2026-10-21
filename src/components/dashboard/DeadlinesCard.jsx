import { Link } from 'react-router-dom';
import { CalendarClock, ExternalLink } from 'lucide-react';
import { ApplicationStatusBadge } from '@/components/common/Badges';
import { deadlinePhrase, formatDate, daysUntil } from '@/lib/format';

export default function DeadlinesCard({ opportunities }) {
  const upcoming = (opportunities || [])
    .filter((opportunity) => opportunity.application_deadline)
    .map((opportunity) => ({ ...opportunity, remaining: daysUntil(opportunity.application_deadline) }))
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 5);

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
        <CalendarClock className="h-4 w-4 text-primary" />
        Upcoming deadlines
      </h2>

      {upcoming.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          No published deadlines among your saved or tracked opportunities yet — listings stay marked
          “To Be Announced” until an administrator confirms the official date.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {upcoming.map((opportunity) => (
            <li key={opportunity.id} className="rounded-xl border border-border px-3.5 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link to={`/opportunities/${opportunity.id}`} className="text-sm font-medium hover:text-primary">
                  {opportunity.title}
                </Link>
                {opportunity.trackingStatus ? <ApplicationStatusBadge status={opportunity.trackingStatus} /> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(opportunity.application_deadline)} ·{' '}
                <span className={opportunity.remaining < 0 ? 'text-destructive' : opportunity.remaining <= 14 ? 'text-warning' : ''}>
                  {deadlinePhrase(opportunity.application_deadline)}
                </span>
              </p>
            </li>
          ))}
        </ul>
      )}

      {upcoming.length > 0 ? (
        <Link to="/applications" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
          Manage tracked applications
          <ExternalLink className="h-3 w-3" />
        </Link>
      ) : null}
    </section>
  );
}