import React, { useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Reusable Modal component for displaying dialogs and overlays.
 * Handles keyboard and click-outside interactions for accessibility.
 */
interface ModalProps {
  /**
   * Props for the Modal component.
   * @property open - Whether the modal is open.
   * @property onClose - Handler to close the modal.
   * @property children - Modal content.
   * @property className - Additional class names for modal styling.
   * @property overlayClassName - Additional class names for overlay styling.
   */
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, children, className = '', overlayClassName = '' }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const theme = useContext(ThemeContext);
  const isDark = theme?.mode === 'dark';

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    // Initial focus
    setTimeout(() => {
      if (modalRef.current) {
        const focusable = modalRef.current.querySelector<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) focusable.focus();
        else modalRef.current.focus();
      }
    }, 0);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // Try to find a heading in children for aria-labelledby
  // (If not found, fallback to aria-label="Dialog")
  let labelledbyId: string | undefined;
  let ariaLabel: string | undefined = 'Dialog';
  React.Children.forEach(children, child => {
    if (React.isValidElement(child) && (child.type === 'h1' || child.type === 'h2' || child.type === 'h3')) {
      if (child.props.id) labelledbyId = child.props.id;
      else if (child.props.children) {
        labelledbyId = 'modal-heading-auto';
        ariaLabel = undefined;
      }
    }
  });

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 ${overlayClassName}`}
      onClick={onClose}
      style={{ pointerEvents: 'auto' }}
      aria-modal="true"
      role="dialog"
      {...(labelledbyId ? { 'aria-labelledby': labelledbyId } : { 'aria-label': ariaLabel })}
    >
      <div
        ref={modalRef}
        className={`relative rounded-xl shadow-2xl border p-6 transition-all duration-300 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-200'
        } ${className}`}
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
      >
        {labelledbyId === 'modal-heading-auto' ? (
          <h2 id="modal-heading-auto">{ariaLabel}</h2>
        ) : null}
        {children}
      </div>
    </div>
  );
};

export default React.memo(Modal); 