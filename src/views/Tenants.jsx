import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Plus, Trash2, FileText, User, Upload, Users, Camera, FileUp, UserPlus, Eye } from 'lucide-react';
import Modal from '../components/Modal';
import { fetchTenants, addTenant, updateTenant, deleteTenant, uploadTenantAsset } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';

// Shared classes
const inputClass = "w-full px-3 py-2 bg-body border border-border rounded-sm text-text-primary font-sans text-[0.88rem] outline-none transition-[border-color,box-shadow] duration-200 focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted";
const inputSmClass = "w-full px-2.5 py-1.5 bg-input border border-border rounded-sm text-text-primary font-sans text-[0.82rem] outline-none transition-[border-color,box-shadow] duration-200 focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted";
const labelClass = "block text-[0.82rem] font-semibold text-text-secondary mb-1.5 uppercase tracking-[0.03em]";
const btnPrimary = "inline-flex items-center gap-2 px-5 py-2.5 border-none rounded-sm font-sans text-[0.88rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap bg-gradient-to-br from-accent to-[#7c3aed] text-white shadow-glow hover:from-accent-hover hover:to-[#8b5cf6] hover:-translate-y-px hover:shadow-[0_0_28px_var(--color-accent-glow)]";
const btnGhost = "inline-flex items-center gap-2 px-5 py-2.5 border-none rounded-sm font-sans text-[0.88rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap bg-transparent text-text-secondary hover:bg-hover hover:text-text-primary";
const btnOutline = "inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-sm bg-transparent text-text-secondary text-[0.88rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap hover:border-accent hover:text-accent hover:bg-accent-glow";
const btnDanger = "inline-flex items-center gap-2 px-5 py-2.5 border-none rounded-sm font-sans text-[0.88rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap bg-red text-white hover:bg-[#dc2626]";
const thClass = "px-5 py-3.5 text-left font-semibold text-text-muted uppercase text-[0.75rem] tracking-[0.06em] border-b border-border whitespace-nowrap bg-card-solid sticky top-0";
const tdClass = "px-5 py-3.5 border-b border-border whitespace-nowrap align-middle";

const FLAT_OPTIONS = [
  { id: '5th (front-east)', labelKey: 'flats.frontEast' },
  { id: '5th (front-west)', labelKey: 'flats.frontWest' },
  { id: '5th (back-east)', labelKey: 'flats.backEast' },
  { id: '5th (back-west)', labelKey: 'flats.backWest' }
];

export default function Tenants() {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const showToast = useToast();

  const [isTenantModalOpen, setTenantModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editTenantData, setEditTenantData] = useState(null);
  const [deleteTenantId, setDeleteTenantId] = useState(null);
  const [viewPhotoUrl, setViewPhotoUrl] = useState(null);
  
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState('');
  const [flat, setFlat] = useState('');
  const [rent, setRent] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [documents, setDocuments] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [status, setStatus] = useState('active');
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchTenants();
      setTenants(data);
    } catch (err) {
      showToast(t('toast.errorLoading') + ': ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [showToast]);

  const handleOpenAdd = () => {
    setEditTenantData(null); setName(''); setFlat(''); setRent('');
    setPhotoUrl(''); setDocuments([]); setFamilyMembers([]); setStatus('active');
    setTenantModalOpen(true);
  };

  const handleOpenEdit = (tData) => {
    setEditTenantData(tData); setName(tData.name); setFlat(tData.flat);
    setRent(tData.monthly_rent); setPhotoUrl(tData.photo_url || '');
    setDocuments(tData.documents || []); setFamilyMembers(tData.family_members || []); 
    setStatus(tData.status || 'active');
    setTenantModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const data = {
      name: name.trim(), flat: flat.trim(), monthly_rent: parseFloat(rent),
      photo_url: photoUrl, documents, family_members: familyMembers, status
    };
    try {
      if (editTenantData) {
        await updateTenant(editTenantData.id, data);
        showToast(t('toast.tenantUpdated'), 'success');
      } else {
        await addTenant(data);
        showToast(t('toast.tenantAdded'), 'success');
      }
      setTenantModalOpen(false);
      loadData();
    } catch (err) {
      showToast(t('toast.errorLoading') + ': ' + err.message, 'error');
    }
  };

  const confirmDelete = (tData) => { setDeleteTenantId(tData.id); setDeleteModalOpen(true); };

  const executeDelete = async () => {
    if (!deleteTenantId) return;
    try {
      await deleteTenant(deleteTenantId);
      showToast(t('toast.tenantDeleted'), 'success');
      setDeleteModalOpen(false); loadData();
    } catch (err) {
      showToast(t('toast.errorLoading') + ': ' + err.message, 'error');
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await uploadTenantAsset(file, 'photo');
      setPhotoUrl(res.url);
      showToast('Photo uploaded!', 'success');
    } catch (err) {
      showToast(t('toast.errorLoading') + ': ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await uploadTenantAsset(file, 'doc');
      setDocuments([...documents, res]);
      showToast('Document uploaded!', 'success');
    } catch (err) {
      showToast(t('toast.errorLoading') + ': ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const addFamilyMember = () => setFamilyMembers([...familyMembers, { name: '', relation: '', age: '' }]);
  const updateFamilyMember = (index, field, value) => {
    const updated = [...familyMembers]; updated[index][field] = value; setFamilyMembers(updated);
  };
  const removeFamilyMember = (index) => setFamilyMembers(familyMembers.filter((_, i) => i !== index));

  return (
    <section className="block animate-fade-in">
      <div className="flex items-center justify-between mb-7 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 className="text-[1.75rem] font-extrabold tracking-tight max-md:text-[1.4rem]">{t('tenants.title')}</h1>
          {/* <p className="text-text-muted text-[0.9rem] mt-0.5">{t('tenants.subtitle')}</p> */}
        </div>
        <button className={btnPrimary} onClick={handleOpenAdd}>
          <Plus size={18} />
          {t('tenants.addTenant')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-card backdrop-blur-[12px] border border-border rounded-lg overflow-hidden">
        <div className="table-card-responsive overflow-x-auto [-webkit-overflow-scrolling:touch]">
          <table className="text-[0.88rem] w-full border-collapse">
            <thead>
              <tr>
                <th className={thClass}>{t('table.name')}</th>
                <th className={thClass}>{t('table.flat')}</th>
                <th className={thClass}>{t('table.monthlyRent')}</th>
                <th className={thClass}>{t('table.due')}</th>
                <th className={`${thClass} text-right! w-[1%]`}>{t('table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className={`${tdClass} text-center`}>{t('table.loading')}</td></tr>
              ) : tenants.length === 0 ? (
                <tr><td colSpan="5" className={`${tdClass} text-center text-text-muted p-10`}>{t('tenants.noTenants')}</td></tr>
              ) : (
                (() => {
                  const groupedTenants = tenants.reduce((acc, tenantItem) => {
                    const f = tenantItem.flat || 'Unknown';
                    if (!acc[f]) acc[f] = [];
                    acc[f].push(tenantItem);
                    return acc;
                  }, {});
                  
                  return Object.entries(groupedTenants)
                    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                    .map(([flatKey, flatTenants]) => (
                      <React.Fragment key={flatKey}>
                        <tr className="bg-body border-b border-border">
                          <td colSpan="5" className="px-5 py-2.5 text-[0.8rem] text-text-secondary font-bold uppercase tracking-[0.05em] bg-card-solid">
                            Flat: <span className="text-accent ml-1 underline decoration-accent/30 underline-offset-[3px]">{flatKey}</span>
                          </td>
                        </tr>
                        {flatTenants.sort((a,b) => a.status === 'active' ? -1 : 1).map(tenantItem => (
                          <tr key={tenantItem.id} onClick={() => navigate({ to: `/tenants/${tenantItem.id}` })} className={`cursor-pointer transition-colors duration-150 hover:bg-hover [&:last-child_td]:border-b-0 ${tenantItem.status !== 'active' ? 'opacity-60 saturate-50' : ''}`}>
                            <td className={`${tdClass} font-semibold`} data-label={t('table.name')}>
                              <div className="flex items-center gap-3">
                                {tenantItem.photo_url ? (
                                  <img
                                    src={tenantItem.photo_url}
                                    alt="Profile"
                                    className="w-[34px] h-[34px] rounded-full object-cover cursor-pointer border border-border shadow-sm"
                                    onClick={(e) => { e.stopPropagation(); setViewPhotoUrl(tenantItem.photo_url); }}
                                  />
                                ) : (
                                  <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-bold ${tenantItem.status === 'active' ? 'bg-accent-glow text-accent border border-accent/20' : 'bg-input text-text-muted border border-border'}`}>
                                    {tenantItem.name.charAt(0)}
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span>{tenantItem.name}</span>
                                  {tenantItem.status !== 'active' && <span className="text-[0.65rem] text-red-600 bg-red-bg uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-sm self-start mt-0.5">{t('forms.statusLeft')}</span>}
                                </div>
                              </div>
                            </td>
                            <td className={tdClass} data-label={t('table.flat')}>
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase tracking-[0.03em] ${tenantItem.status === 'active' ? 'bg-green-bg text-green' : 'bg-body text-text-muted'}`}>{t(FLAT_OPTIONS.find(opt => opt.id === tenantItem.flat)?.labelKey) || tenantItem.flat}</span>
                            </td>
                            <td className={tdClass} data-label={t('table.monthlyRent')}>{formatCurrency(tenantItem.monthly_rent)}</td>
                            <td className={`${tdClass} font-semibold`} data-label={t('table.due')}>
                              {(() => {
                                const totalDue = (tenantItem.monthly_records || []).reduce((sum, r) => sum + (r.due || 0), 0);
                                return totalDue > 0 ? (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase tracking-[0.03em] bg-red-bg text-red">{formatCurrency(totalDue)}</span>
                                ) : (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[0.72rem] font-semibold uppercase tracking-[0.03em] bg-green-bg text-green">0</span>
                                );
                              })()}
                            </td>
                            <td className={`${tdClass} text-right! w-[1%]`} data-label={t('table.actions')}>
                              <div className="flex gap-1.5 justify-end">
                                <button className="inline-flex items-center gap-2 px-2.5 py-1.5 border border-border rounded-[6px] bg-transparent text-text-secondary text-[0.78rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap hover:border-accent hover:text-accent hover:bg-accent-glow" onClick={(e) => { e.stopPropagation(); navigate({ to: `/tenants/${tenantItem.id}` }); }} title={t('actions.view')}><Eye size={16} /></button>
                                <button className="inline-flex items-center gap-2 px-2.5 py-1.5 border border-border rounded-[6px] bg-transparent text-text-secondary text-[0.78rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap hover:border-accent hover:text-accent hover:bg-accent-glow" onClick={(e) => { e.stopPropagation(); handleOpenEdit(tenantItem); }}>{t('actions.edit')}</button>
                                <button className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] bg-red text-white text-[0.78rem] font-semibold cursor-pointer transition-all duration-200 whitespace-nowrap border-none hover:bg-[#dc2626]" onClick={(e) => { e.stopPropagation(); confirmDelete(tenantItem); }}>{t('actions.delete')}</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ));
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ====== ADD / EDIT TENANT MODAL ====== */}
      <Modal
        isOpen={isTenantModalOpen}
        onClose={() => setTenantModalOpen(false)}
        title={editTenantData ? t('tenants.editTenant') : t('tenants.addTenant')}
        isExtraWide
      >
        <form onSubmit={handleFormSubmit} className="p-6">

          {/* Section 1: Personal Info */}
          <div className="bg-body border border-border rounded-md p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-[0.88rem] font-bold text-text-primary uppercase tracking-[0.04em] [&_svg]:text-accent">
                <User size={18} />
                {t('forms.personalInfo')}
              </div>
            </div>
            <div className="mb-4 flex-1">
              <label className={labelClass}>{t('forms.fullName')}</label>
              <input type="text" className={inputClass} required placeholder={t('forms.placeholderName')} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex gap-4 max-md:flex-col max-md:gap-0">
              <div className="mb-4 flex-1">
                <label className={labelClass}>{t('forms.flatRoom')}</label>
                <select className={inputClass} required value={flat} onChange={e => setFlat(e.target.value)}>
                  <option value="" disabled>{t('forms.placeholderFlat')}</option>
                  {FLAT_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4 flex-1">
                <label className={labelClass}>{t('table.monthlyRent')}</label>
                <input type="number" className={inputClass} required min="0" step="1" placeholder={t('forms.placeholderRent')} value={rent} onChange={e => setRent(e.target.value)} />
              </div>
            </div>
            <div className="mb-4">
              <label className={labelClass}>{t('forms.status') || 'Tenant Status'}</label>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">{t('forms.statusActive')}</option>
                <option value="left">{t('forms.statusLeft')}</option>
              </select>
            </div>
          </div>

          {/* Section 2: Uploads */}
          <div className="bg-body border border-border rounded-md p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-[0.88rem] font-bold text-text-primary uppercase tracking-[0.04em] [&_svg]:text-accent">
                <Upload size={18} />
                {t('forms.uploadsSection')}
              </div>
              {uploading && <span className="px-2.5 py-0.5 rounded-full bg-accent-glow text-accent-hover text-[0.72rem] font-semibold">{t('forms.uploading')}</span>}
            </div>
            <div className="flex gap-4 max-md:flex-col max-md:gap-0">
              <div className="mb-4 flex-1">
                <label className={labelClass}>{t('forms.photo')}</label>
                {photoUrl && (
                  <div className="flex items-center gap-4 mb-3">
                    <img src={photoUrl} alt="Tenant" className="w-[72px] h-[72px] rounded-full object-cover border-2 border-border shadow-sm" />
                    <div className="text-[0.82rem] text-text-secondary">
                      <strong className="block text-text-primary text-[0.88rem] mb-0.5">{name || t('forms.photo')}</strong>
                      {t('forms.changePhoto')}
                    </div>
                  </div>
                )}
                <div className="relative flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-border rounded-md cursor-pointer transition-[border-color,background] duration-200 text-center hover:border-accent hover:bg-[rgba(99,102,241,0.04)]">
                  <div className="w-10 h-10 rounded-full bg-accent-glow flex items-center justify-center text-accent"><Camera size={20} /></div>
                  <div className="text-[0.82rem] text-text-muted"><span className="text-accent-hover font-semibold">{t('forms.uploadPhoto')}</span></div>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
              <div className="mb-4 flex-1">
                <label className={labelClass}>{t('forms.documents')}</label>
                <div className="relative flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-border rounded-md cursor-pointer transition-[border-color,background] duration-200 text-center hover:border-accent hover:bg-[rgba(99,102,241,0.04)]">
                  <div className="w-10 h-10 rounded-full bg-accent-glow flex items-center justify-center text-accent"><FileUp size={20} /></div>
                  <div className="text-[0.82rem] text-text-muted"><span className="text-accent-hover font-semibold">{t('forms.uploadDoc')}</span></div>
                  <input type="file" onChange={handleDocUpload} disabled={uploading} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                {documents.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {documents.map((doc, i) => (
                      <a key={i} href={doc.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-input border border-border rounded-full text-[0.78rem] font-medium text-text-secondary transition-[border-color] duration-200 hover:border-accent hover:text-accent-hover [&_svg]:text-accent [&_svg]:shrink-0">
                        <FileText size={14} />
                        {doc.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Family Members */}
          <div className="bg-body border border-border rounded-md p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-[0.88rem] font-bold text-text-primary uppercase tracking-[0.04em] [&_svg]:text-accent">
                <Users size={18} />
                {t('forms.familySection')}
                {familyMembers.length > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-accent-glow text-accent-hover text-[0.72rem] font-bold">{familyMembers.length}</span>
                )}
              </div>
              <button type="button" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-dashed border-accent rounded-sm bg-transparent text-accent-hover font-sans text-[0.8rem] font-semibold cursor-pointer transition-all duration-200 hover:bg-accent-glow hover:border-solid" onClick={addFamilyMember}>
                <UserPlus size={15} />
                {t('forms.addFamilyMember')}
              </button>
            </div>

            {familyMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-7.5 px-5 border-2 border-dashed border-border rounded-md text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-accent-glow flex items-center justify-center text-accent"><Users size={24} /></div>
                <p className="text-text-muted text-[0.88rem] m-0">{t('forms.noFamilyMembers')}</p>
                <button type="button" className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-dashed border-accent rounded-sm bg-transparent text-accent-hover font-sans text-[0.8rem] font-semibold cursor-pointer transition-all duration-200 hover:bg-accent-glow hover:border-solid" onClick={addFamilyMember}>
                  <UserPlus size={15} />
                  {t('forms.addFirstMember')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {familyMembers.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-3.5 py-3 bg-card-solid border border-border rounded-sm transition-[border-color,box-shadow] duration-200 animate-family-slide-in hover:border-[rgba(99,102,241,0.3)] hover:shadow-[0_0_0_1px_rgba(99,102,241,0.1)]">
                    <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-accent to-[#a855f7] flex items-center justify-center text-white font-bold text-[0.82rem] shrink-0 uppercase">
                      {member.name ? member.name.charAt(0) : (idx + 1)}
                    </div>
                    <div className="flex flex-1 gap-2.5">
                      <div className="flex-1">
                        <input type="text" className={inputSmClass} placeholder={t('forms.memberName')} value={member.name} onChange={(e) => updateFamilyMember(idx, 'name', e.target.value)} required />
                      </div>
                      <div className="flex-1">
                        <input type="text" className={inputSmClass} placeholder={t('forms.memberRelation')} value={member.relation} onChange={(e) => updateFamilyMember(idx, 'relation', e.target.value)} required />
                      </div>
                      <div className="max-w-[80px]">
                        <input type="text" className={inputSmClass} placeholder={t('forms.placeholderAge')} value={member.age || ''} onChange={(e) => updateFamilyMember(idx, 'age', e.target.value)} />
                      </div>
                    </div>
                    <button type="button" className="inline-flex items-center justify-center w-[34px] h-[34px] border border-transparent rounded-sm bg-transparent text-text-muted cursor-pointer transition-all duration-200 shrink-0 hover:bg-red-bg hover:border-[rgba(239,68,68,0.3)] hover:text-red" onClick={() => removeFamilyMember(idx)} title={t('forms.remove')}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-4">
            <button type="button" className={btnGhost} onClick={() => setTenantModalOpen(false)}>{t('actions.cancel')}</button>
            <button type="submit" className={btnPrimary} disabled={uploading}>{t('actions.saveTenant')}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title={t('modals.confirmDelete')} isSmall>
        <div className="p-6">
          <p>{t('modals.deleteTenantMsg')}</p>
        </div>
        <div className="flex justify-end gap-2.5 px-6 pb-6">
          <button className={btnGhost} onClick={() => setDeleteModalOpen(false)}>{t('actions.cancel')}</button>
          <button className={btnDanger} onClick={executeDelete}>{t('actions.delete')}</button>
        </div>
      </Modal>

      {/* Photo Modal */}
      <Modal isOpen={!!viewPhotoUrl} onClose={() => setViewPhotoUrl(null)} title={t('forms.photo')} isWide>
        <div className="text-center py-5 px-6">
          {viewPhotoUrl && <img src={viewPhotoUrl} alt="Large Profile" className="max-w-full max-h-[600px] rounded-lg object-contain mx-auto" />}
        </div>
      </Modal>

      {/* Removed heavy Tenant Profile View Modal, outsourced to TenantDetails route */}
    </section>
  );
}
