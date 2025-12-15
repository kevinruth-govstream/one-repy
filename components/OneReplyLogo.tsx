import { cn } from "@/lib/utils";

interface OneReplyLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function OneReplyLogo({ className, size = "md" }: OneReplyLogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-16"
  };
  
  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl", 
    lg: "text-3xl"
  };

  return (
    <div className={cn("flex items-center space-x-3", className)}>
      {/* Diverge → Converge flow logo */}
      <div className={cn("relative", sizeClasses[size])}>
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="flowGradient" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
          </defs>
          
          {/* Main diverge → converge flow path */}
          <path
            d="M 6 20 
               Q 12 20 14 18
               Q 16 16 18 14
               Q 20 12 22 14
               Q 24 16 26 18
               Q 28 20 34 20
               L 32 18
               M 34 20
               L 32 22"
            stroke="url(#flowGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Secondary flow path */}
          <path
            d="M 14 20
               Q 16 22 18 24
               Q 20 26 22 24
               Q 24 22 26 20"
            stroke="url(#flowGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.7"
          />
          
          {/* Tertiary flow path */}
          <path
            d="M 16 20
               Q 18 20 20 20
               Q 22 20 24 20"
            stroke="url(#flowGradient)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.5"
          />
        </svg>
      </div>
      
      {/* WordMark */}
      <h1 className={cn(
        "font-bold text-foreground tracking-tight",
        textSizeClasses[size]
      )}>
        One<span className="text-primary">Reply</span>
      </h1>
    </div>
  );
}