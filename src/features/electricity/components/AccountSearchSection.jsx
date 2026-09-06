import { ArrowDownToLine, CircleAlert, LoaderCircle, Search } from "lucide-react";
import { inputClass } from "../utils";

export default function AccountSearchSection({ accountNo, setAccountNo, fetchData, loading, error, meterNo }) {
  return (
    <section className="rounded-lg border border-border bg-card-solid p-5 shadow-md">
      <div className="mb-5 flex items-center gap-2">
        <div className="rounded-md bg-accent-glow p-2 text-accent">
          <Search size={18} />
        </div>
        <h2 className="font-bold">Electricity account</h2>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-muted">
            Account number
          </label>
          <input
            className={inputClass}
            placeholder="e.g. 14002901"
            value={accountNo}
            onChange={(e) => setAccountNo(e.target.value)}
            inputMode="numeric"
          />
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading || !accountNo.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-accent py-2.5 text-[.9rem] font-bold text-white transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <LoaderCircle size={17} className="animate-spin" /> Finding meter & loading…
            </>
          ) : (
            <>
              <ArrowDownToLine size={17} /> Fetch electricity data
            </>
          )}
        </button>
        {meterNo && (
          <div className="rounded-sm border border-cyan/25 bg-cyan-bg px-3 py-2 text-xs text-cyan">
            Resolved meter: <strong>{meterNo}</strong>
          </div>
        )}
        {error && (
          <div className="flex gap-2 rounded-sm border border-red/30 bg-red-bg p-3 text-xs text-red">
            <CircleAlert size={16} className="shrink-0" />
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
