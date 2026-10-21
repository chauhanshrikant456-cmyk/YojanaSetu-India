import { useEffect, useState } from 'react';
import { BadgeCheck, ExternalLink, ShieldAlert } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { logAudit } from '@/lib/audit';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { LoadingRows } from '@/components/common/LoadingGrid';
import { OpportunityStatusBadge } from '@/components/common/Badges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatDateTime } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

const OUTCOMES = [
  { value: 'reachable', label: 'Source reachable and unchanged' },
  { value: 'changed', label: 'Source reachable but details changed' },
  { value: 'unreachable', label: 'Source unreachable' },
  { value: 'not_found', label: 'Notification not found' }
];

export default function AdminVerification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pending, setPending] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [working, setWorking] = useState('');
  const [verified, setVerified] = useState([]);
  const [revertId, setRevertId] = useState('');
  const [reverting, setReverting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [unverifiedPage, historyPage, verifiedPage] = await Promise.all([
        base44.entities.Opportunity.filter({ source_verified: false }, { sort: '-updated_date', limit: 100 }),
        base44.entities.SourceVerification.list({ sort: '-created_date', limit: 20 }),
        base44.entities.Opportunity.filter({ source_verified: true }, { sort: 'title', limit: 50, fields: ['title'] })
      ]);
      setPending(unverifiedPage.items || []);
      setHistory(historyPage.items || []);
      setVerified(verifiedPage.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const draftFor = (opportunity) => drafts[opportunity.id] || {
    outcome: 'reachable',
    notes: '',
    source_url: opportunity.official_notification_url || ''
  };

  const setDraft = (opportunity, patch) => {
    setDrafts((current) => ({ ...current, [opportunity.id]: { ...draftFor(opportunity), ...patch } }));
  };

  const record = async (opportunity, markVerified) => {
    const draft = draftFor(opportunity);
    setWorking(opportunity.id);
    try {
      await base44.entities.SourceVerification.create({
        opportunity_id: opportunity.id,
        opportunity_title: opportunity.title,
        source_url: draft.source_url || null,
        outcome: draft.outcome,
        checked_date: new Date().toISOString().slice(0, 10),
        checked_by_email: user?.email || null,
        notes: draft.notes || null
      });

      if (markVerified) {
        await base44.entities.Opportunity.update(opportunity.id, {
          source_verified: true,
          last_verified_date: new Date().toISOString().slice(0, 10),
          status: opportunity.status === 'needs_verification' ? 'published' : opportunity.status,
          official_notification_url: draft.source_url || opportunity.official_notification_url,
          data_note: null
        });
        await logAudit({
          action: 'verify',
          entityName: 'Opportunity',
          entityId: opportunity.id,
          entityLabel: opportunity.title,
          details: `Source checked: ${draft.outcome}`,
          user
        });
        toast({ title: 'Listing marked verified', description: 'The verification note is no longer shown to students.' });
      } else {
        await logAudit({
          action: 'update',
          entityName: 'Opportunity',
          entityId: opportunity.id,
          entityLabel: opportunity.title,
          details: `Verification recorded as ${draft.outcome} — listing kept unverified`,
          user
        });
        toast({ title: 'Verification recorded', description: 'The listing stays marked as needing verification.' });
      }

      setPending((current) => current.filter((item) => item.id !== opportunity.id));
      await load();
    } finally {
      setWorking('');
    }
  };

  const revertVerification = async (opportunity) => {
    await base44.entities.Opportunity.update(opportunity.id, { source_verified: false, status: 'needs_verification' });
    await logAudit({
      action: 'update',
      entityName: 'Opportunity',
      entityId: opportunity.id,
      entityLabel: opportunity.title,
      details: 'Reverted to needs verification',
      user
    });
    await load();
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin console"
        title="Source verification"
        description="A listing is never marked verified just because a URL exists. Record what you actually checked, when, and what you found — or keep it flagged until you can."
      />

      {loading ? (
        <LoadingRows count={4} />
      ) : pending.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="Nothing awaiting verification"
          description="Every listing currently in the catalog has a recorded verification. Newly imported listings appear here automatically."
        />
      ) : (
        <div className="space-y-4">
          {pending.map((opportunity) => {
            const draft = draftFor(opportunity);
            return (
              <section key={opportunity.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-heading text-base font-semibold">{opportunity.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {opportunity.authority || 'Authority not recorded'} ·{' '}
                      {opportunity.last_verified_date ? `last checked ${formatDate(opportunity.last_verified_date)}` : 'never checked'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <OpportunityStatusBadge status={opportunity.status} />
                    {opportunity.official_notification_url ? (
                      <Button asChild variant="ghost" size="sm">
                        <a href={opportunity.official_notification_url} target="_blank" rel="noreferrer noopener">
                          Open source
                          <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                        </a>
                      </Button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-warning">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        No source URL recorded
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor={`url-${opportunity.id}`} className="text-sm">Official source URL</Label>
                    <Input
                      id={`url-${opportunity.id}`}
                      value={draft.source_url}
                      onChange={(event) => setDraft(opportunity, { source_url: event.target.value })}
                      placeholder="https://"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">What did you find?</Label>
                    <Select value={draft.outcome} onValueChange={(value) => setDraft(opportunity, { outcome: value })}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OUTCOMES.map((outcome) => (<SelectItem key={outcome.value} value={outcome.value}>{outcome.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`notes-${opportunity.id}`} className="text-sm">Notes</Label>
                    <Input
                      id={`notes-${opportunity.id}`}
                      value={draft.notes}
                      onChange={(event) => setDraft(opportunity, { notes: event.target.value })}
                      placeholder="e.g. dates confirmed on the official portal"
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => record(opportunity, true)} disabled={working === opportunity.id || draft.outcome !== 'reachable'}>
                    <BadgeCheck className="mr-2 h-4 w-4" />
                    Mark verified and publish
                  </Button>
                  <Button variant="outline" onClick={() => record(opportunity, false)} disabled={working === opportunity.id}>
                    Record check, keep unverified
                  </Button>
                </div>
                {draft.outcome !== 'reachable' ? (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    A listing can only be marked verified when the source was reachable and unchanged.
                  </p>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-base font-semibold">Recent verification checks</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No verification checks recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-2.5">
            {history.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3.5 py-2.5 text-sm">
                <span>
                  <span className="font-medium">{entry.opportunity_title}</span>
                  <span className="text-muted-foreground"> · {entry.outcome.replace(/_/g, ' ')}</span>
                  {entry.notes ? <span className="block text-xs text-muted-foreground">{entry.notes}</span> : null}
                </span>
                <span className="text-xs text-muted-foreground">
                  {entry.checked_by_email || 'unknown'} · {formatDateTime(entry.created_date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-muted/40 p-5">
        <h2 className="font-heading text-sm font-semibold">Reverting a verification</h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          If a source later changes or becomes unreachable, move the listing back to “needs verification” so students
          see the warning banner again.
        </p>
        {verified.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No verified listings yet.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Select value={revertId} onValueChange={setRevertId}>
              <SelectTrigger className="rounded-xl sm:w-[380px]"><SelectValue placeholder="Choose a verified listing" /></SelectTrigger>
              <SelectContent>
                {verified.map((item) => (<SelectItem key={item.id} value={item.id}>{item.title}</SelectItem>))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={!revertId || reverting}
              onClick={async () => {
                const target = verified.find((item) => item.id === revertId);
                if (!target) return;
                setReverting(true);
                try {
                  await revertVerification(target);
                  setRevertId('');
                } finally {
                  setReverting(false);
                }
              }}
            >
              {reverting ? 'Reverting…' : 'Revert to needs verification'}
            </Button>
          </div>
        )}
      </section>
    </>
  );
}