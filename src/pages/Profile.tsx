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
    MapPin,
    Award,
    CreditCard,
    History,
    FileText,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { getUserProfile, logout } from "@/lib/auth";
import { ProfileSkeleton } from "@/components/ui/skeleton-loaders";
import TermsAndPrivacy from "@/components/profile/TermsAndPrivacy";

const Profile = () => {
    const navigate = useNavigate();
    const [showTerms, setShowTerms] = useState(false);
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

                const response = await getUserProfile(token);
                if (response?.data?.data) {
                    const freshUserData = response.data.data;
                    setUser(freshUserData);
                    localStorage.setItem("user_data", JSON.stringify(freshUserData));
                } else {
                    const userData = localStorage.getItem("user_data");
                    if (userData) {
                        const parsedUser = JSON.parse(userData);
                        setUser(parsedUser);
                    }
                }
            } catch (error) {
                const userData = localStorage.getItem("user_data");
                if (userData) {
                    try {
                        const parsedUser = JSON.parse(userData);
                        setUser(parsedUser);
                    } catch (parseError) {
                        // Error parsing user data
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
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 py-20 text-center">
                    <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow">
                        <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Not Logged In</h2>
                        <p className="text-gray-600 mb-6">Please log in to view your profile.</p>
                        <button 
                            onClick={() => navigate("/login")} 
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <button 
                        onClick={handleBack} 
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - User Overview */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="text-center mb-6">
                                <div className="mx-auto w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                                    {user.imageId?.key ? (
                                        <img 
                                            src={`${user.imageId.baseUrl}${user.imageId.key}`} 
                                            alt={user.firstName} 
                                            className="w-full h-full rounded-full object-cover" 
                                        />
                                    ) : (
                                        <User className="h-10 w-10 text-gray-500" />
                                    )}
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-1">
                                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "User"}
                                </h2>
                                <p className="text-gray-600 mb-4">{user.email || "No email provided"}</p>
                                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    {user.status || "Active"}
                                </span>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 flex items-center justify-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                Log Out
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="bg-white p-6 rounded-lg shadow mt-6">
                            <h3 className="text-sm font-semibold text-gray-600 uppercase mb-4">Academic Progress</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-blue-50 rounded">
                                    <div className="text-2xl font-bold text-blue-600">{user.profileId?.exams?.length || 0}</div>
                                    <div className="text-xs text-blue-600 uppercase">Exams</div>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded">
                                    <div className="text-2xl font-bold text-green-600">{user.profileId?.totalRewards || 0}</div>
                                    <div className="text-xs text-green-600 uppercase">Rewards</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - User Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                Personal Information
                            </h3>

                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Full Name</label>
                                    <p className="text-gray-900">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : "N/A"}</p>
                                </div>

                                <div className="p-3 bg-gray-50 rounded">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Mobile Number</label>
                                    <p className="text-gray-900">{user.primaryNumber ? `${user.countryCode || "+91"} ${user.primaryNumber}` : "N/A"}</p>
                                </div>

                                <div className="p-3 bg-gray-50 rounded">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Email Address</label>
                                    <p className="text-gray-900">{user.email || "N/A"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-blue-600" />
                                Academic Details
                            </h3>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="p-3 bg-gray-50 rounded">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Class</label>
                                    <p className="text-gray-900">{user.profileId?.class || "N/A"}</p>
                                </div>

                                <div className="p-3 bg-gray-50 rounded">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Board</label>
                                    <p className="text-gray-900">{user.profileId?.board || "N/A"}</p>
                                </div>

                                <div className="p-3 bg-gray-50 rounded">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Goal/Exam</label>
                                    <p className="text-gray-900">{user.profileId?.exams?.join(", ") || "N/A"}</p>
                                </div>

                                <div className="p-3 bg-gray-50 rounded">
                                    <label className="text-xs font-medium text-gray-500 uppercase">Date of Birth</label>
                                    <p className="text-gray-900">{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : "Not specified"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Terms & Privacy */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Shield className="h-5 w-5 text-blue-600" />
                                Legal & Privacy
                            </h3>

                            <button
                                onClick={() => setShowTerms(true)}
                                className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-blue-50 rounded-full flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-gray-900">Terms & Privacy Policy</div>
                                        <div className="text-sm text-gray-600">View our terms of service and privacy policy</div>
                                    </div>
                                </div>
                                <ArrowLeft className="h-4 w-4 rotate-180" />
                            </button>
                        </div>

                        {/* Wallet */}
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                                Wallet & Subscription
                            </h3>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="p-4 bg-yellow-50 rounded">
                                    <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Total Coins</label>
                                    <div className="text-2xl font-bold text-yellow-600">{user.profileId?.coins?.totalCoins || 0}</div>
                                </div>
                                <div className="p-4 bg-green-50 rounded">
                                    <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Wallet Balance</label>
                                    <div className="text-2xl font-bold text-green-600">₹{user.profileId?.wallet || 0}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded md:col-span-1">
                                    <label className="text-xs font-medium text-gray-500 uppercase block mb-1">Member Since</label>
                                    <div className="text-lg font-bold text-gray-900">
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GraduationCap = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
);

const Layers = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>
);

const BookOpen = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h6z" /></svg>
);

export default Profile;
