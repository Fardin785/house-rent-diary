import { useState } from "react";
import { Bolt, Gauge, Activity as ActivityIcon, WalletCards, Zap } from "lucide-react";
import useElectricityData from "../features/electricity/hooks/useElectricityData";
import { formatMonthPeriod, money, number } from "../features/electricity/utils";
import Metric from "../features/electricity/components/Metric";
import AccountSearchSection from "../features/electricity/components/AccountSearchSection";
import BillEstimatorSection from "../features/electricity/components/BillEstimatorSection";
import CostSplitterSection from "../features/electricity/components/CostSplitterSection";
import AccountOverview from "../features/electricity/components/AccountOverview";
import MonthlyConsumption from "../features/electricity/components/MonthlyConsumption";
import DailyConsumption from "../features/electricity/components/DailyConsumption";
import EstimatedBillResult from "../features/electricity/components/EstimatedBillResult";
import { val } from "../features/electricity/utils";

export default function ElectricityCalculator() {
  const [result, setResult] = useState(null);
  const electricityData = useElectricityData();
  const {
    accountNo,
    setAccountNo,
    meterNo,
    monthFrom,
    monthTo,
    loading,
    error,
    data,
    rows,
    daily,
    latestWeek,
    latestThirtyDays,
    hasData,
    info,
    balance,
    fetchData,
    latestMonthly,
    latestMonthlyCost,
    estimateBill,
  } = electricityData;

  return (
    <div className="animate-fade-in max-w-full pb-10">
      <header className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-accent">
            <Bolt size={18} fill="currentColor" />
            <span className="text-xs font-bold uppercase tracking-[.14em]">DESCO prepaid</span>
          </div>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight max-md:text-[1.4rem]">Electricity overview</h1>
          <p className="mt-1 text-[.9rem] text-text-secondary">
            Meter details, balance, usage history and bill estimate.
          </p>
        </div>
        {hasData && (
          <span className="w-fit rounded-full border border-green/25 bg-green-bg px-3 py-1.5 text-xs font-semibold text-green">
            ● Data loaded
          </span>
        )}
      </header>
      
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[350px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <AccountSearchSection
            accountNo={accountNo}
            setAccountNo={setAccountNo}
            fetchData={fetchData}
            loading={loading}
            error={error}
            meterNo={meterNo}
          />

          {/* <BillEstimatorSection estimateBill={estimateBill} setResult={setResult} /> */}

          <CostSplitterSection latestMonthly={latestMonthly} latestMonthlyCost={latestMonthlyCost} />
        </aside>

        <main className="min-w-0 space-y-6">
          {!hasData ? (
            <div className="flex min-h-[390px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/40 p-8 text-center">
              <div className="mb-4 rounded-full bg-accent-glow p-4 text-accent">
                <Zap size={30} />
              </div>
              <h2 className="font-bold">Your electricity data will appear here</h2>
              <p className="mt-2 max-w-sm text-sm text-text-secondary">
                Enter your account number and we’ll find the linked meter before loading the electricity data.
              </p>
            </div>
          ) : (
            <>
              <AccountOverview info={info} data={data} meterNo={meterNo} />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Metric
                  icon={WalletCards}
                  label="Available balance"
                  value={money(val(balance, ["balance", "availableBalance", "currentBalance"], null))}
                  hint="Current prepaid balance"
                  color="text-green bg-green-bg"
                />
                <Metric
                  icon={Gauge}
                  label="Latest monthly usage"
                  value={latestMonthly ? `${number(latestMonthly.units, 3)} units` : "—"}
                  hint={latestMonthly ? formatMonthPeriod(latestMonthly.period) : "No monthly record available"}
                  color="text-cyan bg-cyan-bg"
                />
                <Metric
                  icon={ActivityIcon}
                  label="History"
                  value={`${rows.length} months`}
                  hint={`${monthFrom} to ${monthTo}`}
                  color="text-amber bg-amber-bg"
                />
              </div>

              <MonthlyConsumption rows={rows} />

              <DailyConsumption
                daily={daily}
                monthTo={monthTo}
                latestWeek={latestWeek}
                latestThirtyDays={latestThirtyDays}
              />
            </>
          )}

          <EstimatedBillResult result={result} />
        </main>
      </div>
    </div>
  );
}
