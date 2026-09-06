const SHARED_METER_RENT = 40;
const SHARED_DEMAND_CHARGE = 84;
const DEFAULT_VAT = 5;
const DEFAULT_METER_RENT = 35;

const DEFAULT_PERSON_ONE = "Person 1";
const DEFAULT_PERSON_TWO = "Person 2";

const MONTH_FROM = "2025-09";
const MONTH_TO = "2026-08";

const inputClass =
  "w-full bg-input/70 border border-border rounded-sm px-3.5 py-2.5 text-[0.9rem] text-text-primary outline-none transition focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted";

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const formatNumber = (value, decimals = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? new Intl.NumberFormat("en-BD", {
        maximumFractionDigits: decimals,
      }).format(number)
    : "—";
};

const formatMoney = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? `৳ ${formatNumber(number, 2)}` : "—";
};
