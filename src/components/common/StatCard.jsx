export default function StatCard({ label, value, hint, icon: Icon, tone = 'text-primary bg-primary/10', progress }) {
  const hasProgress = typeof progress === 'number' && Number.isFinite(progress);
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        {Icon ? (
          <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-heading text-2xl font-semibold tracking-tight">{value}</p>
      {hasProgress ? (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
      {hint ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
    </div>
  );
}