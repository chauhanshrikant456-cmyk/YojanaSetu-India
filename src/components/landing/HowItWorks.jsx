import { ClipboardCheck, FileSearch, Route, Sparkles } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardCheck,
    title: 'Build a profile once',
    detail: 'Income, marks, state, domicile, category, course and entrance scores — the fields the eligibility rules actually read.'
  },
  {
    icon: FileSearch,
    title: 'Get evaluated, rule by rule',
    detail: 'Every published condition is evaluated and shown as passed, failed or not yet evaluated. Missing details are never treated as a pass.'
  },
  {
    icon: Route,
    title: 'Untangle the document chain',
    detail: 'Prerequisites are modelled as a graph, so the platform can name the root blocker and the order that clears it fastest.'
  },
  {
    icon: Sparkles,
    title: 'Test changes safely',
    detail: 'The what-if simulator scores a hypothetical income, marks or completed document without touching your saved data.'
  }
];

export default function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-16">
      <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">How it works</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Five questions, answered in order: what fits me, am I eligible, what do I need, what is blocking me, and what do
        I do next.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <div key={step.title} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-4 w-4" />
              </span>
              <span className="font-heading text-xs font-semibold text-muted-foreground">STEP {index + 1}</span>
            </div>
            <h3 className="mt-4 font-heading text-base font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}