import { useState } from 'react';
import { Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function UploadDocumentDialog({ open, onOpenChange, documentType, existing, onSaved }) {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [issuedDate, setIssuedDate] = useState(existing?.issued_date || '');
  const [expiryDate, setExpiryDate] = useState(existing?.expiry_date || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!file && !existing?.file_uri) {
      setError('Choose a file to upload.');
      return;
    }
    setSaving(true);
    try {
      let fileUri = existing?.file_uri || null;
      let fileName = existing?.file_name || null;
      if (file) {
        const upload = await base44.integrations.Core.UploadPrivateFile({ file });
        fileUri = upload.file_uri;
        fileName = file.name;
      }

      const payload = {
        document_code: documentType.code,
        document_name: documentType.name,
        file_uri: fileUri,
        file_name: fileName,
        status: documentType.requires_verification === false ? 'uploaded' : 'pending_verification',
        issued_date: issuedDate || null,
        expiry_date: expiryDate || null,
        notes: notes || null,
        rejection_reason: null
      };

      const saved = existing?.id
        ? await base44.entities.UserDocument.update(existing.id, payload)
        : await base44.entities.UserDocument.create(payload);

      onSaved(saved);
      toast({ title: documentType.name + ' uploaded', description: 'Awaiting verification where required.' });
      onOpenChange(false);
    } catch (uploadError) {
      setError(uploadError.message || 'The upload failed. Try a smaller file or a different format.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{documentType?.name}</DialogTitle>
          <DialogDescription>
            Accepted formats: PDF, JPG or PNG up to 5 MB. Files are stored privately and shared only through
            time-limited links.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="document-file">File</Label>
            <Input
              id="document-file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="rounded-xl"
            />
            {existing?.file_name ? (
              <p className="text-xs text-muted-foreground">Currently uploaded: {existing.file_name}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="document-issued" className="text-sm">Issued on</Label>
              <Input id="document-issued" type="date" value={issuedDate} onChange={(event) => setIssuedDate(event.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="document-expiry" className="text-sm">Valid until</Label>
              <Input id="document-expiry" type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="document-notes" className="text-sm">Notes (optional)</Label>
            <Input id="document-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="e.g. issued at the tehsil office" className="rounded-xl" />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              <Upload className="mr-2 h-4 w-4" />
              {saving ? 'Uploading…' : 'Upload document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}