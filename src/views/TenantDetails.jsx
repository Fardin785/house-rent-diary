import { useState, useEffect, useMemo } from 'react';
import { Plus, Download as DownloadIcon, X as CloseIcon, FileText, ArrowLeft, Eye } from 'lucide-react';
import { Link, useParams } from '@tanstack/react-router';
import Modal from '../components/Modal';
import { fetchRecords, addRecord, updateRecord, deleteRecord, fetchTenants } from '../lib/supabase';
import { formatCurrency, formatMonth, getCurrentMonth, calculateElectricity, DEFAULT_RATE } from '../lib/utils';
import { downloadPDF } from '../lib/pdf';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';

// Shared table header classes
const thClass = "px-5 py-3.5 text-left font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid sticky top-0";
const tdClass = "px-5 py-3.5 border-b border-border whitespace-nowrap align-middle";
const inputClass = "w-full px-3 py-2 bg-body border border-border rounded-sm text-text-primary font-sans text-[0.88rem] outline-none transition-[border-color,box-shadow] duration-200 focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted";

export default function TenantDetails() {
  const { t } = useTranslation();
  
  const params = useParams({ strict: false });
  const tenantId = params.tenantId;
  
  const [tenant, setTenant] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  const [filterMonth, setFilterMonth] = useState('');

  const [isRecordModalOpen, setRecordModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState(null);

  // Form states
  const [recordId, setRecordId] = useState('');
  const [month, setMonth] = useState(getCurrentMonth());
  const [prevReading, setPrevReading] = useState('');
  const [currReading, setCurrReading] = useState('');
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [paid, setPaid] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [tData, rData] = await Promise.all([
        fetchTenants(),
        fetchRecords({ month: filterMonth, tenant_id: tenantId })
      ]);
      const activeTenant = tData.find(t => t.id === tenantId);
      setTenant(activeTenant);
      setRecords(rData);
    } catch (err) {
      showToast(t('toast.errorLoading') + ': ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId && tenantId !== 'tenants') loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMonth, tenantId, showToast]);

  // Auto-fill previous reading from history
  useEffect(() => {
    if (!recordId && tenantId && month) {
      fetchRecords({ tenant_id: tenantId }).then(data => {
        const pastRecords = data.filter(r => r.month < month);
        if (pastRecords.length > 0) {
          setPrevReading(pastRecords[0].current_reading.toString());
        }
      }).catch(err => console.error("Could not fetch past records for autofill:", err));
    }
  }, [tenantId, month, recordId]);

  const handleOpenAdd = () => {
    setRecordId('');
    setMonth(getCurrentMonth());
    setPrevReading('');
    setCurrReading('');
    setRate(DEFAULT_RATE);
    setPaid(0);
    setRecordModalOpen(true);
  };

  const handleOpenEdit = (r) => {
    setRecordId(r.id);
    setMonth(r.month);
    setPrevReading(r.previous_reading);
    setCurrReading(r.current_reading);
    const impliedRate = r.unit > 0 ? (r.electricity_bill / r.unit) : DEFAULT_RATE;
    setRate(impliedRate.toFixed(2));
    setPaid(r.paid);
    setRecordModalOpen(true);
  };

  const calcResult = useMemo(() => {
    const prev = parseFloat(prevReading) || 0;
    const curr = parseFloat(currReading) || 0;
    const r = parseFloat(rate) || DEFAULT_RATE;
    const { unit, electricityBill } = calculateElectricity(prev, curr, r);
    const rent = tenant ? tenant.monthly_rent : 0;
    const total = rent + electricityBill;
    const p = parseFloat(paid) || 0;
    const due = total - p;
    return { unit, electricityBill, rent, total, due, parsedPrev: prev, parsedCurr: curr };
  }, [prevReading, currReading, rate, tenant, paid]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (calcResult.parsedCurr < calcResult.parsedPrev) {
      showToast(t('toast.readingError'), 'error');
      return;
    }
    const recordData = {
      tenant_id: tenantId, 
      month,
      previous_reading: calcResult.parsedPrev, 
      current_reading: calcResult.parsedCurr,
      unit: calcResult.unit, 
      electricity_bill: calcResult.electricityBill,
      rent: calcResult.rent, 
      total: calcResult.total,
      paid: parseFloat(paid) || 0, 
      due: calcResult.due,
    };
    try {
      if (recordId) {
        await updateRecord(recordId, recordData);
        showToast(t('toast.recordUpdated'), 'success');
      } else {
        await addRecord(recordData);
        showToast(t('toast.recordAdded'), 'success');
      }
      setRecordModalOpen(false);
      loadData();
    } catch (err) {
      showToast(t('toast.errorLoading') + ': ' + err.message, 'error');
    }
  };

  const confirmDelete = (id) => { setDeleteRecordId(id); setDeleteModalOpen(true); };

  const executeDelete = async () => {
    if (!deleteRecordId) return;
    try {
      await deleteRecord(deleteRecordId);
      showToast(t('toast.recordDeleted'), 'success');
      setDeleteModalOpen(false);
      loadData();
    } catch (err) {
      showToast(t('toast.errorLoading') + ': ' + err.message, 'error');
    }
  };

  const handleDownloadPDF = (record) => {
    const tenantCtx = record.tenants || tenant;
    downloadPDF(record, tenantCtx, t);
    showToast(t('toast.pdfDownloaded'), 'success');
  };

  if (!tenant && !loading) {
     return <div className="p-8 text-center text-text-muted">Tenant not found.</div>;
  }

  return (
    <section className="block animate-fade-in pb-10">
      
      {/* Back nav */}
      <div className="mb-5 border-b border-border pb-4">
        <Link to="/tenants" className="inline-flex items-center gap-2 text-text-secondary hover:text-accent font-semibold text-[0.9rem] transition-colors">
          <ArrowLeft size={16} /> Back to Tenants
        </Link>
      </div>

      {loading ? (
        <div className="text-text-muted mt-5 font-semibold text-[0.9rem] animate-pulse">Loading Tenant Profile...</div>
      ) : tenant && (
        <div className="bg-card-solid backdrop-blur-md border border-border rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex justify-between items-start max-md:flex-col max-md:gap-5">
            <div className="flex items-center gap-5">
              {tenant.photo_url ? (
                <img src={tenant.photo_url} alt="Profile" className="w-[85px] h-[85px] rounded-full object-cover border-2 border-border shadow-sm" />
              ) : (
                <div className="w-[85px] h-[85px] rounded-full bg-input flex items-center justify-center text-[28px] text-text-muted font-bold border border-border">
                  {tenant.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-2xl font-extrabold mb-1.5 text-text-primary tracking-tight">{tenant.name}</h2>
                <div className="text-text-secondary text-[0.95rem] flex gap-5 font-medium max-md:flex-col max-md:gap-2">
                  <span className="flex items-center gap-1.5 bg-input px-2.5 py-1 rounded-sm"><strong className="text-text-primary">{t('table.flat')}:</strong> {tenant.flat}</span>
                  <span className="flex items-center gap-1.5 bg-green-bg px-2.5 py-1 rounded-sm text-green"><strong className="text-text-primary">{t('table.monthlyRent')}:</strong> {formatCurrency(tenant.monthly_rent)}</span>
                </div>
              </div>
            </div>

            {tenant.documents && tenant.documents.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-end max-w-[40%] max-md:max-w-full max-md:justify-start">
                {tenant.documents.map((doc, i) => (
                  <a key={i} href={doc.url} target="_blank" rel="noreferrer" title={doc.name} className="p-2 border border-border rounded-lg flex items-center justify-center bg-input text-text-secondary transition-all duration-200 hover:border-accent hover:text-accent hover:bg-accent-glow">
                    <FileText size={18} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {tenant.family_members && tenant.family_members.length > 0 && (
            <div className="mt-6 pt-5 border-t border-border">
              <h3 className="text-[0.8rem] uppercase font-bold tracking-wider mb-3 text-text-muted">{t('forms.familyMembers')}</h3>
              <div className="flex flex-wrap gap-3">
                {tenant.family_members.map((member, i) => (
                  <div key={i} className="px-3 py-1.5 bg-body border border-border rounded-md flex items-center gap-2">
                    <span className="font-bold text-[0.9rem] text-text-primary">{member.name}</span>
                    <span className="text-accent text-[0.75rem] bg-accent-glow px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{member.relation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Record Tracker */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-4 max-md:flex-col max-md:items-start pt-2">
        <div>
          <h2 className="text-[1.3rem] font-bold tracking-tight">{t('records.title')}</h2>
        </div>
        <button className="inline-flex items-center gap-2 px-5 py-2.5 border-none rounded-sm font-sans text-[0.88rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap bg-gradient-to-br from-accent to-[#7c3aed] text-white shadow-glow hover:from-accent-hover hover:to-[#8b5cf6] hover:-translate-y-px hover:shadow-[0_0_28px_var(--color-accent-glow)]" onClick={handleOpenAdd}>
          <Plus size={18} />
          {t('records.newEntry')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-card backdrop-blur-[12px] border border-border rounded-lg overflow-hidden relative">
        <div className="table-card-responsive overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <table className="text-[0.88rem] w-full border-collapse">
            <thead>
              <tr>
                <th className={thClass}>{t('table.month')}</th>
                <th className={thClass}>{t('table.elecBill')}</th>
                <th className={thClass}>{t('table.rent')}</th>
                <th className={thClass}>{t('table.total')}</th>
                <th className={thClass}>{t('table.due')}</th>
                <th className={`${thClass} text-right! w-[1%]`}>{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" className={`${tdClass} text-center`}>{t('table.loading')}</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan="10" className={`${tdClass} text-center text-text-muted p-10`}>{t('records.noRecords')}</td></tr>
              ) : (
                records.map(r => {
                  return (
                    <tr key={r.id} className="transition-colors duration-150 hover:bg-hover [&:last-child_td]:border-b-0">
                      <td className={`${tdClass} font-semibold`} data-label={t('table.month')}>{formatMonth(r.month)}</td>
                      <td className={tdClass} data-label={t('table.elecBill')}>{formatCurrency(r.electricity_bill)} <span className="text-text-muted text-[0.85em]">({r.unit} {t('table.units')})</span></td>
                      <td className={tdClass} data-label={t('table.rent')}>{formatCurrency(r.rent)}</td>
                      <td className={`${tdClass} font-bold text-accent-hover`} data-label={t('table.total')}>{formatCurrency(r.total)}</td>
                      <td className={tdClass} data-label={t('table.due')}>
                        {r.due > 0 ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase tracking-[0.03em] bg-red-bg text-red">{formatCurrency(r.due)}</span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase tracking-[0.03em] bg-green-bg text-green">{t('table.statusPaid')}</span>
                        )}
                      </td>
                      <td className={`${tdClass} text-right! w-[1%]`} data-label={t('table.actions')}>
                        <div className="flex gap-1.5 justify-end">
                          <button className="inline-flex items-center gap-2 px-2.5 py-1.5 border border-border rounded-[6px] bg-transparent text-text-secondary text-[0.78rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap hover:border-accent hover:text-accent hover:bg-accent-glow" onClick={() => handleOpenEdit(r)} title={t('actions.edit')}>{t('actions.edit')}</button>
                          <button className="inline-flex items-center gap-2 px-2.5 py-1.5 border border-border rounded-[6px] bg-transparent text-text-secondary text-[0.78rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap hover:border-accent hover:text-accent hover:bg-accent-glow" onClick={() => handleDownloadPDF(r)} title="Download PDF">{t('actions.pdf')}</button>
                          <button className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] bg-red text-white text-[0.78rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap border-none hover:bg-[#dc2626]" onClick={() => confirmDelete(r.id)} title="Delete"><CloseIcon size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Modal */}
      <Modal isOpen={isRecordModalOpen} onClose={() => setRecordModalOpen(false)} title={recordId ? t('records.editEntry') : t('records.newEntry')} isWide>
        <form onSubmit={handleFormSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-[0.82rem] font-semibold text-text-secondary mb-1.5 uppercase tracking-[0.03em]">{t('table.month')}</label>
            <input type="month" className={inputClass} required value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div className="flex gap-4 max-md:flex-col max-md:gap-0">
            <div className="mb-4 flex-1">
              <label className="block text-[0.82rem] font-semibold text-text-secondary mb-1.5 uppercase tracking-[0.03em]">{t('forms.prevReading')}</label>
              <input type="number" className={inputClass} required min="0" step="0.01" placeholder={t('forms.placeholderReading')} value={prevReading} onChange={e => setPrevReading(e.target.value)} />
            </div>
            <div className="mb-4 flex-1">
              <label className="block text-[0.82rem] font-semibold text-text-secondary mb-1.5 uppercase tracking-[0.03em]">{t('forms.currReading')}</label>
              <input type="number" className={inputClass} required min="0" step="0.01" placeholder={t('forms.placeholderReading')} value={currReading} onChange={e => setCurrReading(e.target.value)} />
            </div>
          </div>

          {/* Calc Preview */}
          <div className="bg-input border border-border rounded-md p-5 mb-4">
            <h4 className="text-[0.82rem] uppercase tracking-[0.04em] text-text-muted mb-3.5">{t('forms.autoCalc')}</h4>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3 max-md:grid-cols-2">
              <div className="text-center p-2.5 bg-body rounded-sm">
                <span className="block text-[0.72rem] uppercase tracking-[0.04em] text-text-muted mb-1">{t('table.units')}</span>
                <span className="block text-[1.1rem] font-bold">{calcResult.unit}</span>
              </div>
              <div className="text-center p-2.5 bg-body rounded-sm">
                <span className="block text-[0.72rem] uppercase tracking-[0.04em] text-text-muted mb-1">{t('forms.ratePerUnit')}</span>
                <input type="number" className={`${inputClass} text-center max-w-[80px] mx-auto px-1.5 py-1 text-[0.82rem]`} min="0" step="0.01" value={rate} onChange={e => setRate(e.target.value)} />
              </div>
              <div className="text-center p-2.5 bg-body rounded-sm">
                <span className="block text-[0.72rem] uppercase tracking-[0.04em] text-text-muted mb-1">{t('table.elecBill')}</span>
                <span className="block text-[1.1rem] font-bold">{formatCurrency(calcResult.electricityBill)}</span>
              </div>
              <div className="text-center p-2.5 bg-body rounded-sm">
                <span className="block text-[0.72rem] uppercase tracking-[0.04em] text-text-muted mb-1">{t('table.rent')}</span>
                <span className="block text-[1.1rem] font-bold">{formatCurrency(calcResult.rent)}</span>
              </div>
              <div className="text-center p-2.5 bg-accent-glow rounded-sm">
                <span className="block text-[0.72rem] uppercase tracking-[0.04em] text-text-muted mb-1">{t('table.total')}</span>
                <span className="block text-[1.1rem] font-bold">{formatCurrency(calcResult.total)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 max-md:flex-col max-md:gap-0">
            <div className="mb-4 flex-1">
              <label className="block text-[0.82rem] font-semibold text-text-secondary mb-1.5 uppercase tracking-[0.03em]">{t('forms.amountPaid')}</label>
              <input type="number" className={inputClass} required min="0" step="1" value={paid} onChange={e => setPaid(e.target.value)} />
            </div>
            <div className="mb-4 flex-1">
              <label className="block text-[0.82rem] font-semibold text-text-secondary mb-1.5 uppercase tracking-[0.03em]">{t('forms.due')}</label>
              <div className="flex items-center w-full px-3.5 py-2.5 bg-input border border-border rounded-sm text-accent-hover font-semibold text-[0.9rem]">{formatCurrency(calcResult.due)}</div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4">
            <button type="button" className="inline-flex items-center gap-2 px-5 py-2.5 border-none rounded-sm font-sans text-[0.88rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap bg-transparent text-text-secondary hover:bg-hover hover:text-text-primary" onClick={() => setRecordModalOpen(false)}>{t('actions.cancel')}</button>
            <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 border-none rounded-sm font-sans text-[0.88rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap bg-gradient-to-br from-accent to-[#7c3aed] text-white shadow-glow hover:from-accent-hover hover:to-[#8b5cf6] hover:-translate-y-px hover:shadow-[0_0_28px_var(--color-accent-glow)]">{t('actions.saveRecord')}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title={t('modals.confirmDelete')} isSmall>
        <div className="p-6">
          <p>{t('modals.deleteRecordMsg')}</p>
        </div>
        <div className="flex justify-end gap-2.5 px-6 pb-6">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 border-none rounded-sm font-sans text-[0.88rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap bg-transparent text-text-secondary hover:bg-hover hover:text-text-primary" onClick={() => setDeleteModalOpen(false)}>{t('actions.cancel')}</button>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 border-none rounded-sm font-sans text-[0.88rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap bg-red text-white hover:bg-[#dc2626]" onClick={executeDelete}>{t('actions.delete')}</button>
        </div>
      </Modal>
    </section>
  );
}
