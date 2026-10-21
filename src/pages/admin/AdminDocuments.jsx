import { useEffect, useState } from 'react';
import { FileCheck2, Pencil, Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { logAudit } from '@/lib/audit';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { LoadingRows } from '@/components/common/LoadingGrid';
import DocumentTypeForm from '@/components/admin/DocumentTypeForm';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

export default function AdminDocuments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const page = await base44.entities.DocumentType.list({ sort: 'name', limit: 200 });
      setTypes(page.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleActive = async (type) => {
    const updated = await base44.entities.DocumentType.update(type.id, { is_active: !type.is_active });
    setTypes((current) => current.map((item) => (item.id === type.id ? updated : item)));
    await logAudit({ action: 'update', entityName: 'DocumentType', entityId: type.id, entityLabel: type.name, details: `Available set to ${updated.is_active}`, user });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await base44.entities.DocumentType.delete(pendingDelete.id);
    setTypes((current) => current.filter((item) => item.id !== pendingDelete.id));
    await logAudit({ action: 'delete', entityName: 'DocumentType', entityId: pendingDelete.id, entityLabel: pendingDelete.name, details: 'Document type removed', user });
    setPendingDelete(null);
    toast({ title: 'Document type deleted' });
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin console"
        title="Document catalog"
        description="The master list of documents the platform understands. Listings reference these codes, and the readiness score and dependency graph are built from them."
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New document type
          </Button>
        }
      />

      {loading ? (
        <LoadingRows count={5} />
      ) : types.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No document types yet"
          description="Add the documents students must hold — identity, domicile, income, marksheets and certificates."
          action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}>Add document type</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[220px]">Document</TableHead>
                <TableHead className="w-[200px]">Issuing authority</TableHead>
                <TableHead className="w-[120px]">Validity</TableHead>
                <TableHead className="w-[130px]">Verification</TableHead>
                <TableHead className="w-[120px]">Available</TableHead>
                <TableHead className="w-[110px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>
                    <p className="font-medium">{type.name}</p>
                    <p className="text-xs text-muted-foreground">{type.code}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{type.issuing_authority || 'Not recorded'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{type.validity_months ? `${type.validity_months} months` : 'No fixed validity'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{type.requires_verification === false ? 'Self-declared' : 'Admin verified'}</TableCell>
                  <TableCell>
                    <Switch checked={type.is_active !== false} onCheckedChange={() => toggleActive(type)} aria-label="Toggle availability" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setEditing(type); setFormOpen(true); }} aria-label="Edit document type">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPendingDelete(type)} aria-label="Delete document type">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <DocumentTypeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        documentType={editing}
        onSaved={(saved) => {
          setTypes((current) => {
            const exists = current.some((item) => item.id === saved.id);
            const next = exists ? current.map((item) => (item.id === saved.id ? saved : item)) : current.concat([saved]);
            return next.sort((a, b) => a.name.localeCompare(b.name));
          });
        }}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this document type?</AlertDialogTitle>
            <AlertDialogDescription>
              Listings that reference “{pendingDelete?.name}” will keep the stale code until they are updated. Turning
              availability off is usually safer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}