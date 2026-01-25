// Video proxy for Vercel deployment
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  try {
    const { path } = req.query;
    const targetUrl = `https://sec-prod-mediacdn.pw.live/${path || ''}${req.url.includes('?') ? req.url.split('?')[1] : ''}`;
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        // Remove problematic headers
        'host': undefined,
        'origin': undefined,
        'referer': undefined,
        // Forward other headers
        ...Object.fromEntries(
          Object.entries(req.headers).filter(([key]) => 
            !['host', 'origin', 'referer'].includes(key.toLowerCase())
          )
        )
      }
    });

    // Copy response headers
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'content-length'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const buffer = await response.arrayBuffer();
    res.status(response.status).send(Buffer.from(buffer));
  } catch (error) {
    res.status(500).json({ error: 'Proxy error' });
  }
}
