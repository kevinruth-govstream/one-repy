import { Badge } from "@/components/ui/badge";
import { type DeptStatus } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, Lock, AlertCircle } from "lucide-react";

interface StatusIndicatorProps {
  status: DeptStatus;
  className?: string;
  showIcon?: boolean;
}

export function StatusIndicator({ status, className, showIcon = true }: StatusIndicatorProps) {
  const getStatusConfig = (status: DeptStatus) => {
    switch (status) {
      case "pending":
        return {
          label: "Pending",
          icon: Clock,
          className: "bg-warning-10 text-warning border-warning-20"
        };
      case "annotated":
        return {
          label: "Annotated",
          icon: AlertCircle,
          className: "bg-primary-10 text-primary border-primary-20"
        };
      case "approved":
        return {
          label: "Approved",
          icon: CheckCircle,
          className: "bg-success-10 text-success border-success-20"
        };
      case "locked":
        return {
          label: "Locked",
          icon: Lock,
          className: "bg-professional-10 text-professional border-professional-20"
        };
      case "omitted":
        return {
          label: "Omitted",
          icon: AlertCircle,
          className: "bg-muted text-muted-foreground border-muted"
        };
      default:
        return {
          label: "Unknown",
          icon: AlertCircle,
          className: "bg-muted text-muted-foreground"
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