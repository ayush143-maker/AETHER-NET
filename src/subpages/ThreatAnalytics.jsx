import { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';

/**
 * Threat Analytics Grid
 * Simulated packet-loss, jitter, port scan, and hop table
 */
export default function ThreatAnalytics({ networkData, routingHops }) {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    if (!routingHops?.hops?.length) {
      setMetrics(null);
      return;
    }
    
    setMetrics({
      packetLoss: (Math.random() * 1.5).toFixed(2),
      jitter: (Math.random() * 12 + 3).toFixed(1),
      anomalyScore: Math.floor(Math.random() * 25 + 8),
      openPorts: Math.floor(Math.random() * 4 + 1),
      encryption: 'TLS 1.3',
      protocol: 'HTTPS/QUIC',
      firewall: 'ACTIVE',
      dnsSec: 'VALIDATED',
      ttl: Math.floor(Math.random() * 30 + 50),
      mtu: 1500,
    });
  }, [routingHops]);
  
  if (!metrics) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-gray-600 font-mono min-h-[400px]">
        <div className="text-6xl mb-4 opacity-40">🛡️</div>
        <div className="text-sm tracking-widest uppercase">No Active Analysis</div>
        <div className="text-xs mt-2 text-center max-w-xs">
          Initiate a trace from the terminal to populate threat telemetry
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full h-full p-3 md:p-5 flex flex-col gap-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-fuchsia-500/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" />
          <h2 className="text-xs md:text-sm font-mono text-fuchsia-400 tracking-widest uppercase">
            Threat Analytics Grid
          </h2>
        </div>
        <div className="text-[10px] font-mono text-gray-500">
          SECURITY TELEMETRY
        </div>
      </div>
      
      {/* Top metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          title="Packet Loss"
          value={parseFloat(metrics.packetLoss)}
          unit="%"
          icon="📉"
          color="magenta"
          subtitle="Tolerance <5%"
          trend={parseFloat(metrics.packetLoss) < 1 ? 'up' : 'down'}
        />
        <MetricCard
          title="Jitter"
          value={parseFloat(metrics.jitter)}
          unit="ms"
          icon="📈"
          color="yellow"
          subtitle="Variance"
          trend="stable"
        />
        <MetricCard
          title="Anomaly"
          value={metrics.anomalyScore}
          unit="/100"
          icon="⚠️"
          color="magenta"
          subtitle="Threat Index"
          trend={metrics.anomalyScore < 30 ? 'up' : 'down'}
        />
        <MetricCard
          title="Open Ports"
          value={metrics.openPorts}
          unit="ports"
          icon="🔓"
          color="yellow"
          subtitle="Exposed"
          trend={metrics.openPorts < 2 ? 'up' : 'stable'}
        />
      </div>
      
      {/* Security status panel */}
      <div className="bg-black/60 border border-cyan-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">
            Connection Security Profile
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <div className="text-gray-500 text-[10px] uppercase mb-1">Protocol</div>
            <div className="text-green-400 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-green-400" />
              {metrics.protocol}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-[10px] uppercase mb-1">Encryption</div>
            <div className="text-cyan-400 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-cyan-400" />
              {metrics.encryption}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-[10px] uppercase mb-1">DNSSEC</div>
            <div className="text-green-400 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-green-400" />
              {metrics.dnsSec}
            </div>
          </div>
          <div>
            <div className="text-gray-500 text-[10px] uppercase mb-1">Firewall</div>
            <div className="text-green-400 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-green-400" />
              {metrics.firewall}
            </div>
          </div>
        </div>
      </div>
      
      {/* Network characteristics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-black/60 border border-fuchsia-500/20 rounded-lg p-4">
          <div className="text-[10px] font-mono text-fuchsia-400 uppercase tracking-widest mb-3">
            Detected Ports
          </div>
          <div className="space-y-2">
            {Array.from({ length: metrics.openPorts }, (_, i) => {
              const ports = [443, 80, 8080, 8443, 22, 53];
              const port = ports[i % ports.length];
              const services = { 443: 'HTTPS', 80: 'HTTP', 8080: 'HTTP-ALT', 8443: 'HTTPS-ALT', 22: 'SSH', 53: 'DNS' };
              return (
                <div key={i} className="flex items-center justify-between text-xs font-mono bg-black/40 px-3 py-2 rounded border border-fuchsia-500/10">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                    <span className="text-fuchsia-400">:{port}</span>
                  </div>
                  <span className="text-gray-400">{services[port]}</span>
                  <span className="text-green-400 text-[10px]">OPEN</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-black/60 border border-cyan-500/20 rounded-lg p-4">
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-3">
            Network Characteristics
          </div>
          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-gray-500">TTL</span>
              <span className="text-cyan-400">{metrics.ttl} hops</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">MTU</span>
              <span className="text-cyan-400">{metrics.mtu} bytes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Hop Count</span>
              <span className="text-cyan-400">{routingHops.hops.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Source Region</span>
              <span className="text-cyan-400">{routingHops.sourceRegion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Target Region</span>
              <span className="text-cyan-400">{routingHops.targetRegion}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Detailed hop analysis table */}
      {routingHops?.hops?.length > 0 && (
        <div className="bg-black/60 border border-green-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-mono text-green-400 uppercase tracking-widest">
              Detailed Hop Analysis
            </span>
          </div>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-[11px] font-mono min-w-[600px]">
              <thead>
                <tr className="text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-800">
                  <th className="text-left py-2 px-2">#</th>
                  <th className="text-left py-2 px-2">Node</th>
                  <th className="text-left py-2 px-2">IP</th>
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-right py-2 px-2">Latency</th>
                  <th className="text-right py-2 px-2">Coords</th>
                </tr>
              </thead>
              <tbody>
                {routingHops.hops.map((hop, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === routingHops.hops.length - 1;
                  const rowColor = isFirst ? 'text-green-400' : isLast ? 'text-fuchsia-400' : 'text-cyan-400';
                  
                  return (
                    <tr key={idx} className="border-b border-gray-800/40 hover:bg-green-900/10 transition-colors">
                      <td className={`py-2 px-2 ${rowColor} font-bold`}>{hop.hop}</td>
                      <td className={`py-2 px-2 ${rowColor} truncate max-w-[200px]`}>
                        {hop.name}
                      </td>
                      <td className="py-2 px-2 text-gray-400">{hop.ip}</td>
                      <td className="py-2 px-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] ${
                          hop.type === 'GATEWAY' ? 'bg-green-900/30 text-green-400' :
                          hop.type === 'DESTINATION' ? 'bg-fuchsia-900/30 text-fuchsia-400' :
                          'bg-cyan-900/30 text-cyan-400'
                        }`}>
                          {hop.type}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right text-yellow-400 tabular-nums">
                        {hop.latency}ms
                      </td>
                      <td className="py-2 px-2 text-right text-gray-500 tabular-nums">
                        {hop.lat.toFixed(2)}°, {hop.lon.toFixed(2)}°
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
