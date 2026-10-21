import { AlertTriangle, ArrowRight, FileText, GitBranch, Upload } from 'lucide-react';
import { DocumentStatusBadge } from '@/components/common/Badges';

export default function DocumentsPanel({ documents, dependency }) {
  if (!documents || documents.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Required documents</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          This listing does not record any document requirement yet.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-base font-semibold">Required documents</h2>
      </div>

      <ul className="mt-4 space-y-3">
        {documents.map((document) => (
          <li key={document.code} className="rounded-xl border border-border px-3.5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">{document.name}</p>
              <DocumentStatusBadge status={document.status} />
            </div>
            {document.blocked && document.blocked_by.length > 0 ? (
              <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-warning">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Waiting on {document.blocked_by.map((item) => item.name).join(', ')} first.
              </p>
            ) : null}
            {document.status === 'rejected' && document.rejection_reason ? (
              <p className="mt-2 text-xs leading-relaxed text-destructive">Rejected: {document.rejection_reason}</p>
            ) : null}
            {document.expiry_date ? (
              <p className="mt-1 text-xs text-muted-foreground">Valid until {document.expiry_date}</p>
            ) : null}
          </li>
        ))}
      </ul>

      {dependency && dependency.sequence.length > 0 ? (
        <div className="mt-5 rounded-xl bg-muted/60 p-4">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5" />
            Recommended acquisition order
          </p>
          <ol className="mt-3 space-y-2">
            {dependency.sequence.map((item, index) => (
              <li key={item.code} className="flex items-center gap-2 text-sm">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-card text-[11px] font-semibold text-muted-foreground">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{item.name}</span>
                {index < dependency.sequence.length - 1 ? <ArrowRight className="h-3 w-3 text-muted-foreground/60" /> : null}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Follows the prerequisite graph configured by the administrators — clear the first item and the rest unlock.
          </p>
        </div>
      ) : null}

      {dependency && dependency.roots.length > 0 ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-warning/10 px-3 py-2.5 text-xs leading-relaxed text-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Root blocker{dependency.roots.length > 1 ? 's' : ''}: {dependency.roots.map((item) => item.name).join(', ')}.
        </p>
      ) : null}

      <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Upload className="h-3.5 w-3.5" />
        Upload and manage these in your document vault.
      </p>
    </section>
  );
}