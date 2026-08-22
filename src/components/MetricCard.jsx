/**
 * Minimal telemetry stat — label + value, nothing else.
 */
export default function MetricCard({ label, value, unit }) {
  return (
    <div className="px-4 py-3">
      <div className="text-[9px] uppercase tracking-[0.3em] text-emerald-600">
        {label}
      </div>
      <div className="glow mt-1 font-mono text-lg tabular-nums text-emerald-300 md:text-2xl">
        {value}
        {unit && <span className="ml-1 text-[10px] text-emerald-600">{unit}</span>}
      </div>
    </div>
  );
}
