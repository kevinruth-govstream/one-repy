import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Merge, FileText } from 'lucide-react';

interface ConsolidationToggleProps {
  isConsolidated: boolean;
  onToggle: (consolidated: boolean) => void;
  sectionCount: number;
}

export const ConsolidationToggle = ({ 
  isConsolidated, 
  onToggle, 
  sectionCount 
}: ConsolidationToggleProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Content Mode</CardTitle>
            <Badge variant="outline">
              {isConsolidated ? 'Unified' : 'Individual'}
            </Badge>
          </div>
          <Switch
            checked={isConsolidated}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-primary"
          />
        </div>
        <CardDescription>
          Choose how to display and format the departmental responses
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg border-2 transition-all ${
            !isConsolidated 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-muted-foreground'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" />
              <span className="font-medium">Individual Sections</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Keep each department's response separate and distinct
            </p>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {sectionCount} separate sections
              </Badge>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg border-2 transition-all ${
            isConsolidated 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-muted-foreground'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Merge className="h-4 w-4" />
              <span className="font-medium">Unified Response</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Merge similar content and create a cohesive response
            </p>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                AI-consolidated content
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};