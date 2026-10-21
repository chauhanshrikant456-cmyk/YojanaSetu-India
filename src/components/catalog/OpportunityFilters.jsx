import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORY_OPTIONS, EDUCATION_OPTIONS, OPPORTUNITY_STATUS_OPTIONS, STATE_OPTIONS } from '@/lib/constants';

const SORTS = [
  { value: 'newest', label: 'Recently added' },
  { value: 'deadline', label: 'Deadline (soonest first)' },
  { value: 'title', label: 'Title (A–Z)' }
];

export default function OpportunityFilters({ filters, onChange, onReset }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });
  const hasFilters = Boolean(filters.q || filters.category || filters.state || filters.education_level || filters.status || filters.sort !== 'newest');

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.q}
          onChange={(event) => set('q', event.target.value)}
          placeholder="Search by scheme, examination or university name"
          className="h-11 rounded-xl pl-10"
          aria-label="Search opportunities"
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="filter-category" className="text-xs text-muted-foreground">Category</Label>
          <Select value={filters.category || 'all'} onValueChange={(value) => set('category', value === 'all' ? '' : value)}>
            <SelectTrigger id="filter-category" className="rounded-xl"><SelectValue placeholder="All categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-state" className="text-xs text-muted-foreground">State</Label>
          <Select value={filters.state || 'all'} onValueChange={(value) => set('state', value === 'all' ? '' : value)}>
            <SelectTrigger id="filter-state" className="rounded-xl"><SelectValue placeholder="Any state" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any state / All India</SelectItem>
              {STATE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-level" className="text-xs text-muted-foreground">Education level</Label>
          <Select value={filters.education_level || 'all'} onValueChange={(value) => set('education_level', value === 'all' ? '' : value)}>
            <SelectTrigger id="filter-level" className="rounded-xl"><SelectValue placeholder="Any level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any level</SelectItem>
              {EDUCATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-status" className="text-xs text-muted-foreground">Listing status</Label>
          <Select value={filters.status || 'open'} onValueChange={(value) => set('status', value === 'open' ? '' : value)}>
            <SelectTrigger id="filter-status" className="rounded-xl"><SelectValue placeholder="Active listings" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Active listings</SelectItem>
              <SelectItem value="published">Published only</SelectItem>
              <SelectItem value="needs_verification">Needs verification</SelectItem>
              {OPPORTUNITY_STATUS_OPTIONS.filter((option) => ['draft', 'closing_soon', 'closed', 'archived'].includes(option.value)).map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-sort" className="text-xs text-muted-foreground">Sort by</Label>
          <Select value={filters.sort || 'deadline'} onValueChange={(value) => set('sort', value)}>
            <SelectTrigger id="filter-sort" className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SORTS.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasFilters ? (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onReset}>
            <X className="mr-2 h-3.5 w-3.5" />
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}