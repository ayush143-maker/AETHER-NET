import { useMemo } from 'react';
import MetricCard from '../components/MetricCard';

/**
 * Analytics view — three signal stats + a clean hop table.
 */
export default function ThreatAnalytics({ routingHops }) {
  const hops = routingHops?.hops || [];

  const metrics = useMemo(
    () => ({
      loss: (Math.random() * 1.2).toFixed(2),
      jitter: (Math.random() * 9 + 2).toFixed(1),
      health: Math.floor(92 + Math.random() * 8),
    }),
    [routingHops]
  );

  if (!hops.length) {
    return (
      <div className="flex h-full min-h-[300px] items-center justify-center p-6 text-center text-xs text-emerald-800">
        no active trace — run a query from the uplink
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-3 divide-x divide-emerald-500/10 border-b border-emerald-500/10">
        <MetricCard label="packet loss" value={metrics.loss} unit="%" />
        <MetricCard label="jitter" value={metrics.jitter} unit="ms" />
        <MetricCard label="health" value={metrics.health} unit="%" />
      </div>

      <div className="flex-1 overflow-auto p-4">
        <table className="w-full text-left text-[11px] md:text-xs">
          <thead>
            <tr className="text-[9px] uppercase tracking-[0.25em] text-emerald-800">
              <th className="pb-2 pr-2 font-normal">hop</th>
              <th className="w-full max-w-0 pb-2 pr-2 font-normal">node</th>
              <th className="pb-2 text-right font-normal">rtt</th>
            </tr>
          </thead>
          <tbody className="text-emerald-400/90">
            {hops.map((h) => (
              <tr key={h.hop} className="border-t border-emerald-500/10">
                <td className="py-2 pr-2 text-emerald-800">
                  {String(h.hop).padStart(2, '0')}
                </td>
                <td className="w-full max-w-0 truncate py-2 pr-2">{h.name}</td>
                <td className="py-2 text-right tabular-nums">{h.latency}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
