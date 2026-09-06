import { useState, useMemo } from "react";
import { ReceiptText } from "lucide-react";
import { inputClass, number } from "../utils";

export default function BillEstimatorSection({ estimateBill, setResult }) {
  const [prevReading, setPrevReading] = useState("");
  const [currReading, setCurrReading] = useState("");
  const [meterRent, setMeterRent] = useState(35);
  const [vat, setVat] = useState(5);

  const units = useMemo(() => {
    const p = Number(prevReading),
      c = Number(currReading);
    return Number.isFinite(p) && Number.isFinite(c) ? Math.max(0, c - p) : "";
  }, [prevReading, currReading]);

  const calculate = (e) => {
    e.preventDefault();
    const estUnits = units || Number(currReading) || 0;
    setResult(estimateBill(estUnits, meterRent, vat));
  };

  return (
    <form onSubmit={calculate} className="rounded-lg border border-border bg-card p-5 backdrop-blur-md">
      <div className="mb-5 flex items-center gap-2">
        <ReceiptText size={19} className="text-amber" />
        <h2 className="font-bold">Bill estimator</h2>
      </div>
      <div className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-text-muted">Previous</label>
            <input
              type="number"
              className={inputClass}
              value={prevReading}
              onChange={(e) => setPrevReading(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-text-muted">Current</label>
            <input
              type="number"
              className={inputClass}
              value={currReading}
              onChange={(e) => setCurrReading(e.target.value)}
            />
          </div>
        </div>
        <div className="rounded-sm border border-border bg-input/50 px-3 py-2 text-sm text-text-secondary">
          Consumption{" "}
          <strong className="float-right text-text-primary">
            {units === "" ? "—" : `${number(units)} units`}
          </strong>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-text-muted">Meter rent</label>
            <input
              type="number"
              className={inputClass}
              value={meterRent}
              onChange={(e) => setMeterRent(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-text-muted">VAT %</label>
            <input type="number" className={inputClass} value={vat} onChange={(e) => setVat(e.target.value)} />
          </div>
        </div>
        <button className="w-full rounded-sm border border-accent/40 bg-accent-glow py-2.5 text-[.9rem] font-bold text-accent hover:bg-accent hover:text-white">
          Calculate estimate
        </button>
      </div>
    </form>
  );
}
