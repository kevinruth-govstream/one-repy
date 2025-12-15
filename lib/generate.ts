// AI content generation client helper - Direct API version for hackathon
import { DeptKey, SectionKey } from '@/lib/store';
import { GeneratorConfig, GenResult, defaultGeneratorConfig } from '@/lib/genTypes';

// Re-export for easier imports
export type { GeneratorConfig } from '@/lib/genTypes';

// Get generator configuration from localStorage
export function getGenConfig(): GeneratorConfig {
  try {
    const saved = localStorage.getItem('onereply-generator-config');
    if (saved) {
      return { ...defaultGeneratorConfig, ...JSON.parse(saved) };
    }
  } catch (error) {
    console.error('Failed to load generator config:', error);
  }
  return defaultGeneratorConfig;
}

// Save generator configuration to localStorage
export function saveGenConfig(config: GeneratorConfig): void {
  try {
    localStorage.setItem('onereply-generator-config', JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save generator config:', error);
  }
}

// Check if AI generation is enabled and configured
export function isGenEnabled(): boolean {
  const config = getGenConfig();
  return config.enabled && !!config.baseUrl && !!config.model && !!config.apiKey;
}

// Generate content using AI (direct API call for hackathon)
export async function generateSection(
  dept: DeptKey,
  sectionKey: SectionKey,
  subject: string,
  body: string
): Promise<GenResult> {
  const config = getGenConfig();
  console.log('generateSection called with config:', { ...config, apiKey: '[hidden]' });
  
  if (!isGenEnabled()) {
    console.log('AI generation is not enabled or configured');
    throw new Error('AI generation is not enabled or configured');
  }

  if (!config.apiKey) {
    throw new Error('API key not configured');
  }

  try {
    console.log('Making direct API call to Groq...');
    
    const systemPrompt = `You are OneReply's departmental drafting assistant. Output **strict JSON** containing:

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

    const userMessage = `Department: ${dept}
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

    const response = await fetch(config.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 1000,
        temperature: 0.3
      }),
    });

    console.log('Direct API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Direct API error:', errorText);
      throw new Error(`API call failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Direct API response:', data);

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in API response');
    }

    // Try to parse as JSON with robust error handling
    let result;
    try {
      // Clean content before parsing - remove markdown fences, extra whitespace
      let cleanContent = content.trim();
      
      // Remove markdown code block markers if present
      cleanContent = cleanContent.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '');
      
      // Try to extract JSON from text that might contain extra text
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      console.log('Attempting to parse cleaned content:', cleanContent.substring(0, 200) + '...');
      result = JSON.parse(cleanContent);
      
      // Validate the parsed result has required structure
      if (!result.html && !result.atoms) {
        throw new Error('Missing required html or atoms in parsed JSON');
      }
      
    } catch (parseError) {
      console.error('Failed to parse JSON, attempting content extraction:', parseError);
      
      // Try to extract HTML content from the response even if JSON parsing fails
      const htmlMatch = content.match(/"html":\s*"([^"]*(?:\\.[^"]*)*)"/);
      let extractedHtml = '';
      
      if (htmlMatch) {
        // Unescape the JSON string
        extractedHtml = htmlMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
        console.log('Extracted HTML from failed JSON:', extractedHtml.substring(0, 100) + '...');
      }
      
      // Create a more intelligent fallback response
      if (extractedHtml && extractedHtml.includes('<h3>')) {
        result = {
          html: extractedHtml,
          atoms: {
            sourceDept: dept,
            understanding: 'Content extracted from malformed response'
          }
        };
      } else {
        // Use the normalize function to create proper structure
        const { normalizeContent } = await import('./normalize');
        const normalizedHtml = normalizeContent(content);
        
        result = {
          html: normalizedHtml,
          atoms: {
            sourceDept: dept,
            understanding: 'Fallback content - response required normalization'
          }
        };
      }
    }

    console.log('Parsed result:', result);

    // Ensure we have the required format
    if (!result.html || !result.atoms) {
      throw new Error('Invalid response format from AI');
    }

    return result;
  } catch (error: any) {
    console.error(`AI generation failed for ${dept}-${sectionKey}:`, error);
    throw new Error(error.message || 'AI generation failed');
  }
}

// Test AI generation with sample data
export async function testGeneration(): Promise<boolean> {
  console.log('testGeneration() started');
  try {
    console.log('About to call generateSection...');
    const result = await generateSection(
      'transportation',
      'situation',
      'Test driveway permit inquiry',
      'I need to install a new driveway on my property at 123 Main Street.'
    );
    
    console.log('generateSection result:', result);
    const success = !!(result.html && result.atoms);
    console.log('testGeneration returning:', success);
    return success;
  } catch (error) {
    console.error('Generation test failed:', error);
    return false;
  }
}