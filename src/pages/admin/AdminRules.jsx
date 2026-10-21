import { useEffect, useState } from 'react';
import { AlertTriangle, ListChecks, Play } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { logAudit } from '@/lib/audit';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { LoadingRows } from '@/components/common/LoadingGrid';
import RuleForm from '@/components/admin/RuleForm';
import { VerdictBadge } from '@/components/common/Badges';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { STATUSES_ALLOWED } from '@/lib/constants';
import { OPERATOR_META } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';

export default function AdminRules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState([]);
  const [selected, setSelected] = useState('');
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    base44.entities.Opportunity.filter({ status: { $in: STATUSES_ALLOWED.concat(['draft', 'closed', 'archived']) } }, { sort: 'title', limit: 200, fields: ['id', 'title'] })
      .then((page) => {
        const items = page.items || [];
        setOpportunities(items);
        if (items.length > 0) setSelected(items[0].id);
      })
      .catch(() => setOpportunities([]));
  }, []);

  const load = async (opportunityId) => {
    if (!opportunityId) return;
    setLoading(true);
    setPreview(null);
    try {
      const page = await base44.entities.EligibilityRule.filter({ opportunity_id: opportunityId }, { sort: 'sort_order', limit: 200 });
      setRules(page.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(selected);
    setEditing(null);
  }, [selected]);

  const opportunity = opportunities.find((item) => item.id === selected);

  const runPreview = async () => {
    const response = await base44.functions.invoke('evaluateEligibility', { opportunityIds: [selected] });
    setPreview((response.data?.results || [])[0] || null);
  };

  const toggleRule = async (rule) => {
    const updated = await base44.entities.EligibilityRule.update(rule.id, { is_active: !rule.is_active });
    setRules((current) => current.map((item) => (item.id === rule.id ? updated : item)));
    await logAudit({ action: 'update', entityName: 'EligibilityRule', entityId: rule.id, entityLabel: rule.title, details: `Active set to ${updated.is_active}`, user });
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin console"
        title="Eligibility rule builder"
        description="Rules are evaluated on the server for every student. Missing profile data is reported as “not yet evaluated” — it is never counted as a pass, and an optional condition can only downgrade a verdict to potentially eligible."
        actions={
          <Button variant="outline" onClick={runPreview} disabled={!selected}>
            <Play className="mr-2 h-4 w-4" />
            Preview against my profile
          </Button>
        }
      />

      <div className="mb-6 rounded-2xl border border-border bg-card p-4">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="rounded-xl sm:w-[460px]"><SelectValue placeholder="Choose a listing" /></SelectTrigger>
          <SelectContent>
            {opportunities.map((item) => (<SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>))}
          </SelectContent>
        </Select>
        {preview ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-muted/60 px-4 py-3">
            <VerdictBadge verdict={preview.verdict} />
            <span className="text-sm text-muted-foreground">{preview.summary}</span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div>
          {loading ? (
            <LoadingRows count={4} />
          ) : rules.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="No rules for this listing"
              description="Without rules the public listing shows “needs more information” rather than a verdict — add at least the mandatory conditions."
            />
          ) : (
            <ul className="space-y-3">
              {rules.map((rule) => (
                <li key={rule.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{rule.title}</p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {rule.group === 'OR' ? 'OR alternative' : rule.mandatory === false ? 'Optional' : 'Mandatory'}
                        </span>
                        {rule.is_active ? null : (
                          <span className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">
                            <AlertTriangle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {rule.field} {OPERATOR_META[rule.operator]?.label || rule.operator}{' '}
                        {rule.value ? `“${rule.value}”` : ''}
                        {rule.value2 ? ` and “${rule.value2}”` : ''}
                      </p>
                      {rule.explanation ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{rule.explanation}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={rule.is_active} onCheckedChange={() => toggleRule(rule)} aria-label="Toggle rule" />
                      <Button variant="ghost" size="sm" onClick={() => setEditing(rule)}>Edit</Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <RuleForm
          opportunity={opportunity || { id: selected, title: opportunities.find((item) => item.id === selected)?.title }}
          rule={editing}
          onSaved={(saved) => {
            setRules((current) => {
              const exists = current.some((item) => item.id === saved.id);
              return exists ? current.map((item) => (item.id === saved.id ? saved : item)) : current.concat([saved]);
            });
            setEditing(null);
            toast({ title: 'Rule saved', description: 'Students see this on their next eligibility check.' });
          }}
          onDeleted={(deleted) => {
            setRules((current) => current.filter((item) => item.id !== deleted.id));
            setEditing(null);
            toast({ title: 'Rule deleted' });
          }}
        />
      </div>
    </>
  );
}