export default function BrandMark({ className = '', compact = false }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary via-primary to-chart-2 text-primary-foreground shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2.5 16.5c4.5-7 14.5-7 19 0" />
          <path d="M2.5 19h19" />
          <path d="M6.5 16.5V9.8M17.5 16.5V9.8M12 16.5V7" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block font-heading text-[15px] font-semibold tracking-tight">YojanaSetu</span>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">India</span>
        </span>
      )}
    </div>
  );
}