import { useEffect, useRef } from 'react';

/**
 * Phosphor terminal — auto-scrolls, fixed timestamps per entry.
 * Logs are objects: { t: 'hh:mm:ss.mmm', m: 'message' }
 */
export default function TerminalConsole({ logs = [], status = 'IDLE' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [logs.length]);

  const lineClass = (m) => {
    if (m.startsWith('✓')) return 'text-emerald-300 glow';
    if (m.startsWith('!')) return 'text-emerald-100 underline decoration-emerald-500/60';
    return 'text-emerald-500/90';
  };

  return (
    <div className="flex h-full min-h-[240px] flex-col border border-emerald-500/20 bg-black">
      {/* header */}
      <div className="flex items-center justify-between border-b border-emerald-500/20 px-3 py-1.5 text-[10px] text-emerald-600">
        <span>aether@net:~$</span>
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === 'IDLE'
                ? 'bg-emerald-900'
                : status === 'ERROR'
                ? 'bg-emerald-100'
                : 'animate-pulse bg-emerald-400'
            }`}
          />
          {status}
        </span>
      </div>

      {/* stream */}
      <div
        ref={ref}
        className="flex-1 space-y-0.5 overflow-y-auto p-3 text-[11px] leading-relaxed md:text-xs"
      >
        {logs.length === 0 ? (
          <div className="pt-10 text-center text-emerald-800">
            idle — awaiting target<span className="animate-blink">▊</span>
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="fade-up flex gap-2">
              <span className="shrink-0 select-none text-emerald-900">[{log.t}]</span>
              <span className={`break-words ${lineClass(log.m)}`}>{log.m}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
