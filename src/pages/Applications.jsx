import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { LoadingRows } from '@/components/common/LoadingGrid';
import { ApplicationStatusBadge } from '@/components/common/Badges';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { APPLICATION_STATUS_OPTIONS } from '@/lib/constants';
import { formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

export default function Applications() {
  const { toast } = useToast();
  const [tracked, setTracked] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [trackedPage, savedPage] = await Promise.all([
        base44.entities.TrackedApplication.list({ sort: '-created_date', limit: 100 }),
        base44.entities.SavedOpportunity.list({ sort: '-created_date', limit: 100 })
      ]);
      setTracked(trackedPage.items || []);
      setSaved(savedPage.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (application, status) => {
    const updated = await base44.entities.TrackedApplication.update(application.id, {
      status,
      status_updated_date: new Date().toISOString().slice(0, 10)
    });
    setTracked((current) => current.map((item) => (item.id === application.id ? updated : item)));
  };

  const removeTracked = async (application) => {
    await base44.entities.TrackedApplication.delete(application.id);
    setTracked((current) => current.filter((item) => item.id !== application.id));
    toast({ title: 'Application removed from tracking' });
  };

  const startTracking = async (savedItem) => {
    const created = await base44.entities.TrackedApplication.create({
      opportunity_id: savedItem.opportunity_id,
      opportunity_title: savedItem.opportunity_title,
      status: 'interested',
      status_updated_date: new Date().toISOString().slice(0, 10)
    });
    setTracked((current) => [created].concat(current));
    await base44.entities.SavedOpportunity.delete(savedItem.id);
    setSaved((current) => current.filter((item) => item.id !== savedItem.id));
    toast({ title: 'Added to your application tracker' });
  };

  const removeSaved = async (savedItem) => {
    await base44.entities.SavedOpportunity.delete(savedItem.id);
    setSaved((current) => current.filter((item) => item.id !== savedItem.id));
  };

  return (
    <>
      <PageHeader
        eyebrow="Application tracking"
        title="Applications"
        description="These statuses are yours to manage as a personal checklist. They are not official application statuses unless an authorised integration confirms them."
      />

      {loading ? (
        <LoadingRows count={4} />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 font-heading text-base font-semibold">Tracked applications ({tracked.length})</h2>
            {tracked.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Nothing tracked yet"
                description="Save an opportunity from the catalog, then start tracking it to follow your progress here."
                action={<Button asChild><Link to="/opportunities">Browse opportunities</Link></Button>}
              />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Opportunity</TableHead>
                      <TableHead className="w-[240px]">Status</TableHead>
                      <TableHead className="w-[140px]">Updated</TableHead>
                      <TableHead className="w-[70px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tracked.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell>
                          <Link to={`/opportunities/${application.opportunity_id}`} className="font-medium hover:text-primary">
                            {application.opportunity_title}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Select value={application.status} onValueChange={(value) => updateStatus(application, value)}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {APPLICATION_STATUS_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {application.status_updated_date ? formatDate(application.status_updated_date) : '—'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeTracked(application)} aria-label="Remove application">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-heading text-base font-semibold">Saved opportunities ({saved.length})</h2>
            {saved.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-card px-5 py-6 text-sm text-muted-foreground">
                Nothing saved yet — use the Save button on any listing.
              </p>
            ) : (
              <ul className="space-y-3">
                {saved.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
                    <Link to={`/opportunities/${item.opportunity_id}`} className="font-medium hover:text-primary">
                      {item.opportunity_title}
                    </Link>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => startTracking(item)}>Start tracking</Button>
                      <Button variant="ghost" size="sm" onClick={() => removeSaved(item)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {tracked.length > 0 ? (
            <section className="rounded-2xl border border-border bg-muted/40 p-5">
              <h2 className="font-heading text-sm font-semibold">Statuses at a glance</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {APPLICATION_STATUS_OPTIONS.map((option) => {
                  const count = tracked.filter((item) => item.status === option.value).length;
                  if (count === 0) return null;
                  return (
                    <span key={option.value} className="inline-flex items-center gap-2">
                      <ApplicationStatusBadge status={option.value} />
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </span>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}