import { useEffect, useId, useMemo, useState } from 'react';

const W = 1000;
const H = 500;
const STEP = 2.5; // degrees per dot cell

/* equirectangular projection */
const project = (lat, lon) => [
  (lon + 180) * (W / 360),
  (90 - lat) * (H / 180),
];

/* ============================================================
   EMBEDDED WORLD GEOMETRY (offline — no CDN, never dies)
   Real continent outlines as [lon, lat] rings.
   First 6 rings = landmasses, later "hole" rings = inland seas
   (even-odd fill rule carves them out).
   ============================================================ */
const LAND_RINGS = [
  /* North America */
  [[-168,66],[-165,60],[-155,58],[-140,60],[-130,55],[-125,49],[-124,40],[-117,33],[-110,24],[-105,20],[-97,16],[-92,14],[-85,10],[-80,8],[-77,8],[-82,14],[-88,16],[-88,21],[-97,26],[-91,29],[-84,30],[-81,25],[-76,35],[-70,42],[-66,45],[-60,47],[-64,52],[-68,58],[-72,62],[-80,64],[-85,70],[-95,72],[-110,73],[-125,71],[-140,70],[-155,71]],
  /* Greenland */
  [[-45,60],[-52,64],[-55,68],[-58,72],[-68,76],[-60,82],[-40,83],[-25,80],[-20,75],[-22,70],[-30,65],[-40,62]],
  /* South America */
  [[-77,7],[-80,0],[-81,-5],[-75,-15],[-70,-20],[-70,-30],[-72,-40],[-74,-50],[-70,-55],[-65,-55],[-65,-47],[-62,-40],[-58,-35],[-52,-32],[-48,-28],[-40,-22],[-35,-8],[-44,-3],[-50,0],[-52,5],[-60,8],[-68,11],[-72,11]],
  /* Africa */
  [[-6,35],[-10,28],[-17,20],[-17,14],[-12,7],[-8,4],[4,6],[9,4],[9,-2],[12,-6],[13,-12],[12,-18],[15,-25],[17,-33],[18,-34],[25,-34],[30,-30],[35,-25],[40,-15],[40,-10],[42,-2],[51,10],[43,11],[38,18],[35,25],[32,31],[20,32],[10,37]],
  /* Eurasia (Europe + Asia + Arabia + India as one mass) */
  [[-9,43],[-9,37],[-5,36],[0,39],[6,43],[10,44],[12,44],[15,40],[18,40],[14,45],[21,40],[23,37],[26,38],[30,36],[36,36],[34,31],[34,28],[39,20],[43,13],[48,13],[55,17],[59,20],[57,25],[52,28],[48,30],[60,25],[66,25],[70,21],[73,16],[77,8],[80,13],[86,20],[90,22],[94,17],[98,12],[100,6],[103,1],[102,6],[105,10],[108,12],[108,18],[106,20],[110,21],[117,24],[121,30],[122,37],[126,35],[128,40],[131,43],[137,47],[155,51],[160,56],[162,60],[170,62],[178,65],[178,68],[160,70],[140,72],[120,73],[100,72],[80,68],[70,66],[60,62],[48,60],[40,62],[33,69],[20,70],[12,66],[6,62],[5,59],[8,57],[10,54],[14,54],[20,55],[24,57],[30,60],[30,64],[33,69],[30,46],[34,45],[28,44],[28,41],[26,40],[22,40],[19,42],[14,45],[10,44],[7,43],[3,42],[-1,46],[-4,48]],
  /* Australia */
  [[114,-22],[114,-30],[117,-35],[124,-33],[130,-32],[136,-35],[140,-38],[146,-39],[150,-37],[153,-30],[153,-25],[149,-20],[145,-15],[142,-11],[137,-12],[132,-11],[128,-15],[122,-17],[117,-20]],
  /* UK */
  [[-5,50],[-3,53],[-5,57],[-3,58],[-1,54],[1,51]],
  /* Iceland */
  [[-22,64],[-18,66],[-14,65],[-17,63]],
  /* Japan */
  [[130,32],[133,34],[137,35],[140,37],[141,41],[143,44],[141,43],[138,36],[132,33]],
  /* Madagascar */
  [[44,-25],[47,-24],[50,-16],[49,-13],[46,-16],[44,-20]],
  /* Sumatra */
  [[95,5],[99,3],[103,-1],[106,-5],[103,-5],[98,1],[95,4]],
  /* Java */
  [[105,-7],[110,-7],[114,-8],[110,-8],[106,-8]],
  /* Borneo */
  [[109,1],[113,4],[117,6],[119,1],[116,-3],[111,-2]],
  /* New Guinea */
  [[131,-2],[136,-3],[141,-4],[146,-7],[143,-8],[137,-7],[132,-4]],
  /* New Zealand */
  [[167,-46],[170,-44],[173,-41],[175,-37],[177,-38],[174,-42],[170,-46]],
  /* Cuba */
  [[-84,22],[-79,21],[-74,20],[-78,21],[-82,22]],
  /* ---- holes (inland seas, carved by even-odd rule) ---- */
  /* Hudson Bay */
  [[-92,57],[-85,55],[-79,56],[-78,60],[-82,63],[-90,62],[-94,59]],
  /* Baltic */
  [[18,55],[24,54],[28,57],[26,60],[22,60],[19,58]],
  /* Black Sea */
  [[28,42],[35,42],[41,42],[40,45],[33,46],[29,44]],
  /* Caspian */
  [[50,40],[54,40],[54,45],[52,47],[50,45]],
];

/* point-in-polygon, even-odd across all rings */
function isLand(lon, lat) {
  let inside = false;
  for (const ring of LAND_RINGS) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > lat !== yj > lat &&
          lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
  }
  return inside;
}

/* build the dot-matrix once */
function buildDots() {
  const dots = [];
  for (let lat = 84; lat >= -56; lat -= STEP) {
    for (let lon = -180; lon < 180; lon += STEP) {
      if (isLand(lon, lat)) dots.push(project(lat, lon));
    }
  }
  return dots;
}

/**
 * AETHER-NET world map — offline dot-matrix globe,
 * radar sweep + rolling live beacons + route overlay.
 */
export default function RouteMap({ routingHops, networkData }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const routeId = `${uid}route`;
  const glowId = `${uid}glow`;
  const sweepId = `${uid}sweep`;

  const dots = useMemo(buildDots, []);

  /* dot-matrix as ONE path (fast on phones) */
  const dotsPath = useMemo(
    () =>
      dots
        .map(([x, y]) => `M${(x - 1.3).toFixed(1)} ${(y - 1.3).toFixed(1)}h2.6v2.6h-2.6z`)
        .join(''),
    [dots]
  );

  /* 36 rolling beacons on REAL land — the "world is searching" layer */
  const beacons = useMemo(() => {
    if (!dots.length) return [];
    return Array.from({ length: 36 }, () => {
      const [x, y] = dots[Math.floor(Math.random() * dots.length)];
      return {
        x, y,
        dur: (2 + Math.random() * 4).toFixed(1),
        delay: (Math.random() * 5).toFixed(1),
        r: (1.2 + Math.random() * 1.6).toFixed(1),
      };
    });
  }, [dots]);

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
          <linearGradient id={sweepId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="rgba(111,255,194,0)" />
            <stop offset="0.5" stopColor="rgba(111,255,194,0.28)" />
            <stop offset="1" stopColor="rgba(111,255,194,0)" />
          </linearGradient>
        </defs>

        {/* graticule */}
        <g stroke="rgba(52,211,153,0.06)" strokeWidth="0.5">
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={(i + 1) * (W / 12)} y1="0" x2={(i + 1) * (W / 12)} y2={H} />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={(i + 1) * (H / 6)} x2={W} y2={(i + 1) * (H / 6)} />
          ))}
        </g>

        {/* DOT-MATRIX WORLD (embedded, always online) */}
        <path d={dotsPath} fill="rgba(52,211,153,0.34)" />

        {/* radar sweep — the planet is scanning */}
        <rect y="0" width="90" height={H} fill={`url(#${sweepId})`}>
          <animateTransform
            attributeName="transform"
            type="translate"
            from="-100 0"
            to="1100 0"
            dur="7s"
            repeatCount="indefinite"
          />
        </rect>

        {/* rolling live beacons on real landmasses */}
        <g fill="#6fffc2">
          {beacons.map((b, i) => (
            <circle key={i} cx={b.x} cy={b.y} r={b.r} opacity="0">
              <animate
                attributeName="opacity"
                values="0;0.9;0"
                dur={`${b.dur}s`}
                begin={`${b.delay}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>

        {/* route + live transfer */}
        {routeD && (
          <g key={hops.length}>
            <path d={routeD} fill="none" stroke="rgba(52,211,153,0.22)" strokeWidth="1" />
            <path
              id={routeId}
              d={routeD}
              fill="none"
              stroke="#6fffc2"
              strokeWidth="1.1"
              className="route-dash"
              filter={`url(#${glowId})`}
            />
            {[0, 1, 2].map((i) => (
              <circle key={i} r="2.4" fill="#d9ffe9" filter={`url(#${glowId})`}>
                <animateMotion dur="3s" begin={`${-i * 1}s`} repeatCount="indefinite">
                  <mpath href={`#${routeId}`} />
                </animateMotion>
              </circle>
            ))}
            {hops.map((h, i) => {
              const [x, y] = project(h.lat, h.lon);
              const end = i === 0 || i === hops.length - 1;
              return (
                <g key={i}>
                  <circle
                    cx={x} cy={y} r="7" fill="none"
                    stroke="rgba(111,255,194,0.5)" strokeWidth="0.8"
                    className="ping-ring"
                  />
                  <circle
                    cx={x} cy={y} r={end ? 3.2 : 2.2}
                    fill={end ? '#6fffc2' : '#34d399'}
                    filter={`url(#${glowId})`}
                  />
                  {end && (
                    <text x={x} y={y - 9} textAnchor="middle" fontSize="9" fill="#6fffc2" opacity="0.9">
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
        DOT-MATRIX · EMBEDDED · LIVE
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
