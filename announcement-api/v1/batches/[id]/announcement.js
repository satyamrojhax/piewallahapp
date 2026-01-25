/**
 * Vercel Serverless Function - Handle /announcement-api/v1/batches/[id]/announcement routes
 * This forwards requests to the backend API for batch announcements
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const BACKEND_API = 'https://pw-api-0585c7015531.herokuapp.com';

    try {
        // Extract the batch ID from the query
        const { id } = req.query;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'Missing batch ID'
            });
        }

        // Get query parameters (like page)
        const queryParams = new URLSearchParams(req.url.split('?')[1] || '');
        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

        // Forward to backend announcement API endpoint
        const targetUrl = `${BACKEND_API}/announcement-api/v1/batches/${id}/announcement${queryString}`;

        // Forward the request to the backend
        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'PieWallah/1.0',
            },
        };

        // Add body for non-GET requests
        if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
            fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);

        // Get response data
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        // Forward the response with the same status code
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Proxy error',
            message: error.message,
            details: 'Failed to connect to backend API'
        });
    }
}
