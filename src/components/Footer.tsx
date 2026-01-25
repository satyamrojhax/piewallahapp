import React from "react";

const Footer: React.FC = () => {
    const openInstagram = (e: React.MouseEvent) => {
        e.preventDefault();
        window.open("https://instagram.com/satyamrojha.dev", "_blank", "noopener,noreferrer");
    };

    return (
        <footer className="mt-auto border-t border-border/50 bg-background/80 backdrop-blur-xl py-8">
            <div className="container mx-auto px-6">
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                        <span>Designed and developed by </span>
                        <a
                            href="https://instagram.com/satyamrojha.dev"
                            onClick={openInstagram}
                            className="font-medium text-foreground hover:text-foreground/80 transition-colors duration-200"
                            aria-label="Open Satyam RojhaX instagram"
                        >
                            Satyam RojhaX
                        </a>
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground/70">
                        © 2026 Pie Wallah. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
