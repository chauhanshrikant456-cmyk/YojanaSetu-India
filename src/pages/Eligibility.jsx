import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/common/PageHeader';
import EligibilityResultCard from '@/components/eligibility/EligibilityResultCard';
import EmptyState from '@/components/common/EmptyState';
import { LoadingRows } from '@/components/common/LoadingGrid';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VERDICT_META } from '@/lib/constants';

const ORDER = ['eligible', 'potentially_eligible', 'needs_info', 'ineligible'];

export default function Eligibility() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('evaluateEligibility', {});
      setData(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const results = data?.results || [];
  const visible = tab === 'all' ? results : results.filter((result) => result.verdict === tab);
  const completeness = data?.profile_completeness;

  return (
    <>
      <PageHeader
        eyebrow="Eligibility engine"
        title="Eligibility check"
        description="Every published condition is evaluated against your saved profile. A verdict of “needs more information” means the rule could not be decided — missing data is never counted as a pass."
        actions={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Re-evaluate
          </Button>
        }
      />

      {completeness && completeness.percentage < 100 ? (
        <div className="mb-6 rounded-2xl border border-warning/30 bg-warning/10 p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-warning">
            <AlertTriangle className="h-4 w-4" />
            Your profile is {completeness.percentage}% complete
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-warning/90">
            Missing: {completeness.missing_labels.slice(0, 6).join(', ')}
            {completeness.missing_labels.length > 6 ? ` and ${completeness.missing_labels.length - 6} more` : ''}.
          </p>
          <div className="mt-3 max-w-md">
            <Progress value={completeness.percentage} className="h-2" />
          </div>
          <Button asChild size="sm" className="mt-4">
            <Link to="/profile">Complete my profile</Link>
          </Button>
        </div>
      ) : null}

      <Tabs value={tab} onValueChange={setTab} className="mb-5">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All ({results.length})</TabsTrigger>
          {ORDER.map((verdict) => (
            <TabsTrigger key={verdict} value={verdict}>
              {VERDICT_META[verdict].label} ({results.filter((result) => result.verdict === verdict).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <LoadingRows count={4} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nothing to show in this view"
          description="Try another verdict tab, or browse the catalog and open a listing to check it individually."
          action={<Button asChild><Link to="/opportunities">Browse opportunities</Link></Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((result) => (
            <EligibilityResultCard key={result.opportunity_id} result={result} />
          ))}
        </div>
      )}
    </>
  );
}