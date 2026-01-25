/**
 * Vercel Serverless Function - Schedule Details API Proxy
 * This handles schedule-details endpoint with proper authentication and CORS
 */

const AUTH_CONFIG = {
    BASE_URL_V1: "https://api.penpencil.co/v1",
    BASE_URL_V3: "https://api.penpencil.co/v3",
    CLIENT_ID: "5eb393ee95fab7468a79d189",
    ORG_ID: "5eb393ee95fab7468a79d189",
    CLIENT_SECRET: "KjPXuAVfC5xbmgreETNMaL7z",
    RANDOM_ID: "fcba8b2b-4393-4b6b-8d00-c93fba5e8742",
};

const COMMON_HEADERS = {
    "accept": "*/*",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "client-id": AUTH_CONFIG.CLIENT_ID,
    "client-type": "WEB",
    "client-version": "200",
    "content-type": "application/json",
    "priority": "u=1, i",
    "randomid": AUTH_CONFIG.RANDOM_ID,
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "secure-video-required": "true",
    "user-agent": "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
    "version": "0.0.1"
};

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

    // Only allow GET requests
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        // Extract query parameters
        const { batchId, subjectId, scheduleId } = req.query;
        
        if (!batchId) {
            res.status(400).json({ 
                success: false, 
                error: 'batchId is required' 
            });
            return;
        }

        if (!subjectId) {
            res.status(400).json({ 
                success: false, 
                error: 'subjectId is required' 
            });
            return;
        }

        if (!scheduleId) {
            res.status(400).json({ 
                success: false, 
                error: 'scheduleId is required' 
            });
            return;
        }

        // Get authorization token from request headers
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ 
                success: false, 
                error: 'Authorization token required' 
            });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Construct target URL using the exact pattern from the user's example
        const targetUrl = `${AUTH_CONFIG.BASE_URL_V1}/batches/${batchId}/subject/${subjectId}/schedule/${scheduleId}/schedule-details`;

        // Prepare headers with authorization and all required headers from the user's example
        const headers = {
            ...COMMON_HEADERS,
            'authorization': `Bearer ${token}`,
            'client-version': '200',
            'referer': 'https://www.pw.live/',
            'origin': 'https://www.pw.live',
            'secure-video-required': 'true',
            'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36',
            'version': '0.0.1'
        };

        // Make request to PenPencil API
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: headers
        });

        // Get response data
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
            // Try to parse JSON if text looks like JSON
            try {
                if (typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))) {
                    data = JSON.parse(data);
                }
            } catch (e) { }
        }

        // Forward response with same status code
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Proxy error',
            message: error.message,
            details: 'Failed to connect to PenPencil API'
        });
    }
}
