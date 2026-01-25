// Video API proxy for Vercel deployment
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
    const targetUrl = `https://piewallahapi.vercel.app/api/${path || ''}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`;
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Forward authorization if present
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      }
    });

    const data = await response.json();

    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'API proxy error' });
  }
}
