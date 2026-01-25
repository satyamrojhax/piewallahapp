export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization');
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract query parameters
    const { BatchId, SubjectId, ContentId } = req.query;

    if (!BatchId || !SubjectId || !ContentId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Build the external API URL
    const externalUrl = `https://piewallahapi.vercel.app/api/attachments?BatchId=${BatchId}&SubjectId=${SubjectId}&ContentId=${ContentId}`;

    // Make the request to the external API
    const response = await fetch(externalUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch attachments' });
    }

    const data = await response.json();

    // Set CORS headers for the response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization');

    // Return the data
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
