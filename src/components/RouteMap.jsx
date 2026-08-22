import { useMemo } from 'react';

/**
 * SVG World Map with animated routing paths
 * Uses equirectangular projection with simplified continent outlines
 */
export default function RouteMap({ routingHops, networkData }) {
  const WIDTH = 1000;
  const HEIGHT = 500;
  
  // Equirectangular projection: lat/lon → SVG x/y
  const project = (lat, lon) => ({
    x: (lon + 180) * (WIDTH / 360),
    y: (90 - lat) * (HEIGHT / 180),
  });
  
  // Simplified continent outlines (stylized polygons)
  const continents = useMemo(() => [
    { name: 'North America', path: 'M 80,120 Q 150,90 220,110 L 280,140 Q 300,170 280,200 L 250,240 Q 220,260 190,250 L 140,230 Q 100,200 90,160 Z' },
    { name: 'South America', path: 'M 230,270 Q 260,280 270,310 L 280,360 Q 270,400 250,420 L 220,430 Q 210,400 215,370 L 220,320 Z' },
    { name: 'Europe', path: 'M 450,110 Q 500,100 540,110 L 560,130 Q 550,150 530,160 L 490,170 Q 460,160 450,140 Z' },
    { name: 'Africa', path: 'M 470,190 Q 510,180 540,200 L 570,240 Q 580,290 570,330 L 540,370 Q 510,380 490,360 L 480,310 Q 470,260 475,220 Z' },
    { name: 'Asia', path: 'M 560,100 Q 680,85 790,110 L 850,140 Q 870,170 850,200 L 780,220 Q 700,230 630,220 L 590,200 Q 560,170 565,140 Z' },
    { name: 'Australia', path: 'M 780,330 Q 830,325 870,345 L 880,380 Q 870,410 840,420 L 800,415 Q 780,395 785,360 Z' },
  ], []);
  
  // Major reference cities
  const referenceCities = useMemo(() => [
    { name: 'NYC', lat: 40.7128, lon: -74.0060 },
    { name: 'LON', lat: 51.5074, lon: -0.1278 },
    { name: 'PAR', lat: 48.8566, lon: 2.3522 },
    { name: 'FRA', lat: 50.1109, lon: 8.6821 },
    { name: 'MOW', lat: 55.7558, lon: 37.6173 },
    { name: 'DXB', lat: 25.2048, lon: 55.2708 },
    { name: 'BOM', lat: 19.0760, lon: 72.8777 },
    { name: 'SIN', lat: 1.3521, lon: 103.8198 },
    { name: 'TYO', lat: 35.6762, lon: 139.6503 },
    { name: 'SYD', lat: -33.8688, lon: 151.2093 },
    { name: 'SAO', lat: -23.5505, lon: -46.6333 },
    { name: 'LAX', lat: 34.0522, lon: -118.2437 },
  ], []);
  
  // Build SVG path through hops with smooth quadratic curves
  const routingPath = useMemo(() => {
    if (!routingHops?.hops?.length || routingHops.hops.length < 2) return '';
    const points = routingHops.hops.map(h => project(h.lat, h.lon));
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      const arcHeight = Math.min(50, Math.abs(curr.x - prev.x) / 4);
      const midY = Math.min(prev.y, curr.y) - arcHeight;
      path += ` Q ${midX} ${midY}, ${curr.x} ${curr.y}`;
    }
    return path;
  }, [routingHops]);
  
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-black via-cyber-slate to-black rounded-lg overflow-hidden data-stream-bg">
      {/* Corner HUD elements */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 text-[10px] font-mono text-cyan-400/70">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="tracking-widest">GLOBAL ROUTING MATRIX</span>
      </div>
      <div className="absolute top-3 right-3 z-10 text-[10px] font-mono text-cyan-400/70 text-right">
        <div>LAT/LONG PROJECTION</div>
        <div className="text-gray-500">EQ RECT • v3.2</div>
      </div>
      <div className="absolute bottom-3 left-3 z-10 text-[10px] font-mono text-gray-600">
        50°N — 0° — 50°S
      </div>
      <div className="absolute bottom-3 right-3 z-10 text-[10px] font-mono text-gray-600">
        180°W — 0° — 180°E
      </div>
      
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        aria-label="World map with routing visualization"
      >
        <defs>
          {/* Grid pattern */}
          <pattern id="mapGrid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(0, 240, 255, 0.08)" strokeWidth="0.5" />
          </pattern>
          
          {/* Glow filter */}
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Route gradient */}
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00ff66" />
            <stop offset="50%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#ff0055" />
          </linearGradient>
          
          {/* Radial pulse */}
          <radialGradient id="pulseGrad">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Background grid */}
        <rect width={WIDTH} height={HEIGHT} fill="url(#mapGrid)" />
        
        {/* Latitude lines */}
        <g stroke="rgba(0, 240, 255, 0.05)" strokeWidth="0.5">
          {[0, 125, 250, 375, 500].map(y => (
            <line key={y} x1="0" y1={y} x2={WIDTH} y2={y} />
          ))}
        </g>
        
        {/* Longitude lines */}
        <g stroke="rgba(0, 240, 255, 0.05)" strokeWidth="0.5">
          {[0, 250, 500, 750, 1000].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2={HEIGHT} />
          ))}
        </g>
        
        {/* Continents */}
        <g fill="rgba(0, 240, 255, 0.06)" stroke="rgba(0, 240, 255, 0.25)" strokeWidth="0.8">
          {continents.map(c => (
            <path key={c.name} d={c.path} />
          ))}
        </g>
        
        {/* Reference cities */}
        <g>
          {referenceCities.map((city, idx) => {
            const { x, y } = project(city.lat, city.lon);
            const isActive = routingHops?.hops?.some(h => 
              Math.abs(h.lat - city.lat) < 2 && Math.abs(h.lon - city.lon) < 2
            );
            return (
              <g key={idx}>
                <circle
                  cx={x} cy={y} r="1.5"
                  fill={isActive ? '#00f0ff' : 'rgba(0, 240, 255, 0.4)'}
                />
                <text
                  x={x + 4} y={y + 3}
                  fill={isActive ? '#00f0ff' : 'rgba(0, 240, 255, 0.4)'}
                  fontSize="7"
                  fontFamily="monospace"
                >
                  {city.name}
                </text>
              </g>
            );
          })}
        </g>
        
        {/* Active routing visualization */}
        {routingPath && (
          <g>
            {/* Glow trail */}
            <path
              d={routingPath}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="5"
              opacity="0.25"
              filter="url(#neonGlow)"
            />
            
            {/* Main dashed trail (animated) */}
            <path
              d={routingPath}
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="2"
              strokeDasharray="10 5"
              className="animate-route-flow"
            />
            
            {/* Inner solid core */}
            <path
              d={routingPath}
              fill="none"
              stroke="rgba(255, 255, 255, 0.8)"
              strokeWidth="0.5"
            />
            
            {/* Hop nodes */}
            {routingHops.hops.map((hop, idx) => {
              const { x, y } = project(hop.lat, hop.lon);
              const isFirst = idx === 0;
              const isLast = idx === routingHops.hops.length - 1;
              const nodeColor = isFirst ? '#00ff66' : isLast ? '#ff0055' : '#00f0ff';
              
              return (
                <g key={idx}>
                  {/* Outer pulse ring */}
                  <circle
                    cx={x} cy={y} r="14"
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="1"
                    opacity="0.6"
                    className="animate-pulse-ring"
                  />
                  
                  {/* Mid ring */}
                  <circle
                    cx={x} cy={y} r="8"
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="0.5"
                    opacity="0.4"
                  />
                  
                  {/* Core node */}
                  <circle
                    cx={x} cy={y} r="5"
                    fill={nodeColor}
                    filter="url(#neonGlow)"
                  />
                  
                  {/* Inner white core */}
                  <circle cx={x} cy={y} r="1.5" fill="white" />
                  
                  {/* Label */}
                  <g transform={`translate(${x}, ${y - 22})`}>
                    <rect
                      x="-45" y="-10"
                      width="90" height="14"
                      fill="rgba(0, 0, 0, 0.85)"
                      stroke={nodeColor}
                      strokeWidth="0.5"
                      rx="2"
                    />
                    <text
                      textAnchor="middle"
                      fill={nodeColor}
                      fontSize="7.5"
                      fontFamily="monospace"
                      fontWeight="600"
                      y="2"
                    >
                      HOP {hop.hop} • {hop.latency}ms
                    </text>
                  </g>
                  
                  {/* Node name (below) */}
                  <text
                    x={x} y={y + 18}
                    textAnchor="middle"
                    fill={nodeColor}
                    fontSize="6.5"
                    fontFamily="monospace"
                    opacity="0.85"
                  >
                    {hop.name.length > 25 ? hop.name.substring(0, 22) + '...' : hop.name}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        
        {/* Empty state */}
        {!routingPath && (
          <g>
            <text
              x={WIDTH / 2} y={HEIGHT / 2 - 10}
              textAnchor="middle"
              fill="#00f0ff"
              fontSize="14"
              fontFamily="monospace"
              opacity="0.4"
            >
              ⟨ AWAITING TRACE INITIATION ⟩
            </text>
            <text
              x={WIDTH / 2} y={HEIGHT / 2 + 12}
              textAnchor="middle"
              fill="#00f0ff"
              fontSize="9"
              fontFamily="monospace"
              opacity="0.25"
            >
              ENTER TARGET DOMAIN OR IPv4 TO VISUALIZE GLOBAL ROUTE
            </text>
          </g>
        )}
      </svg>
      
      {/* Bottom info bar */}
      {networkData && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 bg-black/80 border border-cyan-500/30 rounded px-3 py-1.5 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="text-cyan-400">TARGET</span>
            <span className="text-green-400">{networkData.ip}</span>
            <span className="text-gray-600">|</span>
            <span className="text-fuchsia-400">
              {networkData.city}, {networkData.country}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
