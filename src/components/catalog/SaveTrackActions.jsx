import { Link } from 'react-router-dom';
import { BookmarkPlus, BookmarkCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { APPLICATION_STATUS_OPTIONS } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';

export default function SaveTrackActions({ opportunity, saved, tracked, onChange, isAuthenticated }) {
  const { toast } = useToast();

  if (!isAuthenticated) {
    return (
      <Button asChild variant="outline">
        <Link to="/login">Sign in to save and track</Link>
      </Button>
    );
  }

  const toggleSave = async () => {
    if (saved) {
      await base44.entities.SavedOpportunity.delete(saved.id);
      onChange({ saved: null });
      toast({ title: 'Removed from saved opportunities' });
    } else {
      const created = await base44.entities.SavedOpportunity.create({
        opportunity_id: opportunity.id,
        opportunity_title: opportunity.title
      });
      onChange({ saved: created });
      toast({ title: 'Saved to your dashboard' });
    }
  };

  const setStatus = async (status) => {
    if (tracked) {
      const updated = await base44.entities.TrackedApplication.update(tracked.id, {
        status,
        status_updated_date: new Date().toISOString().slice(0, 10)
      });
      onChange({ tracked: updated });
    } else {
      const created = await base44.entities.TrackedApplication.create({
        opportunity_id: opportunity.id,
        opportunity_title: opportunity.title,
        status,
        status_updated_date: new Date().toISOString().slice(0, 10)
      });
      onChange({ tracked: created });
    }
    toast({ title: 'Tracking status updated' });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant={saved ? 'default' : 'outline'} onClick={toggleSave}>
        {saved ? <BookmarkCheck className="mr-2 h-4 w-4" /> : <BookmarkPlus className="mr-2 h-4 w-4" />}
        {saved ? 'Saved' : 'Save'}
      </Button>
      <Select value={tracked?.status || ''} onValueChange={setStatus}>
        <SelectTrigger className="w-[220px] rounded-xl">
          <SelectValue placeholder={tracked ? 'Update progress' : 'Track my application'} />
        </SelectTrigger>
        <SelectContent>
          {APPLICATION_STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}