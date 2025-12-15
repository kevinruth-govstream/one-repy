// Store loader utility - now supports both localStorage and database persistence
import { store } from './store';

export async function loadStoreFromDatabase(): Promise<boolean> {
  try {
    await store.loadFromDatabase();
    return true;
  } catch (error) {
    console.warn('Failed to load store from database:', error);
    return false;
  }
}

export function loadStoreFromLocalStorage(): boolean {
  try {
    const stored = localStorage.getItem('onereply_store');
    if (!stored) return false;

    const data = JSON.parse(stored);
    
    // Load tickets
    if (data.tickets && Array.isArray(data.tickets)) {
      data.tickets.forEach(([id, ticket]: [string, any]) => {
        // Convert date strings back to Date objects
        if (ticket.createdAt) ticket.createdAt = new Date(ticket.createdAt);
        if (ticket.updatedAt) ticket.updatedAt = new Date(ticket.updatedAt);
        (store as any).tickets.set(id, ticket);
      });
    }

    // Load sections
    if (data.sections && Array.isArray(data.sections)) {
      data.sections.forEach(([id, section]: [string, any]) => {
        // Convert date strings back to Date objects
        if (section.createdAt) section.createdAt = new Date(section.createdAt);
        if (section.updatedAt) section.updatedAt = new Date(section.updatedAt);
        (store as any).sections.set(id, section);
      });
    }

    // Load events
    if (data.events && Array.isArray(data.events)) {
      data.events.forEach(([ticketId, events]: [string, any[]]) => {
        const processedEvents = events.map(event => ({
          ...event,
          timestamp: new Date(event.timestamp)
        }));
        (store as any).events.set(ticketId, processedEvents);
      });
    }

    return true;
  } catch (error) {
    console.warn('Failed to load store from localStorage:', error);
    return false;
  }
}

export function saveStoreToLocalStorage(): void {
  try {
    const storeData = {
      tickets: Array.from((store as any).tickets.entries()),
      sections: Array.from((store as any).sections.entries()),
      events: Array.from((store as any).events.entries())
    };
    localStorage.setItem('onereply_store', JSON.stringify(storeData));
  } catch (error) {
    console.warn('Failed to save store to localStorage:', error);
  }
}