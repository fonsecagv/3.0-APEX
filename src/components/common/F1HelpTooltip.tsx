import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, ShieldAlert, CheckCircle2, Info } from 'lucide-react';

export type TooltipPosition = 'top' | 'top-right' | 'top-left' | 'bottom' | 'bottom-right' | 'bottom-left' | 'left' | 'right';

export interface F1HelpTooltipProps {
  title: string;
  ruleCode?: string;
  badge?: string;
  badgeType?: 'warning' | 'success' | 'neutral' | 'danger';
  description: string;
  warning?: string;
  details?: string[];
  position?: TooltipPosition;
  className?: string;
  size?: 'sm' | 'md';
}

export const F1HelpTooltip: React.FC<F1HelpTooltipProps> = ({
  title,
  ruleCode,
  badge,
  badgeType = 'neutral',
  description,
  warning,
  details,
  position = 'top-right',
  className = '',
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle Mouse Enter: trigger after 1 second (1000ms)
  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 1000);
  };

  // Handle Mouse Leave: cancel timer and close
  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    // Small delay before closing to allow user to move cursor onto panel if needed
    hoverTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  // Handle Click: toggle immediately
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsOpen(prev => !prev);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const badgeColors = {
    warning: 'bg-amber-950/60 border-amber-600/40 text-amber-300',
    danger: 'bg-red-950/60 border-red-600/40 text-red-300',
    success: 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300',
    neutral: 'bg-white/10 border-white/15 text-zinc-300'
  };

  const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    'top-right': 'bottom-full right-0 mb-2',
    'top-left': 'bottom-full left-0 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    'bottom-right': 'top-full right-0 mt-2',
    'bottom-left': 'top-full left-0 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center shrink-0 ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Help Question Mark Button */}
      <span
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(prev => !prev);
          }
        }}
        className={`inline-flex items-center justify-center font-f1-mono font-bold transition-all select-none cursor-pointer ${
          size === 'sm' ? 'w-4 h-4 text-[10px]' : 'w-4 h-4 sm:w-5 sm:h-5 text-[11px]'
        } bg-[#181822] hover:bg-[#222230] border border-[#3C3C4A] hover:border-[#6C6C7D] text-[#8E8E9E] hover:text-[#D1D1DE] rounded-none shadow-sm`}
        title="Ajuda e Explicação de Regras"
        aria-label="Ajuda e Explicação de Regras"
      >
        ?
      </span>

      {/* Floating Explanation Popover Panel */}
      {isOpen && (
        <div
          onClick={e => e.stopPropagation()}
          className={`absolute ${positionClasses[position]} z-50 w-72 sm:w-84 max-w-[90vw] bg-[#1A1A26] border border-[#3A3A4C] shadow-2xl p-4 text-left select-text animate-in fade-in zoom-in-95 duration-150 f1-container-frame`}
          style={{
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.08)'
          }}
        >
          {/* F1 Red Accent Line on Top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#E10600] via-[#E10600] to-transparent" />

          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2 mb-2.5">
            <div>
              {ruleCode && (
                <span className="block text-[9px] font-f1-mono text-[#E10600] font-bold tracking-wider uppercase">
                  {ruleCode}
                </span>
              )}
              <h4 className="font-f1-wide font-black text-xs text-white uppercase tracking-wider leading-snug">
                {title}
              </h4>
            </div>

            <span
              role="button"
              tabIndex={0}
              onClick={e => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  setIsOpen(false);
                }
              }}
              className="p-1 text-zinc-500 hover:text-white transition-colors shrink-0 cursor-pointer select-none inline-flex items-center justify-center"
              title="Fechar"
              aria-label="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Badge Tag if present */}
          {badge && (
            <div className="mb-2.5">
              <span className={`inline-block px-2 py-0.5 text-[9px] font-f1-mono font-bold uppercase border ${badgeColors[badgeType]}`}>
                {badge}
              </span>
            </div>
          )}

          {/* Main Description */}
          <p className="text-xs text-zinc-300 font-light leading-relaxed">
            {description}
          </p>

          {/* Warning / Critical Rule Highlight */}
          {warning && (
            <div className="mt-2.5 p-2 bg-[#14141E] border-l-2 border-[#E10600] text-[10px] font-f1-mono text-zinc-300 leading-normal">
              {warning}
            </div>
          )}

          {/* Bulleted Details */}
          {details && details.length > 0 && (
            <ul className="mt-2 space-y-1 border-t border-white/5 pt-2 text-[10px] font-f1-mono text-zinc-400">
              {details.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-[#E10600]">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Footer note */}
          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[9px] font-f1-mono text-zinc-500">
            <span>DIRETRIZ OFICIAL FIA 2026</span>
            <span>Clique fora para fechar</span>
          </div>
        </div>
      )}
    </div>
  );
};
