import { useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from '@dnd-kit/modifiers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { 
  ResizablePanelGroup, 
  ResizablePanel, 
  ResizableHandle 
} from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Mail, Settings } from 'lucide-react';
import { CompactSectionManager } from '@/components/CompactSectionManager';
import { StatusAlert } from '@/components/StatusAlert';

import { EmailPreview } from '@/components/OptimizedEmailPreview';
import { ExportOptions } from '@/components/ExportOptions';
import { store } from '@/lib/store';
import { toast } from 'sonner';

const AssembleTicket = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  
  // Memoized data fetching
  const ticket = useMemo(() => ticketId ? store.getTicket(ticketId) : null, [ticketId]);
  const allSections = useMemo(() => ticketId ? store.getTicketSections(ticketId) : [], [ticketId]);
  const approvedSections = useMemo(() => allSections.filter(section => section.status === 'approved'), [allSections]);
  
  // State management
  const [sectionOrder, setSectionOrder] = useState<string[]>(
    approvedSections.map(section => section.id)
  );
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set(approvedSections.map(section => section.id))
  );
  const [isConsolidated, setIsConsolidated] = useState(false);
  // Memoized default settings
  const getDefaultSettings = useMemo(() => () => {
    const saved = localStorage.getItem('onereply-settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        return {
          intro: settings.emailTemplates?.defaultIntro || "Thank you for your inquiry. After reviewing your request with the appropriate departments, here is our consolidated response:",
          outro: settings.emailTemplates?.defaultOutro || "If you have any questions about this response, please don't hesitate to contact us."
        };
      } catch {
        return {
          intro: "Thank you for your inquiry. After reviewing your request with the appropriate departments, here is our consolidated response:",
          outro: "If you have any questions about this response, please don't hesitate to contact us."
        };
      }
    }
    return {
      intro: "Thank you for your inquiry. After reviewing your request with the appropriate departments, here is our consolidated response:",
      outro: "If you have any questions about this response, please don't hesitate to contact us."
    };
  }, []);

  const defaultSettings = getDefaultSettings();
  const [intro, setIntro] = useState(defaultSettings.intro);
  const [outro, setOutro] = useState(defaultSettings.outro);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get ordered sections
  const orderedSections = useMemo(() => {
    return sectionOrder
      .map(id => approvedSections.find(section => section.id === id))
      .filter(Boolean) as typeof approvedSections;
  }, [sectionOrder, approvedSections]);

  // Memoized handlers
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSectionOrder(items => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        toast.success("Section order updated");
        return newOrder;
      });
    }
  }, []);
  
  const toggleSectionVisibility = useCallback((sectionId: string) => {

    setVisibleSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
        toast.info("Section hidden from email");
      } else {
        newSet.add(sectionId);
        toast.success("Section added to email");
      }
      return newSet;
    });
  }, []);

  const toggleAllSections = useCallback(() => {

    const allVisible = sectionOrder.every(id => visibleSections.has(id));
    if (allVisible) {
      setVisibleSections(new Set());
      toast.info("All sections hidden");
    } else {
      setVisibleSections(new Set(sectionOrder));
      toast.success("All sections visible");
    }
  }, [sectionOrder, visibleSections]);

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto text-center pt-20">
          <h1 className="text-2xl font-bold text-foreground mb-4">Request Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The requested OneReply request could not be found or you don't have access to it.
          </p>
          <Button asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/archive">
                      Archive
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Assemble Email</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Assemble Email Response</h1>
                <Badge variant="outline">Request #{ticketId.slice(-6)}</Badge>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to="/archive">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Archive
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6 space-y-6">
        {/* Status Alert */}
        <StatusAlert sections={allSections} ticketId={ticketId} />

        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[calc(100vh-280px)]"
        >
          {/* Main Panel - Email Preview (Primary Focus) */}
          <ResizablePanel defaultSize={70} minSize={50}>
            <div className="pr-6">
              {/* Email Preview with Tabs */}
              <EmailPreview
                sections={orderedSections}
                visibleSections={visibleSections}
                isConsolidated={true} // Always show unified by default
                intro={intro}
                outro={outro}
                onIntroChange={setIntro}
                onOutroChange={setOutro}
                ticketId={ticketId}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Sidebar - Section Management */}
          <ResizablePanel defaultSize={30} minSize={25}>
            <div className="pl-6 space-y-6">
              {/* Compact Section Manager */}
              <Card>
                <CardContent className="p-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                  >
                    <SortableContext
                      items={sectionOrder}
                      strategy={verticalListSortingStrategy}
                    >
                      <CompactSectionManager
                        sections={orderedSections}
                        sectionOrder={sectionOrder}
                        visibleSections={visibleSections}
                        onToggleVisibility={toggleSectionVisibility}
                        onToggleAllSections={toggleAllSections}
                      />
                    </SortableContext>
                  </DndContext>
                </CardContent>
              </Card>

              {/* Export Options */}
              <ExportOptions
                sections={orderedSections}
                visibleSections={visibleSections}
                isConsolidated={true}
                intro={intro}
                outro={outro}
                ticketId={ticketId}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default AssembleTicket;