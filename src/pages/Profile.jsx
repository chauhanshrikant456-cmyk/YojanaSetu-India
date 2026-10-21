import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import useProfile from '@/hooks/useProfile';
import ProfileForm from '@/components/profile/ProfileForm';
import PageHeader from '@/components/common/PageHeader';
import { LoadingRows } from '@/components/common/LoadingGrid';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { profileCompleteness } from '@/lib/profile';
import { Lock, ShieldCheck, Trash2 } from 'lucide-react';

export default function Profile() {
  const { profile, loading, save, reload } = useProfile();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const completeness = profileCompleteness(profile);

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      await save(payload);
      toast({ title: 'Profile saved', description: 'Eligibility results will use these details.' });
    } finally {
      setSaving(false);
    }
  };

  const updatePref = async (field, value) => {
    setPrefsSaving(true);
    try {
      await save({ [field]: value });
      toast({ title: 'Notification preference updated' });
    } finally {
      setPrefsSaving(false);
    }
  };

  const deleteMyData = async () => {
    setDeleting(true);
    try {
      const docs = await base44.entities.UserDocument.list({ limit: 200 });
      if (docs.items?.length) await base44.entities.UserDocument.deleteMany({});
      if (profile?.id) await base44.entities.UserProfile.delete(profile.id);
      await reload();
      toast({ title: 'Your profile and document records were deleted' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="My profile" description="Loading your saved details…" />
        <LoadingRows count={3} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Preparation profile"
        title="My profile"
        description="These are the fields the eligibility engine reads. Anything left blank is reported as not yet evaluated rather than assumed."
        actions={
          <div className="w-48">
            <p className="mb-1.5 text-xs text-muted-foreground">{completeness.filled} of {completeness.total} fields filled</p>
            <Progress value={completeness.percentage} className="h-2" />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          <ProfileForm profile={profile} onSave={handleSave} saving={saving} />
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-base font-semibold">Notification preferences</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Alerts are created in-app from published deadlines and document validity. Duplicates are suppressed.
            </p>
            <div className="mt-4 space-y-4">
              {[
                { field: 'notify_deadlines', label: 'Deadline reminders' },
                { field: 'notify_documents', label: 'Document expiry and rejection alerts' },
                { field: 'notify_readiness', label: 'Profile and readiness suggestions' }
              ].map((item) => (
                <div key={item.field} className="flex items-center justify-between gap-4">
                  <Label htmlFor={item.field} className="text-sm font-normal">{item.label}</Label>
                  <Switch
                    id={item.field}
                    disabled={prefsSaving}
                    checked={profile?.[item.field] !== false}
                    onCheckedChange={(checked) => updatePref(item.field, checked)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Privacy and your data
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li className="flex items-start gap-2">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Uploaded documents are stored privately and are never given a public link.
              </li>
              <li className="flex items-start gap-2">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Profile records are readable only by you and platform administrators.
              </li>
              <li className="flex items-start gap-2">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                The platform collects only what the eligibility rules need — no identity numbers are stored.
              </li>
            </ul>
            <Button variant="outline" className="mt-4" disabled={deleting} onClick={deleteMyData}>
              <Trash2 className="mr-2 h-4 w-4" />
              {deleting ? 'Deleting…' : 'Delete my profile and document records'}
            </Button>
          </section>
        </div>
      </div>
    </>
  );
}