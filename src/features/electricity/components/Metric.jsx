export default function Metric({ icon: Icon, label, value, hint, color }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 backdrop-blur-md">
      <div className="flex justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.1em] text-text-muted">{label}</p>
          <p className="mt-2 text-[1.35rem] leading-none font-extrabold tracking-tight">{value}</p>
          <p className="mt-2 text-xs text-text-secondary">{hint}</p>
        </div>
        <div className={`h-fit rounded-md p-2 ${color}`}>
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}
