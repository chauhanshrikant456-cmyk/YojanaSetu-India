import { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, FolderOpen, Info, Trash2, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { LoadingRows } from '@/components/common/LoadingGrid';
import { DocumentStatusBadge } from '@/components/common/Badges';
import UploadDocumentDialog from '@/components/documents/UploadDocumentDialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { daysUntil, formatDate } from '@/lib/format';

export default function Documents() {
  const { toast } = useToast();
  const [types, setTypes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [typesPage, docsPage] = await Promise.all([
        base44.entities.DocumentType.filter({ is_active: true }, { sort: 'name', limit: 100 }),
        base44.entities.UserDocument.list({ limit: 200 })
      ]);
      setTypes(typesPage.items || []);
      setDocuments(docsPage.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const recordFor = (code) => documents.find((document) => document.document_code === code) || null;

  const openFile = async (document) => {
    if (!document.file_uri) return;
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: document.file_uri, expires_in: 300 });
    window.open(signed_url, '_blank', 'noopener');
  };

  const removeDocument = async (document) => {
    await base44.entities.UserDocument.delete(document.id);
    setDocuments((current) => current.filter((item) => item.id !== document.id));
    toast({ title: document.document_name + ' removed from your vault' });
  };

  const verifiedCount = documents.filter((document) => document.status === 'verified').length;

  return (
    <>
      <PageHeader
        eyebrow="Document readiness"
        title="Document vault"
        description="Upload the certificates your target opportunities ask for. Files are stored privately — no public link is created — and where a scheme requires verification, an administrator confirms the copy."
        actions={
          <p className="rounded-xl border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground">
            {verifiedCount} verified · {documents.length} uploaded record(s)
          </p>
        }
      />

      {loading ? (
        <LoadingRows count={5} />
      ) : types.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="The document catalog is empty"
          description="An administrator needs to publish the document types this platform tracks."
        />
      ) : (
        <div className="space-y-3">
          {types.map((type) => {
            const record = recordFor(type.code);
            const expiryRemaining = record?.expiry_date ? daysUntil(record.expiry_date) : null;
            return (
              <div key={type.code} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-base font-semibold">{type.name}</h2>
                      <DocumentStatusBadge status={record?.status || 'missing'} />
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{type.description}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {type.issuing_authority ? `Issued by ${type.issuing_authority}` : 'Issuing authority varies'}
                      {type.validity_months ? ` · typically valid ${type.validity_months} months` : ''}
                      {record?.file_name ? ` · ${record.file_name}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {record?.file_uri ? (
                      <Button variant="outline" size="sm" onClick={() => openFile(record)}>
                        <ExternalLink className="mr-2 h-3.5 w-3.5" />
                        View file
                      </Button>
                    ) : null}
                    <Button size="sm" variant={record ? 'outline' : 'default'} onClick={() => setActiveType({ type, record })}>
                      <Upload className="mr-2 h-3.5 w-3.5" />
                      {record ? 'Replace' : 'Upload'}
                    </Button>
                    {record ? (
                      <Button variant="ghost" size="sm" onClick={() => removeDocument(record)} aria-label={`Remove ${type.name}`}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </div>

                {record?.status === 'rejected' && record.rejection_reason ? (
                  <p className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Rejected: {record.rejection_reason}
                  </p>
                ) : null}

                {expiryRemaining !== null && expiryRemaining <= 30 ? (
                  <p className={`mt-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs leading-relaxed ${expiryRemaining < 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {expiryRemaining < 0
                      ? `Expired on ${formatDate(record.expiry_date)} — renew before applying.`
                      : `Expires on ${formatDate(record.expiry_date)} (${expiryRemaining} days).`}
                  </p>
                ) : null}

                {record?.status === 'pending_verification' ? (
                  <p className="mt-3 flex items-start gap-2 rounded-xl bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Awaiting verification. Until then the readiness score gives this document partial credit.
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {activeType ? (
        <UploadDocumentDialog
          open={Boolean(activeType)}
          onOpenChange={(open) => {
            if (!open) setActiveType(null);
          }}
          documentType={activeType.type}
          existing={activeType.record}
          onSaved={(saved) => {
            setDocuments((current) => {
              const others = current.filter((item) => item.id !== saved.id);
              return others.concat([saved]);
            });
          }}
        />
      ) : null}
    </>
  );
}