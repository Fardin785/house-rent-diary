export default function Detail({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className="mt-1 truncate text-[0.92rem] font-semibold" title={String(value)}>
        {value}
      </p>
    </div>
  );
}
