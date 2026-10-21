import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Hero() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/opportunities?q=${encodeURIComponent(trimmed)}` : '/opportunities');
  };

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.07] via-background to-background" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at top, black, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse at top, black, transparent 72%)'
        }}
      />
      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Prepared, not guessed — every listing links to its official source
          </span>
          <h1 className="mt-6 font-heading text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-[56px]">
            Discover opportunities.
            <span className="block bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              Prepare documents. Apply with confidence.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            YojanaSetu India works out which scholarships, admissions, examinations and fellowships fit your
            situation, what each one asks for, and which missing document is holding you back — before the
            official deadline.
          </p>

          <form onSubmit={submit} className="mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search scholarships, exams or universities"
                className="h-12 rounded-xl pl-10"
                aria-label="Search opportunities"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 rounded-xl">
              Search
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>Not an official government portal</span>
            <span>No deadlines invented — unknowns stay marked</span>
            <span>Your documents stay private</span>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">How a check works</p>
          <ol className="mt-5 space-y-5">
            {[
              { title: 'Tell us your situation', detail: 'Income, marks, state, course, category — used only to evaluate the published rules.' },
              { title: 'Get a verdict, with reasons', detail: 'Eligible, potentially eligible, ineligible or needs more information — and exactly which conditions decided it.' },
              { title: 'See the document chain', detail: 'Which documents you already hold, which are pending verification, and which prerequisite blocks the rest.' },
              { title: 'Follow the next action', detail: 'A readiness score with the specific step that moves it up — including a safe what-if simulator.' }
            ].map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 font-heading text-sm font-semibold text-primary">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}