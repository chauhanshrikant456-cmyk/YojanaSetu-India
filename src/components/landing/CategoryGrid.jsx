import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { CATEGORY_META } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

const VISIBLE_STATUSES = ['published', 'closing_soon', 'needs_verification'];

export default function CategoryGrid() {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let active = true;
    base44.entities.Opportunity.aggregate({ query: { status: { $in: VISIBLE_STATUSES } }, groupBy: 'category' })
      .then((result) => {
        if (!active) return;
        const map = {};
        (result?.rows || []).forEach((row) => {
          map[row.category] = row.count;
        });
        setCounts(map);
      })
      .catch(() => {
        if (active) setCounts({});
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Browse by category</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Every listing carries its authority, official links, required documents and the eligibility rules used to
            evaluate you.
          </p>
        </div>
        <Link to="/opportunities" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          See everything
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(CATEGORY_META).map(([value, meta]) => (
          <Link
            key={value}
            to={`/opportunities?category=${value}`}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}>{meta.label}</span>
              {counts === null ? (
                <Skeleton className="h-6 w-9 rounded-full" />
              ) : (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  {counts[value] || 0}
                </span>
              )}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{meta.blurb}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Explore
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}