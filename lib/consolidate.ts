import type { Section, DraftAtoms, DeptKey } from './store';
import { getDepartment } from './departments';

// Similarity calculation using Jaccard index
export function calculateSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) => text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);
  
  const set1 = new Set(normalize(text1));
  const set2 = new Set(normalize(text2));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

// Group similar items together
export function groupSimilarItems(items: string[], threshold = 0.3): string[][] {
  const groups: string[][] = [];
  const used = new Set<number>();
  
  for (let i = 0; i < items.length; i++) {
    if (used.has(i)) continue;
    
    const group = [items[i]];
    used.add(i);
    
    for (let j = i + 1; j < items.length; j++) {
      if (used.has(j)) continue;
      
      if (calculateSimilarity(items[i], items[j]) > threshold) {
        group.push(items[j]);
        used.add(j);
      }
    }
    
    groups.push(group);
  }
  
  return groups;
}

// Merge property facts with conflict resolution
export function mergePropertyFacts(facts: { key: string; value: string; source?: string }[][]): { key: string; value: string; sources: string[] }[] {
  const factMap = new Map<string, { values: Set<string>; sources: Set<string> }>();
  
  facts.flat().forEach(fact => {
    const key = fact.key.toLowerCase();
    
    if (!factMap.has(key)) {
      factMap.set(key, { values: new Set(), sources: new Set() });
    }
    
    const entry = factMap.get(key)!;
    entry.values.add(fact.value);
    if (fact.source) entry.sources.add(fact.source);
  });
  
  return Array.from(factMap.entries()).map(([key, data]) => ({
    key: key.charAt(0).toUpperCase() + key.slice(1),
    value: Array.from(data.values).join(' / '), // Show conflicts separated by " / "
    sources: Array.from(data.sources)
  }));
}

// Merge citations with deduplication
export function mergeCitations(citations: { code: string; section: string; description: string; source?: string }[][]): { code: string; section: string; description: string; sources: string[] }[] {
  const citationMap = new Map<string, { descriptions: Set<string>; sources: Set<string> }>();
  
  citations.flat().forEach(citation => {
    const key = `${citation.code}-${citation.section}`;
    
    if (!citationMap.has(key)) {
      citationMap.set(key, { descriptions: new Set(), sources: new Set() });
    }
    
    const entry = citationMap.get(key)!;
    entry.descriptions.add(citation.description);
    if (citation.source) entry.sources.add(citation.source);
  });
  
  return Array.from(citationMap.entries()).map(([key, data]) => {
    const [code, section] = key.split('-');
    return {
      code,
      section,
      description: Array.from(data.descriptions).join('; '),
      sources: Array.from(data.sources)
    };
  });
}

// Department priority for final ordering
const DEPT_PRIORITY: Record<DeptKey, number> = {
  'transportation': 1,
  'building': 2,
  'utilities': 3,
  'land_use': 4
};

// Consolidate sections into unified atoms (3-section approach)
export function consolidateSections(sections: Section[]): DraftAtoms {
  const approvedSections = sections.filter(s => s.status === 'approved');
  
  // Group by section type
  const sectionGroups = approvedSections.reduce((groups, section) => {
    if (!groups[section.sectionKey]) {
      groups[section.sectionKey] = [];
    }
    groups[section.sectionKey].push(section);
    return groups;
  }, {} as Record<string, Section[]>);

  const consolidated: DraftAtoms = {
    situation: {
      understanding: [],
      propertyFacts: []
    },
    guidance: {
      recommendations: [],
      citations: []
    },
    nextsteps: {
      followups: [],
      actions: []
    }
  };

  // Consolidate Situation (Understanding + Property Facts)
  if (sectionGroups.situation) {
    sectionGroups.situation.forEach(section => {
      if (section.atoms.situation?.understanding) {
        consolidated.situation.understanding.push(...section.atoms.situation.understanding);
      }
      if (section.atoms.situation?.propertyFacts) {
        section.atoms.situation.propertyFacts.forEach(fact => {
          consolidated.situation.propertyFacts.push({
            ...fact,
            source: getDepartment(section.department).name
          });
        });
      }
    });

    // Deduplicate understanding entries
    const uniqueUnderstanding = consolidated.situation.understanding.filter((item, index) =>
      consolidated.situation.understanding.findIndex(other => 
        calculateSimilarity(item, other) > 0.7
      ) === index
    );
    consolidated.situation.understanding = uniqueUnderstanding.slice(0, 3);

    // Merge property facts by key
    const factMap = new Map<string, { values: Set<string>; sources: Set<string> }>();
    consolidated.situation.propertyFacts.forEach(fact => {
      const key = fact.key.toLowerCase();
      if (!factMap.has(key)) {
        factMap.set(key, { values: new Set(), sources: new Set() });
      }
      const entry = factMap.get(key)!;
      entry.values.add(fact.value);
      if (fact.source) entry.sources.add(fact.source);
    });

    consolidated.situation.propertyFacts = Array.from(factMap.entries()).map(([key, data]) => ({
      key: key.charAt(0).toUpperCase() + key.slice(1),
      value: Array.from(data.values).join(' / '),
      source: Array.from(data.sources).join(', ')
    }));
  }

  // Consolidate Guidance (Recommendations + Citations)
  if (sectionGroups.guidance) {
    sectionGroups.guidance.forEach(section => {
      if (section.atoms.guidance?.recommendations) {
        consolidated.guidance.recommendations.push(...section.atoms.guidance.recommendations);
      }
      if (section.atoms.guidance?.citations) {
        section.atoms.guidance.citations.forEach(citation => {
          consolidated.guidance.citations.push({
            ...citation,
            source: getDepartment(section.department).name
          });
        });
      }
    });

    // Group similar recommendations
    const recGroups = groupSimilarItems(consolidated.guidance.recommendations, 0.4);
    consolidated.guidance.recommendations = recGroups.map(group => group[0]);

    // Merge citations by code/section
    const citationMap = new Map<string, { descriptions: Set<string>; sources: Set<string> }>();
    consolidated.guidance.citations.forEach(citation => {
      const key = `${citation.code}-${citation.section}`;
      if (!citationMap.has(key)) {
        citationMap.set(key, { descriptions: new Set(), sources: new Set() });
      }
      const entry = citationMap.get(key)!;
      entry.descriptions.add(citation.description);
      if (citation.source) entry.sources.add(citation.source);
    });

    consolidated.guidance.citations = Array.from(citationMap.entries()).map(([key, data]) => {
      const [code, section] = key.split('-');
      return {
        code,
        section,
        description: Array.from(data.descriptions).join('; '),
        source: Array.from(data.sources).join(', ')
      };
    });
  }

  // Consolidate Next Steps (Follow-ups + Actions)
  if (sectionGroups.nextsteps) {
    sectionGroups.nextsteps.forEach(section => {
      if (section.atoms.nextsteps?.followups) {
        consolidated.nextsteps.followups.push(...section.atoms.nextsteps.followups);
      }
      if (section.atoms.nextsteps?.actions) {
        consolidated.nextsteps.actions.push(...section.atoms.nextsteps.actions);
      }
    });

    // Group similar follow-ups
    const followupGroups = groupSimilarItems(consolidated.nextsteps.followups, 0.5);
    consolidated.nextsteps.followups = followupGroups.map(group => group[0]);

    // Group similar actions and number them
    const actionGroups = groupSimilarItems(consolidated.nextsteps.actions, 0.4);
    consolidated.nextsteps.actions = actionGroups
      .map(group => group[0])
      .map((action, i) => `${i + 1}. ${action}`);
  }

  return consolidated;
}

// Format consolidated atoms for email display (3-section approach)
export function formatConsolidatedSection(sectionKey: string, atoms: DraftAtoms): string {
  switch (sectionKey) {
    case 'situation':
      let situationText = '';
      if (atoms.situation.understanding.length > 0) {
        situationText += 'Understanding:\n' + atoms.situation.understanding.join('\n\n') + '\n\n';
      }
      if (atoms.situation.propertyFacts.length > 0) {
        situationText += 'Property Facts:\n' + atoms.situation.propertyFacts
          .map(fact => `• ${fact.key}: ${fact.value}${fact.source ? ` (${fact.source})` : ''}`)
          .join('\n');
      }
      return situationText;
      
    case 'guidance':
      let guidanceText = '';
      if (atoms.guidance.recommendations.length > 0) {
        guidanceText += 'Recommendations:\n' + atoms.guidance.recommendations
          .map(rec => `• ${rec}`)
          .join('\n') + '\n\n';
      }
      if (atoms.guidance.citations.length > 0) {
        guidanceText += 'Citations:\n' + atoms.guidance.citations
          .map(citation => `• ${citation.code} ${citation.section} - ${citation.description}${citation.source ? ` (${citation.source})` : ''}`)
          .join('\n');
      }
      return guidanceText;
      
    case 'nextsteps':
      let stepsText = '';
      if (atoms.nextsteps.followups.length > 0) {
        stepsText += 'Follow-ups:\n' + atoms.nextsteps.followups
          .map(followup => `• ${followup}`)
          .join('\n') + '\n\n';
      }
      if (atoms.nextsteps.actions.length > 0) {
        stepsText += 'Actions:\n' + atoms.nextsteps.actions.join('\n');
      }
      return stepsText;
      
    default:
      return '';
  }
}