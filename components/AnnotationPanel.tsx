import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Plus, Save, X } from "lucide-react";
import { useState } from "react";

interface AnnotationPanelProps {
  annotations: string[];
  onAddAnnotation: (annotation: string) => void;
  onSave: () => void;
  isModified: boolean;
}

export function AnnotationPanel({ 
  annotations, 
  onAddAnnotation, 
  onSave,
  isModified 
}: AnnotationPanelProps) {
  const [newAnnotation, setNewAnnotation] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddAnnotation = () => {
    if (newAnnotation.trim()) {
      onAddAnnotation(newAnnotation.trim());
      setNewAnnotation("");
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setNewAnnotation("");
    setIsAdding(false);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Annotations & Notes</CardTitle>
            {annotations.length > 0 && (
              <Badge variant="outline" className="bg-primary-10 text-primary border-primary-20">
                {annotations.length}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isModified && (
              <Button 
                onClick={onSave}
                size="sm"
                variant="outline"
                className="bg-success-10 text-success border-success-20 hover:bg-success-20"
              >
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
            )}
            
            {!isAdding && (
              <Button 
                onClick={() => setIsAdding(true)}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add New Annotation */}
        {isAdding && (
          <div className="space-y-3 p-4 bg-primary-10/50 rounded-lg border border-primary-20">
            <Textarea
              value={newAnnotation}
              onChange={(e) => setNewAnnotation(e.target.value)}
              placeholder="Add your review notes, feedback, or questions here..."
              className="min-h-[80px] resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleCancel}
                size="sm"
                variant="ghost"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleAddAnnotation}
                size="sm"
                disabled={!newAnnotation.trim()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </div>
          </div>
        )}

        {/* Existing Annotations */}
        {annotations.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Review History</h3>
            <div className="space-y-3">
              {annotations.map((annotation, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-primary-10 rounded">
                      <MessageSquare className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{annotation}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Note #{index + 1}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No annotations yet</p>
            <p className="text-xs">Add notes to document your review process</p>
          </div>
        )}

        {/* Review Guidelines */}
        <Separator />
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
            Review Guidelines
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Verify all facts and citations are accurate</li>
            <li>• Ensure guidance aligns with current policies</li>
            <li>• Check for completeness and clarity</li>
            <li>• Note any missing information or follow-ups needed</li>
            <li>• Document rationale for approval decisions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
