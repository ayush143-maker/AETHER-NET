import { useEffect, useId, useMemo, useState } from 'react';

const W = 1000;
const H = 500;

/* equirectangular projection */
const project = (lat, lon) => [
  (lon + 180) * (W / 360),
  (90 - lat) * (H / 180),
];

/* ============================================================
   Tiny inline TopoJSON decoder — no npm dependency needed.
   Decodes world-atlas quantized arcs into SVG path strings.
   ============================================================ */
function decodeLand(topo) {
  const [sx, sy] = topo.transform.scale;
  const [tx, ty] = topo.transform.translate;

  // delta-decode + de-quantize every arc
  const arcs = topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * sx + tx, y * sy + ty];
    });
  });

  // stitch arc indices into a closed ring of [lon, lat] points
  const ring = (arcIdxs) => {
    const pts = [];
    arcIdxs.forEach((idx, i) => {
      let a = arcs[idx < 0 ? ~idx : idx];
      if (idx < 0) a = a.slice().reverse();
      if (i > 0) a = a.slice(1); // drop duplicate junction point
      for (const p of a) pts.push(p);
    });
    return pts;
  };

  const geom = topo.objects.land;
  const polys = geom.type === 'MultiPolygon' ? geom.arcs : [geom.arcs];

  return polys.map((poly) =>
    poly
      .map((ringIdxs) => {
        const pts = ring(ringIdxs);
        return (
          'M' +
          pts
            .map(([lon, lat]) => {
              const [x, y] = project(lat, lon);
              return `${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(' L ') +
          ' Z'
        );
      })
      .join(' ')
  );
}

/**
 * Real world map (Natural Earth 110m land geometry, free CDN)
 * + animated broken-line route with live packets riding the cable.
 */
export default function RouteMap({ routingHops, networkData }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const routeId = `${uid}route`;
  const glowId = `${uid}glow`;

  const [land, setLand] = useState([]);
  const [mapStatus, setMapStatus] = useState('loading');

  /* fetch true land geometry once */
  useEffect(() => {
    let cancelled = false;
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json')
      .then((r) => {
        if (!r.ok) throw new Error(`feed ${r.status}`);
        return r.json();
      })
      .then((topo) => {
        if (cancelled) return;
        setLand(decodeLand(topo));
        setMapStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setMapStatus('offline');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hops = routingHops?.hops || [];

  /* curved route path through revealed hops */
  const routeD = useMemo(() => {
    if (hops.length < 2) return '';
    const pts = hops.map((h) => project(h.lat, h.lon));
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const mx = (x0 + x1) / 2;
      const my = Math.min(y0, y1) - Math.min(46, Math.abs(x1 - x0) / 5 + 10);
      d += ` Q ${mx.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
    }
    return d;
  }, [hops]);

  return (
    <div className="scanlines relative h-full w-full bg-black">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="h-full w-full">
        <defs>
          <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* graticule */}
        <g stroke="rgba(52,211,153,0.07)" strokeWidth="0.5">
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={(i + 1) * (W / 12)} y1="0" x2={(i + 1) * (W / 12)} y2={H} />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={(i + 1) * (H / 6)} x2={W} y2={(i + 1) * (H / 6)} />
          ))}
        </g>

        {/* TRUE land geometry */}
        {mapStatus === 'ready' && (
          <g fill="rgba(16,185,129,0.08)" stroke="rgba(52,211,153,0.45)" strokeWidth="0.6">
            {land.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        )}

        {/* route + live transfer */}
        {routeD && (
          <g key={hops.length}>
            {/* dim base line */}
            <path d={routeD} fill="none" stroke="rgba(52,211,153,0.22)" strokeWidth="1" />

            {/* animated broken line */}
            <path
              id={routeId}
              d={routeD}
              fill="none"
              stroke="#6fffc2"
              strokeWidth="1.1"
              className="route-dash"
              filter={`url(#${glowId})`}
            />

            {/* packets riding the cable */}
            {[0, 1, 2].map((i) => (
              <circle key={i} r="2.4" fill="#d9ffe9" filter={`url(#${glowId})`}>
                <animateMotion dur="3s" begin={`${-i * 1}s`} repeatCount="indefinite">
                  <mpath href={`#${routeId}`} />
                </animateMotion>
              </circle>
            ))}

            {/* hop nodes */}
            {hops.map((h, i) => {
              const [x, y] = project(h.lat, h.lon);
              const end = i === 0 || i === hops.length - 1;
              return (
                <g key={i}>
                  <circle
                    cx={x}
                    cy={y}
                    r="7"
                    fill="none"
                    stroke="rgba(111,255,194,0.5)"
                    strokeWidth="0.8"
                    className="ping-ring"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r={end ? 3.2 : 2.2}
                    fill={end ? '#6fffc2' : '#34d399'}
                    filter={`url(#${glowId})`}
                  />
                  {end && (
                    <text
                      x={x}
                      y={y - 9}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#6fffc2"
                      opacity="0.9"
                    >
                      {i === 0 ? 'SRC' : `DST · ${(networkData?.city || '').toUpperCase()}`}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* minimal HUD */}
      <div className="pointer-events-none absolute left-3 top-2 text-[10px] tracking-[0.25em] text-emerald-600">
        GLOBAL ROUTING MATRIX
      </div>
      <div className="pointer-events-none absolute right-3 top-2 text-[10px] text-emerald-800">
        {mapStatus === 'loading'
          ? 'LOADING GEOMETRY…'
          : mapStatus === 'offline'
          ? 'MAP FEED OFFLINE'
          : 'NE-110m · EQUIRECT'}
      </div>
      {hops.length > 1 && (
        <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-1.5 text-[10px] text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          LIVE TRANSFER
        </div>
      )}
    </div>
  );
}
