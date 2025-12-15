// Text normalization utilities for converting plain text to structured HTML

// Convert plain text lines to bulleted HTML list
export function toBulletedHtml(text: string): string {
  if (!text) return '';
  
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';
  
  // Check if most lines already start with bullet indicators
  const bulletPattern = /^[-*•]\s+/;
  const bulletLines = lines.filter(l => bulletPattern.test(l));
  const hasExistingBullets = bulletLines.length >= Math.ceil(lines.length / 2);
  
  if (hasExistingBullets) {
    // Clean existing bullets and wrap in proper HTML
    const items = lines.map(line => {
      const cleanLine = line.replace(bulletPattern, '').trim();
      return cleanLine ? `<li>${cleanLine}</li>` : '';
    }).filter(Boolean);
    return `<ul>${items.join('\n')}</ul>`;
  }
  
  // No existing bullets - decide between paragraphs vs list
  if (lines.length === 1) {
    return `<p>${lines[0]}</p>`;
  }
  
  // Multiple lines - convert to bulleted list
  const items = lines.map(line => `<li>${line}</li>`).join('\n');
  return `<ul>${items}</ul>`;
}

// Coerce unstructured content into the 6-section format
export function coerceToSectionedHtml(rawText: string): string {
  if (!rawText) return '';
  
  // Clean the input text
  const cleanText = rawText.trim();
  
  // Try to detect existing sections first
  const sectionPatterns = [
    { heading: 'Our understanding', keywords: ['understanding', 'situation', 'inquiry', 'request'] },
    { heading: 'Property facts', keywords: ['property', 'facts', 'parcel', 'address', 'zoning'] },
    { heading: 'Relevant code citations', keywords: ['code', 'citation', 'luc', 'bcc', 'regulation'] },
    { heading: 'Guidance', keywords: ['guidance', 'recommendation', 'advice', 'should', 'must'] },
    { heading: 'Follow-up questions', keywords: ['question', 'clarification', 'need to know', 'require'] },
    { heading: 'Next steps', keywords: ['next', 'step', 'action', 'process', 'submit', 'apply'] }
  ];
  
  // If text is very short, put it all in "Our understanding"
  if (cleanText.length < 200) {
    return `<h3>Our understanding</h3>${toBulletedHtml(cleanText)}`;
  }
  
  // Try to split text into sentences/paragraphs for distribution
  const sentences = cleanText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  
  if (sentences.length === 0) {
    return `<h3>Our understanding</h3><p>${cleanText}</p>`;
  }
  
  // Distribute content across sections based on keywords
  const sectionContent: { [key: string]: string[] } = {};
  
  sentences.forEach(sentence => {
    let bestMatch = 'Our understanding'; // default
    let maxScore = 0;
    
    sectionPatterns.forEach(({ heading, keywords }) => {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (sentence.toLowerCase().includes(keyword.toLowerCase()) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = heading;
      }
    });
    
    if (!sectionContent[bestMatch]) {
      sectionContent[bestMatch] = [];
    }
    sectionContent[bestMatch].push(sentence);
  });
  
  // Build the structured HTML
  const htmlSections = sectionPatterns.map(({ heading }) => {
    const content = sectionContent[heading];
    if (!content || content.length === 0) {
      return `<h3>${heading}</h3><p><em>No specific information available</em></p>`;
    }
    
    const contentHtml = content.length === 1 
      ? `<p>${content[0]}</p>`
      : toBulletedHtml(content.join('\n'));
    
    return `<h3>${heading}</h3>${contentHtml}`;
  }).join('\n\n');
  
  return htmlSections + '\n<p><small style="color: gray;">Draft for staff review</small></p>';
}

// Extract and normalize content from various formats (JSON, HTML, plain text)
export function normalizeContent(rawContent: string): string {
  if (!rawContent) return '';
  
  console.log('normalizeContent input:', rawContent.substring(0, 200) + '...');
  
  // Clean the input first
  let cleanContent = rawContent.trim();
  
  // Remove any wrapping quotes if the entire content is quoted
  if (cleanContent.startsWith('"') && cleanContent.endsWith('"')) {
    cleanContent = cleanContent.slice(1, -1);
  }
  
  try {
    // Try to parse as JSON first
    let parsed;
    
    // Try direct parsing
    try {
      parsed = JSON.parse(cleanContent);
    } catch (firstError) {
      // Try to extract JSON from mixed content
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw firstError;
      }
    }
    
    console.log('Successfully parsed JSON in normalizeContent:', parsed);
    
    if (parsed.html && typeof parsed.html === 'string') {
      // Unescape any JSON-escaped content
      let html = parsed.html.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      console.log('Extracted HTML from JSON:', html.substring(0, 100) + '...');
      return html;
    }
    
    // Extract from atoms structure if present
    if (parsed.atoms) {
      console.log('Building content from atoms structure');
      const parts: string[] = [];
      
      if (parsed.atoms.understanding) {
        parts.push(`<h3>Our understanding</h3>${toBulletedHtml(parsed.atoms.understanding)}`);
      }
      
      if (parsed.atoms.propertyFacts) {
        const facts = Array.isArray(parsed.atoms.propertyFacts) 
          ? parsed.atoms.propertyFacts.map((f: any) => `${f.key}: ${f.value}`).join('\n')
          : JSON.stringify(parsed.atoms.propertyFacts);
        parts.push(`<h3>Property facts</h3>${toBulletedHtml(facts)}`);
      }
      
      if (parsed.atoms.guidance) {
        const guidance = Array.isArray(parsed.atoms.guidance) 
          ? parsed.atoms.guidance.join('\n')
          : parsed.atoms.guidance;
        parts.push(`<h3>Guidance</h3>${toBulletedHtml(guidance)}`);
      }
      
      if (parsed.atoms.followups) {
        const followups = Array.isArray(parsed.atoms.followups) 
          ? parsed.atoms.followups.join('\n')
          : parsed.atoms.followups;
        parts.push(`<h3>Follow-up questions</h3>${toBulletedHtml(followups)}`);
      }
      
      if (parsed.atoms.nextsteps) {
        const nextsteps = Array.isArray(parsed.atoms.nextsteps) 
          ? parsed.atoms.nextsteps.join('\n')
          : parsed.atoms.nextsteps;
        parts.push(`<h3>Next steps</h3>${toBulletedHtml(nextsteps)}`);
      }
      
      if (parts.length > 0) {
        const result = parts.join('\n\n') + '\n<p><small style="color: gray;">Draft for staff review</small></p>';
        console.log('Built content from atoms:', result.substring(0, 100) + '...');
        return result;
      }
    }
    
    // If parsed but no usable content, treat as plain text
    console.log('Parsed JSON but no usable html/atoms, treating as plain text');
    
  } catch (error) {
    console.log('Failed to parse as JSON, continuing with text parsing:', error);
    // Not JSON, continue with other parsing
  }
  
  // Try to extract HTML from markdown code blocks
  const codeBlockMatch = cleanContent.match(/```(?:html|json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    console.log('Found content in code block, recursing');
    return normalizeContent(codeBlockMatch[1]);
  }
  
  // Try to extract HTML from quotes - improved pattern
  const quotedHtmlMatch = cleanContent.match(/"html":\s*"([^"]*(?:\\.[^"]*)*)"/);
  if (quotedHtmlMatch) {
    console.log('Found quoted HTML content');
    // Unescape the JSON string
    const unescaped = quotedHtmlMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    return unescaped;
  }
  
  // Try to extract any JSON object and parse it
  const jsonObjectMatch = cleanContent.match(/\{[\s\S]*"html"[\s\S]*\}/);
  if (jsonObjectMatch) {
    console.log('Found JSON object containing html, recursing');
    return normalizeContent(jsonObjectMatch[0]);
  }
  
  // Check if content already looks like HTML
  if (/<h[1-6]|<p|<ul|<li/i.test(cleanContent)) {
    console.log('Content appears to be HTML already');
    return cleanContent;
  }
  
  // Fall back to converting plain text to structured HTML
  console.log('Falling back to coerceToSectionedHtml for plain text');
  return coerceToSectionedHtml(cleanContent);
}