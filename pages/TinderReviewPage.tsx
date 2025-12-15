import { useParams } from 'react-router-dom';
import { TinderReview } from '@/components/OptimizedTinderReview';

const TinderReviewPage = () => {
  const { ticketId, department } = useParams<{ ticketId: string; department?: string }>();

  if (!ticketId) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Ticket ID not found</p>
      </div>
    );
  }

  return <TinderReview ticketId={ticketId} department={department as any} />;
};

export default TinderReviewPage;