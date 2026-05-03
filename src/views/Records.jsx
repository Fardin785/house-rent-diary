import { useState, useEffect, useMemo } from 'react';
import { Plus, Download as DownloadIcon, X as CloseIcon } from 'lucide-react';
import Modal from '../components/Modal';
import { fetchRecords, addRecord, updateRecord, deleteRecord, fetchTenants } from '../lib/supabase';
import { formatCurrency, formatMonth, getCurrentMonth, calculateElectricity, DEFAULT_RATE } from '../lib/utils';
import { downloadPDF } from '../lib/pdf';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';

export default function Records() {
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  const [filterMonth, setFilterMonth] = useState('');
  const [filterTenant, setFilterTenant] = useState('');

  const [isRecordModalOpen, setRecordModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState(null);

  // Form states
  const [recordId, setRecordId] = useState('');
  const [tenantId, setTenantId] = useState('');
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
        fetchRecords({ month: filterMonth, tenant_id: filterTenant })
      ]);
      setTenants(tData);
      setRecords(rData);
    } catch (err) {
      showToast(t('toast.errorLoading') + ': ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMonth, filterTenant, showToast]);

  // Auto-fill previous reading from history
  useEffect(() => {
    if (!recordId && tenantId && month) {
      fetchRecords({ tenant_id: tenantId }).then(data => {
        // Data is already ordered by month descending from Supabase
        const pastRecords = data.filter(r => r.month < month);
        if (pastRecords.length > 0) {
          setPrevReading(pastRecords[0].current_reading.toString());
        }
      }).catch(err => console.error("Could not fetch past records for autofill:", err));
    }
  }, [tenantId, month, recordId]);

  const handleOpenAdd = () => {
    setRecordId('');
    setTenantId('');
    setMonth(getCurrentMonth());
    setPrevReading('');
    setCurrReading('');
    setRate(DEFAULT_RATE);
    setPaid(0);
    setRecordModalOpen(true);
  };

  const handleOpenEdit = (r) => {
    setRecordId(r.id);
    setTenantId(r.tenant_id);
    setMonth(r.month);
    setPrevReading(r.previous_reading);
    setCurrReading(r.current_reading);
    
    // Reverse-engineer rate roughly if unit > 0, otherwise default
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

    const tenant = tenants.find(t => t.id === tenantId);
    const rent = tenant ? tenant.monthly_rent : 0;
    const total = rent + electricityBill;
    const p = parseFloat(paid) || 0;
    const due = total - p;

    return { unit, electricityBill, rent, total, due, parsedPrev: prev, parsedCurr: curr };
  }, [prevReading, currReading, rate, tenantId, tenants, paid]);

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

  const confirmDelete = (id) => {
    setDeleteRecordId(id);
    setDeleteModalOpen(true);
  };

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
    const tenant = record.tenants || tenants.find(t => t.id === record.tenant_id);
    downloadPDF(record, tenant, t);
    showToast(t('toast.pdfDownloaded'), 'success');
  };

  return (
    <section className="view active">
      <div className="view-header">
        <div>
          <h1>{t('records.title')}</h1>
          <p className="view-subtitle">{t('records.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          {t('records.newEntry')}
        </button>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>{t('table.month')}</label>
          <input type="month" className="input" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} />
        </div>
        <div className="filter-group">
          <label>{t('table.tenant')}</label>
          <select className="input" value={filterTenant} onChange={(e) => setFilterTenant(e.target.value)}>
            <option value="">{t('records.allTenants')}</option>
            {tenants.map(tenantItem => (
              <option key={tenantItem.id} value={tenantItem.id}>{tenantItem.name} — {tenantItem.flat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('table.tenant')}</th>
                  <th>{t('table.month')}</th>
                  <th>{t('table.prev')}</th>
                  <th>{t('table.curr')}</th>
                  <th>{t('table.units')}</th>
                  <th>{t('table.elecBill')}</th>
                  <th>{t('table.rent')}</th>
                  <th>{t('table.total')}</th>
                  <th>{t('table.paid')}</th>
                  <th>{t('table.due')}</th>
                  <th className="text-right">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="11" className="text-center">{t('table.loading')}</td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan="11" className="text-center" style={{ color: 'var(--text-muted)', padding: '40px' }}>{t('records.noRecords')}</td></tr>
                ) : (
                  records.map(r => {
                    const tName = r.tenants ? r.tenants.name : (tenants.find(tenantItem => tenantItem.id === r.tenant_id)?.name || '—');
                    return (
                      <tr key={r.id}>
                        <td className="fw-600">{tName}</td>
                        <td>{formatMonth(r.month)}</td>
                        <td>{r.previous_reading}</td>
                        <td>{r.current_reading}</td>
                        <td className="fw-600">{r.unit}</td>
                        <td>{formatCurrency(r.electricity_bill)}</td>
                        <td>{formatCurrency(r.rent)}</td>
                        <td className="fw-700 text-accent">{formatCurrency(r.total)}</td>
                        <td className="text-green fw-600">{formatCurrency(r.paid)}</td>
                        <td>
                          {r.due > 0 ? (
                            <span className="badge badge--due">{formatCurrency(r.due)}</span>
                          ) : (
                            <span className="badge badge--paid">{t('table.statusPaid')}</span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="action-btns">
                            <button className="btn btn-outline btn-sm" onClick={() => handleOpenEdit(r)} title={t('actions.edit')}>{t('actions.edit')}</button>
                            <button className="btn btn-outline btn-sm" onClick={() => handleDownloadPDF(r)} title="Download PDF">{t('actions.pdf')}</button>
                            <button className="btn btn-danger btn-sm" onClick={() => confirmDelete(r.id)} title="Delete"><CloseIcon size={14}/></button>
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
      </div>

      {/* Record Modal */}
      <Modal isOpen={isRecordModalOpen} onClose={() => setRecordModalOpen(false)} title={recordId ? t('records.editEntry') : t('records.newEntry')} isWide>
        <form onSubmit={handleFormSubmit} className="modal-body">
          <div className="form-row">
            <div className="form-group">
              <label>{t('table.tenant')}</label>
              <select className="input" required value={tenantId} onChange={e => setTenantId(e.target.value)}>
                <option value="">{t('records.selectTenant')}</option>
                {tenants.map(tenantItem => (
                  <option key={tenantItem.id} value={tenantItem.id}>{tenantItem.name} — {tenantItem.flat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{t('table.month')}</label>
              <input type="month" className="input" required value={month} onChange={e => setMonth(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>{t('forms.prevReading')}</label>
              <input type="number" className="input" required min="0" step="0.01" placeholder={t('forms.placeholderReading')} value={prevReading} onChange={e => setPrevReading(e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('forms.currReading')}</label>
              <input type="number" className="input" required min="0" step="0.01" placeholder={t('forms.placeholderReading')} value={currReading} onChange={e => setCurrReading(e.target.value)} />
            </div>
          </div>

          <div className="calc-preview">
            <h4>{t('forms.autoCalc')}</h4>
            <div className="calc-grid">
              <div className="calc-item">
                <span className="calc-label">{t('table.units')}</span>
                <span className="calc-value">{calcResult.unit}</span>
              </div>
              <div className="calc-item">
                <span className="calc-label">{t('forms.ratePerUnit')}</span>
                <input type="number" className="input input-sm" min="0" step="0.01" value={rate} onChange={e => setRate(e.target.value)} />
              </div>
              <div className="calc-item">
                <span className="calc-label">{t('table.elecBill')}</span>
                <span className="calc-value">{formatCurrency(calcResult.electricityBill)}</span>
              </div>
              <div className="calc-item">
                <span className="calc-label">{t('table.rent')}</span>
                <span className="calc-value">{formatCurrency(calcResult.rent)}</span>
              </div>
              <div className="calc-item calc-item--total">
                <span className="calc-label">{t('table.total')}</span>
                <span className="calc-value">{formatCurrency(calcResult.total)}</span>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('forms.amountPaid')}</label>
              <input type="number" className="input" required min="0" step="1" value={paid} onChange={e => setPaid(e.target.value)} />
            </div>
            <div className="form-group">
              <label>{t('forms.due')}</label>
              <div className="input input--readonly">{formatCurrency(calcResult.due)}</div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setRecordModalOpen(false)}>{t('actions.cancel')}</button>
            <button type="submit" className="btn btn-primary">{t('actions.saveRecord')}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title={t('modals.confirmDelete')} isSmall>
        <div className="modal-body">
          <p>{t('modals.deleteRecordMsg')}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setDeleteModalOpen(false)}>{t('actions.cancel')}</button>
          <button className="btn btn-danger" onClick={executeDelete}>{t('actions.delete')}</button>
        </div>
      </Modal>
    </section>
  );
}
