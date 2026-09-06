import { useState } from "react";
import { Activity } from "lucide-react";
import { inputClass, money, number, sharedMeterRent, sharedDemandCharge } from "../utils";

export default function CostSplitterSection({ latestMonthly, latestMonthlyCost }) {
  const [personOneName, setPersonOneName] = useState("Person 1");
  const [personTwoName, setPersonTwoName] = useState("Person 2");
  const [personOneUnits, setPersonOneUnits] = useState("");
  const [personTwoUnits, setPersonTwoUnits] = useState("");

  const splitUnits = Number(personOneUnits || 0) + Number(personTwoUnits || 0);
  
  const vatAmount = Number.isFinite(latestMonthlyCost)
    ? (latestMonthlyCost + sharedMeterRent + sharedDemandCharge) * 0.05
    : null;

  const sharedBillTotal = Number.isFinite(latestMonthlyCost)
    ? latestMonthlyCost + sharedMeterRent + sharedDemandCharge + vatAmount
    : null;
    
  const canSplitCost = sharedBillTotal !== null && splitUnits > 0;
  
  const personOneShare = canSplitCost ? (sharedBillTotal * Number(personOneUnits || 0)) / splitUnits : null;
  const personTwoShare = canSplitCost ? (sharedBillTotal * Number(personTwoUnits || 0)) / splitUnits : null;

  return (
    <section className="rounded-lg border border-border bg-card p-5 backdrop-blur-md">
      <div className="mb-2 flex items-center gap-2">
        <Activity size={19} className="text-cyan" />
        <h2 className="font-bold">Split electricity cost</h2>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-text-secondary">
        Split the latest DESCO bill, meter rent and demand charge based on each person’s unit usage.
      </p>
      <div className="space-y-3">
        <div className="grid grid-cols-[minmax(0,1fr)_100px] gap-2">
          <input
            className={inputClass}
            aria-label="First person name"
            value={personOneName}
            onChange={(e) => setPersonOneName(e.target.value)}
          />
          <input
            type="number"
            min="0"
            step="0.001"
            className={inputClass}
            aria-label="First person units"
            placeholder="Units"
            value={personOneUnits}
            onChange={(e) => setPersonOneUnits(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_100px] gap-2">
          <input
            className={inputClass}
            aria-label="Second person name"
            value={personTwoName}
            onChange={(e) => setPersonTwoName(e.target.value)}
          />
          <input
            type="number"
            min="0"
            step="0.001"
            className={inputClass}
            aria-label="Second person units"
            placeholder="Units"
            value={personTwoUnits}
            onChange={(e) => setPersonTwoUnits(e.target.value)}
          />
        </div>
      </div>
      <div className="mt-4 rounded-sm border border-border bg-input/40 p-3 text-xs text-text-secondary">
        <div className="flex justify-between gap-3">
          <span>Electricity charge</span>
          <strong className="text-text-primary">
            {latestMonthly ? money(latestMonthly.amount) : "Load DESCO data first"}
          </strong>
        </div>
        <div className="mt-2 flex justify-between gap-3">
          <span>Meter rent</span>
          <strong className="text-text-primary">{money(sharedMeterRent)}</strong>
        </div>
        <div className="mt-2 flex justify-between gap-3">
          <span>Demand charge</span>
          <strong className="text-text-primary">{money(sharedDemandCharge)}</strong>
        </div>
        <div className="mt-2 flex justify-between gap-3">
          <span>5% VAT</span>
          <strong className="text-text-primary">{vatAmount === null ? "—" : money(vatAmount)}</strong>
        </div>
        <div className="mt-2 flex justify-between gap-3 border-t border-border pt-2">
          <span>Total to split</span>
          <strong className="text-text-primary">{sharedBillTotal === null ? "—" : money(sharedBillTotal)}</strong>
        </div>
        <div className="mt-2 flex justify-between gap-3">
          <span>Total entered usage</span>
          <strong className="text-text-primary">{splitUnits > 0 ? `${number(splitUnits, 3)} units` : "—"}</strong>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-sm border border-cyan/20 bg-cyan-bg/50 p-3">
          <p className="truncate text-xs text-text-secondary">{personOneName || "Person 1"}</p>
          <p className="mt-1 font-bold text-cyan">{personOneShare === null ? "—" : money(personOneShare)}</p>
        </div>
        <div className="rounded-sm border border-cyan/20 bg-cyan-bg/50 p-3">
          <p className="truncate text-xs text-text-secondary">{personTwoName || "Person 2"}</p>
          <p className="mt-1 font-bold text-cyan">{personTwoShare === null ? "—" : money(personTwoShare)}</p>
        </div>
      </div>
    </section>
  );
}
