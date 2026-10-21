export default function ScoreRing({ score = 0, label, size = 156 }) {
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safeScore / 100) * circumference;
  const tone = safeScore >= 80 ? 'text-success' : safeScore >= 50 ? 'text-warning' : 'text-destructive';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="stroke-muted" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className={`${tone} stroke-current`}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 700ms ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-heading text-3xl font-semibold tracking-tight">
          {safeScore}
          <span className="text-base font-medium text-muted-foreground">/100</span>
        </div>
        {label ? <div className={`mt-0.5 text-xs font-semibold ${tone}`}>{label}</div> : null}
      </div>
    </div>
  );
}