import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailIntakePayload {
  source: string;
  mailbox?: string;
  subject: string;
  fromEmail: string;
  fromName?: string;
  received?: string;
  messageId?: string;
  bodyHtml?: string;
  bodyText?: string;
}

// Department suggestion keywords (mirrored from frontend)
const DEPT_KEYWORDS = {
  transportation: ['driveway', 'sidewalk', 'row', 'right-of-way', 'traffic', 'street', 'road', 'parking'],
  building: ['permit', 'wall', 'addition', 'garage', 'structure', 'construction', 'renovation', 'deck'],
  utilities: ['storm', 'sewer', 'drainage', 'water', 'utility', 'pipe', 'main', 'service'],
  land_use: ['zoning', 'setback', 'lot split', 'parcel', 'luc', 'variance', 'subdivision', 'boundary']
};

const suggestDepartments = (subject: string, body: string): string[] => {
  const text = `${subject} ${body}`.toLowerCase();
  const suggestions: string[] = [];
  
  for (const [dept, keywords] of Object.entries(DEPT_KEYWORDS)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      suggestions.push(dept);
    }
  }
  
  return suggestions.length > 0 ? suggestions : ['building']; // Default fallback
};

const sanitizeHtml = (html: string): string => {
  // Remove dangerous script tags and attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/javascript:/gi, '')
    .replace(/<iframe\b[^>]*>/gi, '')
    .replace(/<object\b[^>]*>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '');
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const payload: EmailIntakePayload = await req.json();
    
    // Validate required fields
    if (!payload.subject || (!payload.bodyHtml && !payload.bodyText)) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: subject and (bodyHtml or bodyText)' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate fromEmail
    if (!payload.fromEmail || !payload.fromEmail.includes('@')) {
      return new Response(
        JSON.stringify({ 
          error: 'Valid fromEmail is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Prepare body content (sanitize HTML if present)
    let body = payload.bodyText || '';
    if (payload.bodyHtml) {
      body = sanitizeHtml(payload.bodyHtml);
    }

    // Suggest departments based on content
    const suggestedDepartments = suggestDepartments(payload.subject, body);

    // Create ticket in database
    const ticketData = {
      subject: payload.subject,
      from_field: payload.fromEmail,
      body: body,
      departments: suggestedDepartments,
      gating_mode: 'all' as const,
      user_id: '00000000-0000-0000-0000-000000000000', // System user for email intake
    };

    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert(ticketData)
      .select()
      .single();

    if (ticketError) {
      console.error('Error creating ticket:', ticketError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create ticket',
          details: ticketError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log the email intake event
    await supabase
      .from('events')
      .insert({
        ticket_id: ticket.id,
        event_type: 'email_intake',
        data: {
          source: payload.source || 'outlook_flow',
          messageId: payload.messageId,
          received: payload.received,
          fromName: payload.fromName,
          mailbox: payload.mailbox
        },
        user_id: '00000000-0000-0000-0000-000000000000'
      });

    // Check if auto-review is requested
    const url = new URL(req.url);
    const requestReview = url.searchParams.get('requestReview') === 'true';

    let sectionsCreated = [];
    
    if (requestReview) {
      // Create sections for each suggested department
      const sectionPromises = suggestedDepartments.map(async (dept) => {
        const sectionData = {
          ticket_id: ticket.id,
          department: dept,
          section_key: 'situation',
          title: 'Initial Assessment',
          content: `Email forwarded from ${payload.fromEmail}. Review needed.`,
          atoms: {
            sourceDept: dept,
            understanding: `Email received: ${payload.subject}`,
            guidance: [],
            nextsteps: []
          },
          user_id: '00000000-0000-0000-0000-000000000000'
        };

        const { data: section, error: sectionError } = await supabase
          .from('sections')
          .insert(sectionData)
          .select()
          .single();

        if (sectionError) {
          console.error(`Error creating section for ${dept}:`, sectionError);
          return null;
        }

        return section;
      });

      const sections = await Promise.all(sectionPromises);
      sectionsCreated = sections.filter(s => s !== null);

      // TODO: Send Teams notifications if sections were created
      // This would require the teams webhook URLs to be configured
      // Could be implemented later as an enhancement
    }

    const response = {
      ok: true,
      ticketId: ticket.id,
      departments: suggestedDepartments,
      sectionsCreated: requestReview ? sectionsCreated.length : 0
    };

    console.log('Email intake successful:', {
      ticketId: ticket.id,
      subject: payload.subject,
      fromEmail: payload.fromEmail,
      departments: suggestedDepartments,
      requestReview
    });

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in intake-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);