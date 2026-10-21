import { useEffect, useState } from 'react';
import { PROFILE_FIELDS, draftToPayload, profileToDraft } from '@/lib/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ProfileForm({ profile, onSave, saving, submitLabel = 'Save profile' }) {
  const [draft, setDraft] = useState(() => profileToDraft(profile));

  useEffect(() => {
    setDraft(profileToDraft(profile));
  }, [profile?.id, profile?.updated_date]);

  const setValue = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    onSave(draftToPayload(draft));
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {PROFILE_FIELDS.map((field) => {
          const value = draft[field.profileField];
          return (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={`profile-${field.profileField}`} className="text-sm">{field.label}</Label>

              {field.type === 'select' ? (
                <Select
                  value={value === undefined || value === null || value === '' ? 'unset' : String(value)}
                  onValueChange={(next) => setValue(field.profileField, next === 'unset' ? '' : next)}
                >
                  <SelectTrigger id={`profile-${field.profileField}`} className="rounded-xl">
                    <SelectValue placeholder="Not set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unset">Not set</SelectItem>
                    {field.options.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'boolean' ? (
                <div className="flex h-10 items-center gap-3">
                  <Switch
                    id={`profile-${field.profileField}`}
                    checked={value === true}
                    onCheckedChange={(checked) => setValue(field.profileField, checked)}
                  />
                  <span className="text-sm text-muted-foreground">{value === true ? 'Yes' : 'No'}</span>
                </div>
              ) : (
                <Input
                  id={`profile-${field.profileField}`}
                  type={field.type === 'number' ? 'number' : 'text'}
                  inputMode={field.type === 'number' ? 'numeric' : 'text'}
                  value={value === undefined || value === null ? '' : value}
                  placeholder={field.placeholder}
                  onChange={(event) => setValue(field.profileField, event.target.value)}
                  className="rounded-xl"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Only used to evaluate published eligibility rules. Missing fields are never counted as a pass.
        </p>
      </div>
    </form>
  );
}