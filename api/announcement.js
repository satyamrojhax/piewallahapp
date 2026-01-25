/**
 * Vercel Serverless Function - Proxy for /announcement-api/* routes
 * This handles CORS and forwards requests to the announcement API
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

    const TARGET_API = 'https://api.penpencil.co';

    try {
        // The path comes from the query parameter (via vercel.json rewrite)
        // or we try to extract it from the URL if the rewrite didn't work as expected
        let path = req.query.path;

        if (!path) {
            // Fallback: try to parse from URL if query param is missing
            // URL might be /api/announcement?path=... or just /api/announcement/...
            const url = new URL(req.url, `http://${req.headers.host}`);
            path = url.searchParams.get('path');
        }

        if (!path) {
            // If still no path, maybe it was called directly?
            // Let's just return 400 to avoid "non-JSON" confusion if possible, or try to handle it.
            // But usually, the rewrite ensures 'path' is there.
            return res.status(400).json({ error: 'No path provided' });
        }

        // Ensure we don't have double slashes and handle array from Vercel
        const cleanPath = Array.isArray(path) ? path.join('/') : path;
        const targetUrl = `${TARGET_API}/${cleanPath}`;

        // Forward the request
        const fetchOptions = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        };

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
            // If the upstream API returns HTML (like a 404 page), we should wrap it or return as text
            // to avoid the frontend crashing when trying to parse JSON.
            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                return res.status(500).json({
                    success: false,
                    error: 'Upstream API returned non-JSON response',
                    details: text.substring(0, 200)
                });
            }
        }

        // Forward the response
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Proxy error',
            message: error.message
        });
    }
}
