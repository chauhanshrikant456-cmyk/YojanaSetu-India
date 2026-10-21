import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OPERATOR_META, OPERATOR_OPTIONS } from '@/lib/constants';
import { PROFILE_FIELDS } from '@/lib/profile';

const EMPTY = {
  title: '', field: 'annualFamilyIncome', operator: 'lte', value: '', value2: '',
  group: 'AND', mandatory: true, explanation: '', is_active: true, sort_order: 0
};

export default function RuleForm({ opportunity, rule, onSaved, onDeleted }) {
  const [draft, setDraft] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft(rule ? { ...EMPTY, ...rule } : EMPTY);
    setError('');
  }, [rule, opportunity?.id]);

  const field = PROFILE_FIELDS.find((item) => item.key === draft.field);
  const operatorMeta = OPERATOR_META[draft.operator] || OPERATOR_META.eq;

  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError('Give the rule a title so students understand what it checks.');
      return;
    }
    if (operatorMeta.wantsValue && String(draft.value).trim() === '') {
      setError('This operator needs a target value.');
      return;
    }
    if (operatorMeta.wantsSecondValue && String(draft.value2).trim() === '') {
      setError('A range needs both a lower and an upper value.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        opportunity_id: opportunity.id,
        opportunity_title: opportunity.title,
        title: draft.title,
        field: draft.field,
        operator: draft.operator,
        value: operatorMeta.wantsValue ? String(draft.value) : null,
        value2: operatorMeta.wantsSecondValue ? String(draft.value2) : null,
        group: draft.group,
        mandatory: draft.mandatory,
        explanation: draft.explanation || null,
        is_active: draft.is_active,
        sort_order: draft.sort_order || 0
      };
      const saved = rule?.id
        ? await base44.entities.EligibilityRule.update(rule.id, payload)
        : await base44.entities.EligibilityRule.create(payload);
      onSaved(saved);
      if (!rule?.id) setDraft({ ...EMPTY, sort_order: (draft.sort_order || 0) + 1 });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    await base44.entities.EligibilityRule.delete(rule.id);
    onDeleted(rule);
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold">{rule ? 'Edit rule' : 'Add a rule'}</h3>
        {rule ? <Button type="button" variant="ghost" size="sm" onClick={remove}>Delete rule</Button> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule-title">Rule title</Label>
        <Input id="rule-title" value={draft.title} onChange={(event) => set('title', event.target.value)} placeholder="e.g. Family income within the notified limit" className="rounded-xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Profile field</Label>
          <Select value={draft.field} onValueChange={(value) => set('field', value)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PROFILE_FIELDS.map((item) => (<SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Operator</Label>
          <Select value={draft.operator} onValueChange={(value) => set('operator', value)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {OPERATOR_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {operatorMeta.wantsValue ? (
          <div className="space-y-1.5">
            <Label htmlFor="rule-value">Target value</Label>
            {field?.type === 'select' ? (
              <Select value={String(draft.value || '')} onValueChange={(value) => set('value', value)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose a value" /></SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (<SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="rule-value"
                type={field?.type === 'number' && !['in', 'not_in', 'regex'].includes(draft.operator) ? 'number' : 'text'}
                value={draft.value ?? ''}
                onChange={(event) => set('value', event.target.value)}
                placeholder={operatorMeta.hint || 'Value'}
                className="rounded-xl"
              />
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label>Target value</Label>
            <p className="rounded-xl border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground">
              Not required — “{operatorMeta.label}” only checks whether the field is filled in.
            </p>
          </div>
        )}

        {operatorMeta.wantsSecondValue ? (
          <div className="space-y-1.5">
            <Label htmlFor="rule-value2">Upper value</Label>
            <Input id="rule-value2" type="number" value={draft.value2 ?? ''} onChange={(event) => set('value2', event.target.value)} className="rounded-xl" />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label>Logic group</Label>
          <Select value={draft.group} onValueChange={(value) => set('group', value)}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND — must be satisfied</SelectItem>
              <SelectItem value="OR">OR — one of several alternatives</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule-explanation">Explanation shown to students</Label>
        <Textarea id="rule-explanation" value={draft.explanation || ''} onChange={(event) => set('explanation', event.target.value)} rows={2} placeholder="Say where the threshold comes from and what to confirm officially." />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <Switch checked={draft.mandatory} onCheckedChange={(checked) => set('mandatory', checked)} id="rule-mandatory" />
          <Label htmlFor="rule-mandatory" className="text-sm font-normal">Mandatory condition</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={draft.is_active} onCheckedChange={(checked) => set('is_active', checked)} id="rule-active" />
          <Label htmlFor="rule-active" className="text-sm font-normal">Active</Label>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : rule ? 'Update rule' : 'Save rule'}</Button>
      </div>
    </form>
  );
}