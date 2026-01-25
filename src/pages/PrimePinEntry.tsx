import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Shield, Lock, Unlock } from "lucide-react";
import Navbar from "@/components/Navbar";
import BackButton from "@/components/BackButton";

const PrimePinEntry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pin, setPin] = useState("");
  const [showPinError, setShowPinError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get the intended destination from location state
  const intendedDestination = location.state?.from || "/primehub";

  useEffect(() => {
    // Always show PIN entry page - no localStorage check
  }, []);

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      setShowPinError(true);
      setTimeout(() => setShowPinError(false), 2000);
      return;
    }

    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    if (pin === "2000") {
      // Set session to indicate successful authentication
      sessionStorage.setItem('primehub-session', 'true');
      setShowPinError(false);
      setPin("");
      
      // Navigate to intended destination
      navigate(intendedDestination);
    } else {
      setShowPinError(true);
      setTimeout(() => setShowPinError(false), 2000);
    }
    
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
      setShowPinError(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handlePinSubmit();
    } else if (e.key === "Escape") {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-28 pt-6 md:pb-12">
        <div className="mb-6">
          <BackButton label="Back" />
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Card className="w-full max-w-md p-8 shadow-2xl border-2 border-primary/20">
            <div className="text-center space-y-6">
              {/* 18+ Warning Icon */}
              <div className="mx-auto w-20 h-20 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-10 h-10 text-white" />
                <span className="absolute text-white font-bold text-lg">18+</span>
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">PrimeHub Access</h1>
                <p className="text-muted-foreground text-sm">
                  This content contains mature material. Enter your PIN to continue.
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="Enter 4-digit PIN"
                    value={pin}
                    onChange={handleInputChange}
                    className="text-center text-lg tracking-widest"
                    maxLength={4}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    disabled={isLoading}
                  />
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>

                {showPinError && (
                  <div className="text-red-500 text-sm flex items-center justify-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Incorrect PIN. Access denied.
                  </div>
                )}

                <Button 
                  onClick={handlePinSubmit}
                  className="w-full bg-gradient-primary hover:opacity-90"
                  size="lg"
                  disabled={isLoading || pin.length !== 4}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Verifying...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Unlock className="w-4 h-4" />
                      Unlock PrimeHub
                    </div>
                  )}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Shield className="w-3 h-3" />
                Age-restricted content. Enter responsibly.
              </div>

              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel and go back
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrimePinEntry;
