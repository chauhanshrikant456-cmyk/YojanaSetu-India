import { Link } from 'react-router-dom';
import { ExternalLink, LifeBuoy, Mail, ShieldCheck } from 'lucide-react';
import BrandMark from '@/components/common/BrandMark';
import { DISCLAIMER } from '@/lib/constants';
import {
  ADMIN_ENTRY_PATH, CREATORS, GOVERNMENT_UTILITIES, OFFICIAL_PORTALS, SUPPORT_EMAIL
} from '@/lib/siteConfig';

function LinkColumn({ title, links }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.label}>
            {link.url ? (
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group inline-flex items-start gap-1.5 text-muted-foreground transition-colors hover:text-primary"
              >
                <span>{link.label}</span>
                <ExternalLink className="mt-1 h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
              </a>
            ) : (
              <Link to={link.to} className="text-muted-foreground transition-colors hover:text-primary">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 lg:grid-cols-[1fr_2.4fr]">
          <div>
            <BrandMark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{DISCLAIMER}</p>

            <div className="mt-6 rounded-2xl border border-border bg-card p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <LifeBuoy className="h-3.5 w-3.5" />
                Support
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="mt-2.5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <Mail className="h-4 w-4 shrink-0" />
                {SUPPORT_EMAIL}
              </a>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                For corrections, a missing scheme, a document that was rejected wrongly, or any problem using the
                platform.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Official portals for every category
            </p>
            <div className="mt-4 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {OFFICIAL_PORTALS.map((group) => (
                <LinkColumn key={group.label} title={group.label} links={group.links} />
              ))}
            </div>
            <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
              Official portals open in a new tab. Always check the web address before entering personal details — and
              apply only through the official notification linked on each listing.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-8 border-t border-border pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <LinkColumn
            title="Platform"
            links={[
              { label: 'Opportunity catalog', to: '/opportunities' },
              { label: 'Eligibility check', to: '/eligibility' },
              { label: 'Readiness & what-if', to: '/readiness' },
              { label: 'Document vault', to: '/documents' }
            ]}
          />
          <LinkColumn
            title="Account"
            links={[
              { label: 'Sign in', to: '/login' },
              { label: 'Create account', to: '/register' },
              { label: 'My profile & privacy', to: '/profile' }
            ]}
          />
          <LinkColumn title="Government utilities" links={GOVERNMENT_UTILITIES} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Administration</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link
                  to={ADMIN_ENTRY_PATH}
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin sign in
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-muted-foreground transition-colors hover:text-primary">
                  Admin console
                </Link>
              </li>
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-muted-foreground transition-colors hover:text-primary">
                  Report an issue
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-card/60 px-5 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} YojanaSetu India. Designed and developed by{' '}
            <span className="font-medium text-foreground">{CREATORS}</span>.
          </p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" />
            Independent platform — applications are submitted only on official portals.
          </p>
        </div>
      </div>
    </footer>
  );
}