import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TeamsNotificationRequest {
  departments: string[];
  ticketId: string;
  subject: string;
  origin: string;
  sectionsData: Array<{
    sectionId: string;
    dept: string;
  }>;
  teamsUrls: {
    [key: string]: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      departments, 
      ticketId, 
      subject, 
      origin, 
      sectionsData, 
      teamsUrls 
    }: TeamsNotificationRequest = await req.json();

    console.log("Sending Teams notifications for departments:", departments);

    const results = [];

    for (const dept of departments) {
      const sectionData = sectionsData.find(s => s.dept === dept);
      const webhookUrl = teamsUrls[`teams_url_${dept}`];

      if (!webhookUrl || !sectionData) {
        console.warn(`Missing webhook URL or section data for department: ${dept}`);
        results.push({
          dept,
          success: false,
          error: 'Missing webhook URL or section data'
        });
        continue;
      }

      const payload = {
        ticketId,
        sectionId: sectionData.sectionId,
        dept,
        subject,
        summary: "Approve or annotate your section by EOD.",
        reviewUrl: `${origin}/review/${sectionData.sectionId}`
      };

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const success = response.ok;
        console.log(`Teams notification for ${dept}:`, success ? 'SUCCESS' : 'FAILED');
        
        results.push({
          dept,
          success,
          status: response.status,
          ...(success ? {} : { error: await response.text() })
        });
      } catch (error) {
        console.error(`Error sending Teams notification to ${dept}:`, error);
        results.push({
          dept,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-teams-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);