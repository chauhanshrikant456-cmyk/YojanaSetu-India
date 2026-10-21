import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CalendarDays, FileWarning, Landmark, MapPin, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import CatalogHeader from '@/components/catalog/CatalogHeader';
import { OpportunityStatusBadge, VerdictBadge } from '@/components/common/Badges';
import EligibilityPanel from '@/components/catalog/EligibilityPanel';
import DocumentsPanel from '@/components/catalog/DocumentsPanel';
import ReadinessPanel from '@/components/catalog/ReadinessPanel';
import SaveTrackActions from '@/components/catalog/SaveTrackActions';
import EmptyState from '@/components/common/EmptyState';
import SiteFooter from '@/components/landing/SiteFooter';
import { LoadingRows } from '@/components/common/LoadingGrid';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { CATEGORY_META, EDUCATION_META, DISCLAIMER } from '@/lib/constants';
import { deadlinePhrase, formatDate } from '@/lib/format';

function rememberRecentlyViewed(id) {
  try {
    const key = 'yojanasetu-recent';
    const existing = JSON.parse(window.localStorage.getItem(key) || '[]');
    const next = [id].concat(existing.filter((item) => item !== id)).slice(0, 8);
    window.localStorage.setItem(key, JSON.stringify(next));
  } catch (error) {
    console.warn('Could not record recently viewed listing', error);
  }
}

export default function OpportunityDetail() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [readiness, setReadiness] = useState(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [lastRecalculated, setLastRecalculated] = useState(null);
  const [saved, setSaved] = useState(null);
  const [tracked, setTracked] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    base44.entities.Opportunity.get(id)
      .then((record) => {
        if (!active) return;
        setOpportunity(record);
        setLoading(false);
        rememberRecentlyViewed(record.id);
      })
      .catch(() => {
        if (!active) return;
        setNotFound(true);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || !opportunity) return;
    let active = true;
    setReadinessLoading(true);
    base44.functions.invoke('computeReadiness', { opportunityId: opportunity.id })
      .then((response) => {
        if (!active) return;
        setReadiness(response.data?.readiness || null);
        setLastRecalculated(response.data?.last_recalculated || null);
        setReadinessLoading(false);
      })
      .catch(() => {
        if (active) setReadinessLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, opportunity]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;
    Promise.all([
      base44.entities.SavedOpportunity.filter({ opportunity_id: id }, { limit: 1 }),
      base44.entities.TrackedApplication.filter({ opportunity_id: id }, { limit: 1 })
    ]).then(([savedPage, trackedPage]) => {
      if (!active) return;
      setSaved((savedPage.items && savedPage.items[0]) || null);
      setTracked((trackedPage.items && trackedPage.items[0]) || null);
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [isAuthenticated, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <CatalogHeader />
        <div className="mx-auto max-w-5xl px-5 py-10">
          <LoadingRows count={3} />
        </div>
      </div>
    );
  }

  if (notFound || !opportunity) {
    return (
      <div className="min-h-screen bg-background">
        <CatalogHeader />
        <div className="mx-auto max-w-3xl px-5 py-16">
          <EmptyState
            title="This listing could not be found"
            description="It may have been removed or the link may be incorrect."
            action={<Button asChild><Link to="/opportunities">Back to the catalog</Link></Button>}
          />
        </div>

        <SiteFooter />
      </div>
    );
  }

  const category = CATEGORY_META[opportunity.category] || CATEGORY_META.scholarship;
  const verdict = readiness?.eligibility?.status;

  return (
    <div className="min-h-screen bg-background">
      <CatalogHeader />
      <div className="mx-auto max-w-5xl px-5 py-8">
        <Link to="/opportunities" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to catalog
        </Link>

        <header className="mt-5 rounded-3xl border border-border bg-card p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${category.className}`}>{category.label}</span>
            <OpportunityStatusBadge status={opportunity.status} />
            {verdict ? <VerdictBadge verdict={verdict} /> : null}
          </div>

          <h1 className="mt-4 font-heading text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            {opportunity.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">{opportunity.short_description}</p>

          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-2">
              <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Authority</dt>
                <dd className="font-medium">{opportunity.authority || 'Not recorded'}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Region</dt>
                <dd className="font-medium">{opportunity.state || opportunity.region || 'All India'}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Application deadline</dt>
                <dd className="font-medium">
                  {deadlinePhrase(opportunity.application_deadline)}
                  {opportunity.application_deadline ? (
                    <span className="block text-xs font-normal text-muted-foreground">{formatDate(opportunity.application_deadline)}</span>
                  ) : null}
                </dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div>
                <dt className="text-xs text-muted-foreground">Level</dt>
                <dd className="font-medium">{EDUCATION_META[opportunity.education_level]?.label || 'Any level'}</dd>
              </div>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <SaveTrackActions
              opportunity={opportunity}
              saved={saved}
              tracked={tracked}
              isAuthenticated={isAuthenticated}
              onChange={(next) => {
                if ('saved' in next) setSaved(next.saved);
                if ('tracked' in next) setTracked(next.tracked);
              }}
            />
            {opportunity.official_application_url ? (
              <Button asChild>
                <a href={opportunity.official_application_url} target="_blank" rel="noreferrer noopener">
                  Official portal
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}
            {opportunity.official_notification_url ? (
              <Button asChild variant="outline">
                <a href={opportunity.official_notification_url} target="_blank" rel="noreferrer noopener">
                  Official notification
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : null}
          </div>

          {opportunity.source_verified === false ? (
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-warning/10 px-3 py-2.5 text-xs leading-relaxed text-warning">
              <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {opportunity.data_note || 'This listing has not been verified against the official source yet.'}
              {opportunity.last_verified_date ? ` Last checked ${formatDate(opportunity.last_verified_date)}.` : ' It has never been verified.'}
            </p>
          ) : null}
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-heading text-base font-semibold">Overview</h2>
              <dl className="mt-4 space-y-4 text-sm">
                {[
                  ['Eligibility summary', opportunity.eligibility_summary],
                  ['Eligible courses', opportunity.eligible_courses],
                  ['Exclusions', opportunity.exclusion_rules],
                  ['Benefits', opportunity.benefits],
                  ['Application fee', opportunity.application_fee],
                  ['Academic year', opportunity.academic_year],
                  ['Exam or milestone date', opportunity.exam_date ? formatDate(opportunity.exam_date) : null],
                  ['Domicile requirement', opportunity.domicile_required ? 'Yes — domicile proof required' : 'Not required']
                ]
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</dt>
                      <dd className="mt-1 leading-relaxed">{value}</dd>
                    </div>
                  ))}
              </dl>
            </section>

            <EligibilityPanel
              eligibility={readiness?.eligibility}
              description={
                readinessLoading
                  ? 'Evaluating the published conditions against your profile…'
                  : 'Sign in and complete your profile to see a rule-by-rule eligibility result.'
              }
            />

            {isAuthenticated ? (
              <DocumentsPanel documents={readiness?.documents} dependency={readiness?.dependency} />
            ) : null}
          </div>

          <div className="space-y-6">
            {isAuthenticated && readiness ? (
              <ReadinessPanel readiness={readiness} lastRecalculated={lastRecalculated} />
            ) : null}

            {isAuthenticated && readiness?.next_actions?.length ? (
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-heading text-base font-semibold">What to do next</h2>
                <ul className="mt-4 space-y-3">
                  {readiness.next_actions.slice(0, 5).map((action) => (
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
              </section>
            ) : null}

            <section className="rounded-2xl border border-border bg-muted/40 p-5">
              <h2 className="font-heading text-sm font-semibold">Important</h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{DISCLAIMER}</p>
            </section>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}