import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, Copy, Download, FileWarning, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { logAudit } from '@/lib/audit';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { LoadingRows } from '@/components/common/LoadingGrid';
import { OpportunityStatusBadge } from '@/components/common/Badges';
import OpportunityFormDialog from '@/components/admin/OpportunityFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { OPPORTUNITY_STATUS_OPTIONS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

const PAGE_SIZE = 20;

export default function AdminOpportunities() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const query = useMemo(() => {
    const built = {};
    if (search) built.title = { $regex: search, $options: 'i' };
    if (status) built.status = status;
    return built;
  }, [search, status]);

  const load = useCallback(async () => {
    setLoading(true);
    const page = await base44.entities.Opportunity.filter(query, { sort: '-updated_date', limit: PAGE_SIZE });
    setRows(page.items || []);
    setCursor(page.next_cursor || null);
    setHasMore(Boolean(page.has_more));
    setLoading(false);
  }, [query]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    const page = await base44.entities.Opportunity.filter(query, { sort: '-updated_date', limit: PAGE_SIZE, cursor });
    setRows((current) => current.concat(page.items || []));
    setCursor(page.next_cursor || null);
    setHasMore(Boolean(page.has_more));
  };

  const changeStatus = async (opportunity, nextStatus) => {
    const updated = await base44.entities.Opportunity.update(opportunity.id, { status: nextStatus });
    setRows((current) => current.map((row) => (row.id === opportunity.id ? updated : row)));
    await logAudit({
      action: nextStatus === 'archived' ? 'archive' : nextStatus === 'published' ? 'publish' : 'update',
      entityName: 'Opportunity',
      entityId: opportunity.id,
      entityLabel: opportunity.title,
      details: `Status set to ${nextStatus}`,
      user
    });
    toast({ title: 'Listing status updated' });
  };

  const duplicate = async (opportunity) => {
    const { id, created_date, updated_date, created_by_id, ...rest } = opportunity;
    const created = await base44.entities.Opportunity.create({
      ...rest,
      title: `${opportunity.title} (copy)`,
      status: 'draft',
      source_verified: false,
      last_verified_date: null
    });
    setRows((current) => [created].concat(current));
    await logAudit({
      action: 'duplicate',
      entityName: 'Opportunity',
      entityId: created.id,
      entityLabel: created.title,
      details: 'Duplicated for a new cycle as a draft',
      user
    });
    toast({ title: 'Listing duplicated as a draft', description: 'Update the academic year and dates before publishing.' });
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await base44.entities.Opportunity.delete(pendingDelete.id);
    await base44.entities.EligibilityRule.deleteMany({ opportunity_id: pendingDelete.id });
    setRows((current) => current.filter((row) => row.id !== pendingDelete.id));
    await logAudit({
      action: 'delete',
      entityName: 'Opportunity',
      entityId: pendingDelete.id,
      entityLabel: pendingDelete.title,
      details: 'Listing and its eligibility rules deleted',
      user
    });
    setPendingDelete(null);
    toast({ title: 'Listing deleted' });
  };

  const exportCsv = async () => {
    const all = [];
    let nextCursor = null;
    let more = true;
    while (more) {
      const page = await base44.entities.Opportunity.filter(query, { sort: '-updated_date', limit: 100, cursor: nextCursor });
      all.push(...(page.items || []));
      nextCursor = page.next_cursor || null;
      more = Boolean(page.has_more);
      if (all.length > 2000) break;
    }
    const columns = ['title', 'category', 'authority', 'state', 'region', 'education_level', 'status', 'academic_year', 'application_open_date', 'application_deadline', 'exam_date', 'official_notification_url', 'official_application_url', 'source_verified', 'last_verified_date'];
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [columns.join(',')].concat(all.map((row) => columns.map((column) => escape(row[column])).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'yojanasetu-opportunities.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    toast({ title: `${all.length} listing(s) exported` });
  };

  const issuesFor = (opportunity) => {
    const issues = [];
    if (!opportunity.official_notification_url) issues.push('notification URL');
    if (!opportunity.official_application_url) issues.push('application URL');
    if (!opportunity.application_deadline) issues.push('deadline');
    if (opportunity.source_verified !== true) issues.push('unverified');
    return issues;
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin console"
        title="Schemes & listings"
        description="Full control over the catalog: drafts, publishing, cycles, archiving and validation gaps. A listing is never marked verified just because a URL was entered."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              New listing
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by title" className="rounded-xl sm:max-w-sm" />
        <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
          <SelectTrigger className="rounded-xl sm:w-[220px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {OPPORTUNITY_STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <LoadingRows count={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileWarning}
          title="No listings match"
          description="Adjust the filters, or create the first listing for this academic year."
          action={<Button onClick={() => { setEditing(null); setFormOpen(true); }}>New listing</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[240px]">Listing</TableHead>
                <TableHead className="w-[170px]">Status</TableHead>
                <TableHead className="w-[130px]">Deadline</TableHead>
                <TableHead className="w-[190px]">Validation</TableHead>
                <TableHead className="w-[230px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((opportunity) => {
                const issues = issuesFor(opportunity);
                return (
                  <TableRow key={opportunity.id}>
                    <TableCell>
                      <Link to={`/opportunities/${opportunity.id}`} className="font-medium hover:text-primary">{opportunity.title}</Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">{opportunity.authority || 'Authority not recorded'} · {opportunity.academic_year || 'year not set'}</p>
                    </TableCell>
                    <TableCell>
                      <Select value={opportunity.status} onValueChange={(value) => changeStatus(opportunity, value)}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {OPPORTUNITY_STATUS_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {opportunity.application_deadline ? formatDate(opportunity.application_deadline) : 'To Be Announced'}
                    </TableCell>
                    <TableCell>
                      {issues.length === 0 ? (
                        <span className="text-xs text-success">Complete</span>
                      ) : (
                        <span className="text-xs text-warning">Missing: {issues.join(', ')}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setEditing(opportunity); setFormOpen(true); }}>
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => duplicate(opportunity)} aria-label="Duplicate listing">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => changeStatus(opportunity, 'archived')} aria-label="Archive listing">
                          <Archive className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setPendingDelete(opportunity)} aria-label="Delete listing">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={loadMore}>Load more</Button>
        </div>
      ) : null}

      <OpportunityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        opportunity={editing}
        onSaved={(saved) => {
          setRows((current) => {
            const exists = current.some((row) => row.id === saved.id);
            return exists ? current.map((row) => (row.id === saved.id ? saved : row)) : [saved].concat(current);
          });
        }}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.title}” and its eligibility rules will be permanently removed. Archiving keeps the
              record for reference instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Yes, delete listing</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}