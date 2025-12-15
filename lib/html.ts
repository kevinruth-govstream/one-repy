// HTML sanitization and validation utilities for AI-generated content

// Super-light sanitizer for demo: strips scripts and event handlers, allows specific tags
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Remove scripts and style tags completely
  let out = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  out = out.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
  
  // Strip event handlers (onclick, onload, etc.)
  out = out.replace(/\son\w+="[^"]*"/gi, '');
  out = out.replace(/\son\w+='[^']*'/gi, '');
  
  // Remove javascript: protocol
  out = out.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  
  // Whitelist allowed tags - only allow these and strip everything else
  const allowedTags = /^(H3|P|UL|LI|STRONG|EM|A|BR)$/i;
  out = out.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, (match, tagName) => {
    return allowedTags.test(tagName) ? match : '';
  });
  
  // Clean up any remaining dangerous attributes
  out = out.replace(/\s(src|data-|style)\s*=\s*["'][^"']*["']/gi, '');
  
  return out.trim();
}

// Check if HTML contains the expected 6-section structure
export function hasStructuredSections(html: string): boolean {
  if (!html) return false;
  
  const requiredHeadings = [
    'our understanding',
    'property facts', 
    'relevant code citations',
    'guidance',
    'follow-up questions',
    'next steps'
  ];
  
  const htmlLower = html.toLowerCase();
  const foundHeadings = requiredHeadings.filter(heading => 
    htmlLower.includes(`<h3>${heading}`) || htmlLower.includes(`<h3 >${heading}`)
  );
  
  return foundHeadings.length >= 4; // Allow some flexibility
}

// Validate that HTML uses only allowed tags and has basic structure
export function validateHtmlStructure(html: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!html) {
    issues.push('HTML content is empty');
    return { valid: false, issues };
  }
  
  // Check for dangerous content
  if (/<script|<style|javascript:|on\w+=/i.test(html)) {
    issues.push('Contains potentially unsafe content');
  }
  
  // Check for disallowed tags
  const disallowedTagMatch = html.match(/<\/?(?!\/?(h3|p|ul|li|strong|em|a|br)\b)[a-z0-9]+/gi);
  if (disallowedTagMatch) {
    issues.push(`Contains disallowed tags: ${disallowedTagMatch.slice(0, 3).join(', ')}`);
  }
  
  // Check for basic structure
  if (!/<h3/i.test(html)) {
    issues.push('Missing section headings (h3 tags)');
  }
  
  if (!/<ul|<li/i.test(html)) {
    issues.push('Missing list structure (ul/li tags)');
  }
  
  return { valid: issues.length === 0, issues };
}