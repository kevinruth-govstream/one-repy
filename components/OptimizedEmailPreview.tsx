import { useState, useMemo, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DepartmentBadge } from './DepartmentBadge';
import { ConsolidationDiff } from './ConsolidationDiff';
import { IndividualSectionsView } from './IndividualSectionsView';
import SectionHtml from './SectionHtml';
import { Section } from '@/lib/store';
import { Mail, Calendar, User, Edit3, Save, X, Users, Merge } from 'lucide-react';

interface EmailPreviewProps {
  sections: Section[];
  visibleSections: Set<string>;
  isConsolidated: boolean;
  intro: string;
  outro: string;
  onIntroChange: (intro: string) => void;
  onOutroChange: (outro: string) => void;
  ticketId?: string;
}

// Memoized section group calculator
const useSectionGroups = (visibleSectionList: Section[]) => {
  return useMemo(() => {
    return visibleSectionList.reduce((groups, section) => {
      if (!groups[section.sectionKey]) {
        groups[section.sectionKey] = [];
      }
      groups[section.sectionKey].push(section);
      return groups;
    }, {} as Record<string, Section[]>);
  }, [visibleSectionList]);
};

// Memoized statistics calculator
const useEmailStats = (intro: string, outro: string, visibleSectionList: Section[]) => {
  return useMemo(() => {
    const content = intro + outro + visibleSectionList.map(s => s.content).join(' ');
    const totalWords = content.split(' ').filter(word => word.trim()).length;
    const estimatedReadTime = Math.ceil(totalWords / 200);
    
    return { totalWords, estimatedReadTime };
  }, [intro, outro, visibleSectionList]);
};

// Memoized visible sections filter
const useVisibleSections = (sections: Section[], visibleSections: Set<string>) => {
  return useMemo(() => {
    return sections.filter(section => visibleSections.has(section.id));
  }, [sections, visibleSections]);
};

// Memoized section content formatter
const useSectionContent = (sectionsForKey: Section[]) => {
  return useMemo(() => {
    if (sectionsForKey.length === 0) return '';
    if (sectionsForKey.length === 1) {
      return sectionsForKey[0].content || 'No content available';
    }
    return sectionsForKey.map(section => section.content || 'No content').join('\n\n');
  }, [sectionsForKey]);
};

// Memoized citations extractor
const useCitations = (sectionsForKey: Section[]) => {
  return useMemo(() => {
    return sectionsForKey.flatMap(s => s.atoms.guidance?.citations || []);
  }, [sectionsForKey]);
};

// Memoized edit button component
const EditButton = memo(({ onClick }: { onClick: () => void }) => (
  <Button
    size="sm"
    variant="ghost"
    className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
    onClick={onClick}
  >
    <Edit3 className="h-3 w-3" />
  </Button>
));

// Memoized editable text section
const EditableTextSection = memo(({ 
  text, 
  isEditing, 
  tempText, 
  onEdit, 
  onSave, 
  onCancel, 
  onTempChange,
  placeholder 
}: {
  text: string;
  isEditing: boolean;
  tempText: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onTempChange: (value: string) => void;
  placeholder: string;
}) => (
  <div className="group">
    {isEditing ? (
      <div className="space-y-2">
        <Textarea
          value={tempText}
          onChange={(e) => onTempChange(e.target.value)}
          className="min-h-20 resize-none"
          placeholder={placeholder}
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave}>
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    ) : (
      <div className="relative">
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-foreground pr-8">{text}</div>
        </div>
        <EditButton onClick={onEdit} />
      </div>
    )}
  </div>
));

// Memoized section content component
const SectionContent = memo(({ 
  sectionKey, 
  sectionsForKey 
}: { 
  sectionKey: string; 
  sectionsForKey: Section[] 
}) => {
  const content = useSectionContent(sectionsForKey);
  const citations = useCitations(sectionsForKey);
  
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-lg capitalize">
          {sectionKey.replace(/([A-Z])/g, ' $1').trim()}
        </h3>
        <Badge variant="outline">
          {sectionsForKey.length} dept{sectionsForKey.length !== 1 ? 's' : ''}
        </Badge>
        {sectionsForKey.length > 1 && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Unified
          </Badge>
        )}
      </div>
      
      <div className="prose prose-sm max-w-none text-foreground">
        <div className={`p-4 rounded border ${
          sectionsForKey.length > 1 
            ? 'bg-green-50 border-green-200' 
            : 'bg-muted/30 border-muted'
        }`}>
          <SectionHtml html={content} />
        </div>
      </div>

      {citations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded text-sm">
          <p className="font-medium mb-2">Referenced Regulations:</p>
          <ul className="space-y-1">
            {citations.map((citation, citIndex) => (
              <li key={citIndex} className="text-blue-700">
                <strong>{citation.code}</strong> {citation.section && `§${citation.section}`} - {citation.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

// Optimized Unified Response View
const UnifiedResponseView = memo(({ 
  sections, 
  visibleSections, 
  intro, 
  outro, 
  ticketId,
  editingIntro,
  editingOutro,
  tempIntro,
  tempOutro,
  onEditIntro,
  onEditOutro,
  onSaveIntro,
  onSaveOutro,
  onCancelIntro,
  onCancelOutro,
  onTempIntroChange,
  onTempOutroChange
}: {
  sections: Section[];
  visibleSections: Set<string>;
  intro: string;
  outro: string;
  ticketId?: string;
  editingIntro: boolean;
  editingOutro: boolean;
  tempIntro: string;
  tempOutro: string;
  onEditIntro: () => void;
  onEditOutro: () => void;
  onSaveIntro: () => void;
  onSaveOutro: () => void;
  onCancelIntro: () => void;
  onCancelOutro: () => void;
  onTempIntroChange: (value: string) => void;
  onTempOutroChange: (value: string) => void;
}) => {
  const visibleSectionList = useVisibleSections(sections, visibleSections);
  const sectionGroups = useSectionGroups(visibleSectionList);
  
  const sectionKeys = useMemo(() => ['situation', 'guidance', 'nextsteps'] as const, []);

  return (
    <div className="space-y-4">
      {/* Email Header */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">From:</span>
            <span>OneReply Support</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Date:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className="col-span-2">
            <span className="font-medium">Subject:</span>
            <span className="ml-2">Response to Ticket #{ticketId?.slice(-6) || 'XXXXXX'}</span>
          </div>
        </div>
      </div>

      {/* Email Body */}
      <div className="bg-background border rounded-lg p-6 space-y-6 max-h-[600px] overflow-y-auto">
        {/* Introduction */}
        <EditableTextSection
          text={intro}
          isEditing={editingIntro}
          tempText={tempIntro}
          onEdit={onEditIntro}
          onSave={onSaveIntro}
          onCancel={onCancelIntro}
          onTempChange={onTempIntroChange}
          placeholder="Enter email introduction..."
        />

        <Separator />

        {/* Unified Sections */}
        <div className="space-y-6">
          {sectionKeys.map(sectionKey => {
            const sectionsForKey = sectionGroups[sectionKey] || [];
            if (sectionsForKey.length === 0) return null;

            return (
              <SectionContent
                key={sectionKey}
                sectionKey={sectionKey}
                sectionsForKey={sectionsForKey}
              />
            );
          })}
        </div>

        {/* Outro */}
        <Separator />
        <EditableTextSection
          text={outro}
          isEditing={editingOutro}
          tempText={tempOutro}
          onEdit={onEditOutro}
          onSave={onSaveOutro}
          onCancel={onCancelOutro}
          onTempChange={onTempOutroChange}
          placeholder="Enter email conclusion..."
        />

        {/* OneReply Footer */}
        <Separator />
        <div className="text-sm text-muted-foreground italic text-center pt-4 border-t">
          Prepared with OneReply — one city, one voice.
        </div>
      </div>
    </div>
  );
});

export const EmailPreview = memo(({ 
  sections, 
  visibleSections, 
  isConsolidated, 
  intro, 
  outro,
  onIntroChange,
  onOutroChange,
  ticketId 
}: EmailPreviewProps) => {
  const [editingIntro, setEditingIntro] = useState(false);
  const [editingOutro, setEditingOutro] = useState(false);
  const [tempIntro, setTempIntro] = useState(intro);
  const [tempOutro, setTempOutro] = useState(outro);

  const visibleSectionList = useVisibleSections(sections, visibleSections);
  const { totalWords, estimatedReadTime } = useEmailStats(intro, outro, visibleSectionList);

  const handleSaveIntro = useCallback(() => {
    onIntroChange(tempIntro);
    setEditingIntro(false);
  }, [tempIntro, onIntroChange]);

  const handleCancelIntro = useCallback(() => {
    setTempIntro(intro);
    setEditingIntro(false);
  }, [intro]);

  const handleSaveOutro = useCallback(() => {
    onOutroChange(tempOutro);
    setEditingOutro(false);
  }, [tempOutro, onOutroChange]);

  const handleCancelOutro = useCallback(() => {
    setTempOutro(outro);
    setEditingOutro(false);
  }, [outro]);

  const departmentCount = useMemo(() => 
    new Set(visibleSectionList.map(s => s.department)).size,
    [visibleSectionList]
  );

  const approvedCount = useMemo(() => 
    sections.filter(s => s.status === 'approved').length,
    [sections]
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Response
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {totalWords} words
            </Badge>
            <Badge variant="outline">
              ~{estimatedReadTime} min read
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="unified" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="unified" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Unified Response
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Individual Sections
            </TabsTrigger>
            <TabsTrigger value="diff" className="flex items-center gap-2">
              <Merge className="h-4 w-4" />
              Consolidation Diff
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="unified" className="space-y-4">
              <UnifiedResponseView 
                sections={sections}
                visibleSections={visibleSections}
                intro={intro}
                outro={outro}
                ticketId={ticketId}
                editingIntro={editingIntro}
                editingOutro={editingOutro}
                tempIntro={tempIntro}
                tempOutro={tempOutro}
                onEditIntro={() => setEditingIntro(true)}
                onEditOutro={() => setEditingOutro(true)}
                onSaveIntro={handleSaveIntro}
                onSaveOutro={handleSaveOutro}
                onCancelIntro={handleCancelIntro}
                onCancelOutro={handleCancelOutro}
                onTempIntroChange={setTempIntro}
                onTempOutroChange={setTempOutro}
              />
            </TabsContent>

            <TabsContent value="individual">
              <IndividualSectionsView 
                sections={sections}
                visibleSections={visibleSections}
              />
            </TabsContent>

            <TabsContent value="diff">
              <ConsolidationDiff 
                sections={sections}
                visibleSections={visibleSections}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer Stats */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded mt-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className="font-medium">Sections:</span> {visibleSectionList.length}
            </div>
            <div>
              <span className="font-medium">Departments:</span> {departmentCount}
            </div>
            <div>
              <span className="font-medium">Status:</span> {approvedCount}/{sections.length} approved
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});