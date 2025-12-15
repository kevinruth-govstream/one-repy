import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyRequest {
  flowUrl: string;
  payload: {
    ticketId: string;
    sectionId: string;
    dept: string;
    subject: string;
    summary: string;
    reviewUrl: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flowUrl, payload }: NotifyRequest = await req.json();

    console.log(`Teams webhook relay request for ${payload.dept}:`, { flowUrl: flowUrl.substring(0, 50) + '...' });

    // Validate flowUrl
    if (!flowUrl || typeof flowUrl !== 'string') {
      return new Response(JSON.stringify({ 
        ok: false, 
        status: 400, 
        body: 'Missing or invalid flowUrl' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate that flowUrl is HTTPS
    let url: URL;
    try {
      url = new URL(flowUrl);
      if (url.protocol !== 'https:') {
        return new Response(JSON.stringify({ 
          ok: false, 
          status: 400, 
          body: 'Webhook URL must use HTTPS' 
        }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ 
        ok: false, 
        status: 400, 
        body: 'Invalid webhook URL format' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate payload
    if (!payload || !payload.dept || !payload.subject) {
      return new Response(JSON.stringify({ 
        ok: false, 
        status: 400, 
        body: 'Missing required payload fields' 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Make the relay request to Teams webhook
    try {
      const response = await fetch(flowUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      const success = response.ok;
      
      console.log(`Teams webhook response for ${payload.dept}:`, {
        status: response.status,
        success,
        responseLength: responseText.length
      });

      return new Response(JSON.stringify({ 
        ok: success,
        status: response.status,
        ...(success ? {} : { body: responseText })
      }), {
        status: success ? 200 : response.status,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });

    } catch (fetchError: any) {
      console.error(`Error calling Teams webhook for ${payload.dept}:`, fetchError);
      return new Response(JSON.stringify({ 
        ok: false, 
        status: 500, 
        body: `Network error: ${fetchError.message}` 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("Error in teams-webhook-relay function:", error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        status: 500, 
        body: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);