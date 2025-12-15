import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ALLOWED_DOMAINS = ['govstream.ai', 'bellevuewa.gov'];

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ 
          error: 'Email is required and must be a string' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract domain from email
    const emailDomain = email.split('@')[1]?.toLowerCase();
    
    if (!emailDomain) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid email format' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if domain is allowed
    const isValidDomain = ALLOWED_DOMAINS.includes(emailDomain);
    
    if (!isValidDomain) {
      return new Response(
        JSON.stringify({ 
          error: `Email domain @${emailDomain} is not authorized. Please use an email from @govstream.ai or @bellevuewa.gov`,
          allowedDomains: ALLOWED_DOMAINS
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Domain is valid
    return new Response(
      JSON.stringify({ 
        valid: true,
        domain: emailDomain,
        message: 'Email domain is authorized'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Email domain validation error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error during email validation' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})