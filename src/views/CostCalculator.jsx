import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Users, Wallet, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCurrentMonth, formatMonth } from '../lib/utils';
import { fetchMonthlyCost, saveMonthlyCost } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { MEM_DATA, DEFAULT_COMMON_COSTS, WATER_RATIO_TOTAL } from '../lib/constants';

// Shared Tailwind classes
const inputClass = "w-full px-3 py-2 bg-body border border-border rounded-sm text-text-primary font-sans text-[0.88rem] outline-none transition-[border-color,box-shadow] duration-200 focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted";
const labelClass = "block text-[0.82rem] font-semibold text-text-secondary mb-1.5 uppercase tracking-[0.03em]";

export default function CostCalculator() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const showToast = useToast();

  const [month, setMonth] = useState(getCurrentMonth());
  const [totalCommonRent, setTotalCommonRent] = useState(17500);
  const [totalWaterBill, setTotalWaterBill] = useState('');

  const [commonCosts, setCommonCosts] = useState(
    DEFAULT_COMMON_COSTS.map(c => ({ ...c, id: crypto.randomUUID() }))
  );
  
  const [memberPayments, setMemberPayments] = useState({});

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch saved month data if exists
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await fetchMonthlyCost(month);
        if (data) {
          setTotalCommonRent(Number(data.total_common_rent));
          setTotalWaterBill(data.total_water_bill ? Number(data.total_water_bill) : '');
          const savedCosts = typeof data.common_costs === 'string' ? JSON.parse(data.common_costs) : data.common_costs;
          setCommonCosts(savedCosts && savedCosts.length > 0 ? savedCosts : DEFAULT_COMMON_COSTS.map(c => ({ ...c, id: crypto.randomUUID() })));
          
          const mCosts = data.member_costs ? (typeof data.member_costs === 'string' ? JSON.parse(data.member_costs) : data.member_costs) : {};
          setMemberPayments(mCosts);
        } else {
          // Reset to defaults if no saved data
          setTotalCommonRent(17500);
          setTotalWaterBill('');
          setCommonCosts(DEFAULT_COMMON_COSTS.map(c => ({ ...c, id: crypto.randomUUID() })));
          setMemberPayments({});
        }
      } catch (err) {
        showToast('Failed to load cost data: ' + err.message, 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [month, showToast]);

  // Common costs handlers
  const updateCommonCost = (id, field, value) => {
    setCommonCosts(prev => prev.map(c => c.id === id ? { ...c, [field]: field === 'amount' ? (parseFloat(value) || 0) : value } : c));
  };

  const addCommonCost = () => {
    setCommonCosts(prev => [...prev, { id: crypto.randomUUID(), name: '', nameEn: '', amount: 0 }]);
  };

  const removeCommonCost = (id) => {
    setCommonCosts(prev => prev.filter(c => c.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveMonthlyCost(month, {
        total_common_rent: totalCommonRent,
        total_water_bill: parseFloat(totalWaterBill) || 0,
        common_costs: commonCosts,
        member_costs: memberPayments
      });
      showToast(isBn ? 'সফলভাবে সংরক্ষিত হয়েছে!' : 'Data saved successfully!', 'success');
    } catch (err) {
      showToast('Error saving data: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculations
  const totals = useMemo(() => {
    const commonTotal = commonCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
    const remainingFund = totalCommonRent - commonTotal;

    const parsedWaterTotal = parseFloat(totalWaterBill) || 0;
    
    const perPerson = {};
    MEM_DATA.forEach(m => {
      const water = (parsedWaterTotal * m.water) / WATER_RATIO_TOTAL;
      const total = Math.round(water) + m.gas;
      const paid = memberPayments[m.id] || 0;
      perPerson[m.id] = { 
        water: Math.round(water), 
        gas: m.gas, 
        total, 
        paid, 
        due: total - paid 
      };
    });

    const grandTotalPayable = Object.values(perPerson).reduce((s, p) => s + p.total, 0);
    const grandTotalPaid = Object.values(perPerson).reduce((s, p) => s + p.paid, 0);
    const grandTotalDue = Object.values(perPerson).reduce((s, p) => s + p.due, 0);

    return { commonTotal, remainingFund, perPerson, grandTotalPayable, grandTotalPaid, grandTotalDue };
  }, [commonCosts, totalCommonRent, totalWaterBill, memberPayments]);

  const fmt = (n) => `৳ ${n.toLocaleString()}`;

  return (
    <section className="block animate-fade-in pb-10">
      {/* Header & Month Picker */}
      <div className="flex items-center justify-between mb-7 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight max-md:text-[1.4rem]">
            {t('costCalc.title')}
            {isLoading && <span className="ml-3 text-[0.9rem] text-text-muted font-normal inline-block animate-pulse">Loading...</span>}
          </h1>
          {/* <p className="text-text-muted text-[0.9rem] mt-0.5">{t('costCalc.subtitle')}</p> */}
        </div>
        <div className="flex items-end gap-3 max-md:w-full">
          <div className="flex flex-col gap-1 flex-1">
            <label className={labelClass}>{t('table.month')}</label>
            <input type="month" className={`${inputClass} w-[200px] max-md:w-full`} value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-sm font-semibold transition-all duration-200
              ${isSaving || isLoading
                ? 'bg-border text-text-muted cursor-not-allowed'
                : 'bg-accent-glow text-accent-hover border border-accent hover:bg-accent hover:text-bg-dark hover:shadow-[0_4px_12px_rgba(45,212,191,0.25)]'
              } shrink-0 h-[40px] mt-[1.35rem]`}
          >
            <Save size={18} />
            <span>{isSaving ? (isBn ? 'সংরক্ষণ হচ্ছে…' : 'Saving...') : (isBn ? 'সংরক্ষণ করুন' : 'Save Data')}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── LEFT: Common Costs (col span 7) ── */}
        <div className="lg:col-span-7 bg-card backdrop-blur-md border border-border rounded-lg overflow-hidden h-fit">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-card-solid">
            <div className="flex items-center gap-2.5">
              <Wallet size={20} className="text-accent" />
              <h2 className="text-[1.1rem] font-bold">{t('costCalc.commonCosts')}</h2>
            </div>
            <button
              onClick={addCommonCost}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-accent rounded-sm bg-transparent text-accent-hover font-sans text-[0.8rem] font-semibold cursor-pointer transition-all duration-200 hover:bg-accent-glow hover:border-solid"
            >
              <Plus size={14} />
              {t('costCalc.addItem')}
            </button>
          </div>
          
          <div className="p-6 border-b border-border bg-body/50">
            <label className="block text-[0.82rem] font-semibold text-text-primary mb-2 uppercase tracking-[0.03em]">{t('costCalc.totalCommonRent')}</label>
            <div className="relative max-w-[240px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[0.9rem]">৳</span>
              <input
                type="number"
                className={`${inputClass} pl-8 text-[1rem] font-bold text-accent-hover`}
                value={totalCommonRent}
                onChange={e => setTotalCommonRent(parseFloat(e.target.value) || 0)}
                min="0"
              />
            </div>
          </div>

          <div className="p-5 space-y-3">
            {commonCosts.map((item) => (
              <div key={item.id} className="flex items-center gap-3 animate-family-slide-in">
                <input
                  type="text"
                  className={`${inputClass} flex-2`}
                  value={isBn ? item.name : (item.nameEn || item.name)}
                  onChange={e => updateCommonCost(item.id, isBn ? 'name' : 'nameEn', e.target.value)}
                  placeholder={t('costCalc.itemName')}
                />
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[0.82rem]">৳</span>
                  <input
                    type="number"
                    className={`${inputClass} pl-7 text-right`}
                    value={item.amount === 0 ? '' : item.amount}
                    onChange={e => updateCommonCost(item.id, 'amount', e.target.value)}
                    min="0"
                  />
                </div>
                <button
                  onClick={() => removeCommonCost(item.id)}
                  className="inline-flex items-center justify-center w-9 h-9 border border-transparent rounded-sm bg-transparent text-text-muted cursor-pointer transition-all duration-200 shrink-0 hover:bg-red-bg hover:border-[rgba(239,68,68,0.3)] hover:text-red"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            
            <div className="pt-4 mt-6 border-t border-border space-y-2">
              <div className="flex items-center justify-between text-text-secondary">
                <span className="text-[0.88rem] font-semibold uppercase tracking-[0.04em]">{t('costCalc.total')}</span>
                <span className="text-[1rem] font-bold">{fmt(totals.commonTotal)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-dashed border-border text-text-primary">
                <span className="text-[0.93rem] font-bold uppercase tracking-[0.02em]">{t('costCalc.remainingFund')}</span>
                <span className={`text-[1.2rem] font-bold ${totals.remainingFund >= 0 ? 'text-green' : 'text-red'}`}>
                  {fmt(totals.remainingFund)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Summary per Person (col span 5) ── */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Total Water Bill Input */}
          <div className="bg-card backdrop-blur-md border border-border rounded-lg overflow-hidden h-fit">
             <div className="px-6 py-5 border-b border-border bg-card-solid">
                <h2 className="text-[1.1rem] font-bold flex items-center gap-2">
                  <span className="text-cyan text-[1.2rem]">💧</span>
                  {t('costCalc.totalWaterBill')}
                </h2>
             </div>
             <div className="p-6">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[0.9rem]">৳</span>
                  <input
                    type="number"
                    className={`${inputClass} pl-8 text-[1rem] font-semibold text-cyan`}
                    value={totalWaterBill}
                    onChange={e => setTotalWaterBill(e.target.value)}
                    placeholder="e.g. 4000"
                    min="0"
                  />
                </div>
             </div>
          </div>

          {/* Members Table */}
          <div className="bg-card backdrop-blur-md border border-border rounded-lg overflow-hidden h-fit">
            <div className="px-6 py-5 border-b border-border flex items-center gap-2.5 bg-card-solid">
              <Users size={20} className="text-accent" />
              <h2 className="text-[1.1rem] font-bold">{t('costCalc.summary')}</h2>
            </div>
            <div className="table-card-responsive overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <table className="text-[0.88rem] w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-5 py-3.5 text-left font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid">
                      {t('costCalc.member')}
                    </th>
                    <th className="px-5 py-3.5 text-right font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid">
                      {t('costCalc.waterBill')}
                    </th>
                    <th className="px-5 py-3.5 text-right font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid">
                      {t('costCalc.gasBill')}
                    </th>
                    <th className="px-5 py-3.5 text-right font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid">
                      {t('costCalc.totalPayable')}
                    </th>
                    <th className="px-5 py-3.5 text-right font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid">
                      {isBn ? "পরিমাণ (পেইড)" : "Paid"}
                    </th>
                    <th className="px-5 py-3.5 text-right font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid">
                      {isBn ? "বকেয়া (ডিউ)" : "Due"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MEM_DATA.map(m => {
                    const p = totals.perPerson[m.id];
                    const memberLabel = isBn ? m.bn : m.en;

                    return (
                      <tr key={m.id} className="transition-colors duration-150 hover:bg-hover [&:last-child_td]:border-b-0">
                        <td className="px-5 py-3 border-b border-border whitespace-nowrap align-middle" data-label={t('costCalc.member')}>
                          <span className="font-semibold">{memberLabel}</span>
                        </td>
                        <td className="px-5 py-3 border-b border-border whitespace-nowrap align-middle text-right text-cyan" data-label={t('costCalc.waterBill')}>{fmt(p.water)}</td>
                        <td className="px-5 py-3 border-b border-border whitespace-nowrap align-middle text-right text-amber" data-label={t('costCalc.gasBill')}>{m.gas === 0 ? '-' : fmt(p.gas)}</td>
                        <td className="px-5 py-3 border-b border-border whitespace-nowrap align-middle text-right font-bold text-text-primary" data-label={t('costCalc.totalPayable')}>{fmt(p.total)}</td>
                        <td className="px-5 py-3 border-b border-border whitespace-nowrap align-middle text-right" data-label={isBn ? "পরিমাণ (পেইড)" : "Paid"}>
                          <input 
                            type="number"
                            className={`${inputClass} w-[90px] text-right py-1 h-[32px] inline-block font-semibold text-green focus:border-green focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]`}
                            value={memberPayments[m.id] === undefined ? '' : memberPayments[m.id]}
                            onChange={(e) => setMemberPayments(prev => ({ ...prev, [m.id]: parseFloat(e.target.value) || 0 }))}
                            placeholder="0"
                            min="0"
                          />
                        </td>
                        <td className={`px-5 py-3 border-b border-border whitespace-nowrap align-middle text-right font-bold bg-opacity-10 ${p.due > 0 ? 'text-red bg-red-bg' : 'text-green bg-green-bg'}`} data-label={isBn ? "বকেয়া (ডিউ)" : "Due"}>{fmt(p.due)}</td>
                      </tr>
                    );
                  })}
                  {/* Grand total row */}
                  <tr className="bg-card-solid border-t-2 border-border">
                    <td colSpan="3" className="px-5 py-3.5 text-right font-bold uppercase tracking-[0.04em] text-[0.82rem] text-text-secondary">
                      {t('costCalc.grandTotal')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-[1.05rem] text-text-primary whitespace-nowrap">
                      {fmt(totals.grandTotalPayable)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-[1.05rem] text-green whitespace-nowrap">
                      {fmt(totals.grandTotalPaid)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-[1.05rem] text-red whitespace-nowrap">
                      {fmt(totals.grandTotalDue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
