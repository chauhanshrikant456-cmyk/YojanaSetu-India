import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, GitBranch, RefreshCw, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useProfile from '@/hooks/useProfile';
import PageHeader from '@/components/common/PageHeader';
import LoadingGrid, { LoadingRows } from '@/components/common/LoadingGrid';
import ReadinessPanel from '@/components/catalog/ReadinessPanel';
import WhatIfSimulator from '@/components/readiness/WhatIfSimulator';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toEngineProfile } from '@/lib/profile';
import { formatDateTime } from '@/lib/format';
import { STATUSES_ALLOWED } from '@/lib/constants';

export default function Readiness() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [opportunities, setOpportunities] = useState([]);
  const [selected, setSelected] = useState('');
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Opportunity.filter(
      { status: { $in: STATUSES_ALLOWED } },
      { sort: 'title', limit: 100, fields: ['id', 'title', 'category'] }
    ).then((page) => {
      const items = page.items || [];
      setOpportunities(items);
      const params = new URLSearchParams(location.search);
      const requested = params.get('opportunity');
      const initial = items.find((item) => item.id === requested)?.id || items[0]?.id || '';
      setSelected(initial);
    }).catch(() => setOpportunities([]));
  }, [location.search]);

  const load = async (opportunityId) => {
    if (!opportunityId) return;
    setLoading(true);
    try {
      const response = await base44.functions.invoke('computeReadiness', { opportunityId });
      setPayload(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(selected);
  }, [selected]);

  const readiness = payload?.readiness;

  return (
    <>
      <PageHeader
        eyebrow="Readiness score"
        title="Readiness & what-if"
        description="A transparent 0–100 preparation score built from eligibility verification, document fulfilment, dependency integrity and profile completeness, using the weights your administrators configure."
        actions={
          <Button variant="outline" onClick={() => load(selected)} disabled={loading || !selected}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Recalculate
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4 text-primary" />
          Target opportunity
        </div>
        <Select
          value={selected}
          onValueChange={(value) => {
            setSelected(value);
            navigate(`/readiness?opportunity=${value}`, { replace: true });
          }}
        >
          <SelectTrigger className="w-full rounded-xl sm:w-[420px]">
            <SelectValue placeholder="Choose an opportunity" />
          </SelectTrigger>
          <SelectContent>
            {opportunities.map((opportunity) => (
              <SelectItem key={opportunity.id} value={opportunity.id}>{opportunity.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <><LoadingGrid count={2} /><LoadingRows className="mt-4" count={2} /></>
      ) : !readiness ? (
        <EmptyState
          title="No opportunity selected"
          description="Pick a target from the list above to see its readiness breakdown, blockers and next actions."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="space-y-6">
            <ReadinessPanel readiness={readiness} lastRecalculated={payload.last_recalculated} />

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
                <GitBranch className="h-4 w-4 text-primary" />
                Dependency blockers
              </h2>
              {readiness.dependency.blocked.length === 0 && readiness.dependency.roots.length === 0 ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  No unresolved prerequisites for this opportunity — every required document is either held or waiting
                  on nothing.
                </p>
              ) : (
                <>
                  {readiness.dependency.roots.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Start here</p>
                      <ul className="mt-2 space-y-2">
                        {readiness.dependency.roots.map((item) => (
                          <li key={item.code} className="rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning">{item.name}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {readiness.dependency.blocked.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Blocked behind those</p>
                      <ul className="mt-2 space-y-2">
                        {readiness.dependency.blocked.map((item) => (
                          <li key={item.code} className="rounded-xl border border-border px-3 py-2 text-sm">
                            <span className="font-medium">{item.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              needs {item.blocked_by.join(', ')} first
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              )}
            </section>

            <WhatIfSimulator
              opportunityId={selected}
              readiness={readiness}
              engineProfile={toEngineProfile(profile)}
            />
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-heading text-base font-semibold">Recommended next actions</h2>
              {readiness.next_actions.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Nothing outstanding for this opportunity.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {readiness.next_actions.map((action) => (
                    <li key={action.label} className="rounded-xl border border-border px-3.5 py-3">
                      <p className="text-sm font-medium">{action.label}</p>
                      {action.detail ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{action.detail}</p> : null}
                      {action.link ? (
                        <Link to={action.link} className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          Open
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-muted/40 p-5">
              <h2 className="font-heading text-sm font-semibold">What readiness is not</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                It is not a selection probability and not the same thing as eligibility. A high score means your
                paperwork and profile are in order — the official authority still decides outcomes.
                {payload?.last_recalculated ? ` Last recalculated ${formatDateTime(payload.last_recalculated)}.` : ''}
              </p>
            </section>
          </div>
        </div>
      )}
    </>
  );
}