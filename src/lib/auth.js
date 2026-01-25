// Function to generate a random UUID
const generateRandomId = () => {
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

export const getCommonHeaders = () => ({
    "accept": "*/*",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    "client-id": AUTH_CONFIG.CLIENT_ID,
    "client-type": "WEB",
    "content-type": "application/json",
    "priority": "u=1, i",
    "randomid": crypto.randomUUID(),
    "sec-ch-ua": '"Google Chrome";v="143", "Chromium";v="143", "Not_A(Brand";v="24"',
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "x-sdk-version": "0.0.12"
});

export const sendOtp = async (mobileNumber) => {
    const response = await fetch(`${AUTH_CONFIG.BASE_URL_V1}/users/get-otp?smsType=0&fallback=true`, {
        method: "POST",
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

export const verifyOtp = async (mobileNumber, otp) => {
    const response = await fetch(`${AUTH_CONFIG.BASE_URL_V3}/oauth/token`, {
        method: "POST",
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

    // Store authentication data persistently
    if (data?.data?.access_token) {
        localStorage.setItem("param_auth_token", data.data.access_token);
        localStorage.setItem("refresh_token", data.data.refresh_token || "");
        
        // Calculate proper expiration time (expires_in is in seconds, convert to milliseconds)
        const expirationTime = Date.now() + (data.data.expires_in || 3600) * 1000;
        localStorage.setItem("token_expires_at", String(expirationTime));
    }
    
    // Store user data from token response
    if (data?.data?.user) {
        localStorage.setItem("user_data", JSON.stringify(data.data.user));
    }

    return data;
};

// Token verification removed - using localStorage-based authentication

// Token verification removed - using localStorage-based authentication
export const isTokenVerified = async () => {
    return isTokenValid();
};

export const validateAndRefreshToken = async () => {
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

export const resendOtp = async (mobileNumber) => {
    const response = await fetch(`${AUTH_CONFIG.BASE_URL_V1}/users/resend-otp?smsType=0`, {
        method: "POST",
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

export const sendWhatsAppOtp = async (mobileNumber) => {
    const response = await fetch(`${AUTH_CONFIG.BASE_URL_V1}/users/resend-otp?smsType=1`, {
        method: "POST",
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

export const sendCallOtp = async (mobileNumber) => {
    const response = await fetch(`${AUTH_CONFIG.BASE_URL_V1}/users/resend-otp?smsType=2`, {
        method: "POST",
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

export const getUserProfile = async (token) => {
    const response = await fetch(`${AUTH_CONFIG.BASE_URL_V3}/users?landingPage=true`, {
        method: "GET",
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
export const isTokenValid = () => {
    const token = localStorage.getItem("param_auth_token") || sessionStorage.getItem("param_auth_token");
    const expiresAt = localStorage.getItem("token_expires_at") || sessionStorage.getItem("token_expires_at");
    
    if (!token || !expiresAt) {
        return false;
    }
    
    // Check if token is expired (with 5-minute buffer)
    return Date.now() < (parseInt(expiresAt) - 5 * 60 * 1000);
};

export const isTokenExpired = () => {
    const expiresAt = localStorage.getItem("token_expires_at");
    
    if (!expiresAt) {
        return true; // No expiration time means token is invalid
    }
    
    return Date.now() >= parseInt(expiresAt);
};

export const refreshAuthToken = async () => {
    const refreshToken = localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token");
    
    if (!refreshToken) {
        return false;
    }

    try {
        const response = await fetch(`${AUTH_CONFIG.BASE_URL_V3}/oauth/token`, {
            method: "POST",
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
            localStorage.setItem("param_auth_token", data.data.access_token);
            
            // Calculate proper expiration time (expires_in is in seconds, convert to milliseconds)
            const expirationTime = Date.now() + (data.data.expires_in || 3600) * 1000;
            localStorage.setItem("token_expires_at", String(expirationTime));
            
            if (data.data.refresh_token) {
                localStorage.setItem("refresh_token", data.data.refresh_token);
            }
            
            return true;
        }
        
        return false;
    } catch (error) {
        return false;
    }
};

export const logout = () => {
    // Clear both localStorage and sessionStorage
    localStorage.removeItem("param_auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_expires_at");
    localStorage.removeItem("user_data");
    
    sessionStorage.removeItem("param_auth_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("token_expires_at");
    sessionStorage.removeItem("user_data");
};

export const getStoredUserData = () => {
    const userData = localStorage.getItem("user_data") || sessionStorage.getItem("user_data");
    return userData ? JSON.parse(userData) : null;
};

export const getAuthToken = () => {
    return localStorage.getItem("param_auth_token") || sessionStorage.getItem("param_auth_token");
};
