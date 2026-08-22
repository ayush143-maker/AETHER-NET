/**
 * Vercel Serverless CORS Proxy
 * Routes requests to ip-api.com with proper CORS headers
 * Deployed at: /api/proxy?target=google.com
 */

export default async function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { target } = req.query;
  
  if (!target) {
    return res.status(400).json({ 
      error: 'Missing target parameter',
      example: '/api/proxy?target=google.com'
    });
  }
  
  try {
    // Validate target format (basic security)
    const isValidDomain = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(target);
    const isValidIP = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(target);
    
    if (!isValidDomain && !isValidIP) {
      return res.status(400).json({ 
        status: 'fail',
        message: 'Invalid target format. Use domain or IPv4 address.'
      });
    }
    
    // Fetch from ip-api.com (HTTP endpoint)
    const fields = 'status,message,country,countryCode,regionName,city,lat,lon,timezone,isp,org,as,query';
    const apiUrl = `http://ip-api.com/json/${target}?fields=${fields}`;
    
    console.log(`[Proxy] Fetching: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NetworkMatrix/1.0',
      },
      timeout: 10000, // 10 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Upstream API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    // Add metadata for debugging
    data._proxy = {
      timestamp: new Date().toISOString(),
      region: 'vercel-edge',
    };
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('[Proxy Error]', error.message);
    
    return res.status(500).json({
      status: 'fail',
      message: `Proxy error: ${error.message}`,
      _proxy: {
        timestamp: new Date().toISOString(),
        error: error.message,
      },
    });
  }
}
