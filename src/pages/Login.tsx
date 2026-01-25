
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { sendOtp, isTokenValid } from "@/lib/auth";
import { GraduationCap, ArrowRight, BookOpen, Atom, Sparkles } from "lucide-react";

const Login = () => {
    const [mobileNumber, setMobileNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Check if user has a valid session and redirect to home
        if (isTokenValid()) {
            const from = location.state?.from?.pathname || "/";
            navigate(from, { replace: true });
        }
    }, [navigate, location]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!mobileNumber || mobileNumber.length !== 10) {
            toast.error("Please enter a valid 10-digit mobile number");
            return;
        }

        setIsLoading(true);
        try {
            await sendOtp(mobileNumber);
            toast.success("OTP sent successfully!");
            navigate("/otp-verification", { state: { mobileNumber } });
        } catch (error) {
            toast.error("Failed to send OTP. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 min-h-screen w-full bg-background selection:bg-primary/20 overflow-hidden flex">
            {/* Left Side - Brand & Illustration (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 text-white flex-col justify-between overflow-hidden">
                {/* Background Pattern/Glow */}
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

                <div className="relative z-10 max-w-lg mb-20">
                    <h1 className="text-5xl font-bold leading-tight mb-6">
                        Start your <span className="text-primary">Learning Journey</span> today
                    </h1>
                    <p className="text-lg text-gray-400 mb-8">
                        Join India's most loved education platform. Access high-quality content,
                        expert teachers, and structured learning paths.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                            <BookOpen className="text-primary h-5 w-5" />
                            <span className="font-medium">Quality Content</span>
                        </div>
                        <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm">
                            <Atom className="text-purple-400 h-5 w-5" />
                            <span className="font-medium">Expert Teachers</span>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-sm text-gray-500">
                    © {new Date().getFullYear()} Pie Wallah. All rights reserved.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-12 relative w-full h-full">
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
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back!</h2>
                            <p className="text-muted-foreground">
                                Please enter your details to sign in
                            </p>
                        </div>

                        <form onSubmit={handleSendOtp} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="mobile" className="text-base text-foreground/80">Mobile Number</Label>
                                <div className="relative group">
                                    <span className="absolute left-0 top-0 bottom-0 px-3 flex items-center justify-center border-r border-input text-muted-foreground bg-muted/50 text-sm font-medium rounded-l-md pointer-events-none z-10 w-14 group-focus-within:border-primary group-focus-within:text-primary transition-colors">
                                        +91
                                    </span>
                                    <Input
                                        id="mobile"
                                        type="tel"
                                        placeholder="Enter 10-digit number"
                                        value={mobileNumber}
                                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                        className="pl-16 h-12 text-lg font-medium transition-all focus-visible:ring-primary border-input hover:border-primary/50"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <Button
                                className="w-full h-12 text-base font-semibold bg-gradient-primary hover:opacity-90 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                disabled={isLoading || mobileNumber.length !== 10}
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <Sparkles className="h-4 w-4 animate-spin" />
                                        Sending OTP...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Get OTP <ArrowRight className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                        </form>

                        <div className="text-center text-sm pt-2">
                            <p className="text-muted-foreground">
                                Don't have an account?{" "}
                                <a
                                    href="https://wa.me/918092710478?text=Hello%20Sathyamm%20R%2C%0A%0APlease%20help%20me%20to%20login."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary font-medium hover:underline cursor-pointer transition-colors"
                                >
                                    Contact Admin
                                </a>
                            </p>
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

export default Login;
