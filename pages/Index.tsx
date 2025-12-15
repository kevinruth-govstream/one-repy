import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { TicketCard } from "@/components/TicketCard";
import { EmptyState } from "@/components/EmptyState";
import { StatusIndicator } from "@/components/StatusIndicator";
import { getAllTickets, getOverallTicketStatus, getTicketSections } from "@/lib/store";
import { departments } from "@/lib/departments";
import { Plus, BarChart3, Clock, CheckCircle, Database, Loader2 } from "lucide-react";
import { InboxIntake } from "@/components/InboxIntake";
import { loadDrivewaySeed } from "@/seed/driveway";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [tickets, setTickets] = React.useState(getAllTickets());
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
  const refreshTickets = () => {
    setTickets(getAllTickets());
  };
  
  // Manual refresh function to bypass store issues
  const refreshFromDatabase = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Manual database refresh...');
      const { data: dbTickets, error } = await supabase.from('tickets').select('*');
      
      if (error) {
        console.error('❌ Manual refresh error:', error);
        toast({
          title: "Refresh Error", 
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log(`✅ Manual refresh found ${dbTickets?.length || 0} tickets`);
      
      // Convert and display database tickets directly
      const convertedTickets = (dbTickets || []).map((dbTicket: any) => ({
        id: dbTicket.id,
        subject: dbTicket.subject,
        from: dbTicket.from_field,
        body: dbTicket.body,
        departments: dbTicket.departments,
        gatingMode: dbTicket.gating_mode,
        status: (dbTicket.status === 'draft' ? 'drafting' : 
                dbTicket.status === 'in_progress' ? 'reviewing' : 'assembled') as 'drafting' | 'reviewing' | 'assembled' | 'ready',
        createdAt: new Date(dbTicket.created_at),
        updatedAt: new Date(dbTicket.updated_at)
      }));
      
      setTickets(convertedTickets);
      
      toast({
        title: "Refreshed Successfully",
        description: `Found ${convertedTickets.length} tickets in database`
      });
      
    } catch (error) {
      console.error('❌ Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Calculate dashboard stats
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter(t => getOverallTicketStatus(t.id) === "completed").length;
  const inProgressTickets = tickets.filter(t => getOverallTicketStatus(t.id) === "in_progress").length;
  const draftTickets = tickets.filter(t => getOverallTicketStatus(t.id) === "draft").length;
  
  const allSections = tickets.flatMap(t => getTicketSections(t.id));
  const pendingSections = allSections.filter(s => s.status === "pending").length;

  const handleLoadDemoData = () => {
    try {
      loadDrivewaySeed();
      toast({
        title: "Demo data loaded",
        description: "Driveway widening request with department reviews has been added.",
      });
      // Trigger a re-render by forcing a state update
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load demo data.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero gradient header */}
      <div className="relative overflow-hidden bg-gradient-vibrant border-b border-primary/30">
        <div className="container mx-auto px-6 py-16 relative z-10">
        {/* Dashboard Header */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-2xl tracking-tight">
            OneReply Dashboard
          </h1>
          <p className="text-white mt-4 text-xl font-medium drop-shadow-lg max-w-2xl mx-auto">
            Coordinate multi-department responses with one unified voice
          </p>
        </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Inbox Intake Section */}
        <div className="mb-8">
          <InboxIntake />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <BarChart3 className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalTickets}</div>
              <p className="text-xs text-muted-foreground">
                Across all departments
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gold/10 to-transparent border-gold/20 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <Clock className="h-4 w-4 text-gold" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold">{pendingSections}</div>
              <p className="text-xs text-muted-foreground">
                Sections awaiting review
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal/10 to-transparent border-teal/20 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-teal" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal">{inProgressTickets}</div>
              <p className="text-xs text-muted-foreground">
                Active requests
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-transparent border-success/20 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{completedTickets}</div>
              <p className="text-xs text-muted-foreground">
                Ready to assemble
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Recent Tickets</h2>
            {tickets.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  Sort
                </Button>
              </div>
            )}
          </div>

          {tickets.length === 0 ? (
            <div className="space-y-4">
              <EmptyState
                title="No requests yet"
                description="Create your first OneReply request to get started with the collaborative response system, or load sample data to see how it works."
              />
              <div className="flex justify-center gap-3">
                <Button
                  onClick={handleLoadDemoData}
                  variant="outline"
                  className="max-w-md"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Load Demo Data
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} onDelete={refreshTickets} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {tickets.length > 0 && (
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common workflows and administrative tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <Link to="/settings">
                      Configure Teams Webhooks
                    </Link>
                  </Button>
                  
                  {pendingSections > 0 && (
                    <Button variant="outline" asChild>
                      <Link to={`/review/${allSections.find(s => s.status === "pending")?.ticketId}`}>
                        Review Pending ({pendingSections})
                      </Link>
                    </Button>
                  )}
                  
                  {completedTickets > 0 && (
                    <Button variant="outline" asChild>
                      <Link to={`/assemble/${tickets.find(t => getOverallTicketStatus(t.id) === "completed")?.id}`}>
                        Assemble Email
                      </Link>
                    </Button>
                  )}
                  
                  {tickets.length > 0 && (
                    <Button variant="outline" asChild>
                      <Link to="/archive">
                        View Archive
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Footer with utility actions */}
        <div className="mt-16 pt-8 border-t border-border">
          <div className="flex justify-center">
            <Button 
              onClick={refreshFromDatabase}
              disabled={isRefreshing}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              {isRefreshing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Database className="h-4 w-4 mr-2" />}
              Refresh from Database
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
