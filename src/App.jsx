import { useState } from 'react';
import GlobalMatrix from './subpages/GlobalMatrix';
import ThreatAnalytics from './subpages/ThreatAnalytics';
import TerminalConsole from './components/TerminalConsole';
import RouteMap from './components/RouteMap';
import MetricCard from './components/MetricCard';
import {
  fetchDomainMetadata,
  generateTraceroutePipeline,
  validateInput,
} from './services/networkService';

const stamp = () => {
  const d = new Date();
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * AETHER-NET — orchestration hub.
 * Black void, one phosphor hue, zero clutter.
 */
export default function App() {
  const [tab, setTab] = useState('matrix');
  const [query, setQuery] = useState('');
  const [networkData, setNetworkData] = useState(null);
  const [routingHops, setRoutingHops] = useState(null);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState('IDLE');
  const [error, setError] = useState('');
  const [immersive, setImmersive] = useState(false);

  const busy = status === 'RESOLVING' || status === 'TRACING';

  const addLog = (m) => setLogs((p) => [...p, { t: stamp(), m }]);

  /* ---------- trace pipeline ---------- */
  const runTrace = async (e) => {
    e.preventDefault();
    const target = query.trim();
    const v = validateInput(target);
    if (!v.valid) {
      setError('invalid target — use a domain or ipv4 address');
      return;
    }

    setError('');
    setStatus('RESOLVING');
    setNetworkData(null);
    setRoutingHops(null);
    setLogs([]);

    try {
      addLog(`> resolve ${target}`);
      await sleep(350);

      const meta = await fetchDomainMetadata(target);
      setNetworkData(meta);
      addLog(`✓ ${meta.ip} · ${meta.city}, ${meta.country}`);
      await sleep(350);

      setStatus('TRACING');
      const pipe = generateTraceroutePipeline(meta.ip, meta.lat, meta.lon);
      addLog(`> trace · ${pipe.hops.length} hops · ${pipe.totalDistance} km`);

      for (let i = 0; i < pipe.hops.length; i++) {
        await sleep(420);
        const h = pipe.hops[i];
        addLog(`[${h.hop}] ${h.name} · ${h.latency}ms`);
        setRoutingHops({ ...pipe, hops: pipe.hops.slice(0, i + 1) });
      }

      await sleep(300);
      setStatus('SUCCESS');
      addLog(`✓ complete · ${pipe.totalLatency}ms rtt · ${pipe.throughput} Mbps`);
      setRoutingHops(pipe);
    } catch (err) {
      setStatus('ERROR');
      addLog(`! fault: ${err.message}`);
      addLog('! uplink unreachable — retry shortly');
    }
  };

  const clear = () => {
    setQuery('');
    setNetworkData(null);
    setRoutingHops(null);
    setLogs([]);
    setStatus('IDLE');
    setError('');
  };

  /* ---------- immersive (phone fullscreen) ---------- */
  const immersiveOn = () => {
    setImmersive(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };
  const immersiveOff = () => {
    setImmersive(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  };

  return (
    <div className="min-h-screen bg-black font-mono text-emerald-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-3 py-4 md:px-6 md:py-6">
        {/* header */}
        <header className="flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="glow text-lg tracking-[0.35em] text-emerald-300 md:text-xl">
              AETHER-NET
            </h1>
            <span className="hidden text-[10px] text-emerald-800 md:inline">
              global routing telemetry
            </span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  busy
                    ? 'animate-pulse bg-emerald-300'
                    : status === 'SUCCESS'
                    ? 'bg-emerald-400'
                    : status === 'ERROR'
                    ? 'bg-emerald-100'
                    : 'bg-emerald-900'
                }`}
              />
              {status}
            </span>
            <button
              onClick={immersiveOn}
              className="border border-emerald-500/30 px-2 py-1 tracking-[0.2em] text-emerald-400 hover:bg-emerald-500/10"
            >
              ⛶ FULL
            </button>
          </div>
        </header>

        {/* uplink */}
        <form onSubmit={runTrace} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError('');
            }}
            disabled={busy}
            placeholder="target · domain or ipv4"
            spellCheck="false"
            autoComplete="off"
            className="flex-1 border border-emerald-500/25 bg-black px-3 py-2.5 text-xs text-emerald-300 placeholder-emerald-900 focus:border-emerald-400 focus:outline-none disabled:opacity-40"
          />
          <button
            disabled={busy || !query.trim()}
            className="border border-emerald-400/60 bg-emerald-500/10 px-5 py-2.5 text-xs tracking-[0.25em] text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-30"
          >
            {busy ? '…' : 'TRACE'}
          </button>
          {networkData && !busy && (
            <button
              type="button"
              onClick={clear}
              className="border border-emerald-500/20 px-3 py-2.5 text-xs text-emerald-600 hover:bg-emerald-500/10"
            >
              ✕
            </button>
          )}
        </form>
        {error && (
          <div className="-mt-2 text-[10px] text-emerald-200 underline decoration-emerald-500/50">
            ! {error}
          </div>
        )}

        {/* tabs */}
        <nav className="flex gap-6 border-b border-emerald-500/15 text-[10px] tracking-[0.3em]">
          {[
            ['matrix', 'MATRIX'],
            ['analytics', 'ANALYTICS'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`-mb-px border-b pb-2 ${
                tab === id
                  ? 'glow border-emerald-300 text-emerald-200'
                  : 'border-transparent text-emerald-800 hover:text-emerald-500'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* workspace */}
        <main className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_340px]">
          <section className="border border-emerald-500/15 bg-black">
            {tab === 'matrix' ? (
              <GlobalMatrix networkData={networkData} routingHops={routingHops} />
            ) : (
              <ThreatAnalytics routingHops={routingHops} />
            )}
          </section>
          <aside className="h-64 lg:h-auto">
            <TerminalConsole logs={logs} status={status} />
          </aside>
        </main>

        <footer className="text-center text-[9px] tracking-[0.3em] text-emerald-900">
          AETHER-NET · ip-api uplink · vercel edge
        </footer>
      </div>

      {/* immersive fullscreen overlay (phone-first) */}
      {immersive && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="flex items-center justify-between px-4 py-2 text-[10px]">
            <span className="glow tracking-[0.3em] text-emerald-300">
              AETHER-NET · LIVE
            </span>
            <button
              onClick={immersiveOff}
              className="border border-emerald-500/30 px-2 py-1 tracking-[0.2em] text-emerald-400 hover:bg-emerald-500/10"
            >
              ✕ EXIT
            </button>
          </div>
          <div className="flex-1">
            <RouteMap routingHops={routingHops} networkData={networkData} />
          </div>
          <div className="grid grid-cols-3 divide-x divide-emerald-500/10 border-t border-emerald-500/10">
            <MetricCard
              label="latency"
              value={routingHops ? routingHops.totalLatency : '--'}
              unit="ms"
            />
            <MetricCard
              label="hops"
              value={routingHops?.hops?.length || '--'}
              unit="nodes"
            />
            <MetricCard
              label="distance"
              value={routingHops ? routingHops.totalDistance : '--'}
              unit="km"
            />
          </div>
        </div>
      )}
    </div>
  );
}
