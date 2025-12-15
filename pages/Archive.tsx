import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DepartmentBadge } from "@/components/DepartmentBadge";
import { TicketStatusIndicator } from "@/components/TicketStatusIndicator";
import { getAllTickets } from "@/lib/store";
import { Search, Mail, Download, Eye, Calendar } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AssembledEmail {
  ticketId: string;
  subject: string;
  html: string;
  assembledAt: string;
}

export default function Archive() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedEmail, setSelectedEmail] = useState<AssembledEmail | null>(null);

  // Get all tickets and filter
  const allTickets = getAllTickets();
  const filteredTickets = allTickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.from?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get assembled emails from localStorage
  const getAssembledEmail = (ticketId: string): AssembledEmail | null => {
    try {
      const stored = localStorage.getItem(`assembled_${ticketId}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const handleDownloadEmail = (email: AssembledEmail) => {
    const blob = new Blob([email.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${email.subject.replace(/[^a-z0-9]/gi, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Email Downloaded",
      description: "HTML file saved to downloads."
    });
  };

  const handleCopyToClipboard = (html: string) => {
    navigator.clipboard.writeText(html).then(() => {
      toast({
        title: "HTML Copied",
        description: "Email HTML copied to clipboard."
      });
    });
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ticket Archive</h1>
          <p className="text-muted-foreground mt-2">
            View completed tickets and assembled emails
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickets</SelectItem>
                  <SelectItem value="assembled">Assembled</SelectItem>
                  <SelectItem value="reviewing">In Review</SelectItem>
                  <SelectItem value="drafting">Drafting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{allTickets.length}</div>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {allTickets.filter(t => t.status === 'assembled').length}
              </div>
              <p className="text-sm text-muted-foreground">Assembled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                {allTickets.filter(t => t.status === 'reviewing').length}
              </div>
              <p className="text-sm text-muted-foreground">In Review</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-600">
                {allTickets.filter(t => getAssembledEmail(t.id)).length}
              </div>
              <p className="text-sm text-muted-foreground">Assembled Emails</p>
            </CardContent>
          </Card>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No tickets found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            filteredTickets.map((ticket) => {
              const assembledEmail = getAssembledEmail(ticket.id);
              return (
                <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {ticket.createdAt.toLocaleDateString()}
                          {ticket.from && (
                            <>
                              <span>•</span>
                              <span>{ticket.from}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TicketStatusIndicator status={ticket.status} />
                        {assembledEmail && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Mail className="h-3 w-3 mr-1" />
                            Assembled
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Departments */}
                      <div className="flex flex-wrap gap-2">
                        {ticket.departments.map((dept) => (
                          <DepartmentBadge key={dept} department={dept} />
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {assembledEmail && (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedEmail(assembledEmail)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview Email
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                                <DialogHeader>
                                  <DialogTitle>{assembledEmail.subject}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleDownloadEmail(assembledEmail)}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      Download HTML
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCopyToClipboard(assembledEmail.html)}
                                    >
                                      Copy HTML
                                    </Button>
                                  </div>
                                  <div
                                    className="border rounded-lg p-4 bg-white"
                                    dangerouslySetInnerHTML={{ __html: assembledEmail.html }}
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadEmail(assembledEmail)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}