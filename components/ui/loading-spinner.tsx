import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "muted";
}

export function LoadingSpinner({ 
  className, 
  size = "md", 
  variant = "primary" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8"
  };

  const variantClasses = {
    primary: "text-primary",
    secondary: "text-secondary",
    muted: "text-muted-foreground"
  };

  return (
    <div className={cn("relative", sizeClasses[size], className)}>
      <svg
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <defs>
          <linearGradient id="oneReplyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.6" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Outer ring */}
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2"
        />
        
        {/* Spinning arc with gradient */}
        <path
          className="opacity-75"
          fill="none"
          stroke="url(#oneReplyGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          d="M12 2a10 10 0 0 1 8.66 5"
        />
        
        {/* Center OneReply symbol */}
        <g className="opacity-60">
          <circle cx="9" cy="12" r="2" fill="currentColor" fillOpacity="0.3" />
          <circle cx="15" cy="12" r="2" fill="currentColor" fillOpacity="0.3" />
          <ellipse cx="12" cy="12" rx="1" ry="2" fill="currentColor" fillOpacity="0.8" />
        </g>
      </svg>
    </div>
  );
}