import { X } from 'lucide-react';
import { ReactNode, useEffect } from 'react';

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

  return (
    <div 
      className={`modal-overlay ${isOpen ? 'open' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className={`modal ${isWide ? 'modal--wide' : ''} ${isSmall ? 'modal--sm' : ''} ${isExtraWide ? 'modal--xl' : ''}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button
            type="button"
            className="btn-icon modal-close"
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
