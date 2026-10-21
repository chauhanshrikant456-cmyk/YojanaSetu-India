import { AlertTriangle, ArrowRight } from 'lucide-react';

const STATUS_STYLES = {
  held: 'bg-success/10 text-success border-success/20',
  blocked: 'bg-destructive/10 text-destructive border-destructive/20',
  missing: 'bg-muted text-muted-foreground border-border'
};

export default function DependencyGraph({ levels, nodes, cycle }) {
  const nodeMap = {};
  (nodes || []).forEach((node) => {
    nodeMap[node.code] = node;
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-heading text-base font-semibold">Prerequisite graph</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        Documents are laid out by dependency level — level 1 can be obtained immediately, each later level unlocks once
        its prerequisites exist.
      </p>

      {cycle && cycle.length > 0 ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Circular dependency detected: {cycle.join(' → ')}. Remove one of these links — the graph must stay acyclic.
        </p>
      ) : null}

      <div className="mt-5 space-y-5">
        {(levels || []).map((level, index) => (
          <div key={`level-${index}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Level {index + 1}{index === 0 ? ' · start here' : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {level.map((code) => {
                const node = nodeMap[code] || { name: code, held: false, blocked: false };
                const style = node.held ? STATUS_STYLES.held : node.blocked ? STATUS_STYLES.blocked : STATUS_STYLES.missing;
                return (
                  <span key={code} className={`rounded-xl border px-3 py-2 text-sm font-medium ${style}`}>
                    {node.name}
                    <span className="ml-2 text-[11px] font-normal opacity-80">
                      {node.held ? 'held' : node.blocked ? 'blocked' : 'not held'}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Links</p>
        <ul className="mt-3 space-y-2">
          {(levels || []).length === 0 ? (
            <li className="text-sm text-muted-foreground">No dependency links configured yet.</li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

export function DependencyLink({ edge, onDelete }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5">
      <span className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium">{edge.from_name}</span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="font-medium">{edge.to_name}</span>
        {edge.description ? <span className="text-xs text-muted-foreground">· {edge.description}</span> : null}
      </span>
      <button type="button" onClick={() => onDelete(edge)} className="text-xs font-medium text-destructive hover:underline">
        Remove link
      </button>
    </li>
  );
}