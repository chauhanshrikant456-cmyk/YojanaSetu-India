import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, Bookmark, Bell, FolderOpen, GitBranch, Target, TrendingUp, User
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import EmptyState from '@/components/common/EmptyState';
import { LoadingGrid, LoadingRows } from '@/components/common/LoadingGrid';
import DeadlinesCard from '@/components/dashboard/DeadlinesCard';
import NextStepsCard from '@/components/dashboard/NextStepsCard';
import OpportunityCard from '@/components/catalog/OpportunityCard';
import { VerdictBadge } from '@/components/common/Badges';
import { Button } from '@/components/ui/button';
import { profileCompleteness } from '@/lib/profile';
import { STATUSES_ALLOWED } from '@/lib/constants';
import { formatDate } from '@/lib/format';

const LIST_FIELDS = ['title', 'short_description', 'category', 'authority', 'region', 'state', 'status', 'application_deadline', 'source_verified'];

export default function Dashboard() {
  const { user, displayName } = useAuth();
  const greetingName = displayName || user?.full_name || '';
  const [state, setState] = useState({ loading: true });

  useEffect(() => {
    let active = true;

    const run = async () => {
      const [eligibilityRes, savedPage, trackedPage] = await Promise.all([
        base44.functions.invoke('evaluateEligibility', {}),
        base44.entities.SavedOpportunity.list({ sort: '-created_date', limit: 20 }),
        base44.entities.TrackedApplication.list({ sort: '-created_date', limit: 20 })
      ]);

      const results = eligibilityRes.data?.results || [];
      const opportunities = results.map((result) => ({
        id: result.opportunity_id,
        title: result.title,
        short_description: result.short_description,
        category: result.category,
        authority: result.authority,
        region: result.region,
        state: result.state,
        status: result.status,
        application_deadline: result.application_deadline,
        source_verified: result.source_verified,
        verdict: result
      }));
      const counts = {
        eligible: results.filter((item) => item.verdict === 'eligible').length,
        potential: results.filter((item) => item.verdict === 'potentially_eligible').length
      };

      const saved = savedPage.items || [];
      const tracked = trackedPage.items || [];
      const trackedByOpportunity = {};
      tracked.forEach((item) => {
        trackedByOpportunity[item.opportunity_id] = item;
      });

      const deadlineCandidates = opportunities
        .filter((opportunity) => saved.some((item) => item.opportunity_id === opportunity.id) || trackedByOpportunity[opportunity.id])
        .map((opportunity) => ({
          ...opportunity,
          trackingStatus: trackedByOpportunity[opportunity.id]?.status || null
        }));

      const recommended = opportunities
        .filter((opportunity) => opportunity.verdict)
        .sort((a, b) => rank(a.verdict) - rank(b.verdict))
        .slice(0, 3);

      const focus = opportunities.find((opportunity) => opportunity.verdict && rank(opportunity.verdict) === 0)
        || opportunities.find((opportunity) => opportunity.verdict && rank(opportunity.verdict) === 1)
        || recommended[0]
        || null;

      let readinessPayload = null;
      if (focus) {
        const response = await base44.functions.invoke('computeReadiness', { opportunityId: focus.id });
        readinessPayload = response.data;
      }

      let recent = [];
      try {
        const ids = JSON.parse(window.localStorage.getItem('yojanasetu-recent') || '[]');
        if (ids.length > 0) {
          const page = await base44.entities.Opportunity.filter({ id: { $in: ids.slice(0, 6) } }, { limit: 6, fields: LIST_FIELDS.concat(['id']) });
          const order = new Map(ids.map((id, index) => [id, index]));
          recent = (page.items || []).sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
        }
      } catch (error) {
        recent = [];
      }

      // Alerts are only generated once there is something to alert about, which keeps a first load light.
      const unread = saved.length > 0 || tracked.length > 0
        ? (await base44.functions.invoke('syncNotifications', {})).data?.unread || 0
        : await base44.entities.Notification.count({ is_read: false });

      if (!active) return;
      setState({
        loading: false,
        error: null,
        opportunities,
        recommended,
        deadlineCandidates,
        saved,
        tracked,
        unread,
        readiness: readinessPayload?.readiness || null,
        targetTitle: focus?.title || null,
        recent,
        completeness: eligibilityRes.data?.profile_completeness || null,
        counts
      });
    };

    run().catch((error) => {
      const rateLimited = error?.response?.status === 429;
      setState({
        loading: false,
        error: rateLimited
          ? 'The server is busy right now, so some figures could not be loaded. Reload in a moment.'
          : 'Part of your dashboard could not be loaded. Reload to try again.',
        opportunities: [],
        recommended: [],
        deadlineCandidates: [],
        saved: [],
        tracked: [],
        unread: 0,
        readiness: null,
        targetTitle: null,
        recent: [],
        completeness: null,
        counts: { eligible: 0, potential: 0 }
      });
    });
    return () => {
      active = false;
    };
  }, []);

  const completeness = state.completeness || profileCompleteness(null);
  const missingDocuments = (state.readiness?.documents || []).filter((document) => document.status === 'missing' || document.status === 'expired' || document.status === 'rejected');
  const blockers = state.readiness?.dependency || { roots: [], blocked: [] };

  return (
    <>
      <PageHeader
        eyebrow="Preparation dashboard"
        title={`Welcome${greetingName ? `, ${greetingName.split(' ')[0]}` : ''}`}
        description="Everything that matters right now: what fits you, what is missing, and which prerequisite is holding the rest back."
        actions={
          <Button asChild>
            <Link to="/opportunities">Find opportunities</Link>
          </Button>
        }
      />

      {state.error ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          <span>{state.error}</span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Reload</Button>
        </div>
      ) : null}

      {state.loading ? (
        <><LoadingGrid count={3} /><LoadingRows className="mt-6" count={3} /></>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Profile completeness"
              value={`${completeness.percentage}%`}
              hint={`${completeness.filled} of ${completeness.total} fields filled`}
              icon={User}
              progress={completeness.percentage}
            />
            <StatCard
              label="Readiness"
              value={state.readiness ? `${state.readiness.overall_score}/100` : '—'}
              hint={state.readiness?.status_label || 'Complete your profile to score'}
              icon={TrendingUp}
              tone="text-success bg-success/10"
              progress={state.readiness?.overall_score}
            />
            <StatCard
              label="Eligible listings"
              value={state.counts.eligible + state.counts.potential}
              hint={`${state.counts.eligible} eligible · ${state.counts.potential} potentially eligible`}
              icon={Target}
              tone="text-chart-2 bg-chart-2/10"
            />
            <StatCard
              label="Unread alerts"
              value={state.unread}
              hint={`${state.tracked.length} tracked application(s)`}
              icon={Bell}
              tone="text-warning bg-warning/10"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <NextStepsCard readiness={state.readiness} targetTitle={state.targetTitle} />

            <DeadlinesCard opportunities={state.deadlineCandidates} />

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
                <FolderOpen className="h-4 w-4 text-primary" />
                Documents missing for your target
              </h2>
              {missingDocuments.length === 0 ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Nothing missing for the selected target — every required document is uploaded or verified.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {missingDocuments.slice(0, 5).map((document) => (
                    <li key={document.code} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
                      <span className="text-sm">{document.name}</span>
                      <span className="text-xs capitalize text-muted-foreground">{document.status.replace('_', ' ')}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link to="/documents">Open document vault</Link>
              </Button>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
                <GitBranch className="h-4 w-4 text-primary" />
                Dependency blockers
              </h2>
              {blockers.roots.length === 0 && blockers.blocked.length === 0 ? (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  No prerequisite chain is blocking your target right now.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {blockers.roots.map((item) => (
                    <li key={item.code} className="flex items-start gap-2 rounded-xl bg-warning/10 px-3.5 py-2.5 text-sm text-warning">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Start with {item.name}
                    </li>
                  ))}
                  {blockers.blocked.map((item) => (
                    <li key={item.code} className="rounded-xl border border-border px-3.5 py-2.5 text-sm">
                      {item.name} <span className="text-xs text-muted-foreground">— needs {item.blocked_by.join(', ')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-base font-semibold">Recommended for you</h2>
              <Link to="/eligibility" className="text-xs font-medium text-primary hover:underline">See all verdicts</Link>
            </div>
            {state.recommended.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No recommendations yet"
                description="Add a few profile details — income, marks, state and category — and the listings that fit you will appear here with their reasons."
                action={
                  <Button asChild size="sm">
                    <Link to="/profile">Complete your profile</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {state.recommended.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    verdict={opportunity.verdict ? <VerdictBadge verdict={opportunity.verdict.verdict} /> : null}
                  />
                ))}
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
                <Bookmark className="h-4 w-4 text-primary" />
                Saved opportunities
              </h2>
              {state.saved.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">Nothing saved yet.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {state.saved.slice(0, 5).map((item) => (
                    <li key={item.id} className="rounded-xl border border-border px-3.5 py-2.5">
                      <Link to={`/opportunities/${item.opportunity_id}`} className="text-sm hover:text-primary">{item.opportunity_title}</Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-heading text-base font-semibold">Application progress</h2>
              {state.tracked.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No applications tracked yet.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {state.tracked.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
                      <Link to={`/opportunities/${item.opportunity_id}`} className="truncate text-sm hover:text-primary">{item.opportunity_title}</Link>
                      <span className="shrink-0 text-xs capitalize text-muted-foreground">{item.status.replace(/_/g, ' ')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {state.recent.length > 0 ? (
            <section>
              <h2 className="mb-3 font-heading text-base font-semibold">Recently viewed</h2>
              <div className="flex flex-wrap gap-2">
                {state.recent.map((opportunity) => (
                  <Link
                    key={opportunity.id}
                    to={`/opportunities/${opportunity.id}`}
                    className="rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {opportunity.title}
                    {opportunity.application_deadline ? <span className="block text-xs">{formatDate(opportunity.application_deadline)}</span> : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}

function rank(verdict) {
  if (!verdict) return 4;
  if (verdict.verdict === 'eligible') return 0;
  if (verdict.verdict === 'potentially_eligible') return 1;
  if (verdict.verdict === 'needs_info') return 2;
  return 3;
}