import { Badge } from "@/components/ui/badge";
import { getDepartment } from "@/lib/departments";
import { type DeptKey } from "@/lib/store";
import { cn } from "@/lib/utils";

interface DepartmentBadgeProps {
  department: DeptKey;
  className?: string;
}

export function DepartmentBadge({ department, className }: DepartmentBadgeProps) {
  const dept = getDepartment(department);
  
  // Add safety check to prevent crashes
  if (!dept) {
    console.error(`DepartmentBadge: Invalid department key: ${department}`);
    return (
      <Badge variant="outline" className={cn("text-xs font-medium bg-muted text-muted-foreground", className)}>
        Unknown
      </Badge>
    );
  }
  
  const getVariantClass = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-primary-10 text-primary border-primary-20";
      case "green":
        return "bg-success-10 text-success border-success-20";
      case "purple":
        return "bg-professional-10 text-professional border-professional-20";
      case "orange":
        return "bg-fresh-10 text-fresh border-fresh-20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs font-medium",
        getVariantClass(dept.color),
        className
      )}
    >
      {dept.name}
    </Badge>
  );
}