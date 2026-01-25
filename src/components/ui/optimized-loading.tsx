import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OptimizedLoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
  showText?: boolean;
}

const OptimizedLoading = ({ 
  size = "md", 
  text = "Loading...", 
  className,
  showText = true 
}: OptimizedLoadingProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm", 
    lg: "text-base"
  };

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {showText && (
        <span className={cn("text-muted-foreground animate-pulse", textSizeClasses[size])}>
          {text}
        </span>
      )}
    </div>
  );
};

export default OptimizedLoading;
