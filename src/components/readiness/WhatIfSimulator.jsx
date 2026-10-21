import { useState } from 'react';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import ScoreRing from '@/components/common/ScoreRing';

export default function WhatIfSimulator({ opportunityId, readiness, engineProfile }) {
  const [income, setIncome] = useState('');
  const [marks, setMarks] = useState('');
  const [entrance, setEntrance] = useState('');
  const [disability, setDisability] = useState(Boolean(engineProfile?.disabilityStatus));
  const [assumedCodes, setAssumedCodes] = useState([]);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const missingDocuments = (readiness?.documents || []).filter((document) => document.status !== 'verified');

  const run = async () => {
    setRunning(true);
    try {
      const hypotheticalProfile = { ...engineProfile };
      if (income !== '') hypotheticalProfile.annualFamilyIncome = Number(income);
      if (marks !== '') hypotheticalProfile.marksPercentage = Number(marks);
      if (entrance !== '') hypotheticalProfile.entranceExamScore = Number(entrance);
      hypotheticalProfile.disabilityStatus = disability;

      const hypotheticalDocuments = (readiness?.documents || []).map((document) => ({
        document_code: document.code,
        status: assumedCodes.includes(document.code) ? 'verified' : document.status
      }));

      const response = await base44.functions.invoke('computeReadiness', {
        opportunityId,
        hypotheticalProfile,
        hypotheticalDocuments
      });
      setResult(response.data?.readiness || null);
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    setIncome('');
    setMarks('');
    setEntrance('');
    setDisability(Boolean(engineProfile?.disabilityStatus));
    setAssumedCodes([]);
    setResult(null);
  };

  const delta = result && readiness ? result.overall_score - readiness.overall_score : null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-primary" />
        <h2 className="font-heading text-base font-semibold">What-if simulator</h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Test hypothetical changes to your situation. Nothing here is saved — your profile, documents and tracking stay
        exactly as they are.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="whatif-income" className="text-sm">Hypothetical annual family income (₹)</Label>
          <Input id="whatif-income" type="number" value={income} onChange={(event) => setIncome(event.target.value)} placeholder="e.g. 200000" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatif-marks" className="text-sm">Hypothetical marks percentage</Label>
          <Input id="whatif-marks" type="number" value={marks} onChange={(event) => setMarks(event.target.value)} placeholder="e.g. 82" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatif-entrance" className="text-sm">Hypothetical entrance score</Label>
          <Input id="whatif-entrance" type="number" value={entrance} onChange={(event) => setEntrance(event.target.value)} placeholder="e.g. 74" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Certified disability</Label>
          <div className="flex h-10 items-center gap-3">
            <Switch checked={disability} onCheckedChange={setDisability} />
            <span className="text-sm text-muted-foreground">{disability ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>

      {missingDocuments.length > 0 ? (
        <div className="mt-5">
          <p className="text-sm font-medium">Assume these documents are obtained</p>
          <div className="mt-3 space-y-2.5">
            {missingDocuments.map((document) => (
              <div key={document.code} className="flex items-center gap-3">
                <Checkbox
                  id={`assume-${document.code}`}
                  checked={assumedCodes.includes(document.code)}
                  onCheckedChange={(checked) =>
                    setAssumedCodes((current) => (checked ? current.concat(document.code) : current.filter((code) => code !== document.code)))
                  }
                />
                <Label htmlFor={`assume-${document.code}`} className="text-sm font-normal text-muted-foreground">
                  {document.name}
                </Label>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={run} disabled={running}>{running ? 'Simulating…' : 'Run simulation'}</Button>
        <Button variant="ghost" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      {result ? (
        <div className="mt-6 rounded-2xl border border-dashed border-primary/40 bg-primary/[0.04] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Hypothetical result — not saved</p>
          <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
            <ScoreRing score={result.overall_score} label={result.status_label} size={132} />
            <div className="w-full space-y-2 text-sm">
              <p>
                Score change:{' '}
                <span className={delta === 0 ? 'text-muted-foreground' : delta > 0 ? 'font-medium text-success' : 'font-medium text-destructive'}>
                  {delta > 0 ? '+' : ''}{delta} points
                </span>
              </p>
              <p className="text-muted-foreground">
                Verdict would become <span className="font-medium text-foreground">{result.eligibility.summary}</span>
              </p>
              <p className="text-muted-foreground">
                Remaining blockers: {result.dependency.blocked.length === 0
                  ? 'none'
                  : result.dependency.blocked.map((item) => item.name).join(', ')}
              </p>
              <p className="text-xs text-muted-foreground">
                Real readiness stays at {readiness?.overall_score ?? 0}/100 until you actually change your profile or upload the documents.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}