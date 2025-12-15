// src/seed/driveway.ts
// OneReply seed: Driveway widening (Transportation ✅ approved, Building ✍️ annotated)

import { store } from '@/lib/store';
import type { DeptKey, GatingMode, DeptStatus, Ticket, Section, EventLog, SectionKey } from '@/lib/store';

interface SeedBundle {
  ticket: Ticket;
  sections: Section[];
  events: EventLog[];
  finalHtml: string;
  finalSubject: string;
}

export const DRIVEWAY_SEED: SeedBundle = {
  ticket: {
    id: "90b9c9a0-9f7d-4e29-9c55-9a4df0b5c6a1",
    subject: "Driveway widening at 1234 Example St (ROW/sidewalk impacts?)",
    from: "jamie.nguyen@example.com",
    body: `Hi City Team,

We'd like to widen our driveway at 1234 Example St, Bellevue WA 98004 (Parcel 123450-6789).

Questions:
• Can we expand the driveway apron in the right-of-way (ROW) and adjust the sidewalk?
• Do we need traffic control during construction?
• What permits are required on the building side?

Property details:
• Single-family (1959), corner lot, driveway near the intersection.
• Existing slope is gentle; no trees impacted.

Attachments: site-sketch.pdf

Thanks,
Jamie Nguyen
Homeowner
(206) 555-0133`,
    gatingMode: "all" as GatingMode,
    departments: ["transportation", "building"] as DeptKey[],
    status: "assembled" as const,
    createdAt: new Date("2025-09-03T10:15:00Z"),
    updatedAt: new Date("2025-09-03T10:15:00Z")
  },

  sections: [
    {
      id: "5f2b7c1c-7c9f-415a-9a6c-2f3f3f2a7a11",
      ticketId: "90b9c9a0-9f7d-4e29-9c55-9a4df0b5c6a1",
      department: "transportation" as DeptKey,
      sectionKey: "situation" as SectionKey,
      title: "Transportation Review",
      content: "Transportation has approved the driveway widening request with specific guidance on ROW standards.",
      status: "approved" as DeptStatus,
      annotations: [],
      order: 1,
      createdAt: new Date("2025-09-03T10:20:00Z"),
      updatedAt: new Date("2025-09-03T11:02:18Z"),
      atoms: {
        situation: {
          understanding: ["Driveway widening touches ROW (apron/sidewalk); corner lot; gentle slope."],
          propertyFacts: [
            { key: "parcel", value: "123450-6789" },
            { key: "lotType", value: "Corner lot near intersection" },
            { key: "slope", value: "Gentle" }
          ]
        },
        guidance: {
          recommendations: [
            "Use Standard Detail T-130 for driveway apron.",
            "Maintain 5′ sidewalk clear width.",
            "Traffic control per MUTCD; attach basic TCP."
          ],
          citations: [
            { code: "LUC", section: "20.20.720", description: "driveway standards" },
            { code: "BCC", section: "24.02.120", description: "ROW construction & sidewalk restoration" }
          ]
        },
        nextsteps: {
          followups: ["Provide dimensioned curb cut/apron sketch."],
          actions: [
            "Submit Transportation ROW permit with T-130 + TCP.",
            "Schedule inspection 24h prior to pour; restore per standard."
          ]
        }
      }
    },
    {
      id: "9a7d8f0e-9c5b-4d3a-9a1c-6c8d0b21a222",
      ticketId: "90b9c9a0-9f7d-4e29-9c55-9a4df0b5c6a1",
      department: "building" as DeptKey,
      sectionKey: "guidance" as SectionKey,
      title: "Building Review",
      content: "Building has reviewed and provided annotations for potential structural considerations.",
      status: "approved" as DeptStatus,
      annotations: [
        "If retaining or stairs are affected, include in Building scope.",
        "Provide concrete mix and joint layout if apron ties into private walk."
      ],
      order: 2,
      createdAt: new Date("2025-09-03T10:20:00Z"),
      updatedAt: new Date("2025-09-03T11:05:00Z"),
      atoms: {
        situation: {
          understanding: ["Building scope only if structural elements change (retaining/stairs)."],
          propertyFacts: [{ key: "structureYear", value: "1959 single-family" }]
        },
        guidance: {
          recommendations: [
            "Include retaining/stairs in building permit if affected.",
            "Show concrete mix and joint layout if private walk is altered."
          ],
          citations: [{ code: "LUC", section: "20.20.720", description: "driveway standards (referenced)" }]
        },
        nextsteps: {
          followups: ["Confirm if any retaining wall >4′ is affected."],
          actions: ["If structural work is involved, submit building permit addendum."]
        }
      }
    }
  ],

  events: [
    {
      id: "e1a0b3c2-1f40-4b0a-9f0c-1b2c3d4e5f61",
      ticketId: "90b9c9a0-9f7d-4e29-9c55-9a4df0b5c6a1",
      type: "created",
      department: "transportation",
      sectionKey: "situation",
      details: "Ticket created: Driveway widening at 1234 Example St",
      timestamp: new Date("2025-09-03T10:15:00Z")
    },
    {
      id: "ef2344b7-5a77-4f4c-9d33-5d0a2f9f0ab2",
      ticketId: "90b9c9a0-9f7d-4e29-9c55-9a4df0b5c6a1",
      type: "section_annotated",
      department: "building",
      sectionKey: "guidance",
      details: "Building - Building Review annotated",
      timestamp: new Date("2025-09-03T10:58:12Z")
    },
    {
      id: "6c8b9e21-72fb-4285-a9f2-1d7a4e6bc1a3",
      ticketId: "90b9c9a0-9f7d-4e29-9c55-9a4df0b5c6a1",
      type: "section_approved",
      department: "transportation",
      sectionKey: "situation",
      details: "Transportation - Transportation Review approved",
      timestamp: new Date("2025-09-03T11:02:18Z")
    },
    {
      id: "c0a56f11-b1f6-4a2b-b41e-6a1c5e2f9a22",
      ticketId: "90b9c9a0-9f7d-4e29-9c55-9a4df0b5c6a1",
      type: "ticket_assembled",
      details: "Assembled final email (6 sections)",
      timestamp: new Date("2025-09-03T11:10:00Z")
    }
  ],

  finalSubject: "Reply: Driveway widening at 1234 Example St",
  finalHtml: `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:600px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.5;">
        <tr><td style="padding:16px 0 8px 0;border-bottom:1px solid #e5e7eb;">
          <div style="font-size:14px;color:#6b7280;">OneReply draft</div>
          <div style="font-size:20px;font-weight:700;">Driveway widening at 1234 Example St</div>
        </td></tr>

        <tr><td style="padding:16px 0;">
          <h2 style="font-size:18px;margin:0 0 8px 0;">1) Our understanding</h2>
          <p style="margin:0 0 12px 0;">You want to widen the driveway at 1234 Example St; the work touches the <strong>right-of-way</strong> (apron/sidewalk). Corner lot; gentle slope; no trees.</p>

          <h2 style="font-size:18px;margin:16px 0 8px 0;">2) Property facts</h2>
          <ul style="margin:0 0 12px 18px;padding:0;">
            <li>Parcel: 123450-6789</li>
            <li>Corner lot near intersection</li>
            <li>Gentle overall slope</li>
          </ul>

          <h2 style="font-size:18px;margin:16px 0 8px 0;">3) Relevant code citations</h2>
          <ul style="margin:0 0 12px 18px;padding:0;">
            <li><strong>LUC 20.20.720</strong> — driveway standards <span style="color:#6b7280;">(Transportation, Building)</span></li>
            <li><strong>BCC 24.02.120</strong> — ROW construction & sidewalk restoration <span style="color:#6b7280;">(Transportation)</span></li>
          </ul>

          <h2 style="font-size:18px;margin:16px 0 8px 0;">4) Guidance</h2>
          <ul style="margin:0 0 12px 18px;padding:0;">
            <li>Use City <strong>Standard Detail T-130</strong> for driveway apron.</li>
            <li>Maintain <strong>5′ sidewalk clear width</strong>.</li>
            <li>Traffic control per <strong>MUTCD</strong>; attach a basic TCP for one-day sawcut/pour.</li>
            <li>If retaining walls or stairs are affected, include in the building permit scope.</li>
            <li>Show concrete mix and joint layout in plan if the private walk is altered.</li>
          </ul>

          <h2 style="font-size:18px;margin:16px 0 8px 0;">5) Follow-up questions</h2>
          <ul style="margin:0 0 12px 18px;padding:0;">
            <li>Provide a dimensioned sketch of the proposed curb cut/apron.</li>
            <li>Confirm whether any structural elements (retaining &gt;4′) are affected.</li>
          </ul>

          <h2 style="font-size:18px;margin:16px 0 8px 0;">6) Next steps</h2>
          <ol style="margin:0 0 12px 18px;padding:0;">
            <li>Submit a Transportation ROW permit with T-130 detail + TCP.</li>
            <li>If structural work is involved, submit a Building permit addendum.</li>
            <li>Schedule inspection 24h prior to pour; restore sidewalk per standard.</li>
          </ol>
        </td></tr>

        <tr><td style="padding:12px 0;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
          Prepared with <strong>OneReply</strong> — One city. One voice.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
};

// Quick loader for the in-memory store with localStorage persistence
export function loadDrivewaySeed(): SeedBundle {
  const { ticket, sections, events, finalHtml, finalSubject } = DRIVEWAY_SEED;
  
  // Use the store's public methods to add data
  // First manually set the ticket (bypassing createTicket to avoid duplicating events)
  (store as any).tickets.set(ticket.id, ticket);
  
  // Add sections using private access
  sections.forEach(section => {
    (store as any).sections.set(section.id, section);
  });
  
  // Add events using private access
  (store as any).events.set(ticket.id, events);
  
  // Store final assembled email data
  localStorage.setItem(`assembled_${ticket.id}`, JSON.stringify({
    ticketId: ticket.id,
    subject: finalSubject,
    html: finalHtml,
    assembledAt: "2025-09-03T11:10:00Z"
  }));
  
  // Persist to localStorage for cross-session persistence
  try {
    const storeData = {
      tickets: Array.from((store as any).tickets.entries()),
      sections: Array.from((store as any).sections.entries()),
      events: Array.from((store as any).events.entries())
    };
    localStorage.setItem('onereply_store', JSON.stringify(storeData));
  } catch (error) {
    console.warn('Failed to persist demo data to localStorage:', error);
  }
  
  return DRIVEWAY_SEED;
}