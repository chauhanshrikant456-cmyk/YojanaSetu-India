import {
  BellRing, FileLock2, GitBranch, ListChecks, Scale, ShieldCheck
} from 'lucide-react';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Transparent eligibility verdicts',
    detail: 'Four outcomes, each with the conditions that decided it — so you can see why, not just what.'
  },
  {
    icon: ListChecks,
    title: 'Rules administrators can change',
    detail: 'Equality, comparisons, ranges, list membership, existence and pattern matching, combined with AND and OR groups.'
  },
  {
    icon: GitBranch,
    title: 'Dependency graph with cycle checks',
    detail: 'Prerequisites are validated before saving, so impossible chains are refused with the exact conflict named.'
  },
  {
    icon: Scale,
    title: 'A readiness score you can explain',
    detail: 'Configurable weights for eligibility, documents, dependency integrity and profile completeness — never a promise of selection.'
  },
  {
    icon: FileLock2,
    title: 'Documents kept private',
    detail: 'Uploaded files are stored privately and reachable only through time-limited links for you and the administrators who verify them.'
  },
  {
    icon: BellRing,
    title: 'Deadline and expiry alerts',
    detail: 'Notifications are generated from published dates and document validity, and duplicates are suppressed.'
  }
];

export default function FeatureGrid() {
  return (
    <section id="features" className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Built for accuracy first</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          The platform is a decision-support and preparation tool. It points you to the official notification rather
          than speaking on behalf of any authority.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-border bg-card p-5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-4 w-4" />
              </span>
              <h3 className="mt-4 font-heading text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}