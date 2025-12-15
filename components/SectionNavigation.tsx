import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, List, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { type Section } from "@/lib/store";
import { DepartmentBadge } from "./DepartmentBadge";

interface SectionNavigationProps {
  currentSection: Section;
  allSections: Section[];
  pendingSections: Section[];
}

export function SectionNavigation({ 
  currentSection, 
  allSections,
  pendingSections 
}: SectionNavigationProps) {
  const currentIndex = pendingSections.findIndex(s => s.id === currentSection.id);
  const prevSection = currentIndex > 0 ? pendingSections[currentIndex - 1] : null;
  const nextSection = currentIndex < pendingSections.length - 1 ? pendingSections[currentIndex + 1] : null;
  
  const totalSections = allSections.length;
  const approvedSections = allSections.filter(s => s.status === 'approved').length;
  const progressPercentage = (approvedSections / totalSections) * 100;

  const getStatusIcon = (section: Section) => {
    switch (section.status) {
      case 'approved':
        return <CheckCircle className="h-3 w-3 text-success" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-warning" />;
      case 'annotated':
        return <AlertTriangle className="h-3 w-3 text-primary" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const formatSectionTitle = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Review Progress</CardTitle>
          </div>
          <Badge variant="outline" className="bg-primary-10 text-primary border-primary-20">
            {currentIndex + 1} of {pendingSections.length} pending
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground font-medium">Overall Progress</span>
            <span className="text-muted-foreground">
              {approvedSections}/{totalSections} sections approved
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Navigation Controls */}
        <div className="flex gap-2">
          {prevSection ? (
            <Button asChild variant="outline" className="flex-1">
              <Link to={`/section-review/${prevSection.id}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Link>
            </Button>
          ) : (
            <Button variant="outline" disabled className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
          )}

          {nextSection ? (
            <Button asChild variant="outline" className="flex-1">
              <Link to={`/section-review/${nextSection.id}`}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" disabled className="flex-1">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Current Section Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Current Section</h3>
          <div className="p-3 bg-primary-10/50 rounded-lg border border-primary-20">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-foreground">
                {formatSectionTitle(currentSection.sectionKey)}
              </h4>
              {getStatusIcon(currentSection)}
            </div>
            <DepartmentBadge department={currentSection.department} className="mb-2" />
            <p className="text-xs text-muted-foreground">
              Created {currentSection.createdAt.toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* All Sections Overview */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">All Sections</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {allSections.map((section) => (
              <div
                key={section.id}
                className={`p-2 rounded border text-xs ${
                  section.id === currentSection.id
                    ? 'bg-primary-10 border-primary-20'
                    : 'bg-muted/50 border-border hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">
                        {formatSectionTitle(section.sectionKey)}
                      </span>
                      {getStatusIcon(section)}
                    </div>
                    <div className="flex items-center gap-1">
                      <DepartmentBadge 
                        department={section.department} 
                        className="text-xs py-0 px-1 h-auto"
                      />
                    </div>
                  </div>
                  {section.status === 'pending' && section.id !== currentSection.id && (
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                    >
                      <Link to={`/section-review/${section.id}`}>
                        Review
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <Button asChild variant="outline" className="w-full">
            <Link to="/">
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}