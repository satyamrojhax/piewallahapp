/**
 * Vercel Serverless Function - Weekly Planner API Proxy
 * This handles the weekly-planner endpoint with proper authentication and CORS
 */

import { COMMON_HEADERS, AUTH_CONFIG } from '../../src/lib/auth.js';

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
        const { batchId, startDate } = req.query;
        
        if (!batchId) {
            res.status(400).json({ 
                success: false, 
                error: 'batchId is required' 
            });
            return;
        }

        if (!startDate) {
            res.status(400).json({ 
                success: false, 
                error: 'startDate is required' 
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

        // Construct the target URL
        const targetUrl = `${AUTH_CONFIG.BASE_URL_V3}/test-service/tests/${batchId}/weekly-planner?batchId=${batchId}&startDate=${startDate}`;

        // Prepare headers with authorization and all required headers
        const headers = {
            ...COMMON_HEADERS,
            'authorization': `Bearer ${token}`,
            'client-version': '1.0.0',
            'referer': 'https://www.pw.live/',
            'origin': 'https://www.pw.live'
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

        // Forward the response with the same status code
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
