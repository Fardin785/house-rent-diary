import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, isWide = false, isSmall = false, isExtraWide = false }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const maxWidthClass = isExtraWide
    ? 'max-w-[720px]'
    : isWide
      ? 'max-w-[640px]'
      : isSmall
        ? 'max-w-[400px]'
        : 'max-w-[480px]';

  return (
    <div
      className={`fixed inset-0 bg-modal-overlay backdrop-blur-[6px] flex items-center justify-center z-200 p-5 transition-[opacity,visibility] duration-250 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
      onClick={handleOverlayClick}
    >
      <div className={`bg-card-solid border border-border rounded-lg w-full ${maxWidthClass} shadow-lg transition-transform duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2.5'
      }`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h3 className="text-[1.1rem] font-bold">{title}</h3>
          <button
            type="button"
            className="inline-flex items-center justify-center w-10 h-10 border-none bg-transparent text-text-secondary rounded-sm cursor-pointer transition-all duration-200 hover:bg-hover hover:text-text-primary"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
