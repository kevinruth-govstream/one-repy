import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateRequest {
  dept: string;
  sectionKey: string;
  subject: string;
  body: string;
  config: {
    baseUrl: string;
    model: string;
    enabled: boolean;
  };
}

// System prompt for LLM - enforces strict 6-section HTML structure
const SYSTEM_PROMPT = `You are OneReply's departmental drafting assistant. Output **strict JSON** containing:

- html: **HTML** using only these tags: <h3>, <p>, <ul>, <li>, <strong>, <em>, <a>.
- atoms: the structured fields.

**HTML requirements:**
- Use exactly these 6 <h3> headings in order:
  1) Our understanding
  2) Property facts
  3) Relevant code citations
  4) Guidance
  5) Follow-up questions
  6) Next steps
- Under each heading, prefer a <ul> with concise <li> items. Use <p> only for one-sentence intros.
- No inline CSS, no <br>, no <div>, no tables, no images, no scripts.
- Keep total under ~250 words; cite codes like [LUC xx.xx.xxx] or [BCC xx.xx.xxx] only if clear.
- Be conservative; do not fabricate parcel IDs, permit numbers, or fees.
- Include disclaimer at end: <p><small style="color: gray;">Draft for staff review</small></p>`;

function createUserMessage(dept: string, sectionKey: string, subject: string, body: string): string {
  return `Department: ${dept}
Subject: ${subject}
Inbound email (HTML or text):

${body}

Return a single JSON object with:
{
  "html": "<h3>Our understanding</h3><ul>...</ul><h3>Property facts</h3><ul>...</ul><h3>Relevant code citations</h3><ul>...</ul><h3>Guidance</h3><ul>...</ul><h3>Follow-up questions</h3><ul>...</ul><h3>Next steps</h3><ul>...</ul>",
  "atoms": {
    "sourceDept": "${dept}",
    "understanding": "...",
    "propertyFacts": [{"key":"...","value":"..."}],
    "citations": [{"code":"LUC","section":"xx.xx.xxx","text":"optional"}],
    "guidance": ["..."],
    "followups": ["..."],
    "nextsteps": ["..."]
  }
}

Only the JSON. No markdown fences, no commentary.`;
}

function sanitizeHtml(html: string): string {
  // Remove script tags and other potentially harmful content
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

function validateResponse(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.html !== 'string') return false;
  if (!data.atoms || typeof data.atoms !== 'object') return false;
  
  // Check if atoms has at least one of the expected section structures
  const hasValidSection = ['situation', 'guidance', 'nextsteps'].some(key => 
    data.atoms[key] && typeof data.atoms[key] === 'object'
  );
  
  return hasValidSection;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dept, sectionKey, subject, body, config }: GenerateRequest = await req.json();
    
    console.log(`Generating content for ${dept}-${sectionKey}: ${subject}`);

    // Validate required fields
    if (!dept || !sectionKey || !subject || !body || !config) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get API key from Supabase secrets
    const apiKey = Deno.env.get('GROQ_API_KEY');
    
    if (!config.enabled || !config.baseUrl || !config.model) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI generation not properly configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'API key not configured in Supabase secrets' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare API request
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: createUserMessage(dept, sectionKey, subject, body) }
    ];

    const requestBody: any = {
      model: config.model,
      messages,
      temperature: 0.2,
      max_tokens: 1200,
      response_format: { type: 'json_object' }
    };

    console.log(`Calling LLM API: ${config.baseUrl}/chat/completions`);

    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`LLM API error (${response.status}):`, errorText);
        return new Response(
          JSON.stringify({ success: false, error: `API request failed: ${response.status}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const apiData = await response.json();
      
      if (!apiData.choices?.[0]?.message?.content) {
        console.error('Invalid API response structure:', apiData);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid response from AI service' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse the JSON response
      let generatedContent;
      try {
        generatedContent = JSON.parse(apiData.choices[0].message.content);
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', parseError);
        return new Response(
          JSON.stringify({ success: false, error: 'AI response was not valid JSON' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate the response structure
      if (!validateResponse(generatedContent)) {
        console.error('AI response failed validation:', generatedContent);
        return new Response(
          JSON.stringify({ success: false, error: 'AI response structure is invalid' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Sanitize HTML content
      generatedContent.html = sanitizeHtml(generatedContent.html);

      // Add size check (50KB limit)
      const responseSize = JSON.stringify(generatedContent).length;
      if (responseSize > 50 * 1024) {
        console.error('Response too large:', responseSize);
        return new Response(
          JSON.stringify({ success: false, error: 'Generated content is too large' }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Add disclaimer to HTML if not present
      if (!generatedContent.html.includes('Draft for staff review')) {
        generatedContent.html += '\n<p style="font-size: 0.8em; color: #666; margin-top: 1em;">Draft for staff review</p>';
      }

      console.log(`Successfully generated content for ${dept}-${sectionKey}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: generatedContent 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('Request timeout');
        return new Response(
          JSON.stringify({ success: false, error: 'Request timed out after 12 seconds' }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.error('Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ success: false, error: 'Network error connecting to AI service' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error in ai-generate-section function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});