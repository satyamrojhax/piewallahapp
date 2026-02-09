import { networkDetector } from './networkDetector';
import "@/config/firebase";

// Function to generate a random UUID
const generateRandomId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const AUTH_CONFIG = {
    BASE_URL_V1: "https://api.penpencil.co/v1",
    BASE_URL_V3: "https://api.penpencil.co/v3",
    CLIENT_ID: "5eb393ee95fab7468a79d189",
    ORG_ID: "5eb393ee95fab7468a79d189",
    CLIENT_SECRET: "KjPXuAVfC5xbmgreETNMaL7z",
};

export const getCommonHeaders = () => {
    const token = getAuthToken();
    const headers: Record<string, string> = {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "client-id": AUTH_CONFIG.CLIENT_ID,
        "client-type": "WEB",
        "client-version": "4.4.20",
        "content-type": "application/json",
        "priority": "u=1, i",
        "randomid": crypto.randomUUID(),
        "sec-ch-ua": '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
        "sec-ch-ua-mobile": "?1",
        "sec-ch-ua-platform": '"Android"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "x-sdk-version": "0.0.16"
    };
    
    // Add authorization header only if token exists
    if (token) {
        headers["authorization"] = `Bearer ${token}`;
    }
    
    return headers;
};

export const sendOtp = async (mobileNumber: string) => {
    const response = await fetch(`${AUTH_CONFIG.BASE_URL_V1}/users/get-otp?smsType=0&fallback=true`, {
        method: "POST",
        mode: "cors",
        headers: getCommonHeaders(),
        body: JSON.stringify({
            username: mobileNumber,
            countryCode: "+91",
            organizationId: AUTH_CONFIG.ORG_ID,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to send OTP");
    }

    return response.json();
};

export const verifyOtp = async (mobileNumber: string, otp: string) => {
    const response = await fetch(`${AUTH_CONFIG.BASE_URL_V3}/oauth/token`, {
        method: "POST",
        mode: "cors",
        headers: getCommonHeaders(),
        body: JSON.stringify({
            username: mobileNumber,
            otp: otp,
            client_id: "system-admin",
            client_secret: AUTH_CONFIG.CLIENT_SECRET,
            grant_type: "password",
            organizationId: AUTH_CONFIG.ORG_ID,
            latitude: 0,
            longitude: 0,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to verify OTP");
    }

    const data = await response.json();

    // Store authentication data persistently in both localStorage and sessionStorage
    if (data?.data?.access_token) {
        const token = data.data.access_token;
        const refreshToken = data.data.refresh_token || "";
        const expiresAt = Date.now() + (data.data.expires_in || 3600) * 1000;
        
        // localStorage for persistence across sessions
        localStorage.setItem("param_auth_token", token);
        localStorage.setItem("refresh_token", refreshToken);
        localStorage.setItem("token_expires_at", String(expiresAt));
        
        // sessionStorage for current session backup
        sessionStorage.setItem("param_auth_token", token);
        sessionStorage.setItem("refresh_token", refreshToken);
        sessionStorage.setItem("token_expires_at", String(expiresAt));
    }
    
    // Store user data from token response
    if (data?.data?.user) {
        const userData = JSON.stringify(data.data.user);
        localStorage.setItem("user_data", userData);
        sessionStorage.setItem("user_data", userData);
    }

    return data;
};

// Token verification removed - using localStorage-based authentication

// Token verification removed - using localStorage-based authentication
export const isTokenVerified = async (): Promise<boolean> => {
    return isTokenValid();
};

export const validateAndRefreshToken = async (): Promise<boolean> => {
    // Check if token exists and is not expired
    if (isTokenValid()) {
        return true;
    }

    // Token is expired, try to refresh it
    const refreshSuccess = await refreshAuthToken();
    if (!refreshSuccess) {
        logout();
        return false;
    }

    return true;
};

export const resendOtp = async (mobileNumber: string) => {
    const response = await fetch(`${AUTH_CONFIG.BASE_URL_V1}/users/resend-otp?smsType=0`, {
        method: "POST",
        mode: "cors",
        headers: getCommonHeaders(),
        body: JSON.stringify({
            mobile: mobileNumber,
            organizationId: AUTH_CONFIG.ORG_ID,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to resend OTP");
    }

    return response.json();
};

export const sendWhatsAppOtp = async (mobileNumber: string) => {
    const response = await fetch(`${AUTH_CONFIG.BASE_URL_V1}/users/resend-otp?smsType=1`, {
        method: "POST",
        mode: "cors",
        headers: getCommonHeaders(),
        body: JSON.stringify({
            mobile: mobileNumber,
            organizationId: AUTH_CONFIG.ORG_ID,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to send WhatsApp OTP");
    }

    return response.json();
};

export const sendCallOtp = async (mobileNumber: string) => {
    const response = await fetch(`${AUTH_CONFIG.BASE_URL_V1}/users/resend-otp?smsType=2`, {
        method: "POST",
        mode: "cors",
        headers: getCommonHeaders(),
        body: JSON.stringify({
            mobile: mobileNumber,
            organizationId: AUTH_CONFIG.ORG_ID,
        }),
    });

    if (!response.ok) {
        throw new Error("Failed to send OTP via Call");
    }

    return response.json();
};

export const getUserProfile = async (token: string) => {
    const response = await fetch(`${AUTH_CONFIG.BASE_URL_V3}/users?landingPage=true`, {
        method: "GET",
        mode: "cors",
        headers: {
            ...getCommonHeaders(),
            "authorization": `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch user profile");
    }

    return response.json();
};

// New persistent login utilities
export const isTokenValid = (): boolean => {
    const token = localStorage.getItem("param_auth_token") || sessionStorage.getItem("param_auth_token");
    const expiresAt = localStorage.getItem("token_expires_at") || sessionStorage.getItem("token_expires_at");
    
    if (!token || !expiresAt) {
        return false;
    }
    
    // Check if token is expired (with 5-minute buffer)
    return Date.now() < (parseInt(expiresAt) - 5 * 60 * 1000);
};

export const refreshAuthToken = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token");
    
    if (!refreshToken) {
        return false;
    }

    try {
        const response = await fetch(`${AUTH_CONFIG.BASE_URL_V3}/oauth/token`, {
            method: "POST",
            mode: "cors",
            headers: getCommonHeaders(),
            body: JSON.stringify({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
                client_id: "system-admin",
                client_secret: AUTH_CONFIG.CLIENT_SECRET,
                organizationId: AUTH_CONFIG.ORG_ID,
            }),
        });

        if (!response.ok) {
            throw new Error("Token refresh failed");
        }

        const data = await response.json();
        
        if (data?.data?.access_token) {
            const token = data.data.access_token;
            const newRefreshToken = data.data.refresh_token || refreshToken;
            const expiresAt = Date.now() + (data.data.expires_in || 3600) * 1000;
            
            // Update both localStorage and sessionStorage
            localStorage.setItem("param_auth_token", token);
            localStorage.setItem("token_expires_at", String(expiresAt));
            sessionStorage.setItem("param_auth_token", token);
            sessionStorage.setItem("token_expires_at", String(expiresAt));
            
            if (data.data.refresh_token) {
                localStorage.setItem("refresh_token", newRefreshToken);
                sessionStorage.setItem("refresh_token", newRefreshToken);
            }
            
            return true;
        }
        
        return false;
    } catch (error) {
        return false;
    }
};

export const logout = (): void => {
    // Clear both localStorage and sessionStorage
    localStorage.removeItem("param_auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expires_at");
    localStorage.removeItem("user_data");
    
    sessionStorage.removeItem("param_auth_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("token_expires_at");
    sessionStorage.removeItem("user_data");
    
    // Redirect to login page
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

// Handle authentication errors and auto-logout
export const handleAuthError = (): void => {
    logout();
};

// Check token and redirect to login if expired
export const checkTokenAndRedirect = (): boolean => {
    if (!isTokenValid()) {
        logout();
        return false;
    }
    return true;
};

// Enhanced API call wrapper with token validation
export const authenticatedFetch = async (url: string, options?: RequestInit): Promise<Response> => {
    // Check token validity before making request
    if (!checkTokenAndRedirect()) {
        throw new Error('Token expired - redirecting to login');
    }

    try {
        const response = await fetch(url, options);
        
        // Handle 401/403 responses - token might be expired/invalid
        if (response.status === 401 || response.status === 403) {
            logout();
            throw new Error('Authentication failed - token expired');
        }
        
        return response;
    } catch (error) {
        // If it's already an auth error, don't double-handle
        if (error instanceof Error && (error.message.includes('Token expired') || error.message.includes('Authentication failed'))) {
            throw error;
        }
        
        // For other errors, check if token might be the issue
        if (!isTokenValid()) {
            logout();
            throw new Error('Token expired during request');
        }
        
        throw error;
    }
};

export const getStoredUserData = () => {
    const userData = localStorage.getItem("user_data") || sessionStorage.getItem("user_data");
    return userData ? JSON.parse(userData) : null;
};

export const getAuthToken = (): string | null => {
    return localStorage.getItem("param_auth_token") || sessionStorage.getItem("param_auth_token");
};
