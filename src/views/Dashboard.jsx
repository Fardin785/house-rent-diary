import { useEffect, useState } from 'react';
import { Users, FileText, Download, Target, TrendingUp, AlertCircle } from 'lucide-react';
import StatCard from '../components/StatCard';
import { fetchTenants, fetchRecords } from '../lib/supabase';
import { formatCurrency, formatMonth, getCurrentMonth } from '../lib/utils';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [tData, rData] = await Promise.all([
          fetchTenants(),
          fetchRecords()
        ]);
        setTenants(tData);
        setRecords(rData);
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
  const unitsThisMonth = thisMonthRecords.reduce((sum, r) => sum + (r.unit || 0), 0);

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
    <section className="view active">
      <div className="view-header">
        <div>
          <h1>{t('dashboard.title')}</h1>
          <p className="view-subtitle">{t('dashboard.subtitle')}</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard 
          label={t('dashboard.totalTenants')} 
          value={loading ? '...' : tenants.length}
          icon={<Users size={24} />}
          className="stat-card--tenants"
        />
        <StatCard 
          label={t('dashboard.totalDue')} 
          value={loading ? '...' : formatCurrency(totalDue)}
          icon={<AlertCircle size={24} />}
          className="stat-card--due"
        />
        <StatCard 
          label={t('dashboard.collectedThisMonth')} 
          value={loading ? '...' : formatCurrency(collectedThisMonth)}
          icon={<TrendingUp size={24} />}
          className="stat-card--collected"
        />
        <StatCard 
          label={t('dashboard.unitsThisMonth')} 
          value={loading ? '...' : `${unitsThisMonth} kWh`}
          icon={<Target size={24} />}
          className="stat-card--units"
        />
      </div>

      <div className="card">
        <div className="card-header">
          <h2>{t('dashboard.monthlySummary')}</h2>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('table.month')}</th>
                  <th>{t('table.records')}</th>
                  <th>{t('table.totalRent')}</th>
                  <th>{t('table.totalElec')}</th>
                  <th>{t('table.totalPaid')}</th>
                  <th>{t('table.totalDue')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center">{t('table.loading')}</td></tr>
                ) : sortedMonths.length === 0 ? (
                  <tr><td colSpan="6" className="text-center" style={{ color: 'var(--text-muted)', padding: '40px' }}>{t('dashboard.noRecords')}</td></tr>
                ) : (
                  sortedMonths.map(m => {
                    const s = monthMap[m];
                    return (
                      <tr key={m}>
                        <td className="fw-600">{formatMonth(m)}</td>
                        <td>{s.records}</td>
                        <td>{formatCurrency(s.rent)}</td>
                        <td>{formatCurrency(s.elec)}</td>
                        <td className="text-green fw-600">{formatCurrency(s.paid)}</td>
                        <td className={s.due > 0 ? "text-red fw-600" : "text-green fw-600"}>{formatCurrency(s.due)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
