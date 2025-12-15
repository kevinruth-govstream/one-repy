import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { Section } from '@/lib/store';

interface StatusAlertProps {
  sections: Section[];
  ticketId: string;
}

export const StatusAlert = ({ sections, ticketId }: StatusAlertProps) => {
  const pendingCount = sections.filter(s => s.status === 'pending').length;
  const approvedCount = sections.filter(s => s.status === 'approved').length;
  const annotatedCount = sections.filter(s => s.status === 'annotated').length;
  const lockedCount = sections.filter(s => s.status === 'locked').length;
  
  // Calculate total reviewed count (approved + locked)
  const reviewedCount = approvedCount + lockedCount;
  const needsReviewCount = pendingCount + annotatedCount;
  
  if (needsReviewCount === 0) {
    return (
      <Alert className="bg-green-50 border-green-200 text-green-800">
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>All Sections Reviewed</AlertTitle>
        <AlertDescription>
          All {reviewedCount} sections have been reviewed and are ready for email assembly.
        </AlertDescription>
      </Alert>
    );
  }

  if (pendingCount > 0 || annotatedCount > 0) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
        <Clock className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          Review Needed
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {pendingCount} pending
            </Badge>
          )}
          {annotatedCount > 0 && (
            <Badge variant="outline" className="bg-orange-100 text-orange-800">
              {annotatedCount} annotated
            </Badge>
          )}
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>
            {pendingCount > 0 && `${pendingCount} section${pendingCount !== 1 ? 's' : ''} still need${pendingCount === 1 ? 's' : ''} review`}
            {pendingCount > 0 && annotatedCount > 0 && ' and '}
            {annotatedCount > 0 && `${annotatedCount} section${annotatedCount !== 1 ? 's' : ''} have annotations to review`}.
            Complete the review process to enable full email assembly.
          </span>
          <Button asChild size="sm" className="ml-4">
            <Link to={`/review/${ticketId}`}>
              Review Sections
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};