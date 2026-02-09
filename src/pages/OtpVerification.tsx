
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { verifyOtp, sendOtp, resendOtp, sendWhatsAppOtp, sendCallOtp } from "@/lib/auth";
import { ShieldCheck, ArrowLeft, Shield, Timer, PencilLine, MessageCircle, Phone } from "lucide-react";
import { hasUserSelectedClasses } from "@/services/cohortService";
import { useAuth } from "@/contexts/AuthContext";
import "@/config/firebase";

const OtpVerification = () => {
    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(10);
    const location = useLocation();
    const navigate = useNavigate();
    const mobileNumber = location.state?.mobileNumber;
    const { checkAuth } = useAuth();

    useEffect(() => {
        if (!mobileNumber) {
            toast.error("No mobile number provided. Redirecting to login.");
            navigate("/login");
        }

        const timer = setInterval(() => {
            setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => clearInterval(timer);
    }, [mobileNumber, navigate]);

    // Auto-verify removed - user must manually click verify button

    const handleVerify = async () => {
        if (otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        setIsLoading(true);
        
        try {
            const response = await verifyOtp(mobileNumber, otp);
            
            // Store complete authentication data from response
            if (response?.data) {
                const { access_token, refresh_token, expires_in, user } = response.data;
                
                if (access_token) {
                    // Store all auth data in localStorage
                    localStorage.setItem("param_auth_token", access_token);
                    localStorage.setItem("refresh_token", refresh_token || "");
                    localStorage.setItem("token_expires_at", String(Date.now() + (expires_in || 3600) * 1000));
                    
                    // Store complete user data
                    if (user) {
                        localStorage.setItem("user_data", JSON.stringify(user));
                    }
                    
                    // Also store in sessionStorage for backup
                    sessionStorage.setItem("param_auth_token", access_token);
                    sessionStorage.setItem("refresh_token", refresh_token || "");
                    sessionStorage.setItem("token_expires_at", String(Date.now() + (expires_in || 3600) * 1000));
                    if (user) {
                        sessionStorage.setItem("user_data", JSON.stringify(user));
                    }
                    
                    toast.success("Login Successful!");
                    
                    // Immediately update authentication state
                    await checkAuth();
                    
                    // Navigate immediately after successful auth
                    navigate("/");
                } else {
                    throw new Error("Token not found in response");
                }
            } else {
                throw new Error("Invalid response format");
            }

        } catch (error) {
            toast.error("Wrong OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;

        setIsLoading(true);
        try {
            await resendOtp(mobileNumber);
            toast.success("OTP Resent via SMS!");
            setResendTimer(20);
        } catch (error) {
            toast.error("Failed to resend OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendWhatsApp = async () => {
        if (resendTimer > 0) return;

        setIsLoading(true);
        try {
            await sendWhatsAppOtp(mobileNumber);
            toast.success("OTP Sent via WhatsApp!");
            setResendTimer(30);
        } catch (error) {
            toast.error("Failed to send WhatsApp OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCall = async () => {
        if (resendTimer > 0) return;

        setIsLoading(true);
        try {
            await sendCallOtp(mobileNumber);
            toast.success("OTP Sent via Call!");
            setResendTimer(50);
        } catch (error) {
            toast.error("Failed to send OTP via Call");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditNumber = () => {
        // Mobile number editing disabled as requested
        toast.error("Mobile number cannot be edited after OTP is sent");
    }

    return (
        <div className="fixed inset-0 min-h-screen w-full bg-background selection:bg-primary/20 overflow-hidden flex">
            {/* Left Side - Brand (Consistent with Login) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 text-white flex-col justify-between overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary blur-[100px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600 blur-[120px]" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo.png"
                            alt="Pie Wallah Logo"
                            className="h-12 w-12 rounded-xl object-contain bg-white/10 backdrop-blur p-1 border border-white/20"
                        />
                        <span className="text-2xl font-bold tracking-tight">Pie Wallah</span>
                    </div>
                </div>

                <div className="relative z-10 max-w-lg mb-20 animate-in fade-in slide-in-from-left-8 duration-700">
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Secure your <span className="text-primary">Account</span>
                    </h1>
                    <p className="text-lg text-gray-400 mb-8">
                        We've sent a verification code to your mobile number. Please enter it to continue accessing your personalized learning experience.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                            <ShieldCheck className="text-green-400 h-5 w-5" />
                            <span className="font-medium">Secure Login</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                            <Shield className="text-primary h-5 w-5" />
                            <span className="font-medium">Encrypted</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-gray-500">
                    © {new Date().getFullYear()} Pie Wallah. All rights reserved.
                </div>
            </div>

            {/* Right Side - OTP Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-12 relative w-full h-full">
                <button
                    onClick={() => navigate("/login")}
                    className="absolute top-6 left-6 lg:top-12 lg:left-12 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-20"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </button>

                {/* Content Wrapper for Vertical Centering */}
                <div className="w-full max-w-[400px] flex flex-col items-center justify-center gap-6 z-10">

                    {/* Mobile Brand Header */}
                    <div className="lg:hidden flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5 p-2 overflow-hidden">
                            <img
                                src="/logo.png"
                                alt="Pie Wallah Logo"
                                className="h-full w-full object-cover rounded-full"
                            />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-foreground">Pie Wallah</span>
                    </div>

                    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-background sm:bg-transparent rounded-xl">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-bold tracking-tight">Verify Details</h2>
                            <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <span>OTP sent to +91 {mobileNumber}</span>
                                {/* Edit button removed - mobile number cannot be edited */}
                            </div>
                        </div>

                        <div className="flex flex-col gap-6">
                            <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
                                <div className="flex justify-center py-4">
                                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                                        <InputOTPGroup className="gap-2 sm:gap-4">
                                            <InputOTPSlot index={0} className="rounded-md border-2 border-input h-12 w-10 sm:w-12 text-lg focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 transition-all font-semibold" />
                                            <InputOTPSlot index={1} className="rounded-md border-2 border-input h-12 w-10 sm:w-12 text-lg focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 transition-all font-semibold" />
                                            <InputOTPSlot index={2} className="rounded-md border-2 border-input h-12 w-10 sm:w-12 text-lg focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 transition-all font-semibold" />
                                            <InputOTPSlot index={3} className="rounded-md border-2 border-input h-12 w-10 sm:w-12 text-lg focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 transition-all font-semibold" />
                                            <InputOTPSlot index={4} className="rounded-md border-2 border-input h-12 w-10 sm:w-12 text-lg focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 transition-all font-semibold" />
                                            <InputOTPSlot index={5} className="rounded-md border-2 border-input h-12 w-10 sm:w-12 text-lg focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/20 transition-all font-semibold" />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-12 text-base font-semibold bg-gradient-primary hover:opacity-90 transition-all shadow-md hover:shadow-lg"
                                    disabled={isLoading || otp.length !== 6}
                                >
                                    {isLoading ? "Verifying..." : "Verify & Continue"}
                                </Button>
                            </form>

                            <div className="text-center space-y-3">
                                {resendTimer > 0 ? (
                                    <div className="text-muted-foreground flex items-center justify-center gap-2">
                                        <Timer className="h-4 w-4" />
                                        Resend OTP in <span className="font-mono">{resendTimer}s</span>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="text-center">
                                            <span className="text-sm text-muted-foreground">Didn't receive OTP? Try Getting OTP via</span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={handleResend}
                                                className="w-full px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium text-sm border border-primary/20"
                                                disabled={isLoading}
                                            >
                                                SMS
                                            </button>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleResendWhatsApp}
                                                    className="flex-1 px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2 border border-primary/20"
                                                    disabled={isLoading}
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                    WhatsApp
                                                </button>
                                                <button
                                                    onClick={handleResendCall}
                                                    className="flex-1 px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors font-medium text-sm flex items-center justify-center gap-2 border border-primary/20"
                                                    disabled={isLoading}
                                                >
                                                    <Phone className="h-4 w-4" />
                                                    Call
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer for Mobile - Absolute bottom */}
                <div className="lg:hidden absolute bottom-6 text-xs text-muted-foreground">
                    © {new Date().getFullYear()} Pie Wallah.
                </div>
            </div>
        </div>
    );
};

export default OtpVerification;
