import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { StatusIndicator } from "@/components/StatusIndicator";
import { DepartmentBadge } from "@/components/DepartmentBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { store, getTicketSections, getOverallTicketStatus, type Ticket, type Section } from "@/lib/store";
import { departments } from "@/lib/departments";
import { 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  Calendar, 
  Mail, 
  Users, 
  BarChart3,
  AlertCircle,
  Archive,
  Edit3
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const TicketDetail = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticketId) {
      navigate('/');
      return;
    }

    try {
      const foundTicket = store.getTicket(ticketId);
      if (!foundTicket) {
        toast({
          title: "Ticket not found",
          description: "The requested ticket could not be found.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      setTicket(foundTicket);
      setSections(getTicketSections(ticketId));
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast({
        title: "Error loading ticket",
        description: "There was an error loading the ticket details.",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [ticketId, navigate]);

  // Calculate progress and status metrics
  const statusMetrics = useMemo(() => {
    if (!sections.length) return { progress: 0, counts: {} };

    const counts = sections.reduce((acc, section) => {
      acc[section.status] = (acc[section.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalSections = sections.length;
    const completedSections = (counts.approved || 0) + (counts.locked || 0);
    const progress = totalSections > 0 ? (completedSections / totalSections) * 100 : 0;

    return { progress, counts, totalSections, completedSections };
  }, [sections]);

  // Determine next actions based on ticket state
  const nextActions = useMemo(() => {
    if (!ticket || !sections.length) return [];

    const overallStatus = getOverallTicketStatus(ticket.id);
    const pendingSections = sections.filter(s => s.status === 'pending');
    const annotatedSections = sections.filter(s => s.status === 'annotated');

    if (pendingSections.length > 0 || annotatedSections.length > 0) {
      return [
        {
          label: "Review by Department",
          href: `/departments/${ticket.id}`,
          variant: "default" as const,
          icon: Users,
          description: `${pendingSections.length + annotatedSections.length} sections need review`
        },
        {
          label: "Quick Review",
          href: `/review/${ticket.id}`,
          variant: "outline" as const,
          icon: Edit3,
          description: "Review all sections in sequence"
        }
      ];
    }

    if (overallStatus === 'completed') {
      return [{
        label: "Assemble Email",
        href: `/assemble/${ticket.id}`,
        variant: "default" as const,
        icon: Mail,
        description: "All sections are ready for assembly"
      }];
    }

    return [];
  }, [ticket, sections]);

  // Group sections by department
  const sectionsByDepartment = useMemo(() => {
    return sections.reduce((acc, section) => {
      if (!acc[section.department]) {
        acc[section.department] = [];
      }
      acc[section.department].push(section);
      return acc;
    }, {} as Record<string, Section[]>);
  }, [sections]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-96" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Ticket not found</h1>
          <p className="text-muted-foreground">The requested ticket could not be found.</p>
          <Button asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-6 py-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{ticket.subject}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Header */}
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-xl">{ticket.subject}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {ticket.from}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {ticket.createdAt.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <StatusIndicator status={getOverallTicketStatus(ticket.id) === 'completed' ? 'approved' : 'pending'} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Progress Overview */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Review Progress</span>
                      <span className="text-muted-foreground">
                        {statusMetrics.completedSections} of {statusMetrics.totalSections} sections complete
                      </span>
                    </div>
                    <Progress value={statusMetrics.progress} className="h-2" />
                  </div>

                  {/* Departments Involved */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-medium text-sm">Departments Involved</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ticket.departments.map((dept) => (
                        <DepartmentBadge key={dept} department={dept} />
                      ))}
                    </div>
                  </div>

                  {/* Gating Mode */}
                  <div className="flex items-center gap-2 text-sm">
                    <BarChart3 className="h-4 w-4" />
                    <span className="font-medium">Gating Mode:</span>
                    <Badge variant="outline" className="capitalize">
                      {ticket.gatingMode}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Alert */}
            {nextActions.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    {nextActions[0].description}
                  </span>
                  <Button asChild size="sm" className="ml-4">
                    <Link to={nextActions[0].href}>
                      {nextActions[0].label}
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Sections by Department */}
            <Card>
              <CardHeader>
                <CardTitle>Section Status by Department</CardTitle>
                <CardDescription>
                  Track the progress of each department's review sections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(sectionsByDepartment).map(([dept, deptSections]) => (
                  <div key={dept} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <DepartmentBadge department={dept as any} />
                      <div className="text-sm text-muted-foreground">
                        {deptSections.filter(s => ['approved', 'locked'].includes(s.status)).length} of {deptSections.length} complete
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {deptSections.map((section) => (
                        <div key={section.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                          <div className="space-y-1">
                            <div className="font-medium text-sm capitalize">
                              {section.sectionKey.replace('_', ' ')}
                            </div>
                            <StatusIndicator status={section.status} showIcon={false} className="text-xs" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Ticket Body */}
            <Card>
              <CardHeader>
                <CardTitle>Original Request</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                    {ticket.body}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {nextActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button key={index} asChild variant={action.variant} className="w-full justify-start">
                      <Link to={action.href}>
                        <Icon className="h-4 w-4 mr-2" />
                        {action.label}
                      </Link>
                    </Button>
                  );
                })}
                
                <Separator />
                
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link to="/archive">
                    <Archive className="h-4 w-4 mr-2" />
                    View Archive
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Status Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Status Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {Object.entries(statusMetrics.counts).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <StatusIndicator status={status as any} />
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;