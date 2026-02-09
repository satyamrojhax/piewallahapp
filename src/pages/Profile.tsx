import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Phone,
    LogOut,
    ArrowLeft,
    ShieldCheck,
    Calendar,
    Award,
    CreditCard,
    Users,
    GraduationCap,
    Target
} from "lucide-react";
import "@/config/firebase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { getUserProfile, logout } from "@/lib/auth";
import { ProfileSkeleton } from "@/components/ui/skeleton-loaders";

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(() => {
        try {
            const saved = localStorage.getItem("user_data");
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [loading, setLoading] = useState(!user);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = localStorage.getItem("param_auth_token");
                if (!token) {
                    navigate("/login");
                    return;
                }

                // Fetch fresh user data from API
                const response = await getUserProfile(token);
                if (response?.data?.data) {
                    const freshUserData = response.data.data;
                    setUser(freshUserData);
                    // Update localStorage with fresh data
                    localStorage.setItem("user_data", JSON.stringify(freshUserData));
                } else {
                    // Fallback to localStorage if API fails
                    const userData = localStorage.getItem("user_data");
                    if (userData) {
                        const parsedUser = JSON.parse(userData);
                        setUser(parsedUser);
                    }
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                // Fallback to localStorage on error
                const userData = localStorage.getItem("user_data");
                if (userData) {
                    try {
                        const parsedUser = JSON.parse(userData);
                        setUser(parsedUser);
                    } catch (parseError) {
                        console.error("Error parsing user data:", parseError);
                    }
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [navigate]);

    const handleLogout = () => {
        logout();
        toast.success("Logged out successfully");
        navigate("/login");
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (loading) {
        return <ProfileSkeleton />;
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <Card className="max-w-md mx-auto p-8 shadow-card">
                        <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Not Logged In</h2>
                        <p className="text-muted-foreground mb-6">Please log in to view your profile.</p>
                        <Button onClick={() => navigate("/login")} className="w-full bg-gradient-primary">
                            Go to Login
                        </Button>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            {/* Mobile View */}
            <div className="md:hidden">
                {/* Header with Back Button */}
                <div className="px-4 pt-6 pb-4">
                    <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </div>

                {/* Profile Header Card */}
                <div className="px-4 mb-6">
                    <Card className="p-6 shadow-lg border-0 bg-gradient-to-br from-primary/5 to-primary/10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-20 h-20 rounded-full border-4 border-background shadow-lg flex items-center justify-center overflow-hidden bg-primary/10">
                                {user.imageId?.key ? (
                                    <img src={`${user.imageId.baseUrl}${user.imageId.key}`} alt={user.firstName} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="h-10 w-10 text-primary" />
                                )}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-xl font-bold text-foreground mb-1">
                                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "User"}
                                </h1>
                                <p className="text-sm text-muted-foreground mb-2">{user.email || "No email provided"}</p>
                                <Badge className="bg-emerald-500 text-white text-xs">
                                    {user.status || "Active"}
                                </Badge>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 rounded-xl bg-background/50">
                                <div className="text-lg font-bold text-primary">{user.profileId?.coins?.totalCoins || 0}</div>
                                <div className="text-xs text-muted-foreground">Coins</div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-background/50">
                                <div className="text-lg font-bold text-emerald-600">₹{user.profileId?.wallet || 0}</div>
                                <div className="text-xs text-muted-foreground">Wallet</div>
                            </div>
                            <div className="text-center p-3 rounded-xl bg-background/50">
                                <div className="text-lg font-bold text-foreground">
                                    {user.createdAt ? new Date(user.createdAt).getFullYear() : "N/A"}
                                </div>
                                <div className="text-xs text-muted-foreground">Since</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Personal Information Card */}
                <div className="px-4 mb-6">
                    <Card className="p-6 shadow-lg border-0">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 text-primary" />
                            Personal Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Email</span>
                                </div>
                                <span className="text-sm font-medium text-foreground">{user.email || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Mobile</span>
                                </div>
                                <span className="text-sm font-medium text-foreground">
                                    {user.primaryNumber ? `${user.countryCode || "+91"} ${user.primaryNumber}` : "N/A"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Member Since</span>
                                </div>
                                <span className="text-sm font-medium text-foreground">
                                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Academic Information Card */}
                <div className="px-4 mb-6">
                    <Card className="p-6 shadow-lg border-0">
                        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            Academic Details
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Class</span>
                                </div>
                                <span className="text-sm font-medium text-foreground">{user.profileId?.class || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <Award className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Board</span>
                                </div>
                                <span className="text-sm font-medium text-foreground">{user.profileId?.board || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Goal</span>
                                </div>
                                <span className="text-sm font-medium text-foreground">
                                    {user.profileId?.exams?.join(", ") || "N/A"}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Logout Button */}
                <div className="px-4 mb-6">
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-3 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4" />
                        Log Out
                    </Button>
                </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
                <div className="container mx-auto px-4 pt-6">
                    <div className="mb-6">
                        <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-full gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Left Column - Profile Header */}
                        <div className="lg:col-span-1">
                            <Card className="p-6 text-center shadow-lg border-0 bg-gradient-to-br from-primary/5 to-primary/10">
                                <div className="relative mb-6">
                                    <div className="mx-auto w-32 h-32 rounded-full border-4 border-background shadow-xl flex items-center justify-center overflow-hidden bg-primary/10">
                                        {user.imageId?.key ? (
                                            <img src={`${user.imageId.baseUrl}${user.imageId.key}`} alt={user.firstName} className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="h-16 w-16 text-primary" />
                                        )}
                                    </div>
                                    <Badge className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/2 bg-emerald-500 text-white border-2 border-background">
                                        {user.status || "Active"}
                                    </Badge>
                                </div>

                                <h2 className="text-2xl font-bold text-foreground mb-2">
                                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "User"}
                                </h2>
                                <p className="text-sm text-muted-foreground mb-6">{user.email || "No email provided"}</p>

                                {/* Quick Stats */}
                                <div className="space-y-3">
                                    <div className="p-4 rounded-xl bg-background/50">
                                        <div className="text-xl font-bold text-primary">{user.profileId?.coins?.totalCoins || 0}</div>
                                        <div className="text-xs text-muted-foreground">Total Coins</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-background/50">
                                        <div className="text-xl font-bold text-emerald-600">₹{user.profileId?.wallet || 0}</div>
                                        <div className="text-xs text-muted-foreground">Wallet Balance</div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-background/50">
                                        <div className="text-lg font-bold text-foreground">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Member Since</div>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start gap-3 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/10"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Log Out
                                    </Button>
                                </div>
                            </Card>
                        </div>

                        {/* Right Column - User Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Personal Information */}
                            <Card className="p-8 shadow-lg border-0">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Personal Information
                                </h3>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Mail className="h-4 w-4" /> Email Address
                                        </label>
                                        <p className="font-medium text-foreground">{user.email || "N/A"}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Phone className="h-4 w-4" /> Mobile Number
                                        </label>
                                        <p className="font-medium text-foreground">
                                            {user.primaryNumber ? `${user.countryCode || "+91"} ${user.primaryNumber}` : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Academic Details */}
                            <Card className="p-8 shadow-lg border-0">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                    Academic Details
                                </h3>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Users className="h-4 w-4" /> Class
                                        </label>
                                        <p className="font-medium text-foreground">{user.profileId?.class || "N/A"}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Award className="h-4 w-4" /> Board
                                        </label>
                                        <p className="font-medium text-foreground">{user.profileId?.board || "N/A"}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Target className="h-4 w-4" /> Goal/Exam
                                        </label>
                                        <p className="font-medium text-foreground">
                                            {user.profileId?.exams?.join(", ") || "N/A"}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-4 w-4" /> Member Since
                                        </label>
                                        <p className="font-medium text-foreground">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
