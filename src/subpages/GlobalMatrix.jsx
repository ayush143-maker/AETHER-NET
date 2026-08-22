import MetricCard from '../components/MetricCard';
import RouteMap from '../components/RouteMap';

/**
 * Matrix view — one thin stat strip + the map. Nothing else.
 */
export default function GlobalMatrix({ networkData, routingHops }) {
  const hops = routingHops?.hops || [];

  return (
    <div className="flex h-full flex-col">
      {/* stat strip */}
      <div className="grid grid-cols-3 divide-x divide-emerald-500/10 border-b border-emerald-500/10">
        <MetricCard
          label="latency"
          value={routingHops ? routingHops.totalLatency : '--'}
          unit="ms"
        />
        <MetricCard label="hops" value={hops.length || '--'} unit="nodes" />
        <MetricCard
          label="distance"
          value={routingHops ? routingHops.totalDistance : '--'}
          unit="km"
        />
      </div>

      {/* single target line */}
      {networkData && (
        <div className="truncate border-b border-emerald-500/10 px-4 py-1.5 text-[10px] text-emerald-600">
          {networkData.ip} · {networkData.city}, {networkData.country} · {networkData.isp}
        </div>
      )}

      {/* map */}
      <div className="min-h-[300px] flex-1 md:min-h-[420px]">
        <RouteMap routingHops={routingHops} networkData={networkData} />
      </div>
    </div>
  );
}
