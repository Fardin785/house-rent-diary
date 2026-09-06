import { money, number } from "../utils";
import Detail from "./Detail";

export default function EstimatedBillResult({ result }) {
  if (!result) return null;

  return (
    <section className="rounded-lg border border-amber/25 bg-gradient-to-br from-amber-bg to-card p-5">
      <p className="text-xs font-bold uppercase tracking-[.12em] text-amber">Estimated bill</p>
      <h2 className="mt-1 text-[1.7rem] font-extrabold tracking-tight">{money(result.total)}</h2>
      <p className="mt-1 text-xs text-text-secondary">
        For {number(result.units)} units, including VAT and meter rent
      </p>
      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-amber/15 pt-4 text-sm sm:grid-cols-4">
        <Detail label="Energy" value={money(result.energyCharge)} />
        <Detail label="Meter rent" value={money(result.meterRent)} />
        <Detail label={`VAT (${result.vatPercent}%)`} value={money(result.vatAmount)} />
        <Detail label="Slabs used" value={result.breakdown.length} />
      </div>
    </section>
  );
}
