import { useState, useMemo, useEffect } from 'react';
import { BookOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatMonth } from '../lib/utils';
import { fetchMonthlyCosts, saveMonthlyCost } from '../lib/supabase';
import { useToast } from '../components/Toast';
import { MEM_DATA, WATER_RATIO_TOTAL } from '../lib/constants';

const inputClass = "w-full px-3 py-2 bg-body border border-border rounded-sm text-text-primary font-sans text-[0.88rem] outline-none transition-[border-color,box-shadow] duration-200 focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted";

export default function FamilyLedger() {
  const { t, i18n } = useTranslation();
  const showToast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [allMonthlyCosts, setAllMonthlyCosts] = useState([]);
  const [ledgerMemberId, setLedgerMemberId] = useState(MEM_DATA[0].id);
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (month) => setExpandedRows(prev => ({...prev, [month]: !prev[month]}));

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await fetchMonthlyCosts();
        setAllMonthlyCosts(data || []);
      } catch (err) {
        showToast('Failed to load ledger data: ' + err.message, 'error');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [showToast]);

  const ledgerStats = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    const records = [];

    const member = MEM_DATA.find(m => m.id === ledgerMemberId);
    if (!member) return { totalBilled: 0, totalPaid: 0, totalDue: 0, records: [] };

    [...allMonthlyCosts].sort((a,b) => b.month.localeCompare(a.month)).forEach(mc => {
      const pWaterTotal = Number(mc.total_water_bill) || 0;
      const water = Math.round((pWaterTotal * member.water) / WATER_RATIO_TOTAL);
      const gas = member.gas;
      const total = water + gas;
      
      const mCosts = mc.member_costs ? (typeof mc.member_costs === 'string' ? JSON.parse(mc.member_costs) : mc.member_costs) : {};
      const paid = Number(mCosts[ledgerMemberId]) || 0;

      totalBilled += total;
      totalPaid += paid;
      
      records.push({
        month: mc.month,
        water,
        gas,
        total,
        paid,
        due: total - paid,
        originalData: mc
      });
    });

    return { totalBilled, totalPaid, totalDue: totalBilled - totalPaid, records };
  }, [allMonthlyCosts, ledgerMemberId]);

  const updateLedgerPayment = async (monthKey, newValue) => {
    const mc = allMonthlyCosts.find(c => c.month === monthKey);
    if (!mc) return;

    const val = parseFloat(newValue) || 0;
    const mCosts = mc.member_costs ? (typeof mc.member_costs === 'string' ? JSON.parse(mc.member_costs) : mc.member_costs) : {};
    const updatedMCosts = { ...mCosts, [ledgerMemberId]: val };

    setAllMonthlyCosts(prev => prev.map(c => c.month === monthKey ? { ...c, member_costs: updatedMCosts } : c));

    try {
      await saveMonthlyCost(monthKey, {
        total_common_rent: mc.total_common_rent,
        total_water_bill: mc.total_water_bill,
        common_costs: mc.common_costs,
        member_costs: updatedMCosts
      });
    } catch (error) {
      showToast('Ledger save failed: ' + error.message, 'error');
    }
  };

  const fmt = (n) => `৳ ${n.toLocaleString()}`;

  return (
    <section className="block animate-fade-in pb-10">
      <div className="flex items-center justify-between mb-7 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight max-md:text-[1.4rem]">
            {t('ledger.title')}
            {isLoading && <span className="ml-3 text-[0.9rem] text-text-muted font-normal inline-block animate-pulse">Loading...</span>}
          </h1>
          {/* <p className="text-text-muted text-[0.9rem] mt-0.5">
            {t('ledger.subtitle')}
          </p> */}
        </div>
      </div>

      <div className="bg-card backdrop-blur-md border border-border rounded-lg overflow-hidden h-fit">
        <div className="px-6 py-5 border-b border-border bg-card-solid flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <BookOpen size={20} className="text-accent" />
            <h2 className="text-[1.1rem] font-bold">{t('ledger.details')}</h2>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[0.85rem] font-semibold text-text-muted">{t('ledger.selectMember')}</label>
            <select
              className="px-3 py-1.5 bg-input border border-border rounded-sm text-text-primary text-[0.88rem] outline-none min-w-[150px] font-semibold cursor-pointer focus:border-accent"
              value={ledgerMemberId}
              onChange={(e) => setLedgerMemberId(e.target.value)}
            >
              {MEM_DATA.map(m => (
                <option key={m.id} value={m.id}>{i18n.language === 'bn' ? m.bn : m.en}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-border divide-border bg-body/30">
          <div className="p-5 flex flex-col items-center justify-center text-center">
            <span className="text-[0.8rem] font-bold uppercase tracking-[0.05em] text-text-muted mb-1">{t('ledger.totalBilled')}</span>
            <span className="text-[1.4rem] font-extrabold text-text-primary">{fmt(ledgerStats.totalBilled)}</span>
          </div>
          <div className="p-5 flex flex-col items-center justify-center text-center">
            <span className="text-[0.8rem] font-bold uppercase tracking-[0.05em] text-text-muted mb-1">{t('ledger.totalPaid')}</span>
            <span className="text-[1.4rem] font-extrabold text-green">{fmt(ledgerStats.totalPaid)}</span>
          </div>
          <div className="p-5 flex flex-col items-center justify-center text-center bg-card-solid">
            <span className="text-[0.8rem] font-bold uppercase tracking-[0.05em] text-text-muted mb-1">{t('ledger.totalDue')}</span>
            <span className={`text-[1.6rem] font-black ${ledgerStats.totalDue > 0 ? 'text-red' : 'text-green'}`}>{fmt(ledgerStats.totalDue)}</span>
          </div>
        </div>

        <div className="table-card-responsive overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <table className="text-[0.88rem] w-full border-collapse">
            <thead>
              <tr>
                <th className="px-5 py-3.5 text-left font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid">
                  {t('table.month')}
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
                  {t('ledger.amountPaid')}
                </th>
                <th className="px-5 py-3.5 text-center font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid">
                  {t('ledger.paidInFull')}
                </th>
                <th className="px-5 py-3.5 text-right font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid">
                  {t('ledger.monthDue')}
                </th>
              </tr>
            </thead>
            <tbody>
              {ledgerStats.records.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-text-muted p-10">{t('dashboard.noRecords')}</td>
                </tr>
              ) : (
                ledgerStats.records.map((r, i) => {
                  const isExpanded = expandedRows[r.month];
                  const hiddenClass = isExpanded ? '' : 'max-md:hidden!';
                  
                  return (
                  <tr key={i} className="transition-colors duration-150 hover:bg-hover [&:last-child_td]:border-b-0 cursor-pointer md:cursor-auto" onClick={() => toggleRow(r.month)}>
                    <td className="px-5 py-3 border-b border-border whitespace-nowrap align-middle" data-label={t('table.month')}>
                      <div className="flex items-center justify-between md:justify-start gap-2">
                        <span className="font-semibold">{formatMonth(r.month)}</span>
                        <span className="md:hidden text-text-muted">
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </span>
                      </div>
                    </td>
                    <td className={`px-5 py-3 border-b border-border whitespace-nowrap align-middle text-right text-cyan ${hiddenClass}`} data-label={t('costCalc.waterBill')}>{fmt(r.water)}</td>
                    <td className={`px-5 py-3 border-b border-border whitespace-nowrap align-middle text-right text-amber ${hiddenClass}`} data-label={t('costCalc.gasBill')}>{r.gas === 0 ? '-' : fmt(r.gas)}</td>
                    <td className="px-5 py-3 border-b border-border whitespace-nowrap align-middle text-right font-bold text-text-primary" data-label={t('costCalc.totalPayable')}>{fmt(r.total)}</td>
                    <td className={`px-5 py-3 border-b border-border whitespace-nowrap align-middle text-right ${hiddenClass}`} data-label={t('ledger.amountPaid')} onClick={e => e.stopPropagation()}>
                      <input 
                        type="number"
                        className={`${inputClass} w-[90px]! text-right py-1 h-[32px] inline-block font-bold ${r.paid === r.total ? 'text-text-muted' : 'text-green'} focus:border-green focus:shadow-[0_0_0_3px_rgba(16,185,129,0.15)]`}
                        value={r.paid === 0 ? '' : r.paid}
                        onChange={(e) => updateLedgerPayment(r.month, e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </td>
                    <td className={`px-5 py-3 border-b border-border whitespace-nowrap align-middle text-center ${hiddenClass}`} data-label={t('ledger.paidInFull')} onClick={e => e.stopPropagation()}>
                      <label className="flex items-center justify-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 text-accent border-border focus:ring-accent accent-accent bg-input cursor-pointer"
                          checked={r.paid === r.total && r.total > 0}
                          onChange={(e) => {
                            if(e.target.checked) updateLedgerPayment(r.month, r.total);
                            else updateLedgerPayment(r.month, 0); 
                          }}
                        />
                      </label>
                    </td>
                    <td className={`px-5 py-3 border-b border-border whitespace-nowrap align-middle text-right font-bold bg-opacity-10 ${r.due > 0 ? 'text-red bg-red-bg' : 'text-green bg-green-bg'}`} data-label={t('ledger.monthDue')}>{fmt(r.due)}</td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
