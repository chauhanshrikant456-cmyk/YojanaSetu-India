import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { logAudit } from '@/lib/audit';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CATEGORY_OPTIONS, EDUCATION_OPTIONS, OPPORTUNITY_STATUS_OPTIONS, STATE_OPTIONS } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';

const EMPTY = {
  title: '', short_description: '', category: 'scholarship', subcategory: '', authority: '', region: 'All India',
  state: '', education_level: 'any', eligible_courses: '', eligibility_summary: '', exclusion_rules: '',
  benefits: '', application_fee: '', duration: '', domicile_required: false, required_documents: [],
  official_notification_url: '', official_application_url: '', status: 'draft', academic_year: '', 
  application_open_date: '', application_deadline: '', exam_date: '', data_note: ''
};

export default function OpportunityFormDialog({ open, onOpenChange, opportunity, onSaved }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [draft, setDraft] = useState(EMPTY);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!open) return;
    setDraft(opportunity ? { ...EMPTY, ...opportunity } : EMPTY);
    setErrors([]);
  }, [open, opportunity]);

  useEffect(() => {
    base44.entities.DocumentType.filter({ is_active: true }, { sort: 'name', limit: 100 })
      .then((page) => setDocumentTypes(page.items || []))
      .catch(() => setDocumentTypes([]));
  }, []);

  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const toggleDocument = (code, checked) => {
    setDraft((current) => ({
      ...current,
      required_documents: checked
        ? [...new Set((current.required_documents || []).concat(code))]
        : (current.required_documents || []).filter((item) => item !== code)
    }));
  };

  const validate = () => {
    const found = [];
    if (!draft.title.trim()) found.push('Title is required.');
    if (!draft.authority.trim()) found.push('Authority is required before publishing.');
    if (draft.status === 'published') {
      if (!/^https?:\/\/.+/i.test(draft.official_notification_url || '')) found.push('A valid official notification URL is required to publish.');
      if (!/^https?:\/\/.+/i.test(draft.official_application_url || '')) found.push('A valid official application URL is required to publish.');
    }
    if (draft.application_deadline && !/^\d{4}-\d{2}-\d{2}$/.test(draft.application_deadline)) found.push('Deadline must use the YYYY-MM-DD format.');
    return found;
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = validate();
    setErrors(found);
    if (found.length > 0) return;

    setSaving(true);
    try {
      const payload = { ...draft };
      delete payload.id;
      delete payload.created_date;
      delete payload.updated_date;
      delete payload.created_by_id;
      delete payload.status_summary;

      const saved = opportunity?.id
        ? await base44.entities.Opportunity.update(opportunity.id, payload)
        : await base44.entities.Opportunity.create(payload);

      await logAudit({
        action: opportunity?.id ? 'update' : 'create',
        entityName: 'Opportunity',
        entityId: saved.id,
        entityLabel: saved.title,
        details: `Saved with status ${saved.status}`,
        user
      });
      onSaved(saved);
      toast({ title: opportunity?.id ? 'Listing updated' : 'Listing created' });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{opportunity?.id ? 'Edit listing' : 'New listing'}</DialogTitle>
          <DialogDescription>
            Dates are stored as YYYY-MM-DD. Leave a date blank when it has not been published officially — it will
            display as “To Be Announced”.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="opp-title">Title</Label>
              <Input id="opp-title" value={draft.title} onChange={(event) => set('title', event.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="opp-description">Short description</Label>
              <Textarea id="opp-description" value={draft.short_description} onChange={(event) => set('short_description', event.target.value)} rows={2} />
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={draft.category} onValueChange={(value) => set('category', value)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-subcategory">Subcategory</Label>
              <Input id="opp-subcategory" value={draft.subcategory || ''} onChange={(event) => set('subcategory', event.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-authority">Authority</Label>
              <Input id="opp-authority" value={draft.authority} onChange={(event) => set('authority', event.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>State (leave blank for All India)</Label>
              <Select value={draft.state || 'none'} onValueChange={(value) => set('state', value === 'none' ? '' : value)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="All India" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All India</SelectItem>
                  {STATE_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Education level</Label>
              <Select value={draft.education_level} onValueChange={(value) => set('education_level', value)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EDUCATION_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={draft.status} onValueChange={(value) => set('status', value)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OPPORTUNITY_STATUS_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['eligibility_summary', 'Eligibility summary', 3],
              ['exclusion_rules', 'Exclusion rules', 2],
              ['eligible_courses', 'Eligible courses', 2],
              ['benefits', 'Benefits', 2],
              ['application_fee', 'Application fee', 1],
              ['duration', 'Duration', 1]
            ].map(([key, label, rows]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`opp-${key}`}>{label}</Label>
                <Textarea id={`opp-${key}`} value={draft[key] || ''} onChange={(event) => set(key, event.target.value)} rows={rows} />
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            {[
              ['academic_year', 'Academic year'],
              ['application_open_date', 'Opens'],
              ['application_deadline', 'Deadline'],
              ['exam_date', 'Exam / milestone']
            ].map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`opp-${key}`}>{label}</Label>
                <Input
                  id={`opp-${key}`}
                  type={key === 'academic_year' ? 'text' : 'date'}
                  value={draft[key] || ''}
                  onChange={(event) => set(key, event.target.value)}
                  className="rounded-xl"
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="opp-notification">Official notification URL</Label>
              <Input id="opp-notification" value={draft.official_notification_url || ''} onChange={(event) => set('official_notification_url', event.target.value)} placeholder="https://" className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="opp-application">Official application URL</Label>
              <Input id="opp-application" value={draft.official_application_url || ''} onChange={(event) => set('official_application_url', event.target.value)} placeholder="https://" className="rounded-xl" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
            <div>
              <Label htmlFor="opp-domicile" className="text-sm">Domicile requirement</Label>
              <p className="text-xs text-muted-foreground">Turns on domicile-related prompts for this listing.</p>
            </div>
            <Switch id="opp-domicile" checked={draft.domicile_required === true} onCheckedChange={(checked) => set('domicile_required', checked)} />
          </div>

          <div>
            <Label className="text-sm">Required documents</Label>
            {documentTypes.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Publish document types first, then select them here.</p>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {documentTypes.map((type) => (
                  <div key={type.code} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`doc-${type.code}`}
                      checked={(draft.required_documents || []).includes(type.code)}
                      onCheckedChange={(checked) => toggleDocument(type.code, checked)}
                    />
                    <Label htmlFor={`doc-${type.code}`} className="text-sm font-normal">{type.name}</Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="opp-note">Verification note shown to users</Label>
            <Textarea id="opp-note" value={draft.data_note || ''} onChange={(event) => set('data_note', event.target.value)} rows={2} placeholder="e.g. Seeded from public information; confirm dates against the official notification." />
          </div>

          {errors.length > 0 ? (
            <ul className="space-y-1 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errors.map((error) => (<li key={error}>{error}</li>))}
            </ul>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save listing'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}