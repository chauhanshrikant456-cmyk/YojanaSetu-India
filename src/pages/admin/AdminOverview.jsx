import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BadgeCheck, FileCheck2, GitBranch, GraduationCap, ListChecks, ScrollText, ShieldAlert, Users
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import { LoadingRows } from '@/components/common/LoadingGrid';
import { OpportunityStatusBadge } from '@/components/common/Badges';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';

const SECTIONS = [
  { to: '/admin/opportunities', label: 'Schemes & listings', description: 'Create, publish, duplicate and archive records.', icon: GraduationCap },
  { to: '/admin/rules', label: 'Eligibility rule builder', description: 'Configure conditions without touching code.', icon: ListChecks },
  { to: '/admin/documents', label: 'Document catalog', description: 'Master list of documents and validity rules.', icon: FileCheck2 },
  { to: '/admin/dependencies', label: 'Prerequisite graph', description: 'Dependencies with cycle detection.', icon: GitBranch },
  { to: '/admin/scoring', label: 'Scoring weights', description: 'Readiness formula, normalised to 100%.', icon: BadgeCheck },
  { to: '/admin/verification', label: 'Source verification', description: 'Confirm official sources before publishing.', icon: ShieldAlert },
  { to: '/admin/users', label: 'User directory', description: 'Invite people and manage admin roles.', icon: Users },
  { to: '/admin/audit', label: 'Audit logs', description: 'Who changed what, and when.', icon: ScrollText }
];

export default function AdminOverview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const [statusRows, rulesCount, docTypesCount, edgesCount, pendingDocs, auditPage, unverified] = await Promise.all([
        base44.entities.Opportunity.aggregate({ groupBy: 'status' }),
        base44.entities.EligibilityRule.count({}),
        base44.entities.DocumentType.count({}),
        base44.entities.DependencyEdge.count({}),
        base44.entities.UserDocument.count({ status: 'pending_verification' }),
        base44.entities.AuditLog.list({ sort: '-created_date', limit: 6 }),
        base44.entities.Opportunity.count({ source_verified: false })
      ]);
      if (!active) return;
      const byStatus = {};
      (statusRows?.rows || []).forEach((row) => {
        byStatus[row.status || 'unknown'] = row.count;
      });
      setData({
        byStatus,
        total: Object.values(byStatus).reduce((sum, value) => sum + value, 0),
        rulesCount,
        docTypesCount,
        edgesCount,
        pendingDocs,
        unverified,
        audit: auditPage.items || []
      });
    };
    run().catch(() => setData({ byStatus: {}, total: 0, rulesCount: 0, docTypesCount: 0, edgesCount: 0, pendingDocs: 0, unverified: 0, audit: [] }));
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Admin console"
        title="Overview"
        description="Catalog health, verification backlog and recent administrative activity. Every write here is recorded in the audit log."
      />

      {!data ? (
        <LoadingRows count={4} />
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Catalog listings" value={data.total} hint={`${data.byStatus.published || 0} published · ${data.byStatus.needs_verification || 0} need verification`} icon={GraduationCap} />
            <StatCard label="Eligibility rules" value={data.rulesCount} hint={`${data.docTypesCount} document types · ${data.edgesCount} dependency links`} icon={ListChecks} tone="text-chart-2 bg-chart-2/10" />
            <StatCard label="Unverified listings" value={data.unverified} hint="Listings whose official source has not been confirmed" icon={ShieldAlert} tone="text-warning bg-warning/10" />
            <StatCard label="Documents awaiting review" value={data.pendingDocs} hint="Student uploads waiting for verification" icon={FileCheck2} tone="text-chart-3 bg-chart-3/10" />
          </div>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold">Listing status breakdown</h2>
            <div className="flex flex-wrap gap-2">
              {Object.keys(data.byStatus).length === 0 ? (
                <p className="text-sm text-muted-foreground">No listings yet.</p>
              ) : (
                Object.entries(data.byStatus).map(([status, count]) => (
                  <span key={status} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
                    <OpportunityStatusBadge status={status} />
                    <span className="text-sm font-semibold">{count}</span>
                  </span>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold">Console sections</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {SECTIONS.map((section) => (
                <Link
                  key={section.to}
                  to={section.to}
                  className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <section.icon className="h-4 w-4" />
                  </span>
                  <p className="mt-4 font-heading text-sm font-semibold">{section.label}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{section.description}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-semibold">Recent administrative activity</h2>
              <Button asChild variant="ghost" size="sm"><Link to="/admin/audit">Full audit log</Link></Button>
            </div>
            {data.audit.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No administrative changes recorded yet.</p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {data.audit.map((entry) => (
                  <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3.5 py-2.5 text-sm">
                    <span>
                      <span className="font-medium capitalize">{entry.action.replace(/_/g, ' ')}</span>{' '}
                      <span className="text-muted-foreground">{entry.entity_name}</span>
                      {entry.entity_label ? <span className="text-muted-foreground"> · {entry.entity_label}</span> : null}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.actor_email || 'system'} · {formatDateTime(entry.created_date)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}