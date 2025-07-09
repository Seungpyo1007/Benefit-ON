import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        className={`glass-panel rounded-2xl p-6 relative w-full ${sizeClasses[size]} animate-modalOpen text-white`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-white/20">
          <h2 className="text-xl sm:text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors text-2xl"
            aria-label="닫기"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto pr-2 modal-content-scrollbar">
         {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;