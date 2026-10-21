import { Link } from 'react-router-dom';
import { ArrowUpRight, Lightbulb } from 'lucide-react';
import ScoreRing from '@/components/common/ScoreRing';

export default function NextStepsCard({ readiness, targetTitle }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-base font-semibold">Your next best step</h2>
      </div>

      {!readiness ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Complete your profile to get a readiness score and a recommended next action.
        </p>
      ) : (
        <>
          {targetTitle ? (
            <p className="mt-2 text-xs text-muted-foreground">Focus opportunity: <span className="font-medium text-foreground">{targetTitle}</span></p>
          ) : null}
          <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
            <ScoreRing score={readiness.overall_score} label={readiness.status_label} size={132} />
            <ul className="w-full space-y-2.5">
              {readiness.next_actions.slice(0, 3).map((action) => (
                <li key={action.label} className="rounded-xl border border-border px-3 py-2.5">
                  <p className="text-sm font-medium">{action.label}</p>
                  {action.detail ? <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{action.detail}</p> : null}
                </li>
              ))}
              {readiness.next_actions.length === 0 ? (
                <li className="text-sm text-muted-foreground">Nothing outstanding for this opportunity.</li>
              ) : null}
            </ul>
          </div>
          <Link to="/readiness" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            Open readiness & what-if
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </>
      )}
    </section>
  );
}