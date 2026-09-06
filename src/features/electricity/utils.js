export const inputClass =
  "w-full bg-input/70 border border-border rounded-sm px-3.5 py-2.5 text-[0.9rem] text-text-primary outline-none transition focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted";
export const sharedMeterRent = 40;
export const sharedDemandCharge = 84;

export const val = (o, keys, fallback = "—") => {
  const k = keys.find((key) => o?.[key] !== undefined && o[key] !== null && o[key] !== "");
  return k ? o[k] : fallback;
};

export const number = (v, d = 0) =>
  Number.isFinite(Number(v)) ? new Intl.NumberFormat("en-BD", { maximumFractionDigits: d }).format(v) : "—";

export const money = (v) => (Number.isFinite(Number(v)) ? `৳ ${number(v, 2)}` : "—");

export const formatMonthPeriod = (period) => {
  const match = String(period).match(/^(\d{4})-(\d{2})$/);
  if (!match) return period;
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" })
    .format(new Date(`${period}-01`))
    .replace(" ", "-");
};

export const recordsFrom = (data) => {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  return Object.values(data).find(Array.isArray) || [];
};

export const monthlyRows = (data) =>
  recordsFrom(data)
    .map((item, i) => ({
      period: val(item, ["month", "monthName", "billingMonth", "date", "yearMonth"], `Period ${i + 1}`),
      units:
        Number(
          val(
            item,
            ["consumedUnit", "consumption", "unit", "units", "totalConsumption", "monthlyConsumption", "value"],
            0,
          ),
        ) || 0,
      amount: val(item, ["consumedTaka", "amount", "billAmount", "charge"], null),
    }))
    .sort((a, b) => String(a.period).localeCompare(String(b.period)));

export const dailyRows = (data) => {
  const orderedReadings = recordsFrom(data)
    .map((item, i) => ({
      period: val(item, ["date", "consumptionDate", "readingDate", "day"], `Day ${i + 1}`),
      reading:
        Number(
          val(
            item,
            ["consumedUnit", "meterReading", "reading", "consumption", "unit", "units", "dailyConsumption", "value"],
            0,
          ),
        ) || 0,
      taka: Number(val(item, ["consumedTaka", "amount", "billAmount", "charge"], 0)) || 0,
    }))
    .sort((a, b) => String(a.period).localeCompare(String(b.period)));

  return orderedReadings.slice(1).map((item, index) => {
    const previous = orderedReadings[index];
    return {
      period: item.period,
      units: Math.max(0, item.reading - previous.reading),
      taka: item.taka < previous.taka ? item.taka : item.taka - previous.taka,
    };
  });
};
