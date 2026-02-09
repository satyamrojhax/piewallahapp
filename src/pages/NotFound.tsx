import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Linkedin, Instagram, Github } from "lucide-react";
import "@/config/firebase";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <div className="flex-grow flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center shadow-lg transition-shadow hover:shadow-xl">
          <h1 className="mb-4 text-5xl font-extrabold text-primary">404</h1>
          <p className="mb-4 text-lg text-muted-foreground">Oops! The page you’re looking for doesn’t exist.</p>
          <Button asChild className="bg-gradient-primary hover:opacity-90">
            <a href="/" className="inline-block w-full">
              Return to Home
            </a>
          </Button>
        </Card>
        <div className="mt-8 text-center">
          <div className="text-sm text-muted-foreground mb-2">Developer</div>
          <div className="flex flex-col items-center gap-1">
            <div className="font-medium text-foreground">Satyam RojhaX</div>
            <a href="https://instagram.com/satyamrojha.dev" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
              @SatyamRojhaX
            </a>
            <div className="mt-3 flex items-center gap-4">
              <a href="https://www.linkedin.com/in/satyamrojhax" target="_blank" rel="noopener noreferrer" className="hover:opacity-90">
                <Linkedin className="h-5 w-5 text-muted-foreground" />
              </a>
              <a href="https://instagram.com/satyamrojha.dev" target="_blank" rel="noopener noreferrer" className="hover:opacity-90">
                <Instagram className="h-5 w-5 text-muted-foreground" />
              </a>
              <a href="https://github.com/satyamrojhax" target="_blank" rel="noopener noreferrer" className="hover:opacity-90">
                <Github className="h-5 w-5 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
