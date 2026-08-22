/**
 * Network Service Layer — Vercel Native
 * Uses local /api/proxy endpoint for CORS-free GeoIP resolution
 */

const MAJOR_IXP_NODES = [
  { name: 'Frankfurt DE-CIX', lat: 50.1109, lon: 8.6821, region: 'EU', asn: 'AS24940' },
  { name: 'London LINX', lat: 51.5074, lon: -0.1278, region: 'EU', asn: 'AS5459' },
  { name: 'Amsterdam AMS-IX', lat: 52.3676, lon: 4.9041, region: 'EU', asn: 'AS6777' },
  { name: 'Paris SFINX', lat: 48.8566, lon: 2.3522, region: 'EU', asn: 'AS12091' },
  { name: 'Warsaw PL-IX', lat: 52.2297, lon: 21.0122, region: 'EU', asn: 'AS12324' },
  { name: 'Tokyo JPNAP', lat: 35.6762, lon: 139.6503, region: 'ASIA', asn: 'AS2497' },
  { name: 'Singapore SGIX', lat: 1.3521, lon: 103.8198, region: 'ASIA', asn: 'AS24115' },
  { name: 'Mumbai NIXI', lat: 19.0760, lon: 72.8777, region: 'ASIA', asn: 'AS24186' },
  { name: 'Hong Kong HKIX', lat: 22.3193, lon: 114.1694, region: 'ASIA', asn: 'AS4515' },
  { name: 'Sydney EdgeIX', lat: -33.8688, lon: 151.2093, region: 'OCEANIA', asn: 'AS38195' },
  { name: 'New York NYIIX', lat: 40.7128, lon: -74.0060, region: 'NA', asn: 'AS12182' },
  { name: 'Los Angeles Any2', lat: 34.0522, lon: -118.2437, region: 'NA', asn: 'AS3356' },
  { name: 'Chicago Equinix', lat: 41.8781, lon: -87.6298, region: 'NA', asn: 'AS23393' },
  { name: 'Ashburn DE Datacenter', lat: 39.0438, lon: -77.4874, region: 'NA', asn: 'AS14618' },
  { name: 'São Paulo IX.br', lat: -23.5505, lon: -46.6333, region: 'SA', asn: 'AS22548' },
  { name: 'Johannesburg NAP', lat: -26.2041, lon: 28.0473, region: 'AF', asn: 'AS37215' },
  { name: 'Dubai UAE-IX', lat: 25.2048, lon: 55.2708, region: 'ME', asn: 'AS8966' },
  { name: 'Stockholm Netnod', lat: 59.3293, lon: 18.0686, region: 'EU', asn: 'AS8674' },
];

const LOCAL_GATEWAYS = [
  { name: 'Regional ISP Gateway • US-East', lat: 40.7128, lon: -74.0060, isp: 'Comcast Business' },
  { name: 'Regional ISP Gateway • US-West', lat: 34.0522, lon: -118.2437, isp: 'Spectrum Enterprise' },
  { name: 'Regional ISP Gateway • UK-West', lat: 51.5074, lon: -0.1278, isp: 'BT Enterprise' },
  { name: 'Regional ISP Gateway • Frankfurt', lat: 50.1109, lon: 8.6821, isp: 'Deutsche Telekom' },
  { name: 'Regional ISP Gateway • Singapore', lat: 1.3521, lon: 103.8198, isp: 'SingTel Business' },
  { name: 'Regional ISP Gateway • Tokyo', lat: 35.6762, lon: 139.6503, isp: 'NTT Communications' },
  { name: 'Regional ISP Gateway • Sydney', lat: -33.8688, lon: 151.2093, isp: 'Telstra Business' },
  { name: 'Regional ISP Gateway • São Paulo', lat: -23.5505, lon: -46.6333, isp: 'Vivo Business' },
];

/**
 * Fetches metadata via local Vercel serverless proxy
 * Endpoint: /api/proxy?target=<domain-or-ip>
 */
export async function fetchDomainMetadata(target) {
  const proxyUrl = `/api/proxy?target=${encodeURIComponent(target)}`;
  
  console.log(`[NetworkService] Calling proxy: ${proxyUrl}`);
  
  try {
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Proxy returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'fail') {
      throw new Error(data.message || 'DNS resolution failed');
    }
    
    console.log('[NetworkService] Success:', data);
    
    return {
      ip: data.query,
      status: data.status,
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.city,
      lat: data.lat,
      lon: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      org: data.org,
      as: data.as,
      _proxy: data._proxy, // Debug metadata
    };
    
  } catch (error) {
    console.error('[NetworkService] Error:', error);
    throw new Error(`Network fetch failed: ${error.message}`);
  }
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getRegion(lat, lon) {
  if (lat > 15 && lon > -170 && lon < -50) return 'NA';
  if (lat < 15 && lat > -60 && lon > -90 && lon < -30) return 'SA';
  if (lat > 35 && lon > -25 && lon < 45) return 'EU';
  if (lat < 35 && lon > -25 && lon < 60) return 'AF';
  if (lon >= 45 && lon < 180 && lat > 0) return 'ASIA';
  if (lat < 0 && lon >= 90) return 'OCEANIA';
  if (lon >= 25 && lon < 65 && lat > 10 && lat < 45) return 'ME';
  return 'EU';
}

function estimateLatency(distanceKm) {
  const propagationMs = (distanceKm / 200000) * 1000;
  const routerHops = Math.random() * 4 + 2;
  const processingMs = routerHops * 1.5;
  return Math.round(propagationMs + processingMs + Math.random() * 2);
}

function generateRandomIP() {
  return `${Math.floor(Math.random() * 223 + 1)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

export function generateTraceroutePipeline(targetIp, targetLat, targetLon) {
  const targetRegion = getRegion(targetLat, targetLon);
  const gateway = LOCAL_GATEWAYS[Math.floor(Math.random() * LOCAL_GATEWAYS.length)];
  const sourceRegion = getRegion(gateway.lat, gateway.lon);
  const totalDistance = calculateDistance(gateway.lat, gateway.lon, targetLat, targetLon);
  
  let ixpChain = [];
  
  if (sourceRegion === targetRegion) {
    const localIXPs = MAJOR_IXP_NODES.filter(n => n.region === sourceRegion);
    if (localIXPs.length > 0) {
      ixpChain.push(localIXPs[Math.floor(Math.random() * localIXPs.length)]);
    }
  } else {
    const sourceIXPs = MAJOR_IXP_NODES.filter(n => n.region === sourceRegion);
    const targetIXPs = MAJOR_IXP_NODES.filter(n => n.region === targetRegion);
    const transitIXPs = MAJOR_IXP_NODES.filter(
      n => n.region !== sourceRegion && n.region !== targetRegion
    );
    
    if (sourceIXPs.length) {
      ixpChain.push(sourceIXPs[Math.floor(Math.random() * sourceIXPs.length)]);
    }
    if (transitIXPs.length && totalDistance > 8000) {
      ixpChain.push(transitIXPs[Math.floor(Math.random() * transitIXPs.length)]);
    }
    if (targetIXPs.length) {
      const available = targetIXPs.filter(n => !ixpChain.includes(n));
      if (available.length) {
        ixpChain.push(available[Math.floor(Math.random() * available.length)]);
      }
    }
  }
  
  ixpChain = ixpChain.slice(0, 5);
  
  const hops = [];
  
  hops.push({
    hop: 0,
    name: gateway.name,
    ip: generateRandomIP(),
    lat: gateway.lat,
    lon: gateway.lon,
    latency: Math.floor(Math.random() * 5 + 1),
    isp: gateway.isp,
    type: 'GATEWAY',
  });
  
  let prevLat = gateway.lat;
  let prevLon = gateway.lon;
  
  ixpChain.forEach((ixp, idx) => {
    const dist = calculateDistance(prevLat, prevLon, ixp.lat, ixp.lon);
    hops.push({
      hop: idx + 1,
      name: ixp.name,
      ip: generateRandomIP(),
      lat: ixp.lat,
      lon: ixp.lon,
      latency: estimateLatency(dist),
      isp: 'Backbone Transit',
      asn: ixp.asn,
      type: 'IXP',
    });
    prevLat = ixp.lat;
    prevLon = ixp.lon;
  });
  
  const finalDist = calculateDistance(prevLat, prevLon, targetLat, targetLon);
  hops.push({
    hop: hops.length,
    name: `Destination • ${targetIp}`,
    ip: targetIp,
    lat: targetLat,
    lon: targetLon,
    latency: estimateLatency(finalDist),
    isp: 'End Host',
    type: 'DESTINATION',
  });
  
  const totalLatency = hops.reduce((sum, h) => sum + h.latency, 0);
  const throughput = Math.max(80, Math.min(980, 1200 - totalLatency * 3));
  
  return {
    hops,
    totalLatency,
    totalDistance: Math.round(totalDistance),
    throughput: Math.round(throughput),
    gateway: gateway.name,
    targetRegion,
    sourceRegion,
  };
}

export function validateInput(input) {
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
  
  if (domainRegex.test(input)) return { valid: true, type: 'domain' };
  if (ipv4Regex.test(input)) return { valid: true, type: 'ipv4' };
  return { valid: false, type: null };
}
