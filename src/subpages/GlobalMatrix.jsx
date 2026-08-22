import { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import RouteMap from '../components/RouteMap';

/**
 * Primary Global Matrix View
 * Telemetry cards + world map visualization
 */
export default function GlobalMatrix({ networkData, routingHops }) {
  const [packetCounter, setPacketCounter] = useState(0);
  
  // Simulate live packet processing counter
  useEffect(() => {
    if (!routingHops?.hops?.length) {
      setPacketCounter(0);
      return;
    }
    
    const interval = setInterval(() => {
      setPacketCounter(prev => (prev + Math.floor(Math.random() * 50) + 20) % 999999);
    }, 400);
    
    return () => clearInterval(interval);
  }, [routingHops]);
  
  const hasData = !!routingHops?.hops?.length;
  
  return (
    <div className="w-full h-full p-3 md:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-xs md:text-sm font-mono text-cyan-400 tracking-widest uppercase">
            Global Routing Matrix
          </h2>
        </div>
        {hasData && (
          <div className="text-[10px] font-mono text-gray-500">
            {new Date().toLocaleTimeString()}
          </div>
        )}
      </div>
      
      {/* Metric cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <MetricCard
          title="Latency"
          value={hasData ? routingHops.totalLatency : 0}
          unit="ms"
          icon="⚡"
          color="cyan"
          subtitle="Round-Trip"
          trend={hasData ? (routingHops.totalLatency < 100 ? 'up' : 'stable') : 'stable'}
        />
        <MetricCard
          title="Throughput"
          value={hasData ? routingHops.throughput : 0}
          unit="Mbps"
          icon="📊"
          color="green"
          subtitle="Packet Rate"
          trend={hasData ? 'up' : 'stable'}
        />
        <MetricCard
          title="Distance"
          value={hasData ? routingHops.totalDistance : 0}
          unit="km"
          icon="🌐"
          color="magenta"
          subtitle="Path Length"
          trend="stable"
        />
      </div>
      
      {/* Live packet counter (active only when tracing) */}
      {hasData && (
        <div className="flex items-center justify-between bg-black/60 border border-cyan-500/20 rounded px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              Live Packets Processed
            </span>
          </div>
          <span className="text-sm md:text-base font-mono text-green-400 font-bold tabular-nums">
            {packetCounter.toLocaleString()}
          </span>
        </div>
      )}
      
      {/* World map */}
      <div className="flex-1 min-h-[350px] md:min-h-[450px]">
        <RouteMap routingHops={routingHops} networkData={networkData} />
      </div>
      
      {/* Network intelligence panel */}
      {networkData && (
        <div className="bg-black/60 border border-cyan-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
            <span className="text-[10px] font-mono text-fuchsia-400 uppercase tracking-widest">
              Target Intelligence
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div>
              <div className="text-gray-500 text-[10px] uppercase">IP</div>
              <div className="text-green-400 truncate">{networkData.ip}</div>
            </div>
            <div>
              <div className="text-gray-500 text-[10px] uppercase">Location</div>
              <div className="text-cyan-400 truncate">{networkData.city}, {networkData.country}</div>
            </div>
            <div>
              <div className="text-gray-500 text-[10px] uppercase">ISP</div>
              <div className="text-yellow-400 truncate">{networkData.isp}</div>
            </div>
            <div>
              <div className="text-gray-500 text-[10px] uppercase">AS Number</div>
              <div className="text-fuchsia-400 truncate">{networkData.as}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
