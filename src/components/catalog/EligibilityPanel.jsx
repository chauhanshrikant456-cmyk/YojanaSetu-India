import { CheckCircle2, CircleDashed, HelpCircle, XCircle } from 'lucide-react';
import { VerdictBadge } from '@/components/common/Badges';

const OUTCOME_META = {
  pass: { label: 'Passed', icon: CheckCircle2, className: 'text-success' },
  fail: { label: 'Failed', icon: XCircle, className: 'text-destructive' },
  missing: { label: 'Not yet evaluated', icon: HelpCircle, className: 'text-muted-foreground' }
};

export default function EligibilityPanel({ eligibility, description }) {
  if (!eligibility) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Eligibility check</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description || 'Sign in and complete your profile to see a rule-by-rule eligibility result.'}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold">Eligibility check</h2>
        <VerdictBadge verdict={eligibility.status} />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{eligibility.summary}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {eligibility.counts.pass} passed · {eligibility.counts.fail} failed · {eligibility.counts.missing} not yet
        evaluated (of {eligibility.counts.total} published conditions)
      </p>

      {eligibility.evaluations.length === 0 ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          No rules have been published for this listing yet, so no verdict can be given.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {eligibility.evaluations.map((evaluation) => {
            const meta = OUTCOME_META[evaluation.outcome] || OUTCOME_META.missing;
            const Icon = meta.icon;
            return (
              <li key={evaluation.rule_id || evaluation.title} className="rounded-xl border border-border px-3.5 py-3">
                <div className="flex items-start gap-2.5">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.className}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{evaluation.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {meta.label} · your value: {evaluation.actual} · expected: {evaluation.expected}
                      {evaluation.group === 'OR' ? ' · alternative condition' : ''}
                      {evaluation.mandatory === false ? ' · optional' : ''}
                    </p>
                    {evaluation.explanation ? (
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{evaluation.explanation}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}