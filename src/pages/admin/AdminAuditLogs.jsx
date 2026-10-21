import { useEffect, useState } from 'react';
import { RefreshCw, ScrollText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { LoadingRows } from '@/components/common/LoadingGrid';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime } from '@/lib/format';

const ACTIONS = ['create', 'update', 'delete', 'publish', 'unpublish', 'archive', 'verify', 'duplicate', 'role_change', 'setting_change'];
const PAGE_SIZE = 25;

export default function AdminAuditLogs() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('');
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const load = async () => {
    setLoading(true);
    const query = action ? { action } : {};
    const page = await base44.entities.AuditLog.filter(query, { sort: '-created_date', limit: PAGE_SIZE });
    setEntries(page.items || []);
    setCursor(page.next_cursor || null);
    setHasMore(Boolean(page.has_more));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [action]);

  const loadMore = async () => {
    const query = action ? { action } : {};
    const page = await base44.entities.AuditLog.filter(query, { sort: '-created_date', limit: PAGE_SIZE, cursor });
    setEntries((current) => current.concat(page.items || []));
    setCursor(page.next_cursor || null);
    setHasMore(Boolean(page.has_more));
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin console"
        title="Audit logs"
        description="Every administrative change to the catalog, rules, documents, dependency graph, verification and settings is recorded with who did it and when."
        actions={
          <>
            <Select value={action || 'all'} onValueChange={(value) => setAction(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[190px] rounded-xl"><SelectValue placeholder="All actions" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {ACTIONS.map((item) => (
                  <SelectItem key={item} value={item}>{item.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={load}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </>
        }
      />

      {loading ? (
        <LoadingRows count={6} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No audit entries"
          description="Changes made from the admin console will appear here with the actor, the record and the details."
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Action</TableHead>
                  <TableHead className="w-[170px]">Record type</TableHead>
                  <TableHead className="min-w-[240px]">Record</TableHead>
                  <TableHead className="min-w-[200px]">Details</TableHead>
                  <TableHead className="w-[190px]">Actor</TableHead>
                  <TableHead className="w-[170px]">When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm font-medium capitalize">{entry.action.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.entity_name}</TableCell>
                    <TableCell className="text-sm">{entry.entity_label || entry.entity_id || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.details || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{entry.actor_email || 'system'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDateTime(entry.created_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {hasMore ? (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" onClick={loadMore}>Load older entries</Button>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}