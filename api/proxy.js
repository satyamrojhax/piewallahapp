/**
 * Vercel Serverless Function - Proxy for all /api/* routes
 * This handles CORS properly and forwards requests to the backend
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
        // Get the path from query (via vercel.json rewrite) or fallback to URL parsing
        let path = req.query.path;

        if (!path) {
            // Fallback: try to parse from URL
            // req.url might be /api/proxy?path=... or /api/batch/...
            const url = new URL(req.url, `http://${req.headers.host}`);
            path = url.searchParams.get('path');

            if (!path) {
                // If called as /api/batch/123 and routed here without query param
                // We try to extract from pathname
                const pathname = url.pathname;
                if (pathname.startsWith('/api/')) {
                    path = pathname.replace(/^\/api\//, '') + url.search;
                }
            }
        } else {
            // If path came from query, we need to append original query params if any
            // But req.query includes all params.
            // If we have /api/batch?page=1, rewrite captures path='batch'. page=1 is also in query.
            // We need to reconstruct the query string.

            // Actually, let's simplify.
            // If we use rewrite: /api/:path* -> /api/proxy?path=:path*
            // Then req.query.path is the path.
            // Any other query params are also in req.query.

            // Let's just use the raw URL approach which is safer for proxies
            // We want everything after /api/
        }

        // Robust path extraction:
        // 1. If we are at /api/proxy, we look at the 'path' query param or the original URL
        // 2. We want to construct target: BACKEND_API/api/<path_and_query>

        // Let's rely on req.url and strip the prefix.
        // But if we rewrite, req.url might be the rewritten URL (/api/proxy?...)
        // Vercel preserves original URL in x-now-route-matches? No.

        // Let's use the 'path' param from rewrite, it's the most reliable way with rewrites.
        if (Array.isArray(path)) path = path.join('/');

        // If path is missing, try to extract from url (if not rewritten)
        if (!path) {
            path = req.url.replace(/^\/api\//, '').replace(/^\/api\/proxy\/?/, '');
        }

        // Remove any leading slash
        if (path.startsWith('/')) path = path.substring(1);

        // Reconstruct query string from other params if needed
        // But wait, if we use destination: /api/proxy?path=:path*
        // The query params from original URL are merged.

        // Let's look at the query object
        const { path: pathParam, ...restQuery } = req.query;
        const queryString = new URLSearchParams(restQuery).toString();

        // If pathParam is present, use it.
        let finalPath = '';
        if (pathParam) {
            finalPath = Array.isArray(pathParam) ? pathParam.join('/') : pathParam;
        } else {
            // Fallback
            finalPath = req.url.replace(/^\/api\//, '').split('?')[0];
        }

        // Append query string if it exists
        if (queryString) {
            finalPath += (finalPath.includes('?') ? '&' : '?') + queryString;
        }

        const targetUrl = `${BACKEND_API}/api/${finalPath}`;

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
            // Try to parse JSON if text looks like JSON (sometimes headers are wrong)
            try {
                if (typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))) {
                    data = JSON.parse(data);
                }
            } catch (e) { }
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
