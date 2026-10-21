import { useEffect, useState } from 'react';
import { Info, Save, SlidersHorizontal } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { logAudit } from '@/lib/audit';
import PageHeader from '@/components/common/PageHeader';
import { LoadingRows } from '@/components/common/LoadingGrid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const FIELDS = [
  { key: 'eligibility_weight', label: 'Eligibility verification', help: 'Share of the score decided by published eligibility conditions. An ineligible verdict scores zero here.' },
  { key: 'document_weight', label: 'Direct document fulfilment', help: 'Verified documents score fully; uploaded or pending documents score partial credit.' },
  { key: 'dependency_weight', label: 'Dependency graph integrity', help: 'Penalises required documents that are stuck behind an unresolved prerequisite.' },
  { key: 'profile_weight', label: 'Profile data completeness', help: 'Proportion of profile fields filled in — kept separate from actual eligibility.' }
];

export default function AdminScoring() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [recordId, setRecordId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    base44.entities.ScoringSettings.list({ sort: '-updated_date', limit: 1 })
      .then((page) => {
        const existing = page.items && page.items[0];
        if (existing) {
          setRecordId(existing.id);
          setSettings({
            eligibility_weight: existing.eligibility_weight ?? 30,
            document_weight: existing.document_weight ?? 30,
            dependency_weight: existing.dependency_weight ?? 25,
            profile_weight: existing.profile_weight ?? 15,
            ready_threshold: existing.ready_threshold ?? 80,
            preparation_threshold: existing.preparation_threshold ?? 50,
            pending_document_credit: existing.pending_document_credit ?? 0.6
          });
        } else {
          setSettings({
            eligibility_weight: 30, document_weight: 30, dependency_weight: 25, profile_weight: 15,
            ready_threshold: 80, preparation_threshold: 50, pending_document_credit: 0.6
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const set = (key, value) => setSettings((current) => ({ ...current, [key]: value }));

  const weightTotal = settings
    ? Number(settings.eligibility_weight) + Number(settings.document_weight) + Number(settings.dependency_weight) + Number(settings.profile_weight)
    : 0;

  const save = async () => {
    setError('');
    if (Math.abs(weightTotal - 100) > 0.001) {
      setError(`The four weights must add up to exactly 100%. They currently add up to ${weightTotal}%.`);
      return;
    }
    if (Number(settings.preparation_threshold) >= Number(settings.ready_threshold)) {
      setError('The “In Preparation” band must start below the “Ready to Apply” band.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        eligibility_weight: Number(settings.eligibility_weight),
        document_weight: Number(settings.document_weight),
        dependency_weight: Number(settings.dependency_weight),
        profile_weight: Number(settings.profile_weight),
        ready_threshold: Number(settings.ready_threshold),
        preparation_threshold: Number(settings.preparation_threshold),
        pending_document_credit: Number(settings.pending_document_credit)
      };
      const saved = recordId
        ? await base44.entities.ScoringSettings.update(recordId, payload)
        : await base44.entities.ScoringSettings.create(payload);
      setRecordId(saved.id);
      await logAudit({
        action: 'setting_change',
        entityName: 'ScoringSettings',
        entityId: saved.id,
        entityLabel: 'Readiness formula',
        details: `Weights ${payload.eligibility_weight}/${payload.document_weight}/${payload.dependency_weight}/${payload.profile_weight}`,
        user
      });
      toast({ title: 'Readiness formula saved', description: 'Every score recalculates with the new weights.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin console"
        title="Scoring weights & system settings"
        description="The readiness score is only as trustworthy as its formula. Weights must be valid and normalised to 100%, and the calculation is shown to students in plain language."
        actions={
          <Button onClick={save} disabled={saving || loading}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        }
      />

      {loading || !settings ? (
        <LoadingRows count={4} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Readiness components
            </h2>
            <div className="mt-5 space-y-5">
              {FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor={field.key} className="text-sm">{field.label}</Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        id={field.key}
                        type="number"
                        min={0}
                        max={100}
                        value={settings[field.key]}
                        onChange={(event) => set(field.key, event.target.value)}
                        className="w-20 rounded-xl text-right"
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{field.help}</p>
                </div>
              ))}
            </div>

            <div className={`mt-6 rounded-xl px-4 py-3 text-sm ${Math.abs(weightTotal - 100) < 0.001 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
              Weights currently total {weightTotal}% {Math.abs(weightTotal - 100) < 0.001 ? '— valid.' : '— they must total exactly 100%.'}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-heading text-base font-semibold">Readiness bands</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="ready-threshold" className="text-sm">Ready to Apply from</Label>
                  <Input id="ready-threshold" type="number" value={settings.ready_threshold} onChange={(event) => set('ready_threshold', event.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preparation-threshold" className="text-sm">In Preparation from</Label>
                  <Input id="preparation-threshold" type="number" value={settings.preparation_threshold} onChange={(event) => set('preparation_threshold', event.target.value)} className="rounded-xl" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="pending-credit" className="text-sm">Credit for uploaded but unverified documents</Label>
                  <Input id="pending-credit" type="number" step="0.05" min={0} max={1} value={settings.pending_document_credit} onChange={(event) => set('pending_document_credit', event.target.value)} className="rounded-xl" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    A value of 0.6 gives an uploaded document 60% of its document weight until an administrator verifies it.
                  </p>
                </div>
              </div>
              {error ? <p className="mt-4 rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">{error}</p> : null}
            </section>

            <section className="rounded-2xl border border-border bg-muted/40 p-5">
              <h2 className="flex items-center gap-2 font-heading text-sm font-semibold">
                <Info className="h-4 w-4" />
                How the score is explained to students
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Each component shows points earned out of its weight, alongside a sentence describing exactly how it was
                computed — how many conditions passed, how many documents are verified, how many are waiting on a
                prerequisite, and how many profile fields are filled. Readiness is always presented as distinct from
                eligibility and from any chance of selection.
              </p>
            </section>
          </div>
        </div>
      )}
    </>
  );
}