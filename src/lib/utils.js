export const DEMAND_CHARGE = 84;
export const METER_RENT = 40;
export const VAT_RATE = 0.05;
export const DEFAULT_RATE = 8;

export function formatCurrency(n) {
  return '৳ ' + Number(n || 0).toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatMonth(m) {
  if (!m) return '—';
  const [y, mo] = m.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(mo) - 1]} ${y}`;
}

export function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function calculateElectricity(prevReading, currReading, ratePerUnit) {
  const unit = Math.max(0, currReading - prevReading);
  const base = unit * ratePerUnit;
  const subtotal = base + DEMAND_CHARGE + METER_RENT;
  const vat = subtotal * VAT_RATE;
  const electricityBill = Math.round((subtotal + vat) * 100) / 100;
  return { unit, base, subtotal, vat, electricityBill };
}
