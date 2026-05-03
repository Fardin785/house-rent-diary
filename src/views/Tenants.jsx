import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, User, Upload, Users, Camera, FileUp, UserPlus } from 'lucide-react';
import Modal from '../components/Modal';
import { fetchTenants, addTenant, updateTenant, deleteTenant, uploadTenantAsset } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';

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
  const [viewTenantData, setViewTenantData] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [flat, setFlat] = useState('');
  const [rent, setRent] = useState('');
  
  // Extended Fields
  const [photoUrl, setPhotoUrl] = useState('');
  const [documents, setDocuments] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
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

  useEffect(() => {
    loadData();
  }, [showToast]);

  const handleOpenAdd = () => {
    setEditTenantData(null);
    setName('');
    setFlat('');
    setRent('');
    setPhotoUrl('');
    setDocuments([]);
    setFamilyMembers([]);
    setTenantModalOpen(true);
  };

  const handleOpenEdit = (tData) => {
    setEditTenantData(tData);
    setName(tData.name);
    setFlat(tData.flat);
    setRent(tData.monthly_rent);
    setPhotoUrl(tData.photo_url || '');
    setDocuments(tData.documents || []);
    setFamilyMembers(tData.family_members || []);
    setTenantModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const data = { 
      name: name.trim(), 
      flat: flat.trim(), 
      monthly_rent: parseFloat(rent),
      photo_url: photoUrl,
      documents,
      family_members: familyMembers
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

  const confirmDelete = (tData) => {
    setDeleteTenantId(tData.id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTenantId) return;
    try {
      await deleteTenant(deleteTenantId);
      showToast(t('toast.tenantDeleted'), 'success');
      setDeleteModalOpen(false);
      loadData();
    } catch (err) {
      showToast(t('toast.errorLoading') + ': ' + err.message, 'error');
    }
  };

  // Upload Handlers
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

  // Dynamic Members Handlers
  const addFamilyMember = () => setFamilyMembers([...familyMembers, { name: '', relation: '', age: '' }]);
  
  const updateFamilyMember = (index, field, value) => {
    const updated = [...familyMembers];
    updated[index][field] = value;
    setFamilyMembers(updated);
  };

  const removeFamilyMember = (index) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  return (
    <section className="view active">
      <div className="view-header">
        <div>
          <h1>{t('tenants.title')}</h1>
          <p className="view-subtitle">{t('tenants.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          {t('tenants.addTenant')}
        </button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('table.name')}</th>
                  <th>{t('table.flat')}</th>
                  <th>{t('table.monthlyRent')}</th>
                  <th className="text-right">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="text-center">{t('table.loading')}</td></tr>
                ) : tenants.length === 0 ? (
                  <tr><td colSpan="4" className="text-center" style={{ color: 'var(--text-muted)', padding: '40px' }}>{t('tenants.noTenants')}</td></tr>
                ) : (
                  tenants.map(tenantItem => (
                    <tr key={tenantItem.id} onClick={() => setViewTenantData(tenantItem)} style={{cursor: 'pointer'}} className="tenant-row">
                      <td className="fw-600">
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                          {tenantItem.photo_url ? (
                            <img 
                              src={tenantItem.photo_url} 
                              alt="Profile" 
                              style={{width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', border: '1px solid #e5e7eb'}} 
                              onClick={(e) => { e.stopPropagation(); setViewPhotoUrl(tenantItem.photo_url); }}
                            />
                          ) : (
                            <div style={{width: '32px', height: '32px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#9ca3af'}}>
                              {tenantItem.name.charAt(0)}
                            </div>
                          )}
                          {tenantItem.name}
                        </div>
                      </td>
                      <td><span className="badge badge--paid">{tenantItem.flat}</span></td>
                      <td>{formatCurrency(tenantItem.monthly_rent)}</td>
                      <td className="text-right">
                        <div className="action-btns">
                          <button className="btn btn-outline btn-sm" onClick={(e) => { e.stopPropagation(); handleOpenEdit(tenantItem); }}>{t('actions.edit')}</button>
                          <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); confirmDelete(tenantItem); }}>{t('actions.delete')}</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ====== ADD / EDIT TENANT MODAL ====== */}
      <Modal 
        isOpen={isTenantModalOpen} 
        onClose={() => setTenantModalOpen(false)}
        title={editTenantData ? t('tenants.editTenant') : t('tenants.addTenant')}
        isExtraWide
      >
        <form onSubmit={handleFormSubmit} className="modal-body">

          {/* ── Section 1: Personal Info ── */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-title">
                <User size={18} />
                {t('forms.personalInfo')}
              </div>
            </div>
            <div className="form-group">
              <label>{t('forms.fullName')}</label>
              <input type="text" className="input" required placeholder={t('forms.placeholderName')} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('forms.flatRoom')}</label>
                <input type="text" className="input" required placeholder={t('forms.placeholderFlat')} value={flat} onChange={e => setFlat(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t('table.monthlyRent')}</label>
                <input type="number" className="input" required min="0" step="1" placeholder={t('forms.placeholderRent')} value={rent} onChange={e => setRent(e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Section 2: Uploads ── */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-title">
                <Upload size={18} />
                {t('forms.uploadsSection')}
              </div>
              {uploading && <span className="badge" style={{background: 'var(--accent-glow)', color: 'var(--accent-hover)', fontSize: '0.72rem'}}>{t('forms.uploading')}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>{t('forms.photo')}</label>
                {photoUrl && (
                  <div className="photo-preview">
                    <img src={photoUrl} alt="Tenant" />
                    <div className="photo-preview-info">
                      <strong>{name || t('forms.photo')}</strong>
                      {t('forms.changePhoto')}
                    </div>
                  </div>
                )}
                <div className="upload-zone">
                  <div className="upload-zone-icon"><Camera size={20} /></div>
                  <div className="upload-zone-text"><span>{t('forms.uploadPhoto')}</span></div>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
                </div>
              </div>
              <div className="form-group">
                <label>{t('forms.documents')}</label>
                <div className="upload-zone">
                  <div className="upload-zone-icon"><FileUp size={20} /></div>
                  <div className="upload-zone-text"><span>{t('forms.uploadDoc')}</span></div>
                  <input type="file" onChange={handleDocUpload} disabled={uploading} />
                </div>
                {documents.length > 0 && (
                  <div className="doc-list">
                    {documents.map((doc, i) => (
                      <a key={i} href={doc.url} target="_blank" rel="noreferrer" className="doc-chip">
                        <FileText size={14} />
                        {doc.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Section 3: Family Members ── */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-title">
                <Users size={18} />
                {t('forms.familySection')}
                {familyMembers.length > 0 && <span className="section-count">{familyMembers.length}</span>}
              </div>
              <button type="button" className="btn-add-member" onClick={addFamilyMember}>
                <UserPlus size={15} />
                {t('forms.addFamilyMember')}
              </button>
            </div>

            {familyMembers.length === 0 ? (
              <div className="family-empty">
                <div className="family-empty-icon"><Users size={24} /></div>
                <p>{t('forms.noFamilyMembers')}</p>
                <button type="button" className="btn-add-member" onClick={addFamilyMember}>
                  <UserPlus size={15} />
                  {t('forms.addFirstMember')}
                </button>
              </div>
            ) : (
              <div className="family-cards-grid">
                {familyMembers.map((member, idx) => (
                  <div key={idx} className="family-card">
                    <div className="family-avatar">
                      {member.name ? member.name.charAt(0) : (idx + 1)}
                    </div>
                    <div className="family-card-inputs">
                      <div className="form-group">
                        <input type="text" className="input input-sm" placeholder={t('forms.memberName')} value={member.name} onChange={(e) => updateFamilyMember(idx, 'name', e.target.value)} required />
                      </div>
                      <div className="form-group">
                        <input type="text" className="input input-sm" placeholder={t('forms.memberRelation')} value={member.relation} onChange={(e) => updateFamilyMember(idx, 'relation', e.target.value)} required />
                      </div>
                      <div className="form-group" style={{maxWidth: '80px'}}>
                        <input type="text" className="input input-sm" placeholder={t('forms.placeholderAge')} value={member.age || ''} onChange={(e) => updateFamilyMember(idx, 'age', e.target.value)} />
                      </div>
                    </div>
                    <button type="button" className="btn-remove" onClick={() => removeFamilyMember(idx)} title={t('forms.remove')}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setTenantModalOpen(false)}>{t('actions.cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={uploading}>{t('actions.saveTenant')}</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={t('modals.confirmDelete')}
        isSmall
      >
        <div className="modal-body">
          <p>{t('modals.deleteTenantMsg')}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setDeleteModalOpen(false)}>{t('actions.cancel')}</button>
          <button className="btn btn-danger" onClick={executeDelete}>{t('actions.delete')}</button>
        </div>
      </Modal>

      <Modal
        isOpen={!!viewPhotoUrl}
        onClose={() => setViewPhotoUrl(null)}
        title={t('forms.photo')}
        isWide
      >
        <div className="modal-body" style={{textAlign: 'center', padding: '20px 0'}}>
          {viewPhotoUrl && <img src={viewPhotoUrl} alt="Large Profile" style={{maxWidth: '100%', maxHeight: '600px', borderRadius: '8px', objectFit: 'contain'}} />}
        </div>
      </Modal>

      {/* Tenant Profile View Modal */}
      <Modal
        isOpen={!!viewTenantData}
        onClose={() => setViewTenantData(null)}
        title={t('tenants.viewProfile')}
        isWide
      >
        {viewTenantData && (
          <div className="modal-body" style={{paddingTop: 0}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',marginBlock:'20px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '20px'}}>
                {viewTenantData.photo_url ? (
                  <img src={viewTenantData.photo_url} alt="Profile" style={{width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb'}} />
                ) : (
                  <div style={{width: '90px', height: '90px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#9ca3af', fontWeight: 600}}>
                    {viewTenantData.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h2 style={{margin: '0 0 5px 0', fontSize: '24px', fontWeight: 700}}>{viewTenantData.name}</h2>
                  <div style={{color: '#6b7280', fontSize: '15px', display: 'flex', gap: '15px'}}>
                    <span><strong>{t('table.flat')}:</strong> {viewTenantData.flat}</span>
                    <span><strong>{t('table.monthlyRent')}:</strong> {formatCurrency(viewTenantData.monthly_rent)}</span>
                  </div>
                </div>
              </div>

              {/* Documents Top Right Header */}
              {viewTenantData.documents && viewTenantData.documents.length > 0 && (
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '40%'}}>
                  {viewTenantData.documents.map((doc, i) => (
                    <a key={i} href={doc.url} target="_blank" rel="noreferrer" title={doc.name} className="btn btn-outline" style={{padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                      <FileText size={18} className="text-primary" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div style={{marginBottom: '20px'}}>
              <h3 style={{fontSize: '16px', fontWeight: 600, marginBottom: '15px', color: '#374151'}}>{t('forms.familyMembers')}</h3>
              {viewTenantData.family_members && viewTenantData.family_members.length > 0 ? (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px'}}>
                  {viewTenantData.family_members.map((member, i) => (
                    <div key={i} style={{padding: '12px 15px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span style={{fontWeight: 600, fontSize: '15px', color: '#111827'}}>{member.name}</span>
                      <span style={{color: '#4f46e5', fontSize: '13px', background: '#e0e7ff', padding: '4px 10px', borderRadius: '20px', fontWeight: 500}}>{member.relation}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{color: '#9ca3af', fontStyle: 'italic'}}>{t('tenants.noTenants').split('.')[0]}</p>
              )}
            </div>

            <div className="modal-footer" style={{marginTop: '30px'}}>
              <button type="button" className="btn btn-outline" onClick={() => setViewTenantData(null)}>{t('actions.cancel')}</button>
            </div>
          </div>
        )}
      </Modal>

    </section>
  );
}
