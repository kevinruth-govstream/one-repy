import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, Package, FileText } from "lucide-react";

interface TicketStatusIndicatorProps {
  status: 'drafting' | 'reviewing' | 'ready' | 'assembled';
  className?: string;
  showIcon?: boolean;
}

export function TicketStatusIndicator({ status, className, showIcon = true }: TicketStatusIndicatorProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "drafting":
        return {
          label: "Drafting",
          icon: FileText,
          className: "bg-gray-100 text-gray-800 border-gray-200"
        };
      case "reviewing":
        return {
          label: "In Review",
          icon: Clock,
          className: "bg-blue-100 text-blue-800 border-blue-200"
        };
      case "ready":
        return {
          label: "Ready",
          icon: CheckCircle,
          className: "bg-green-100 text-green-800 border-green-200"
        };
      case "assembled":
        return {
          label: "Assembled",
          icon: Package,
          className: "bg-purple-100 text-purple-800 border-purple-200"
        };
      default:
        return {
          label: "Unknown",
          icon: FileText,
          className: "bg-gray-100 text-gray-800 border-gray-200"
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs font-medium flex items-center gap-1",
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
}