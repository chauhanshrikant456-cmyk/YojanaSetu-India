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
import { useToast } from '@/components/ui/use-toast';

const EMPTY = { code: '', name: '', description: '', issuing_authority: '', validity_months: '', requires_verification: true, is_active: true, notes: '' };

export default function DocumentTypeForm({ open, onOpenChange, documentType, onSaved }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [draft, setDraft] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setDraft(documentType ? { ...EMPTY, ...documentType, validity_months: documentType.validity_months ?? '' } : EMPTY);
    setError('');
  }, [open, documentType]);

  const set = (key, value) => setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!draft.name.trim()) return setError('A document name is required.');
    if (!draft.code.trim() || !/^[a-z0-9_]+$/.test(draft.code)) {
      return setError('The code must use lowercase letters, numbers and underscores only (e.g. income_certificate).');
    }

    setSaving(true);
    try {
      const payload = {
        code: draft.code.trim(),
        name: draft.name.trim(),
        description: draft.description || null,
        issuing_authority: draft.issuing_authority || null,
        validity_months: draft.validity_months === '' ? null : Number(draft.validity_months),
        requires_verification: draft.requires_verification,
        is_active: draft.is_active,
        notes: draft.notes || null
      };
      const saved = documentType?.id
        ? await base44.entities.DocumentType.update(documentType.id, payload)
        : await base44.entities.DocumentType.create(payload);

      await logAudit({
        action: documentType?.id ? 'update' : 'create',
        entityName: 'DocumentType',
        entityId: saved.id,
        entityLabel: saved.name,
        details: 'Document catalog entry saved',
        user
      });
      onSaved(saved);
      toast({ title: 'Document type saved' });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{documentType?.id ? 'Edit document type' : 'New document type'}</DialogTitle>
          <DialogDescription>
            Document requirements are configurable — nothing is mandatory for every student or every listing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-name">Name</Label>
              <Input id="doc-name" value={draft.name} onChange={(event) => set('name', event.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-code">Code</Label>
              <Input id="doc-code" value={draft.code} onChange={(event) => set('code', event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-description">Description</Label>
            <Textarea id="doc-description" rows={2} value={draft.description || ''} onChange={(event) => set('description', event.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-authority">Issuing authority</Label>
              <Input id="doc-authority" value={draft.issuing_authority || ''} onChange={(event) => set('issuing_authority', event.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="doc-validity">Typical validity (months)</Label>
              <Input id="doc-validity" type="number" value={draft.validity_months} onChange={(event) => set('validity_months', event.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-notes">Notes for administrators</Label>
            <Textarea id="doc-notes" rows={2} value={draft.notes || ''} onChange={(event) => set('notes', event.target.value)} />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <Switch id="doc-verification" checked={draft.requires_verification} onCheckedChange={(checked) => set('requires_verification', checked)} />
              <Label htmlFor="doc-verification" className="text-sm font-normal">Requires verification</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="doc-active" checked={draft.is_active} onCheckedChange={(checked) => set('is_active', checked)} />
              <Label htmlFor="doc-active" className="text-sm font-normal">Available to students</Label>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save document type'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}