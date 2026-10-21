import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellOff, CheckCheck, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useProfile from '@/hooks/useProfile';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { LoadingRows } from '@/components/common/LoadingGrid';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { formatDateTime } from '@/lib/format';
import { useToast } from '@/components/ui/use-toast';

const TYPE_TONES = {
  deadline: 'bg-warning/10 text-warning',
  document: 'bg-primary/10 text-primary',
  readiness: 'bg-accent text-accent-foreground',
  system: 'bg-muted text-muted-foreground'
};

export default function Notifications() {
  const { profile, save } = useProfile();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('syncNotifications', {});
      setItems(response.data?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (item) => {
    const updated = await base44.entities.Notification.update(item.id, { is_read: true });
    setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
  };

  const markAllRead = async () => {
    const unread = items.filter((item) => item.is_read !== true);
    if (unread.length === 0) return;
    await base44.entities.Notification.bulkUpdate(unread.map((item) => ({ id: item.id, is_read: true })));
    setItems((current) => current.map((entry) => ({ ...entry, is_read: true })));
    toast({ title: 'All notifications marked as read' });
  };

  const remove = async (item) => {
    await base44.entities.Notification.delete(item.id);
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  };

  const unreadCount = items.filter((item) => item.is_read !== true).length;

  return (
    <>
      <PageHeader
        eyebrow="Alerts"
        title="Notifications"
        description="Generated in-app from published deadlines, document validity and profile gaps. Identical alerts are never created twice."
        actions={
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div>
          {loading ? (
            <LoadingRows count={4} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={BellOff}
              title="No notifications yet"
              description="Alerts appear here once you save or track an opportunity with a published deadline, or upload a document with an expiry date."
            />
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`rounded-2xl border bg-card p-4 ${item.is_read ? 'border-border' : 'border-primary/30'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${TYPE_TONES[item.type] || TYPE_TONES.system}`}>
                          {item.type}
                        </span>
                        {item.is_read ? null : <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}
                      </div>
                      <p className="mt-2 font-medium">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.message}</p>
                      <p className="mt-1.5 text-xs text-muted-foreground">{formatDateTime(item.created_date)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {item.link ? (
                        <Button asChild variant="ghost" size="sm">
                          <Link to={item.link}>Open</Link>
                        </Button>
                      ) : null}
                      {item.is_read ? null : (
                        <Button variant="ghost" size="icon" onClick={() => markRead(item)} aria-label="Mark as read">
                          <Bell className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => remove(item)} aria-label="Delete notification">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-heading text-base font-semibold">What you get alerted about</h2>
          <div className="mt-4 space-y-4">
            {[
              { field: 'notify_deadlines', label: 'Deadlines for saved and tracked opportunities' },
              { field: 'notify_documents', label: 'Document expiry and rejection' },
              { field: 'notify_readiness', label: 'Profile gaps that block a verdict' }
            ].map((item) => (
              <div key={item.field} className="flex items-center justify-between gap-4">
                <Label htmlFor={`notify-${item.field}`} className="text-sm font-normal">{item.label}</Label>
                <Switch
                  id={`notify-${item.field}`}
                  checked={profile?.[item.field] !== false}
                  onCheckedChange={(checked) => save({ [item.field]: checked })}
                />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Email delivery is not enabled — these alerts are in-app only, so nothing is sent to an address you have not
            confirmed.
          </p>
        </section>
      </div>
    </>
  );
}