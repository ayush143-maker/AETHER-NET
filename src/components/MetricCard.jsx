import { useEffect, useState } from 'react';

/**
 * High-fidelity telemetry metric card with animated counter
 * Cyberpunk aesthetic with color-coded severity
 */
export default function MetricCard({ 
  title, 
  value, 
  unit, 
  icon, 
  color = 'cyan', 
  subtitle, 
  trend = 'stable' 
}) {
  const [displayValue, setDisplayValue] = useState(0);
  
  // Animate counter from 0 to target
  useEffect(() => {
    if (typeof value !== 'number' || isNaN(value)) return;
    
    const duration = 1200;
    const steps = 48;
    const interval = duration / steps;
    let step = 0;
    
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      
      if (step >= steps) {
        clearInterval(timer);
        setDisplayValue(value);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [value]);
  
  const themeMap = {
    cyan: {
      border: 'border-cyan-500/40',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-500/20',
      gradient: 'from-cyan-500/20',
      pulseColor: 'bg-cyan-400',
    },
    green: {
      border: 'border-green-500/40',
      text: 'text-green-400',
      glow: 'shadow-green-500/20',
      gradient: 'from-green-500/20',
      pulseColor: 'bg-green-400',
    },
    magenta: {
      border: 'border-fuchsia-500/40',
      text: 'text-fuchsia-400',
      glow: 'shadow-fuchsia-500/20',
      gradient: 'from-fuchsia-500/20',
      pulseColor: 'bg-fuchsia-400',
    },
    yellow: {
      border: 'border-yellow-500/40',
      text: 'text-yellow-400',
      glow: 'shadow-yellow-500/20',
      gradient: 'from-yellow-500/20',
      pulseColor: 'bg-yellow-400',
    },
  };
  
  const theme = themeMap[color] || themeMap.cyan;
  
  const trendIcon = {
    up: '▲',
    down: '▼',
    stable: '●',
  };
  
  const trendColor = {
    up: 'text-green-400',
    down: 'text-red-400',
    stable: 'text-gray-400',
  };
  
  return (
    <div className={`
      relative overflow-hidden rounded-lg border ${theme.border} 
      bg-gradient-to-br from-black/90 to-cyber-slate/90 
      backdrop-blur-sm p-4 md:p-5
      shadow-lg ${theme.glow}
      transition-all duration-300 hover:scale-[1.02] hover:shadow-xl
    `}>
      {/* Corner accent */}
      <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl ${theme.gradient} to-transparent opacity-30`} />
      
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className={`text-2xl ${theme.text}`}>{icon}</div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${theme.pulseColor} animate-pulse`} />
          <span className={`text-[10px] font-mono tracking-widest ${theme.text} uppercase`}>
            {title}
          </span>
        </div>
      </div>
      
      {/* Value */}
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className={`text-2xl md:text-3xl font-bold ${theme.text} font-mono tabular-nums`}>
          {displayValue.toLocaleString()}
        </span>
        <span className="text-xs text-gray-500 font-mono">{unit}</span>
      </div>
      
      {/* Subtitle + trend */}
      <div className="flex items-center justify-between">
        {subtitle && (
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wide">
            {subtitle}
          </span>
        )}
        <span className={`text-xs ${trendColor[trend]}`}>
          {trendIcon[trend]}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="mt-3 h-[2px] bg-gray-800/50 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-gradient-to-r ${theme.gradient} to-transparent`}
          style={{ width: `${Math.min(100, (displayValue / 1000) * 100)}%` }}
        />
      </div>
    </div>
  );
}
