import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DepartmentBadge } from "./DepartmentBadge";
import { StatusIndicator } from "./StatusIndicator";
import { SourceBadge } from "./SourceBadge";
import { type Ticket, getOverallTicketStatus, getTicketSections, deleteTicket } from "@/lib/store";
import { Eye, Edit, Mail, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface TicketCardProps {
  ticket: Ticket;
  className?: string;
  onDelete?: () => void;
}

export function TicketCard({ ticket, className, onDelete }: TicketCardProps) {
  const { toast } = useToast();
  const overallStatus = getOverallTicketStatus(ticket.id);
  const sections = getTicketSections(ticket.id);
  const pendingSections = sections.filter(s => s.status === "pending");
  const approvedSections = sections.filter(s => s.status === "approved");

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`Are you sure you want to delete "${ticket.subject}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteTicket(ticket.id);
      toast({
        title: "Ticket Deleted",
        description: `"${ticket.subject}" has been deleted.`,
      });
      onDelete?.();
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete ticket. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success-10 text-success border-success-20";
      case "in_progress":
        return "bg-primary-10 text-primary border-primary-20";
      case "draft":
        return "bg-warning-10 text-warning border-warning-20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-foreground line-clamp-2">
            {ticket.subject}
          </CardTitle>
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            <Badge 
              variant="outline" 
              className={cn(getStatusBadgeVariant(overallStatus))}
            >
              {overallStatus.replace("_", " ")}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDelete}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {ticket.departments.map((dept) => (
            <DepartmentBadge key={dept} department={dept} />
          ))}
          <SourceBadge source={(ticket as any).source} />
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <strong>From:</strong> {ticket.from}
          </div>
          
          <div className="text-sm text-foreground line-clamp-3">
            {ticket.body}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>Gating: {ticket.gatingMode}</span>
              <span>{sections.length} sections</span>
            </div>
            <div className="flex items-center gap-2">
              {pendingSections.length > 0 && (
                <span className="text-warning">{pendingSections.length} pending</span>
              )}
              {approvedSections.length > 0 && (
                <span className="text-success">{approvedSections.length} approved</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 flex justify-between">
        <div className="flex gap-2">
          {pendingSections.length > 0 && (
            <Link to={`/review/${ticket.id}`}>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-1" />
                Review
              </Button>
            </Link>
          )}
          
          {overallStatus === "completed" && (
            <Link to={`/assemble/${ticket.id}`}>
              <Button size="sm" variant="default">
                <Mail className="h-4 w-4 mr-1" />
                Assemble
              </Button>
            </Link>
          )}
        </div>

        <Button size="sm" variant="ghost" asChild>
          <Link to={`/ticket/${ticket.id}`}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}