import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, UploadCloud, Trash2, Download, AlertCircle, Droplet, Flame, Zap, Eye } from 'lucide-react';
import { fetchUtilityDocuments, uploadUtilityDocument, deleteUtilityDocument } from '../lib/supabase';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { formatMonth } from '../lib/utils';

const inputClass = "w-full px-3 py-2 bg-body border border-border rounded-sm text-text-primary font-sans text-[0.88rem] outline-none transition-[border-color,box-shadow] duration-200 focus:border-border-focus focus:shadow-[0_0_0_3px_var(--color-accent-glow)] placeholder:text-text-muted";

export default function UtilityBills() {
  const { t, i18n } = useTranslation();
  const showToast = useToast();

  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Form State
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedType, setSelectedType] = useState('water');
  const [fileToUpload, setFileToUpload] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setIsLoading(true);
    try {
      const data = await fetchUtilityDocuments();
      setDocuments(data || []);
    } catch (err) {
      showToast('Failed to load documents: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileToUpload) return;

    setIsUploading(true);
    try {
      await uploadUtilityDocument(selectedMonth, selectedType, fileToUpload);
      showToast('Document uploaded successfully', 'success');
      setFileToUpload(null);
      // Reset input UI gracefully
      const fileInput = document.getElementById('utility-file-input');
      if (fileInput) fileInput.value = '';
      
      await loadDocuments();
    } catch (error) {
      showToast('Upload failed: ' + error.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id, filePath) => {
    try {
      setDeleteId(id);
      await deleteUtilityDocument(id, filePath);
      showToast('Document deleted successfully', 'success');
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      showToast('Failed to delete document: ' + error.message, 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const getTypeRender = (type) => {
    switch(type) {
      case 'water': return { icon: Droplet, label: t('utility.waterBill'), color: 'text-cyan bg-cyan-bg' };
      case 'gas': return { icon: Flame, label: t('utility.gasBill'), color: 'text-amber bg-amber-bg' };
      case 'electricity': return { icon: Zap, label: t('utility.electricBill'), color: 'text-accent bg-accent-glow' };
      default: return { icon: FileText, label: t('utility.otherBill'), color: 'text-text-muted bg-input' };
    }
  };

  return (
    <div className="animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="text-[1.75rem] font-extrabold tracking-tight max-md:text-[1.4rem]">
          {t('utility.title')}
          {isLoading && <span className="ml-3 text-[0.9rem] text-text-muted font-normal inline-block animate-pulse">Loading...</span>}
        </h1>
        {/* <p className="text-text-muted text-[0.9rem] mt-0.5">
          {t('utility.subtitle')}
        </p> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleUpload} className="bg-card-solid border border-border rounded-lg p-6 shadow-sm sticky top-[90px]">
            <h2 className="text-[1.1rem] font-bold mb-5 flex items-center gap-2">
              <UploadCloud size={20} className="text-accent"/>
              {t('utility.uploadNew')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[0.8rem] font-semibold text-text-muted uppercase tracking-wider mb-2">
                  {t('utility.selectMonth')}
                </label>
                <input 
                  type="month"
                  className={inputClass}
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[0.8rem] font-semibold text-text-muted uppercase tracking-wider mb-2">
                  {t('utility.billType')}
                </label>
                <select 
                  className={`${inputClass} cursor-pointer appearance-none`}
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="water">{t('utility.waterBill')}</option>
                  <option value="gas">{t('utility.gasBill')}</option>
                  <option value="electricity">{t('utility.electricBill')}</option>
                  <option value="other">{t('utility.otherBill')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[0.8rem] font-semibold text-text-muted uppercase tracking-wider mb-2">
                  {t('utility.file')}
                </label>
                <div className="border-2 border-dashed border-border hover:border-accent/50 transition-colors duration-200 rounded-lg p-5 text-center bg-input/50 relative cursor-pointer">
                  <input 
                    id="utility-file-input"
                    type="file" 
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <FileText className="mx-auto text-text-muted mb-2" size={28}/>
                  <p className="text-[0.85rem] font-medium text-text-secondary truncate px-2">
                    {fileToUpload ? fileToUpload.name : t('forms.uploadDoc')}
                  </p>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isUploading || !fileToUpload}
                className="w-full mt-4 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-sm transition-colors text-[0.9rem] flex items-center justify-center gap-2"
              >
                {isUploading ? (
                   <><UploadCloud size={18} className="animate-pulse"/> {t('utility.uploading')}</>
                ) : (
                   <><UploadCloud size={18}/> {t('utility.uploadBtn')}</>
                )}
              </button>

            </div>
          </form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-6">
          
          {isLoading && documents.length === 0 ? null : documents.length === 0 ? (
             <div className="bg-card backdrop-blur-md border border-border rounded-lg p-6 min-h-[400px] flex flex-col items-center justify-center text-center text-text-muted opacity-70">
               <AlertCircle size={40} className="mb-3 opacity-50 block" />
               <p>{t('utility.noDocs')}</p>
             </div>
          ) : (
            <>
              {['water', 'gas', 'electricity', 'other'].map(billType => {
                const groupDocs = documents.filter(d => d.type === billType);
                if (groupDocs.length === 0) return null;
                
                const { icon: TypeIcon, label, color } = getTypeRender(billType);

                return (
                  <div key={billType} className="bg-card backdrop-blur-md border border-border rounded-lg p-6">
                    <h2 className="text-[1.15rem] font-bold mb-5 flex items-center gap-2 pb-3 border-b border-border/50">
                      <div className={`p-1.5 rounded-md ${color}`}><TypeIcon size={18} /></div>
                      {label}
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {groupDocs.map(doc => (
                        <div key={doc.id} className="bg-card-solid border border-border rounded-lg py-2.5 px-4 flex items-center justify-between hover:border-accent/40 transition-colors group">
                           <div className="font-bold text-[1.05rem] tracking-tight text-text-primary">
                              {formatMonth(doc.month, i18n.language)}
                           </div>

                          <div className="flex items-center gap-2">
                            <button 
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="bg-input hover:bg-hover border border-border rounded-sm px-3 py-1.5 text-[0.8rem] font-semibold transition-colors flex items-center justify-center gap-1.5 text-text-primary"
                              title={t('actions.view')}
                            >
                              <Eye size={14}/>
                            </button>
                            <button 
                              onClick={() => {
                                if(window.confirm(i18n.language === 'bn' ? "ডিলিট নিশ্চিত করুন?" : "Confirm Delete?")) {
                                  handleDelete(doc.id, doc.file_path);
                                }
                              }}
                              disabled={deleteId === doc.id}
                              className="px-2.5 bg-red/10 text-red hover:bg-red/20 font-bold rounded-sm border border-transparent transition-colors py-1.5 disabled:opacity-50"
                              title={t('actions.delete')}
                            >
                              <Trash2 size={16}/>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

      </div>

      {previewDoc && (
        <Modal 
          isOpen={!!previewDoc} 
          onClose={() => setPreviewDoc(null)} 
          title={previewDoc.file_name}
          isWide
        >
          <div className="flex flex-col items-center bg-body p-4 max-h-[80vh] overflow-y-auto">
            {previewDoc.file_path.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
              <img src={previewDoc.file_url} alt={previewDoc.file_name} className="max-w-full rounded-md object-contain" />
            ) : (
              <iframe src={previewDoc.file_url} className="w-full h-[60vh] rounded-md border-0 bg-white" title={previewDoc.file_name} />
            )}
            <div className="mt-5 w-full flex justify-end px-2 pb-2">
               <a 
                 href={previewDoc.file_url} 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="bg-accent hover:bg-accent-hover text-white px-5 py-2 rounded-sm text-[0.9rem] font-bold shadow-sm transition-colors flex items-center gap-2"
               >
                  <Download size={16}/> {t('actions.download') || 'Download'}
               </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
