import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

// Core types
export type DeptKey = 'transportation' | 'building' | 'utilities' | 'land_use';
export type GatingMode = 'all' | 'first';
export type DeptStatus = 'pending' | 'annotated' | 'approved' | 'locked' | 'omitted';

// Updated section template types - reduced from 6 to 3
export type SectionKey = 'situation' | 'guidance' | 'nextsteps';

// Updated structured data atoms for 3-section approach
export interface DraftAtoms {
  // Situation = Understanding + Property Facts
  situation: {
    understanding: string[];
    propertyFacts: { key: string; value: string; source?: string }[];
  };
  // Guidance = Guidance + Citations  
  guidance: {
    recommendations: string[];
    citations: { code: string; section: string; description: string; source?: string }[];
  };
  // Next Steps = Follow-ups + Next Steps
  nextsteps: {
    followups: string[];
    actions: string[];
  };
}

// Individual section with content and metadata
export interface Section {
  id: string;
  ticketId: string;
  department: DeptKey;
  sectionKey: SectionKey;
  title: string;
  content: string;
  atoms: DraftAtoms;
  status: DeptStatus;
  annotations: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Main ticket entity
export interface Ticket {
  id: string;
  subject: string;
  from: string;
  body: string;
  departments: DeptKey[];
  gatingMode: GatingMode;
  status: 'drafting' | 'reviewing' | 'ready' | 'assembled';
  createdAt: Date;
  updatedAt: Date;
}

// Event logging for audit trail
export interface EventLog {
  id: string;
  ticketId: string;
  type: 'created' | 'draft_generated' | 'section_annotated' | 'section_approved' | 'section_locked' | 'ticket_assembled';
  department?: DeptKey;
  sectionKey?: SectionKey;
  details: string;
  timestamp: Date;
}

// In-memory data store
class DataStore {
  private tickets: Map<string, Ticket> = new Map();
  private sections: Map<string, Section> = new Map();
  private events: Map<string, EventLog[]> = new Map();
  private currentUser: any = null;
  private authReady = false;
  private pendingOperations: (() => Promise<void>)[] = [];

  // Auth management methods
  setUser(user: any): void {
    const prevUser = this.currentUser;
    console.log(`🔐 Store auth update: ${prevUser?.email || 'null'} → ${user?.email || 'null'}`);
    
    this.currentUser = user;
    this.authReady = true;
    
    // Execute any pending operations
    if (this.pendingOperations.length > 0) {
      console.log(`Executing ${this.pendingOperations.length} pending operations...`);
      const operations = [...this.pendingOperations];
      this.pendingOperations = [];
      operations.forEach((op, index) => {
        console.log(`Executing pending operation ${index + 1}...`);
        op().catch((error) => {
          console.error(`Pending operation ${index + 1} failed:`, error);
        });
      });
    }
  }

  isAuthReady(): boolean {
    return this.authReady;
  }

  private addPendingOperation(operation: () => Promise<void>): void {
    console.log(`Adding pending operation. Auth ready: ${this.authReady}, Current user: ${this.currentUser?.id || 'none'}`);
    if (this.authReady && this.currentUser) {
      console.log('Executing operation immediately...');
      operation().catch((error) => {
        console.error('Pending operation failed:', error);
      });
    } else {
      console.log('Queuing operation for later execution');
      this.pendingOperations.push(operation);
    }
  }

  // Database persistence methods
  async saveTicketToDatabase(ticket: Ticket): Promise<void> {
    if (!this.isAuthReady() || !this.currentUser) {
      console.warn('⚠️ Cannot save ticket: auth not ready or no user');
      throw new Error('Authentication required for database operations');
    }

    // Ensure we have an active session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('No active session for database operation');
    }

    const { error } = await supabase.from('tickets').insert({
      id: ticket.id,
      subject: ticket.subject,
      from_field: ticket.from,
      body: ticket.body,
      departments: ticket.departments,
      gating_mode: ticket.gatingMode,
      status: ticket.status === 'drafting' ? 'draft' : 
              ticket.status === 'reviewing' ? 'in_progress' : 'completed',
      user_id: this.currentUser.id
    });

    if (error) {
      console.error('❌ Error saving ticket to database:', error);
      throw error;
    }

    console.log(`✅ Ticket ${ticket.id} saved to database`);
  }

  async saveSectionToDatabase(section: Section): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('sections')
        .insert({
          id: section.id,
          ticket_id: section.ticketId,
          department: section.department,
          section_key: section.sectionKey,
          title: section.title,
          content: section.content,
          atoms: section.atoms as any,
          status: section.status,
          annotations: section.annotations,
          order_index: section.order,
          created_at: section.createdAt.toISOString(),
          updated_at: section.updatedAt.toISOString(),
          user_id: this.currentUser.id
        });
      
      if (error) {
        console.error('Error saving section to database:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to save section to database:', error);
      throw error;
    }
  }

  async updateSectionInDatabase(sectionId: string, updates: Partial<Section>): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const updateData: any = {};
      
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.annotations !== undefined) updateData.annotations = updates.annotations;
      if (updates.atoms !== undefined) updateData.atoms = updates.atoms;
      if (updates.order !== undefined) updateData.order_index = updates.order;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('sections')
        .update(updateData)
        .eq('id', sectionId);

      if (error) {
        console.error('Error updating section in database:', error);
        throw error;
      }

      console.log('Section updated in database successfully');
    } catch (error) {
      console.error('Failed to update section in database:', error);
      throw error;
    }
  }

  async saveEventToDatabase(event: EventLog): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('events')
        .insert({
          id: event.id,
          ticket_id: event.ticketId,
          section_id: null, // We'll need to map this if needed
          event_type: event.type,
          data: {
            department: event.department,
            sectionKey: event.sectionKey,
            details: event.details
          },
          timestamp: event.timestamp.toISOString(),
          user_id: this.currentUser.id
        });
      
      if (error) {
        console.error('Error saving event to database:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to save event to database:', error);
      throw error;
    }
  }

  async loadFromDatabase(): Promise<void> {
    if (!this.isAuthReady() || !this.currentUser) {
      console.warn('⚠️ Cannot load from database: auth not ready or no user');
      throw new Error('Authentication required for database operations');
    }

    try {
      console.log(`🔄 Loading from database for user: ${this.currentUser.email}`);
      
      // Get current session to ensure we have proper auth context
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No active session found');
      }

      // Clear existing data first
      this.tickets.clear();
      this.sections.clear();
      this.events.clear();

      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('❌ Error loading tickets:', ticketsError);
        throw ticketsError;
      }

      const { data: sections, error: sectionsError } = await supabase
        .from('sections')
        .select('*')
        .order('order_index', { ascending: true });

      if (sectionsError) {
        console.error('❌ Error loading sections:', sectionsError);
        throw sectionsError;
      }

      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('timestamp', { ascending: true });

      if (eventsError) {
        console.error('❌ Error loading events:', eventsError);
        throw eventsError;
      }

      // Load tickets
      tickets?.forEach(dbTicket => {
        const ticket: Ticket = {
          id: dbTicket.id,
          subject: dbTicket.subject,
          from: dbTicket.from_field,
          body: dbTicket.body,
          departments: dbTicket.departments,
          gatingMode: dbTicket.gating_mode as GatingMode,
          status: dbTicket.status === 'draft' ? 'drafting' : 
                  dbTicket.status === 'in_progress' ? 'reviewing' : 'assembled',
          createdAt: new Date(dbTicket.created_at),
          updatedAt: new Date(dbTicket.updated_at)
        };
        this.tickets.set(ticket.id, ticket);
      });

      // Load sections
      sections?.forEach(dbSection => {
        const section: Section = {
          id: dbSection.id,
          ticketId: dbSection.ticket_id,
          department: dbSection.department as DeptKey,
          sectionKey: dbSection.section_key as SectionKey,
          title: dbSection.title,
          content: dbSection.content || '',
          atoms: (dbSection.atoms as unknown as DraftAtoms) || {
            situation: { understanding: [], propertyFacts: [] },
            guidance: { recommendations: [], citations: [] },
            nextsteps: { followups: [], actions: [] }
          },
          status: dbSection.status as DeptStatus,
          annotations: (dbSection.annotations as string[]) || [],
          order: dbSection.order_index,
          createdAt: new Date(dbSection.created_at),
          updatedAt: new Date(dbSection.updated_at)
        };
        this.sections.set(section.id, section);
      });

      // Load events
      const eventsByTicket = new Map<string, EventLog[]>();
      events?.forEach(dbEvent => {
        const eventData = dbEvent.data as any;
        const event: EventLog = {
          id: dbEvent.id,
          ticketId: dbEvent.ticket_id,
          type: dbEvent.event_type as EventLog['type'],
          department: eventData?.department as DeptKey,
          sectionKey: eventData?.sectionKey as SectionKey,
          details: eventData?.details || '',
          timestamp: new Date(dbEvent.timestamp)
        };
        
        if (!eventsByTicket.has(event.ticketId)) {
          eventsByTicket.set(event.ticketId, []);
        }
        eventsByTicket.get(event.ticketId)!.push(event);
      });

      // Set events by ticket
      eventsByTicket.forEach((eventsForTicket, ticketId) => {
        this.events.set(ticketId, eventsForTicket);
      });

      console.log(`✅ Loaded ${tickets?.length || 0} tickets, ${sections?.length || 0} sections, ${events?.length || 0} events from database`);
      
      // Save to localStorage as backup
      this.saveToLocalStorageBackup();
      
    } catch (error) {
      console.error('❌ Failed to load from database:', error);
      throw error;
    }
  }

  // LocalStorage backup method
  private saveToLocalStorageBackup(): void {
    try {
      const storeData = {
        tickets: Array.from(this.tickets.entries()),
        sections: Array.from(this.sections.entries()),
        events: Array.from(this.events.entries())
      };
      localStorage.setItem('onereply_store', JSON.stringify(storeData));
      console.log('💾 Data backed up to localStorage');
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  // Ticket operations
  async createTicket(data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Ticket> {
    const ticket: Ticket = {
      ...data,
      id: uuidv4(),
      status: 'drafting',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log(`Creating ticket ${ticket.id}: ${ticket.subject}`);
    this.tickets.set(ticket.id, ticket);
    
    // Note: Not awaiting logEvent to avoid blocking ticket creation
    this.logEvent(ticket.id, 'created', `Ticket created: ${ticket.subject}`);
    
    // Save to database (using pending operations if auth not ready)
    console.log(`Scheduling database save for ticket ${ticket.id}`);
    this.addPendingOperation(() => this.saveTicketToDatabase(ticket));
    
    console.log(`Ticket ${ticket.id} created in memory. Total tickets in store: ${this.tickets.size}`);
    return ticket;
  }

  getTicket(id: string): Ticket | undefined {
    return this.tickets.get(id);
  }

  getAllTickets(): Ticket[] {
    return Array.from(this.tickets.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  updateTicket(id: string, updates: Partial<Ticket>): Ticket | undefined {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;

    const updated = { ...ticket, ...updates, updatedAt: new Date() };
    this.tickets.set(id, updated);
    return updated;
  }

  // Section operations
  async createSection(data: Omit<Section, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'annotations'>): Promise<Section> {
    const section: Section = {
      ...data,
      id: uuidv4(),
      status: 'pending',
      annotations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.sections.set(section.id, section);
    this.logEvent(section.ticketId, 'draft_generated', `Draft generated for ${section.department} - ${section.title}`, section.department, section.sectionKey);
    
    // Save to database (using pending operations if auth not ready)
    this.addPendingOperation(() => this.saveSectionToDatabase(section));
    
    return section;
  }

  getSection(id: string): Section | undefined {
    return this.sections.get(id);
  }

  getTicketSections(ticketId: string): Section[] {
    return Array.from(this.sections.values())
      .filter(section => section.ticketId === ticketId)
      .sort((a, b) => a.order - b.order);
  }

  updateSection(id: string, updates: Partial<Section>): Section | undefined {
    const section = this.sections.get(id);
    if (!section) return undefined;

    const updated = { ...section, ...updates, updatedAt: new Date() };
    this.sections.set(id, updated);

    // Log status changes
    if (updates.status && updates.status !== section.status) {
      const eventType = updates.status === 'annotated' ? 'section_annotated' : 
                       updates.status === 'approved' ? 'section_approved' : 
                       updates.status === 'locked' ? 'section_locked' : null;
      
      if (eventType) {
        this.logEvent(section.ticketId, eventType, `${section.department} - ${section.title} ${updates.status}`, section.department, section.sectionKey);
      } else if (updates.status === 'omitted') {
        this.logEvent(section.ticketId, 'section_annotated', `${section.department} - ${section.title} omitted from email`, section.department, section.sectionKey);
      }
    }

    // Save to database
    this.addPendingOperation(() => this.updateSectionInDatabase(id, updates));

    return updated;
  }

  // Department status helpers
  getDepartmentStatus(ticketId: string, department: DeptKey): DeptStatus {
    const sections = this.getTicketSections(ticketId).filter(s => s.department === department);
    if (sections.length === 0) return 'pending';

    const statuses = sections.map(s => s.status);
    if (statuses.every(s => s === 'approved' || s === 'locked' || s === 'omitted')) return 'approved';
    if (statuses.some(s => s === 'annotated')) return 'annotated';
    if (statuses.some(s => s === 'omitted')) return 'omitted';
    return 'pending';
  }

  canApproveTicket(ticketId: string): boolean {
    const ticket = this.getTicket(ticketId);
    if (!ticket) return false;

    const deptStatuses = ticket.departments.map(dept => this.getDepartmentStatus(ticketId, dept));
    
    if (ticket.gatingMode === 'all') {
      return deptStatuses.every(status => status === 'approved' || status === 'omitted');
    } else {
      return deptStatuses.some(status => status === 'approved' || status === 'omitted');
    }
  }

  // Apply gating logic when section is approved
  applyGatingLogic(ticketId: string, department: DeptKey): void {
    const ticket = this.getTicket(ticketId);
    if (!ticket || ticket.gatingMode !== 'first') return;

    const sections = this.getTicketSections(ticketId);
    const approvedSections = sections.filter(s => s.department === department && s.status === 'approved');
    
    if (approvedSections.length > 0) {
      // Lock all other departments
      sections.forEach(section => {
        if (section.department !== department && section.status === 'pending') {
          this.updateSection(section.id, { status: 'locked' });
        }
      });
    }
  }

  // Event logging
  async logEvent(ticketId: string, type: EventLog['type'], details: string, department?: DeptKey, sectionKey?: SectionKey): Promise<void> {
    const event: EventLog = {
      id: uuidv4(),
      ticketId,
      type,
      department,
      sectionKey,
      details,
      timestamp: new Date(),
    };

    const events = this.events.get(ticketId) || [];
    events.push(event);
    this.events.set(ticketId, events);

    // Save to database
    try {
      await this.saveEventToDatabase(event);
    } catch (error) {
      console.error('Failed to save event to database, keeping in memory only:', error);
    }
  }

  getTicketEvents(ticketId: string): EventLog[] {
    return this.events.get(ticketId) || [];
  }

  // Teams notification helper
  async sendTeamsNotification(department: DeptKey, message: string): Promise<boolean> {
    const webhookUrl = localStorage.getItem(`teams_webhook_${department}`);
    if (!webhookUrl) return false;

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": "0076D7",
          "summary": "Ticket Review Request",
          "sections": [{
            "activityTitle": "Ticket Review Request",
            "activitySubtitle": `Department: ${department}`,
            "text": message,
            "markdown": true
          }]
        })
      });
      
      return response.ok;
    } catch (error) {
      console.error('Teams notification failed:', error);
      return false;
    }
  }

  // Delete ticket and all its sections
  async deleteTicket(ticketId: string): Promise<void> {
    console.log(`🗑️ Deleting ticket: ${ticketId}`);
    
    try {
      // Delete from Supabase if available
      if (this.currentUser) {
        const { error: sectionsError } = await supabase
          .from('sections')
          .delete()
          .eq('ticket_id', ticketId);
          
        if (sectionsError) {
          console.warn('Failed to delete sections from Supabase:', sectionsError);
        }
        
        const { error: eventsError } = await supabase
          .from('events')
          .delete()
          .eq('ticket_id', ticketId);
          
        if (eventsError) {
          console.warn('Failed to delete events from Supabase:', eventsError);
        }
        
        const { error: ticketError } = await supabase
          .from('tickets')
          .delete()
          .eq('id', ticketId);
          
        if (ticketError) {
          console.warn('Failed to delete ticket from Supabase:', ticketError);
          throw ticketError;
        }
      }
      
      // Delete from local store
      this.tickets.delete(ticketId);
      
      // Delete all sections for this ticket
      const sectionsToDelete = Array.from(this.sections.values())
        .filter(section => section.ticketId === ticketId);
      
      for (const section of sectionsToDelete) {
        this.sections.delete(section.id);
      }
      
      // Delete events
      this.events.delete(ticketId);
      
      // Save to localStorage
      this.saveToLocalStorageBackup();
      
      console.log(`✅ Ticket ${ticketId} deleted successfully`);
      
    } catch (error) {
      console.error('❌ Failed to delete ticket:', error);
      throw error;
    }
  }
}

// Global store instance
export const store = new DataStore();

// Helper to get pending sections for review
export function getPendingSections(): Section[] {
  return store.getAllTickets()
    .flatMap(ticket => store.getTicketSections(ticket.id))
    .filter(section => section.status === 'pending');
}

// Helper to get next pending section for a department
export function getNextPendingSection(department?: DeptKey): Section | undefined {
  const pending = getPendingSections();
  return department 
    ? pending.find(s => s.department === department)
    : pending[0];
}

// Export helper functions for components
export function getAllTickets(): Ticket[] {
  return store.getAllTickets();
}

export function getTicketSections(ticketId: string): Section[] {
  return store.getTicketSections(ticketId);
}

export function getOverallTicketStatus(ticketId: string): 'draft' | 'in_progress' | 'completed' {
  const ticketSections = getTicketSections(ticketId);
  if (ticketSections.length === 0) return 'draft';
  
  const approvedCount = ticketSections.filter(s => s.status === 'approved').length;
  if (approvedCount === ticketSections.length) return 'completed';
  if (approvedCount > 0) return 'in_progress';
  return 'draft';
}

// Export createTicket helper function for compatibility
export function createTicket(data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Ticket> {
  return store.createTicket(data);
}

// Export deleteTicket helper function
export function deleteTicket(ticketId: string): Promise<void> {
  return store.deleteTicket(ticketId);
}