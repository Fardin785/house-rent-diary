export default function StatCard({ label, value, icon, iconBg = 'bg-accent-glow', iconColor = 'text-accent' }) {
  return (
    <div className="bg-card backdrop-blur-[12px] border border-border rounded-lg p-6 flex items-center gap-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md max-md:p-4 max-md:flex-col max-md:items-start max-md:gap-2.5">
      <div className={`w-12 h-12 rounded-md flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div>
        <span className="block text-[0.82rem] text-text-muted font-medium uppercase tracking-[0.04em]">
          {label}
        </span>
        <span className="block text-[1.6rem] font-bold mt-0.5 tracking-tight max-md:text-[1.3rem]">
          {value}
        </span>
      </div>
    </div>
  );
}
