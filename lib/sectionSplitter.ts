// HTML section splitter for AI-generated content
// Splits 6-section AI HTML into 3 department sections: situation, guidance, nextsteps

import type { DraftAtoms, SectionKey } from '@/lib/store';

interface SplitSection {
  sectionKey: SectionKey;
  title: string;
  content: string;
  atoms: DraftAtoms;
}

// Extract content between headings in HTML
function extractSectionContent(html: string, heading: string): string {
  const regex = new RegExp(`<h3[^>]*>${heading}</h3>([\\s\\S]*?)(?=<h3|$)`, 'i');
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

// Create partial atoms for each section type
function extractSituationAtoms(html: string): Partial<DraftAtoms> {
  const understanding = extractSectionContent(html, 'Our understanding');
  const propertyFacts = extractSectionContent(html, 'Property facts');
  
  const atoms: Partial<DraftAtoms> = {};
  
  if (understanding || propertyFacts) {
    atoms.situation = {
      understanding: understanding ? [understanding.replace(/<[^>]+>/g, '').trim()] : [],
      propertyFacts: []
    };
    
    if (propertyFacts) {
      const listItems = propertyFacts.match(/<li[^>]*>([^<]+)<\/li>/gi) || [];
      atoms.situation.propertyFacts = listItems.map(item => {
        const text = item.replace(/<[^>]+>/g, '').trim();
        const [key, ...valueParts] = text.split(':');
        return {
          key: key?.trim() || text,
          value: valueParts.length ? valueParts.join(':').trim() : ''
        };
      });
    }
  }
  
  return atoms;
}

function extractGuidanceAtoms(html: string): Partial<DraftAtoms> {
  const guidance = extractSectionContent(html, 'Guidance');
  const citations = extractSectionContent(html, 'Relevant code citations');
  
  const atoms: Partial<DraftAtoms> = {};
  
  if (guidance || citations) {
    atoms.guidance = {
      recommendations: [],
      citations: []
    };
    
    if (guidance) {
      const listItems = guidance.match(/<li[^>]*>([^<]+)<\/li>/gi) || [];
      atoms.guidance.recommendations = listItems.map(item => item.replace(/<[^>]+>/g, '').trim());
    }
    
    if (citations) {
      const listItems = citations.match(/<li[^>]*>([^<]+)<\/li>/gi) || [];
      atoms.guidance.citations = listItems.map(item => {
        const text = item.replace(/<[^>]+>/g, '').trim();
        const codeMatch = text.match(/\[(LUC|BCC)\s+([\d.]+)\]/);
        return {
          code: codeMatch?.[1] || 'LUC',
          section: codeMatch?.[2] || '',
          description: text.replace(/\[(LUC|BCC)\s+[\d.]+\]\s*-?\s*/, '').trim()
        };
      });
    }
  }
  
  return atoms;
}

function extractNextstepsAtoms(html: string): Partial<DraftAtoms> {
  const followups = extractSectionContent(html, 'Follow-up questions');
  const nextsteps = extractSectionContent(html, 'Next steps');
  
  const atoms: Partial<DraftAtoms> = {};
  
  if (followups || nextsteps) {
    atoms.nextsteps = {
      followups: [],
      actions: []
    };
    
    if (followups) {
      const listItems = followups.match(/<li[^>]*>([^<]+)<\/li>/gi) || [];
      atoms.nextsteps.followups = listItems.map(item => item.replace(/<[^>]+>/g, '').trim());
    }
    
    if (nextsteps) {
      const listItems = nextsteps.match(/<li[^>]*>([^<]+)<\/li>/gi) || [];
      atoms.nextsteps.actions = listItems.map(item => item.replace(/<[^>]+>/g, '').trim());
    }
  }
  
  return atoms;
}

// Check if HTML content contains multiple sections (AI-generated format)
export function isMultiSectionContent(html: string): boolean {
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
  
  return foundHeadings.length >= 3; // At least half the sections
}

// Split AI-generated HTML into 3 department sections
export function splitAIContentIntoSections(html: string, department: string): SplitSection[] {
  if (!isMultiSectionContent(html)) {
    // Return as single situation section for non-AI content
    const defaultAtoms: DraftAtoms = {
      situation: { understanding: [], propertyFacts: [] },
      guidance: { recommendations: [], citations: [] },
      nextsteps: { followups: [], actions: [] }
    };
    
    return [{
      sectionKey: 'situation',
      title: 'Situation',
      content: html,
      atoms: defaultAtoms
    }];
  }

  const sections: SplitSection[] = [];

  // Section 1: Situation (Understanding + Property Facts)
  const situationParts = [];
  const understandingContent = extractSectionContent(html, 'Our understanding');
  const propertyFactsContent = extractSectionContent(html, 'Property facts');
  
  if (understandingContent) {
    situationParts.push(`<h3>Our understanding</h3>${understandingContent}`);
  }
  if (propertyFactsContent) {
    situationParts.push(`<h3>Property facts</h3>${propertyFactsContent}`);
  }

  if (situationParts.length > 0) {
    const situationAtoms = extractSituationAtoms(html);
    const defaultAtoms: DraftAtoms = {
      situation: situationAtoms.situation || { understanding: [], propertyFacts: [] },
      guidance: { recommendations: [], citations: [] },
      nextsteps: { followups: [], actions: [] }
    };

    sections.push({
      sectionKey: 'situation',
      title: 'Situation',
      content: situationParts.join('\n'),
      atoms: defaultAtoms
    });
  }

  // Section 2: Guidance (Citations + Guidance)
  const guidanceParts = [];
  const citationsContent = extractSectionContent(html, 'Relevant code citations');
  const guidanceContent = extractSectionContent(html, 'Guidance');
  
  if (citationsContent) {
    guidanceParts.push(`<h3>Relevant code citations</h3>${citationsContent}`);
  }
  if (guidanceContent) {
    guidanceParts.push(`<h3>Guidance</h3>${guidanceContent}`);
  }

  if (guidanceParts.length > 0) {
    const guidanceAtoms = extractGuidanceAtoms(html);
    const defaultAtoms: DraftAtoms = {
      situation: { understanding: [], propertyFacts: [] },
      guidance: guidanceAtoms.guidance || { recommendations: [], citations: [] },
      nextsteps: { followups: [], actions: [] }
    };

    sections.push({
      sectionKey: 'guidance',
      title: 'Guidance',
      content: guidanceParts.join('\n'),
      atoms: defaultAtoms
    });
  }

  // Section 3: Next Steps (Follow-ups + Next Steps)
  const nextstepsParts = [];
  const followupsContent = extractSectionContent(html, 'Follow-up questions');
  const nextstepsContent = extractSectionContent(html, 'Next steps');
  
  if (followupsContent) {
    nextstepsParts.push(`<h3>Follow-up questions</h3>${followupsContent}`);
  }
  if (nextstepsContent) {
    nextstepsParts.push(`<h3>Next steps</h3>${nextstepsContent}`);
  }

  if (nextstepsParts.length > 0) {
    const nextstepsAtoms = extractNextstepsAtoms(html);
    const defaultAtoms: DraftAtoms = {
      situation: { understanding: [], propertyFacts: [] },
      guidance: { recommendations: [], citations: [] },
      nextsteps: nextstepsAtoms.nextsteps || { followups: [], actions: [] }
    };

    sections.push({
      sectionKey: 'nextsteps',
      title: 'Next Steps',
      content: nextstepsParts.join('\n'),
      atoms: defaultAtoms
    });
  }

  return sections;
}