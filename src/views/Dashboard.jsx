import { TrendingUp, AlertCircle, Wallet, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatCard from '../components/StatCard';
import { fetchTenants, fetchRecords, fetchMonthlyCosts } from '../lib/supabase';
import { formatCurrency, formatMonth, getCurrentMonth } from '../lib/utils';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const isBn = i18n.language === 'bn';
  const [tenants, setTenants] = useState([]);
  const [records, setRecords] = useState([]);
  const [monthlyCostsData, setMonthlyCostsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [tData, rData, cData] = await Promise.all([
          fetchTenants(),
          fetchRecords(),
          fetchMonthlyCosts()
        ]);
        setTenants(tData);
        setRecords(rData);
        setMonthlyCostsData(cData);
      } catch (err) {
        showToast('Failed to load dashboard data: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [showToast]);

  const currentMonth = getCurrentMonth();
  const totalDue = records.reduce((sum, r) => sum + (r.due || 0), 0);
  const thisMonthRecords = records.filter(r => r.month === currentMonth);
  const collectedThisMonth = thisMonthRecords.reduce((sum, r) => sum + (r.paid || 0), 0);
  
  // Calculate current month's remaining house fund
  const currentCostData = monthlyCostsData.find(c => c.month === currentMonth);
  let totalFundThisMonth = 0;
  if (currentCostData) {
    const commonCosts = typeof currentCostData.common_costs === 'string' ? JSON.parse(currentCostData.common_costs) : currentCostData.common_costs;
    const spent = (commonCosts || []).reduce((sum, c) => sum + (c.amount || 0), 0);
    totalFundThisMonth = Number(currentCostData.total_common_rent) - spent;
  }

  // Formatting chart data for Recharts
  const chartData = [...monthlyCostsData]
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(c => {
        const commonCosts = typeof c.common_costs === 'string' ? JSON.parse(c.common_costs) : c.common_costs;
        const spent = (commonCosts || []).reduce((sum, item) => sum + (item.amount || 0), 0);
        return {
          name: formatMonth(c.month),
          expense: spent,
          fund: Number(c.total_common_rent),
          details: commonCosts || []
        };
      });

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card-solid border border-border p-4 rounded-lg shadow-xl min-w-[220px]">
          <p className="font-bold border-b border-border pb-2 mb-3 tracking-wide">{label}</p>
          <div className="space-y-1.5 mb-3">
            <div className="flex justify-between text-[0.88rem] font-bold text-accent-hover">
              <span>{isBn ? "ভাড়ার ফান্ড" : "Total Fund"}:</span>
              <span>{formatCurrency(data.fund)}</span>
            </div>
            <div className="flex justify-between text-[0.88rem] font-bold text-red">
              <span>{isBn ? "মোট খরচ" : "Total Expense"}:</span>
              <span>{formatCurrency(data.expense)}</span>
            </div>
          </div>
          
          {data.details && data.details.length > 0 && (
            <div className="pt-3 border-t border-border border-dashed text-[0.82rem] text-text-muted space-y-1.5">
              {data.details.map((cost, idx) => (
                <div key={idx} className="flex justify-between gap-4">
                  <span className="truncate max-w-[140px]">{isBn ? (cost.name || cost.nameEn) : (cost.nameEn || cost.name)}</span>
                  <span>{formatCurrency(cost.amount || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Group by month
  const monthMap = {};
  records.forEach(r => {
    if (!monthMap[r.month]) monthMap[r.month] = { records: 0, rent: 0, elec: 0, paid: 0, due: 0 };
    monthMap[r.month].records++;
    monthMap[r.month].rent += r.rent || 0;
    monthMap[r.month].elec += r.electricity_bill || 0;
    monthMap[r.month].paid += r.paid || 0;
    monthMap[r.month].due += r.due || 0;
  });

  const sortedMonths = Object.keys(monthMap).sort().reverse();

  return (
    <section className="block animate-fade-in">
      <div className="flex items-center justify-between mb-7 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight max-md:text-[1.4rem]">{t('dashboard.title')}</h1>
          {/* <p className="text-text-muted text-[0.9rem] mt-0.5">{t('dashboard.subtitle')}</p> */}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5 mb-7 max-md:grid-cols-2 max-md:gap-3 max-[440px]:grid-cols-1">
         <StatCard
          label={isBn ? "নিচতলার বর্তমান ফান্ড" : "Current House Fund"}
          value={loading ? '...' : formatCurrency(totalFundThisMonth)}
          icon={<Wallet size={24} />}
          iconBg="bg-accent-glow"
          iconColor="text-accent"
        /><StatCard
          label={t('dashboard.totalDue')}
          value={loading ? '...' : formatCurrency(totalDue)}
          icon={<AlertCircle size={24} />}
          iconBg="bg-red-bg"
          iconColor="text-red"
        />
        <StatCard
          label={t('dashboard.collectedThisMonth')}
          value={loading ? '...' : formatCurrency(collectedThisMonth)}
          icon={<TrendingUp size={24} />}
          iconBg="bg-green-bg"
          iconColor="text-green"
        />
       
      </div>

      {/* Chart Section */}
      <div className="bg-card backdrop-blur-[12px] border border-border rounded-lg mb-7 relative z-10 overflow-visible">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-[1.1rem] font-bold flex items-center gap-2">
            <Activity className="text-accent" size={20}/>
            {isBn ? "মাসিক সাধারণ খরচের গ্রাফ" : "Monthly Common Costs Graph"}
          </h2>
        </div>
        <div className="p-6 h-[300px]">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center text-text-muted">{t('table.loading')}...</div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-text-muted">{t('dashboard.noRecords')}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `৳${val}`} width={60} />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ fill: 'var(--color-hover)', opacity: 0.4 }} 
                  wrapperStyle={{ zIndex: 100 }}
                />
                <Bar dataKey="expense" name={isBn ? "মোট খরচ" : "Total Expense"} fill="var(--color-red)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Bar dataKey="fund" name={isBn ? "ভাড়ার ফান্ড" : "Total Fund"} fill="var(--color-accent-hover)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-card backdrop-blur-[12px] border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="text-[1.1rem] font-bold">{t('dashboard.monthlySummary')}</h2>
        </div>
        <div className="table-card-responsive overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <table className="text-[0.88rem] w-full border-collapse">
            <thead>
              <tr>
                <th className="px-5 py-3.5 text-left font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid sticky top-0">{t('table.month')}</th>
                <th className="px-5 py-3.5 text-left font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid sticky top-0">{t('table.records')}</th>
                <th className="px-5 py-3.5 text-left font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid sticky top-0">{t('table.totalRent')}</th>
                <th className="px-5 py-3.5 text-left font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid sticky top-0">{t('table.totalElec')}</th>
                <th className="px-5 py-3.5 text-left font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid sticky top-0">{t('table.totalPaid')}</th>
                <th className="px-5 py-3.5 text-left font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid sticky top-0">{t('table.totalDue')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center px-5 py-3.5 border-b border-border">{t('table.loading')}</td></tr>
              ) : sortedMonths.length === 0 ? (
                <tr><td colSpan="6" className="text-center text-text-muted p-10 border-b border-border">{t('dashboard.noRecords')}</td></tr>
              ) : (
                sortedMonths.map(m => {
                  const s = monthMap[m];
                  return (
                    <tr key={m} className="transition-colors duration-150 hover:bg-hover [&:last-child_td]:border-b-0">
                      <td className="px-5 py-3.5 border-b border-border whitespace-nowrap align-middle font-semibold" data-label={t('table.month')}>{formatMonth(m)}</td>
                      <td className="px-5 py-3.5 border-b border-border whitespace-nowrap align-middle" data-label={t('table.records')}>{s.records}</td>
                      <td className="px-5 py-3.5 border-b border-border whitespace-nowrap align-middle" data-label={t('table.totalRent')}>{formatCurrency(s.rent)}</td>
                      <td className="px-5 py-3.5 border-b border-border whitespace-nowrap align-middle" data-label={t('table.totalElec')}>{formatCurrency(s.elec)}</td>
                      <td className="px-5 py-3.5 border-b border-border whitespace-nowrap align-middle text-green font-semibold" data-label={t('table.totalPaid')}>{formatCurrency(s.paid)}</td>
                      <td className={`px-5 py-3.5 border-b border-border whitespace-nowrap align-middle font-semibold ${s.due > 0 ? 'text-red' : 'text-green'}`} data-label={t('table.totalDue')}>{formatCurrency(s.due)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
