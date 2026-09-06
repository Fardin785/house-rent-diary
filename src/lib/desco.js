// DESCO electricity calculation utilities
export const defaultSlabs = [
  { upto: 50, rate: 5.323 },
  { upto: 75, rate: 6.18 },
  { upto: 200, rate: 8.5 },
  { upto: 300, rate: 9.1 },
  { upto: 400, rate: 9.62 },
  { upto: 600, rate: 15.01 },
  { upto: Infinity, rate: 17.35 },
];

export function calculateDescoBill(units, options = {}) {
  const { slabs = defaultSlabs, meterRent = 35, vatPercent = 5 } = options;
  let remaining = Number(units) || 0;
  let energyCharge = 0;
  const breakdown = [];

  let lower = 0;
  for (const slab of slabs) {
    const slabLimit = slab.upto - lower;
    const used = Math.max(0, Math.min(remaining, slabLimit));
    if (used <= 0) {
      lower = slab.upto;
      continue;
    }
    const amt = used * slab.rate;
    breakdown.push({ upto: slab.upto, units: used, rate: slab.rate, amount: amt });
    energyCharge += amt;
    remaining -= used;
    lower = slab.upto;
    if (remaining <= 0) break;
  }

  const vatAmount = (energyCharge + meterRent) * (vatPercent / 100);
  const total = energyCharge + meterRent + vatAmount;

  return {
    units: Number(units) || 0,
    energyCharge: Number(energyCharge.toFixed(2)),
    meterRent: Number(meterRent),
    vatPercent: Number(vatPercent),
    vatAmount: Number(vatAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
    breakdown,
  };
}

export default calculateDescoBill;

// Public DESCO API wrappers
const DESCO_BASE = "https://prepaid.desco.org.bd/api";

async function fetchDesco(path, params = {}) {
  const url = new URL(DESCO_BASE + path);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Network error: ${res.status}`);
  const json = await res.json();
  if (!json) throw new Error("Invalid JSON response");
  if (json.code && json.code !== 200) throw new Error(json.desc || "DESCO API error");
  return json.data;
}

export async function getCustomerInfo(accountNo, meterNo = "") {
  return fetchDesco("/tkdes/customer/getCustomerInfo", { accountNo, meterNo });
}

export async function getCustomerLocation(accountNo) {
  return fetchDesco("/common/getCustomerLocation", { accountNo });
}

export async function getCustomerDailyConsumption(accountNo, meterNo = "", dateFrom, dateTo) {
  return fetchDesco("/tkdes/customer/getCustomerDailyConsumption", { accountNo, meterNo, dateFrom, dateTo });
}

export async function getCustomerMonthlyConsumption(accountNo, meterNo = "", monthFrom, monthTo) {
  return fetchDesco("/tkdes/customer/getCustomerMonthlyConsumption", { accountNo, meterNo, monthFrom, monthTo });
}

export async function getBalance(accountNo, meterNo = "") {
  return fetchDesco("/tkdes/customer/getBalance", { accountNo, meterNo });
}

export async function getMeterNoFromAccount(accountNo) {
  if (!accountNo) return null;
  const data = await fetchDesco("/tkdes/customer/getCustomerInfo", { accountNo }).catch(() => null);
  if (!data) return null;
  // Some responses embed meterNo in data.meterNo
  return data.meterNo || null;
}
