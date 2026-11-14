import React from 'react';

interface F1LogoProps {
  className?: string;
  variant?: 'red' | 'white' | 'black';
  withWordmark?: boolean;
  withChampionship?: boolean;
}

export const F1Logo: React.FC<F1LogoProps> = ({
  className = 'h-6',
  variant = 'red',
  withWordmark = false,
  withChampionship = false
}) => {
  const fillColor = variant === 'red' ? '#E10600' : variant === 'black' ? '#15151E' : '#FFFFFF';
  const textColor = variant === 'black' ? '#15151E' : '#FFFFFF';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official F1 Flying Track Mark */}
      <svg
        viewBox="0 0 100 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto aspect-[100/24]"
      >
        {/* Left 'F' Sweep */}
        <path
          d="M34.8 0L19.2 15.6H8.4L18.6 5.4H0L4.5 0.9L5.4 0H34.8Z"
          fill={fillColor}
        />
        <path
          d="M17.4 17.4L11.7 23.1H0L6.9 16.2L8.1 15H15L17.4 17.4Z"
          fill={fillColor}
        />
        {/* Right '1' Slash and upper connector */}
        <path
          d="M37.5 0H62.4L38.4 24H23.7L47.7 0H37.5Z"
          fill={fillColor}
        />
        <path
          d="M66.6 0H96L72 24H42.6L66.6 0Z"
          fill={fillColor}
        />
      </svg>

      {withWordmark && (
        <span
          className="font-f1-wide font-black text-xs md:text-sm tracking-wider uppercase"
          style={{ color: textColor }}
        >
          Formula 1®
        </span>
      )}

      {withChampionship && (
        <div className="flex flex-col border-l border-white/20 pl-2 leading-none">
          <span className="text-[9px] font-f1-mono font-bold tracking-widest text-zinc-400">FIA WORLD</span>
          <span className="text-[10px] font-f1-wide font-black tracking-wider text-white">CHAMPIONSHIP</span>
        </div>
      )}
    </div>
  );
};

export const F1TabBucket: React.FC<{
  children: React.ReactNode;
  title?: string;
  badge?: string;
  className?: string;
  active?: boolean;
}> = ({ children, title, badge, className = '', active = false }) => {
  return (
    <div className={`relative bg-[#1C1C26] border border-white/10 ${className}`}>
      {/* Red F1 top accent bar */}
      <div className={`h-[3px] w-full ${active ? 'bg-[#E10600]' : 'bg-white/10'}`} />
      
      {title && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#15151E]/60">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3 bg-[#E10600]" />
            <h3 className="font-f1-wide text-xs uppercase tracking-wider text-white font-bold">{title}</h3>
          </div>
          {badge && (
            <span className="font-f1-mono text-[11px] text-zinc-400 tabular-nums">{badge}</span>
          )}
        </div>
      )}
      
      <div className="p-4">{children}</div>
    </div>
  );
};
