import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Section, DeptKey, DeptStatus } from "@/lib/store";
import { store } from "@/lib/store";
import { departments, getDepartment } from "@/lib/departments";
import { DepartmentBadge } from "@/components/DepartmentBadge";
import { CheckCircle, Clock, AlertCircle, ArrowRight, Users } from "lucide-react";

interface DepartmentProgress {
  department: DeptKey;
  pending: number;
  approved: number;
  total: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

export default function DepartmentSelection() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [departmentProgress, setDepartmentProgress] = useState<DepartmentProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticketId) return;

    const loadTicketData = () => {
      const ticketData = store.getTicket(ticketId);
      if (!ticketData) return;

      setTicket(ticketData);

      // Calculate progress for each department
      const progress: DepartmentProgress[] = ticketData.departments.map(deptKey => {
        const sections = store.getTicketSections(ticketId).filter(s => s.department === deptKey);
        const pending = sections.filter(s => s.status === 'pending' || s.status === 'annotated').length;
        const approved = sections.filter(s => s.status === 'approved').length;
        const total = sections.length;

        let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
        if (approved === total && total > 0) {
          status = 'completed';
        } else if (approved > 0 || pending > 0) {
          status = 'in_progress';
        }

        return {
          department: deptKey,
          pending,
          approved,
          total,
          status
        };
      });

      setDepartmentProgress(progress);
      setLoading(false);
    };

    loadTicketData();

    // Refresh data periodically (simple approach without subscription)
    const interval = setInterval(loadTicketData, 2000);
    return () => clearInterval(interval);
  }, [ticketId]);

  const getStatusIcon = (status: 'not_started' | 'in_progress' | 'completed') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'in_progress':
        return <Clock className="w-5 h-5 text-warning" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: 'not_started' | 'in_progress' | 'completed') => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Complete</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Ticket not found</p>
      </div>
    );
  }

  const totalSections = departmentProgress.reduce((sum, dept) => sum + dept.total, 0);
  const totalApproved = departmentProgress.reduce((sum, dept) => sum + dept.approved, 0);
  const totalPending = departmentProgress.reduce((sum, dept) => sum + dept.pending, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Dashboard</Link>
            <span>→</span>
            <Link to={`/ticket/${ticketId}`} className="hover:text-foreground">Ticket Detail</Link>
            <span>→</span>
            <span>Department Reviews</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>From: {ticket.from}</span>
              <span>•</span>
              <span>Created: {ticket.createdAt.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Review Progress
            </h2>
            <div className="text-sm text-muted-foreground">
              {totalApproved} of {totalSections} sections approved
            </div>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalSections > 0 ? (totalApproved / totalSections) * 100 : 0}%` }}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">{totalApproved}</div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{totalPending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalSections}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </div>
        </Card>

        {/* Department Cards */}
        <div className="grid gap-4">
          <h2 className="text-lg font-semibold">Select Department to Review</h2>
          
          {departmentProgress.map((dept) => {
            const department = getDepartment(dept.department);
            const canReview = dept.pending > 0;
            
            return (
              <Card key={dept.department} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(dept.status)}
                      <DepartmentBadge department={dept.department} />
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-semibold">{department.name}</h3>
                      <p className="text-sm text-muted-foreground">{department.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-success">{dept.approved} approved</span>
                        {dept.pending > 0 && (
                          <span className="text-warning">{dept.pending} pending</span>
                        )}
                      </div>
                      {getStatusBadge(dept.status)}
                    </div>
                    
                    <Button
                      variant={canReview ? "default" : "outline"}
                      disabled={!canReview}
                      asChild={canReview}
                    >
                      {canReview ? (
                        <Link 
                          to={`/review/${ticketId}/${dept.department}`}
                          className="flex items-center gap-2"
                        >
                          Review Sections <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <span className="flex items-center gap-2">
                          {dept.status === 'completed' ? 'Complete' : 'No Sections'}
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" asChild>
            <Link to={`/ticket/${ticketId}`}>Back to Ticket</Link>
          </Button>
          
          {totalPending === 0 && totalApproved > 0 && (
            <Button asChild>
              <Link to={`/assemble/${ticketId}`} className="flex items-center gap-2">
                Assemble Final Response <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}