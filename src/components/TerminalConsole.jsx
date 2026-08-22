import { useEffect, useRef, useMemo } from 'react';

/**
 * Cyberpunk Terminal Console
 * Auto-scrolls as logs stream in with flicker + scanline aesthetic
 */
export default function TerminalConsole({ logs = [], status = 'IDLE' }) {
  const scrollRef = useRef(null);
  
  // Auto-scroll on new log entry
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [logs.length]);
  
  const formatTimestamp = useMemo(() => () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const ms = String(now.getMilliseconds()).padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  }, []);
  
  const getLogColor = (log) => {
    const upper = log.toUpperCase();
    if (upper.includes('ERROR') || upper.includes('FAIL')) return 'text-red-400';
    if (upper.includes('SUCCESS') || upper.includes('COMPLETE') || upper.includes('✓')) return 'text-green-400';
    if (upper.includes('WARNING') || upper.includes('⚠')) return 'text-yellow-400';
    if (upper.includes('INITIATING') || upper.includes('ESTABLISHING')) return 'text-cyan-400';
    if (upper.includes('━━━') || upper.includes('───')) return 'text-gray-600';
    return 'text-green-300/90';
  };
  
  return (
    <div className="w-full h-full flex flex-col terminal-panel rounded-lg overflow-hidden relative">
      {/* Scanline overlay */}
      <div className="absolute inset-0 pointer-events-none crt-overlay" />
      
      {/* Terminal header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-green-500/20 bg-black/60 relative z-10">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <div className="text-[10px] text-green-400/80 font-mono tracking-widest">
          root@matrix:~/telemetry$
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${
            status === 'IDLE' ? 'bg-gray-500' :
            status === 'ERROR' ? 'bg-red-500' :
            'bg-green-500 animate-pulse'
          }`} />
          <span className="text-[10px] text-gray-500 font-mono">
            {status}
          </span>
        </div>
      </div>
      
      {/* Terminal body */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 md:p-4 font-mono text-xs md:text-sm relative z-10"
        style={{ 
          minHeight: '300px',
          maxHeight: '600px',
        }}
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-green-600/40">
            <div className="text-4xl mb-3 opacity-50">⟨⟩</div>
            <div className="text-[11px] tracking-widest uppercase">
              Awaiting telemetry stream...
            </div>
            <div className="mt-2 text-[10px] text-green-700/50 animate-pulse">
              Input a target to begin trace
            </div>
          </div>
        ) : (
          <div className="space-y-[2px]">
            {logs.map((log, idx) => (
              <div 
                key={`${idx}-${log}`} 
                className="flex gap-2 animate-fade-in leading-relaxed"
                style={{ animationDelay: `${Math.min(idx * 20, 300)}ms` }}
              >
                <span className="text-cyan-500/70 shrink-0 select-none text-[10px]">
                  [{formatTimestamp()}]
                </span>
                <span className={`${getLogColor(log)} break-words flex-1`}>
                  {log}
                </span>
              </div>
            ))}
            
            {/* Cursor */}
            <div className="flex gap-2 mt-1">
              <span className="text-cyan-500/70 shrink-0 text-[10px]">
                [{formatTimestamp()}]
              </span>
              <span className="text-green-400 animate-blink font-bold">▊</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
