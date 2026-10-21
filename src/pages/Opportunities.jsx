import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import CategoryGridlessHeader from '@/components/catalog/CatalogHeader';
import OpportunityFilters from '@/components/catalog/OpportunityFilters';
import OpportunityCard from '@/components/catalog/OpportunityCard';
import { LoadingGrid } from '@/components/common/LoadingGrid';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';
import SiteFooter from '@/components/landing/SiteFooter';

const OPEN_STATUSES = ['published', 'closing_soon', 'needs_verification'];
const PAGE_SIZE = 12;

export default function Opportunities() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  const filters = {
    q: params.get('q') || '',
    category: params.get('category') || '',
    state: params.get('state') || '',
    education_level: params.get('education_level') || '',
    status: params.get('status') || '',
    sort: params.get('sort') || 'newest'
  };

  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const query = useMemo(() => {
    const built = {};
    if (filters.q) built.title = { $regex: filters.q, $options: 'i' };
    if (filters.category) built.category = filters.category;
    if (filters.state) built.state = filters.state;
    if (filters.education_level) built.education_level = filters.education_level;
    built.status = filters.status || { $in: OPEN_STATUSES };
    return built;
  }, [filters.q, filters.category, filters.state, filters.education_level, filters.status]);

  const sort = filters.sort === 'newest' ? '-created_date' : filters.sort === 'title' ? 'title' : 'application_deadline';

  useEffect(() => {
    let active = true;
    setLoading(true);
    base44.entities.Opportunity.filter(query, { sort, limit: PAGE_SIZE })
      .then((page) => {
        if (!active) return;
        setItems(page.items || []);
        setCursor(page.next_cursor || null);
        setHasMore(Boolean(page.has_more));
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        setHasMore(false);
        setLoading(false);
      });

    base44.entities.Opportunity.count(query)
      .then((count) => {
        if (active) setTotal(count);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [query, sort]);

  const loadMore = async () => {
    setLoadingMore(true);
    const page = await base44.entities.Opportunity.filter(query, { sort, limit: PAGE_SIZE, cursor });
    setItems((current) => current.concat(page.items || []));
    setCursor(page.next_cursor || null);
    setHasMore(Boolean(page.has_more));
    setLoadingMore(false);
  };

  const updateFilters = (next) => {
    const nextParams = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (!value) return;
      if (key === 'sort' && value === 'newest') return;
      nextParams.set(key, value);
    });
    const search = nextParams.toString();
    navigate(search ? `/opportunities?${search}` : '/opportunities');
  };

  const reset = () => navigate('/opportunities');

  return (
    <div className="min-h-screen bg-background">
      <CategoryGridlessHeader />
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Opportunity catalog</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Scholarships, admissions, examinations, certifications and fellowships — with the authority responsible,
            the documents required and the eligibility rules used to evaluate you.
          </p>
        </div>

        <OpportunityFilters filters={filters} onChange={updateFilters} onReset={reset} />

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? 'Searching the catalog…' : `${total === null ? items.length : total} listing(s) found`}
          </p>
        </div>

        <div className="mt-4">
          {loading ? (
            <LoadingGrid count={6} />
          ) : items.length === 0 ? (
            <EmptyState
              icon={Compass}
              title="No listings match these filters"
              description="Try a different category or state, or clear the filters to see everything currently catalogued."
              action={<Button variant="outline" onClick={reset}>Clear filters</Button>}
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
              {hasMore ? (
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? 'Loading…' : 'Load more listings'}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}