import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Mail, Globe, User } from 'lucide-react';

interface SourceBadgeProps {
  source?: string;
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ source, className }) => {
  if (!source) return null;

  const getSourceDisplay = (source: string) => {
    switch (source) {
      case 'outlook_graph':
        return {
          label: 'Email Import',
          icon: Mail,
          variant: 'secondary' as const
        };
      case 'outlook_flow':
        return {
          label: 'Email Intake',
          icon: Mail,
          variant: 'secondary' as const
        };
      case 'manual':
        return {
          label: 'Manual Entry',
          icon: User,
          variant: 'outline' as const
        };
      default:
        return {
          label: 'System',
          icon: Globe,
          variant: 'outline' as const
        };
    }
  };

  const { label, icon: Icon, variant } = getSourceDisplay(source);

  return (
    <Badge variant={variant} className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
};