import { Link } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, ChevronDown, HelpCircle, XCircle } from 'lucide-react';
import { VerdictBadge } from '@/components/common/Badges';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

const OUTCOME_ICON = { pass: CheckCircle2, fail: XCircle, missing: HelpCircle };
const OUTCOME_TONE = { pass: 'text-success', fail: 'text-destructive', missing: 'text-muted-foreground' };

export default function EligibilityResultCard({ result }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/opportunities/${result.opportunity_id}`} className="font-heading text-base font-semibold hover:text-primary">
            {result.title}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {result.counts.pass} passed · {result.counts.fail} failed · {result.counts.missing} not yet evaluated
          </p>
        </div>
        <VerdictBadge verdict={result.verdict} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{result.summary}</p>

      {result.evaluations.length > 0 ? (
        <Collapsible className="mt-4">
          <CollapsibleTrigger className="group flex items-center gap-1.5 text-sm font-medium text-primary">
            View conditions
            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="mt-3 space-y-2">
              {result.evaluations.map((evaluation) => {
                const Icon = OUTCOME_ICON[evaluation.outcome] || HelpCircle;
                return (
                  <li key={evaluation.rule_id || evaluation.title} className="rounded-xl border border-border px-3.5 py-2.5">
                    <div className="flex items-start gap-2.5">
                      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${OUTCOME_TONE[evaluation.outcome] || 'text-muted-foreground'}`} />
                      <div>
                        <p className="text-sm">{evaluation.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Your value: {evaluation.actual} · expected {evaluation.expected}
                          {evaluation.group === 'OR' ? ' · alternative' : ''}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      <Button asChild variant="outline" size="sm" className="mt-4">
        <Link to={`/opportunities/${result.opportunity_id}`}>
          Open listing
          <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
        </Link>
      </Button>
    </article>
  );
}