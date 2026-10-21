import { Info } from 'lucide-react';
import ScoreRing from '@/components/common/ScoreRing';
import { StatusBadge } from '@/components/common/Badges';
import { READINESS_STATUS_META } from '@/lib/constants';
import { formatDateTime } from '@/lib/format';

export default function ReadinessPanel({ readiness, lastRecalculated, showExplanations = true }) {
  if (!readiness) return null;
  const statusMeta = READINESS_STATUS_META[readiness.status_label] || { className: 'bg-muted text-muted-foreground' };

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold">Application readiness</h2>
        <StatusBadge label={readiness.status_label} className={statusMeta.className} />
      </div>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <ScoreRing score={readiness.overall_score} label={readiness.status_label} />
        <div className="w-full space-y-3">
          {readiness.explanations.map((item) => (
            <div key={item.component}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{item.component}</span>
                <span className="text-muted-foreground">
                  {item.earned} / {item.weight}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${Math.min(100, (item.earned / (item.weight || 1)) * 100)}%` }}
                />
              </div>
              {showExplanations ? (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.note}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-5 flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Readiness measures how prepared you are, not whether you will be selected. It is separate from the eligibility
        verdict{lastRecalculated ? ` · last recalculated ${formatDateTime(lastRecalculated)}` : ''}.
      </p>
    </section>
  );
}