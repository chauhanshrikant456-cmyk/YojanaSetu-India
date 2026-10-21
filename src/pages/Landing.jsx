import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Info, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import BrandMark from '@/components/common/BrandMark';
import Hero from '@/components/landing/Hero';
import CategoryGrid from '@/components/landing/CategoryGrid';
import HowItWorks from '@/components/landing/HowItWorks';
import FeatureGrid from '@/components/landing/FeatureGrid';
import FaqSection from '@/components/landing/FaqSection';
import SiteFooter from '@/components/landing/SiteFooter';
import OpportunityCard from '@/components/catalog/OpportunityCard';
import ThemeToggle from '@/components/ThemeToggle';
import { LoadingGrid } from '@/components/common/LoadingGrid';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { ADMIN_ENTRY_PATH } from '@/lib/siteConfig';

export default function Landing() {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const location = useLocation();
  const [featured, setFeatured] = useState(null);

  useEffect(() => {
    let active = true;
    base44.entities.Opportunity.filter(
      { status: { $in: ['published', 'closing_soon', 'needs_verification'] } },
      { sort: '-created_date', limit: 6, fields: ['title', 'short_description', 'category', 'authority', 'region', 'state', 'status', 'application_deadline', 'source_verified'] }
    ).then((page) => {
      if (active) setFeatured(page.items || []);
    }).catch(() => {
      if (active) setFeatured([]);
    });
    return () => {
      active = false;
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
          <Link to="/">
            <BrandMark />
          </Link>
          <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
            <Link to="/opportunities" className="transition-colors hover:text-foreground">Opportunities</Link>
            <Link
              to={isAdmin ? '/admin' : ADMIN_ENTRY_PATH}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {isAdmin ? 'Admin console' : 'Admin sign in'}
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-1.5 md:ml-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <Button size="sm" onClick={() => navigate('/dashboard')}>My dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
                <Button size="sm" onClick={() => navigate('/register')}>Create account</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <Hero />
      <CategoryGrid />

      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Recently added listings</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Newly catalogued schemes and examinations. Listings marked “needs verification” carry placeholder
                details until an administrator confirms them against the official source.
              </p>
            </div>
            <Link to="/opportunities" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
              Browse the catalog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8">
            {featured === null ? (
              <LoadingGrid count={3} />
            ) : featured.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-card px-5 py-8 text-sm text-muted-foreground">
                No listings published yet. Administrators can add schemes from the admin console.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            )}
          </div>

          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Dates, amounts and income limits shown as “To Be Announced” have not been published officially yet — the
            platform does not guess them.
          </p>
        </div>
      </section>

      <HowItWorks />
      <FeatureGrid />
      <FaqSection />
      <SiteFooter />
    </div>
  );
}