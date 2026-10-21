import { useEffect, useState } from 'react';
import { GitBranch, Plus, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { logAudit } from '@/lib/audit';
import PageHeader from '@/components/common/PageHeader';
import { LoadingRows } from '@/components/common/LoadingGrid';
import DependencyGraph, { DependencyLink } from '@/components/admin/DependencyGraph';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

export default function AdminDependencies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fromCode, setFromCode] = useState('');
  const [toCode, setToCode] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('analyzeDependencies', {});
      setData(response.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addLink = async () => {
    setError('');
    if (!fromCode || !toCode) {
      setError('Choose both documents — the first must be obtained before the second.');
      return;
    }
    setSaving(true);
    try {
      const validation = await base44.functions.invoke('validateDependencyEdge', { from_code: fromCode, to_code: toCode });
      if (!validation.data?.valid) {
        setError(validation.data?.reason || 'This link is not valid.');
        return;
      }

      const fromNode = data.nodes.find((node) => node.code === fromCode);
      const toNode = data.nodes.find((node) => node.code === toCode);
      const created = await base44.entities.DependencyEdge.create({
        from_code: fromCode,
        to_code: toCode,
        from_name: fromNode?.name || fromCode,
        to_name: toNode?.name || toCode,
        description: description || null,
        is_active: true
      });

      await logAudit({
        action: 'create',
        entityName: 'DependencyEdge',
        entityId: created.id,
        entityLabel: `${fromNode?.name} → ${toNode?.name}`,
        details: 'Prerequisite link added after cycle validation',
        user
      });

      setDescription('');
      await load();
      toast({ title: 'Prerequisite link added' });
    } finally {
      setSaving(false);
    }
  };

  const removeLink = async (edge) => {
    await base44.entities.DependencyEdge.delete(edge.id);
    await logAudit({
      action: 'delete',
      entityName: 'DependencyEdge',
      entityId: edge.id,
      entityLabel: `${edge.from_name} → ${edge.to_name}`,
      details: 'Prerequisite link removed',
      user
    });
    await load();
    toast({ title: 'Prerequisite link removed' });
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin console"
        title="Prerequisite graph"
        description="Model how documents depend on each other. Every new link is validated against the existing graph — a change that would create a cycle is refused and the conflict is named."
        actions={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh graph
          </Button>
        }
      />

      {loading ? (
        <LoadingRows count={4} />
      ) : !data ? (
        <p className="text-sm text-muted-foreground">The graph could not be loaded.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
          <div className="space-y-6">
            <DependencyGraph levels={data.levels} nodes={data.nodes} cycle={data.cycle} />

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
                <GitBranch className="h-4 w-4 text-primary" />
                Configured links ({data.edges.length})
              </h2>
              {data.edges.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No links yet — add the first prerequisite below.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {data.edges.map((edge) => (
                    <DependencyLink key={edge.id} edge={edge} onDelete={removeLink} />
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-heading text-base font-semibold">Add a prerequisite</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Read it as: the first document must be obtained before the second can be issued.
              </p>

              <div className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label>First document (prerequisite)</Label>
                  <Select value={fromCode} onValueChange={setFromCode}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose a document" /></SelectTrigger>
                    <SelectContent>
                      {data.nodes.map((node) => (<SelectItem key={node.code} value={node.code}>{node.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Second document (depends on the first)</Label>
                  <Select value={toCode} onValueChange={setToCode}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose a document" /></SelectTrigger>
                    <SelectContent>
                      {data.nodes.map((node) => (<SelectItem key={node.code} value={node.code}>{node.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edge-description">Why it depends (optional)</Label>
                  <Input id="edge-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. residence proof is required before a domicile certificate" className="rounded-xl" />
                </div>

                {error ? <p className="rounded-xl bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">{error}</p> : null}

                <Button onClick={addLink} disabled={saving} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  {saving ? 'Validating…' : 'Validate and add link'}
                </Button>
              </div>
            </section>

            {data.root_blockers.length > 0 ? (
              <section className="rounded-2xl border border-border bg-muted/40 p-5">
                <h2 className="font-heading text-sm font-semibold">Currently the earliest steps for a new student</h2>
                <ul className="mt-3 space-y-2">
                  {data.root_blockers.slice(0, 6).map((item) => (
                    <li key={item.code} className="rounded-xl bg-card px-3.5 py-2.5 text-sm">{item.name}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {data.blocked_documents.length} document(s) are behind these steps for students who hold nothing yet.
                </p>
              </section>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}