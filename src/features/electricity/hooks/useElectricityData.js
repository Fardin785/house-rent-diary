import { useMemo, useState } from "react";
import calculateDescoBill, {
  defaultSlabs,
  getCustomerInfo,
  getCustomerLocation,
  getCustomerDailyConsumption,
  getCustomerMonthlyConsumption,
  getBalance,
  getMeterNoFromAccount,
} from "../../../lib/desco";
import { val, monthlyRows, dailyRows } from "../utils";

export default function useElectricityData() {
  const [accountNo, setAccountNo] = useState("");
  const [meterNo, setMeterNo] = useState("");
  const [monthFrom] = useState("2025-09");
  const [monthTo] = useState("2026-08");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});

  const rows = useMemo(() => monthlyRows(data.monthly), [data.monthly]);
  const daily = useMemo(() => dailyRows(data.daily), [data.daily]);
  
  const completedDaily = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return daily.filter(({ period }) => {
      const date = new Date(period);
      return Number.isFinite(date.getTime()) && date < today;
    });
  }, [daily]);

  const latestWeek = useMemo(() => completedDaily.slice(-7), [completedDaily]);
  const latestThirtyDays = useMemo(() => completedDaily.slice(-30).reverse(), [completedDaily]);
  const hasData = Boolean(data.info || data.loc || data.balance || rows.length || daily.length);
  const info = data.info || {};
  const balance = data.balance || {};
  
  // Calculate cost share dependencies
  const latestMonthly = rows.at(-1);
  const latestMonthlyCost = Number(latestMonthly?.amount);

  const fetchData = async () => {
    setError(null);
    setLoading(true);
    try {
      const account = accountNo.trim();
      const meter = await getMeterNoFromAccount(account);
      if (!meter) throw new Error("No meter was found for this account number.");
      setMeterNo(String(meter));
      
      const customer = await getCustomerInfo(account, String(meter)).catch(() => null);
      const resolvedAccount = val(customer, ["accountNo", "accountNumber", "customerNo"], account);
      
      const formatApiDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      
      const yesterday = new Date();
      yesterday.setHours(0, 0, 0, 0);
      yesterday.setDate(yesterday.getDate() - 1);
      const thirtyDaysBeforeYesterday = new Date(yesterday);
      thirtyDaysBeforeYesterday.setDate(thirtyDaysBeforeYesterday.getDate() - 29);
      
      const dateFrom = formatApiDate(thirtyDaysBeforeYesterday);
      const dateTo = formatApiDate(yesterday);
      
      const [loc, currentBalance, monthly, dailyReq] = await Promise.all([
        getCustomerLocation(resolvedAccount).catch(() => null),
        getBalance(resolvedAccount, String(meter)).catch(() => null),
        getCustomerMonthlyConsumption(resolvedAccount, String(meter), monthFrom, monthTo).catch(() => null),
        getCustomerDailyConsumption(resolvedAccount, "", dateFrom, dateTo).catch(() => null),
      ]);
      
      setData({ info: customer, loc, balance: currentBalance, monthly, daily: dailyReq });
    } catch (e) {
      setError(e.message || "Could not retrieve DESCO data.");
    } finally {
      setLoading(false);
    }
  };

  const estimateBill = (units, meterRent, vatPercent) => {
    return calculateDescoBill(units, {
      slabs: defaultSlabs,
      meterRent: Number(meterRent),
      vatPercent: Number(vatPercent),
    });
  };

  return {
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
    completedDaily,
    latestWeek,
    latestThirtyDays,
    hasData,
    info,
    balance,
    fetchData,
    latestMonthly,
    latestMonthlyCost,
    estimateBill
  };
}
