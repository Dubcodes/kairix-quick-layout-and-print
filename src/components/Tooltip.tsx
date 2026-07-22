import { cloneElement, useId, useRef, useState, type FocusEvent, type ReactElement } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  content: string;
  disabled?: boolean;
  className?: string;
  children: ReactElement<{ 'aria-describedby'?: string }>;
}

export function Tooltip({ content, disabled = false, className = '', children }: Props) {
  const id = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0, above: false });
  const [open, setOpen] = useState(false);
  const describedChild = cloneElement(children, { 'aria-describedby': id });
  const show = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const above = window.innerHeight - rect.bottom < 110;
    setPosition({ left: rect.left + rect.width / 2, top: above ? rect.top - 8 : rect.bottom + 8, above });
    setOpen(true);
  };
  const hideAfterBlur = (event: FocusEvent<HTMLSpanElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
  };
  return (
    <span
      ref={anchorRef}
      className={`tooltip-anchor ${className}`}
      tabIndex={disabled ? 0 : undefined}
      aria-describedby={disabled ? id : undefined}
      onMouseEnter={show}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={show}
      onBlurCapture={hideAfterBlur}
    >
      {describedChild}
      {createPortal(
        <span
          className={`tooltip-bubble ${position.above ? 'tooltip-bubble--above' : ''}`}
          id={id}
          role="tooltip"
          data-open={open ? 'true' : 'false'}
          style={{ left: position.left, top: position.top }}
        >
          {content}
        </span>,
        document.body,
      )}
    </span>
  );
}
