import type { DeptKey, SectionKey, DraftAtoms } from './store';

// Department configuration
export interface Department {
  key: DeptKey;
  name: string;
  color: string;
  description: string;
}

export const departments: Department[] = [
  {
    key: 'transportation',
    name: 'Transportation',
    color: 'blue',
    description: 'Roads, traffic, parking, and transit infrastructure'
  },
  {
    key: 'building',
    name: 'Building',
    color: 'green',
    description: 'Building permits, inspections, and code compliance'
  },
  {
    key: 'utilities',
    name: 'Utilities',
    color: 'purple',
    description: 'Water, sewer, electrical, and telecommunications'
  },
  {
    key: 'land_use',
    name: 'Land Use',
    color: 'orange',
    description: 'Zoning, planning, and development regulations'
  }
];

// Section templates
export interface SectionTemplate {
  key: SectionKey;
  title: string;
  description: string;
  placeholder: string;
}

export const sectionTemplates: SectionTemplate[] = [
  {
    key: 'situation',
    title: 'Situation',
    description: 'Summary of the request and relevant property information',
    placeholder: 'Describe your understanding of the citizen\'s request and relevant property details...'
  },
  {
    key: 'guidance',
    title: 'Guidance',
    description: 'Department recommendations and applicable code citations',
    placeholder: 'Provide guidance, recommendations, and relevant code citations...'
  },
  {
    key: 'nextsteps',
    title: 'Next Steps',
    description: 'Follow-ups and specific actions the citizen should take',
    placeholder: 'List follow-up questions and outline specific next steps...'
  }
];

// Department suggestion logic
export function suggestDepartments(subject: string, body: string): DeptKey[] {
  const text = (subject + ' ' + body).toLowerCase();
  const suggested: DeptKey[] = [];

  // Transportation keywords
  if (/\b(road|street|traffic|parking|sidewalk|crosswalk|stop sign|traffic light|pothole|snow removal|transit|bus)\b/.test(text)) {
    suggested.push('transportation');
  }

  // Building keywords
  if (/\b(building|permit|construction|renovation|inspection|code|violation|roof|fence|deck|addition|demolition)\b/.test(text)) {
    suggested.push('building');
  }

  // Utilities keywords
  if (/\b(water|sewer|electric|power|gas|internet|cable|utility|outage|leak|meter|connection)\b/.test(text)) {
    suggested.push('utilities');
  }

  // Land use keywords
  if (/\b(zoning|planning|development|variance|subdivision|lot|property line|setback|easement|land use)\b/.test(text)) {
    suggested.push('land_use');
  }

  return suggested.length > 0 ? suggested : ['transportation']; // Default fallback
}

// Mock content generators for realistic municipal responses
export function generateMockContent(department: DeptKey, sectionKey: SectionKey, ticketSubject: string): string {
  const templates = {
    transportation: {
      situation: [
        `The resident is reporting ${ticketSubject.toLowerCase()} affecting traffic safety and road conditions in their neighborhood. Road classification: Residential collector, Speed limit: 25 mph, Sidewalk status: Present on both sides, Street lighting: Standard municipal fixtures.`,
        `Request involves transportation infrastructure concerns related to ${ticketSubject.toLowerCase()} requiring assessment and potential action. Right-of-way width: 66 feet, Pavement type: Asphalt over concrete base, Drainage: Storm sewer system, Maintenance schedule: Annual inspection.`,
        `Traffic safety issue reported regarding ${ticketSubject.toLowerCase()} that may impact pedestrian and vehicle movement. Traffic volume: 2,500 vehicles/day, Parking regulations: No parking 7-9 AM, Snow route: Priority Level 2, Bike lane: Planned for 2024.`
      ],
      guidance: [
        'Transportation Department recommends immediate temporary signage while permanent solutions are evaluated and scheduled.\n\nRelevant Codes:\n• Municipal Code 12.08.020 - Traffic Control Devices\n• Municipal Code 12.16.040 - Parking Restrictions\n• State Highway Code Section 21400 - Traffic Control',
        'Standard protocol requires 30-day public notice for any permanent traffic modifications. Temporary measures can be implemented within 5 business days.\n\nRelevant Codes:\n• Municipal Code 12.12.030 - Road Maintenance Standards\n• CALTRANS Manual Section 3B.01 - Warning Signs\n• ADA Requirements Title II',
        'Coordinate with Public Works for any utility relocations. Traffic impact study may be required for major changes.\n\nRelevant Codes:\n• Municipal Code 12.20.010 - Pedestrian Safety\n• Vehicle Code Section 21950 - Right of Way\n• Mutual Aid Agreement Protocol 2023'
      ],
      nextsteps: [
        'Follow-ups:\n• Need traffic count data for past 12 months\n• Require engineering assessment of sight lines\n• Check for pending development projects in area\n\nNext Steps:\n1. Submit formal request through online portal\n2. Attend next Traffic Safety Committee meeting\n3. Allow 2-3 weeks for engineering review',
        'Follow-ups:\n• Verify current signage inventory and condition\n• Review accident history for intersection\n• Consult with school district if near school zone\n\nNext Steps:\n1. Contact Transportation at (555) 123-4567\n2. Schedule site visit within 10 business days\n3. Receive written assessment within 30 days',
        'Follow-ups:\n• Coordinate with utilities for any underground conflicts\n• Check winter maintenance access requirements\n• Review emergency vehicle response times\n\nNext Steps:\n1. File online service request #TR-2024-0156\n2. Provide additional photos if available\n3. Monitor status through citizen portal'
      ]
    },
    building: {
      situation: [
        `Property owner seeking guidance on ${ticketSubject.toLowerCase()} and applicable building code requirements for their project. Zoning: R-1 Single Family Residential, Lot size: 0.25 acres, Existing structure: 1,800 sq ft single story, Setbacks: Front 25ft, Side 10ft, Rear 20ft.`,
        `Building permit inquiry related to ${ticketSubject.toLowerCase()} requiring code compliance review and permitting process clarification. Year built: 1985, Foundation: Concrete slab, Roof type: Composition shingle, Utilities: All public services available.`,
        `Code compliance question regarding ${ticketSubject.toLowerCase()} with need for inspection requirements and approval process. Property ID: APN 123-456-789, Flood zone: X (minimal risk), Slope: <10% grade, Soil type: Well-draining sandy loam.`
      ],
      guidance: [
        'Building Department recommends pre-application consultation to review project scope and identify potential issues before formal submittal.\n\nRelevant Codes:\n• International Building Code 2021 Edition\n• Municipal Code Title 15 - Buildings and Construction\n• California Building Code Chapter 1A',
        'Standard residential permits typically process within 3-5 business days. Complex projects may require plan review by outside consultants.\n\nRelevant Codes:\n• Municipal Code 15.12.040 - Permit Requirements\n• IBC Section 105.1 - Required Permits\n• CBC Section 1613 - Earthquake Loads',
        'Ensure all contractors are properly licensed and bonded. Final inspection required before Certificate of Occupancy is issued.\n\nRelevant Codes:\n• Municipal Code 15.08.020 - Setback Requirements\n• Zoning Code Section 17.20.030 - Residential Standards\n• Fire Code Chapter 5 - Fire Service Features'
      ],
      nextsteps: [
        'Follow-ups:\n• Need detailed project plans and specifications\n• Require structural calculations if applicable\n• Verify contractor licensing status\n\nNext Steps:\n1. Schedule pre-application meeting\n2. Prepare complete permit application\n3. Submit plans and pay fees online',
        'Follow-ups:\n• Confirm utility capacity for additional loads\n• Check for deed restrictions or HOA requirements\n• Review environmental constraints\n\nNext Steps:\n1. Contact Building Department at (555) 234-5678\n2. Download permit application forms\n3. Schedule plan review appointment',
        'Follow-ups:\n• Schedule required inspections in advance\n• Ensure accessibility compliance if applicable\n• Verify fire department access requirements\n\nNext Steps:\n1. Visit permit counter during business hours\n2. Bring property survey and project plans\n3. Allow 10-15 business days for review'
      ]
    },
    utilities: {
      understanding: [
        `Utility service request regarding ${ticketSubject.toLowerCase()} requiring coordination between multiple utility providers and city services.`,
        `Infrastructure concern related to ${ticketSubject.toLowerCase()} affecting water, sewer, or electrical service reliability in the area.`,
        `Utility connection or modification request for ${ticketSubject.toLowerCase()} requiring engineering review and service coordination.`
      ],
      property_facts: [
        'Water service: 5/8" meter, adequate pressure\nSewer connection: 6" lateral to main\nElectric: Underground service, 200A panel\nGas: Natural gas available',
        'Utility easements: 10ft rear, 5ft side\nWater main: 8" ductile iron, installed 1995\nSewer main: 10" PVC, good condition\nStorm drain: 24" RCP',
        'Service address: 123 Main Street\nUtility district: Zone 3\nPressure zone: 180 PSI\nEmergency shutoffs: Street and meter'
      ],
      citations: [
        'Municipal Code Title 13 - Public Utilities\nCalifornia Public Utilities Code Section 216\nUniform Plumbing Code Chapter 6',
        'Municipal Code 13.04.020 - Water Service Requirements\nCalifornia Health and Safety Code 116275\nTitle 22 Drinking Water Standards',
        'Municipal Code 13.08.030 - Sewer Connection Standards\nRegional Water Quality Control Board Order\nState Water Resources Control Board Regulations'
      ],
      guidance: [
        'Utilities Department recommends coordinating all underground work to minimize service disruptions and reduce restoration costs.',
        'New connections require capacity analysis and may trigger system development fees. Schedule inspections before backfilling.',
        'Emergency contact: (555) 999-8888 for after-hours utility emergencies. Non-emergency service requests process within 3-5 business days.'
      ],
      followups: [
        'Need current utility usage data\nRequire site survey for new connections\nVerify existing service capacity',
        'Check for underground utility conflicts\nConfirm contractor qualifications and licensing\nReview environmental permits if required',
        'Coordinate with other departments for permits\nSchedule required pressure testing\nEnsure proper backflow prevention devices'
      ],
      nextsteps: [
        '1. Contact Utilities at (555) 345-6789\n2. Submit service application with fees\n3. Schedule pre-construction meeting',
        '1. Call 811 for underground utility marking\n2. Obtain required permits before work\n3. Schedule inspections 24 hours in advance',
        '1. Visit Utilities office with property deed\n2. Pay applicable connection fees\n3. Coordinate with licensed contractor for work'
      ]
    },
    land_use: {
      understanding: [
        `Zoning and land use inquiry regarding ${ticketSubject.toLowerCase()} requiring review of applicable development standards and permit requirements.`,
        `Property development question related to ${ticketSubject.toLowerCase()} with need for planning review and compliance verification.`,
        `Land use compatibility concern involving ${ticketSubject.toLowerCase()} requiring zoning analysis and variance consideration.`
      ],
      property_facts: [
        'Current zoning: R-1 Single Family Residential\nGeneral Plan designation: Low Density Residential\nLot coverage: 30% maximum allowed\nHeight limit: 35 feet maximum',
        'Parcel size: 10,000 square feet\nStreet frontage: 100 feet\nFlood hazard area: Zone X\nHillside overlay: Not applicable',
        'Existing use: Single family residence\nAccessory structures: Detached garage\nLandscape requirements: 40% of front yard\nParking: 2 spaces required'
      ],
      citations: [
        'Municipal Code Title 17 - Zoning\nGeneral Plan Housing Element 2021-2029\nCalifornia Government Code Section 65580',
        'Municipal Code 17.04.020 - Zoning Districts\nSubdivision Map Act Section 66410\nCalifornia Environmental Quality Act Guidelines',
        'Municipal Code 17.64.040 - Design Review Requirements\nHistoric Preservation Ordinance\nFlood Damage Prevention Ordinance'
      ],
      guidance: [
        'Planning Department recommends early consultation for complex projects. Design review may be required for certain modifications.',
        'Variance applications require neighborhood notification and Planning Commission review. Process typically takes 6-8 weeks.',
        'Consider sustainability features and climate action goals in project design. Green building incentives may be available.'
      ],
      followups: [
        'Need detailed site plan and project description\nRequire environmental review determination\nVerify compliance with design standards',
        'Check for historic designation or significance\nReview neighborhood compatibility\nConfirm adequate parking and access',
        'Evaluate traffic and infrastructure impacts\nAssess compliance with general plan policies\nReview applicable development fees'
      ],
      nextsteps: [
        '1. Schedule pre-application conference\n2. Prepare detailed project application\n3. Submit environmental review checklist',
        '1. Contact Planning at (555) 456-7890\n2. Review zoning code requirements online\n3. Attend Planning Commission if required',
        '1. Visit Planning counter with project plans\n2. Pay application and review fees\n3. Allow 30-45 days for complete review'
      ]
    }
  };

  const deptTemplates = templates[department];
  const sectionTemplates = deptTemplates[sectionKey];
  
  if (!sectionTemplates) return `${department} ${sectionKey} content for ${ticketSubject}`;
  
  return sectionTemplates[Math.floor(Math.random() * sectionTemplates.length)];
}

// Content parser to extract structured atoms (3-section approach)
export function parseContentToAtoms(content: string, sectionKey: SectionKey): DraftAtoms {
  const atoms: DraftAtoms = {
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

  // Simple parsing logic based on section type
  switch (sectionKey) {
    case 'situation':
      // Split content into understanding and property facts
      const situationLines = content.split('\n').filter(line => line.trim());
      atoms.situation.understanding = [situationLines[0] || content.trim()];
      
      // Extract property facts (lines with colons)
      atoms.situation.propertyFacts = situationLines
        .filter(line => line.includes(':'))
        .map(line => {
          const [key, value] = line.split(':').map(s => s.trim());
          return { key, value };
        });
      break;
      
    case 'guidance':
      // Split into recommendations and citations
      const sections = content.split('Relevant Codes:');
      atoms.guidance.recommendations = sections[0]?.split('\n').filter(line => line.trim()) || [];
      
      if (sections[1]) {
        atoms.guidance.citations = sections[1].split('\n')
          .filter(line => line.trim() && line.includes('•'))
          .map(line => {
            const cleanLine = line.replace('•', '').trim();
            const parts = cleanLine.split(' - ');
            return {
              code: parts[0]?.trim() || '',
              section: '',
              description: parts[1]?.trim() || cleanLine
            };
          });
      }
      break;
      
    case 'nextsteps':
      // Split into follow-ups and actions
      const parts = content.split('Next Steps:');
      
      if (parts[0]?.includes('Follow-ups:')) {
        atoms.nextsteps.followups = parts[0]
          .split('Follow-ups:')[1]
          ?.split('\n')
          .filter(line => line.trim() && line.includes('•'))
          .map(line => line.replace('•', '').trim()) || [];
      }
      
      if (parts[1]) {
        atoms.nextsteps.actions = parts[1]
          .split(/\d+\./)
          .filter(step => step.trim())
          .map(step => step.trim());
      }
      break;
  }

  return atoms;
}

// Get department by key
export function getDepartment(key: DeptKey): Department {
  const dept = departments.find(dept => dept.key === key);
  if (!dept) {
    console.error(`Department not found for key: ${key}`);
    // Return a fallback department to prevent crashes
    return {
      key: key,
      name: 'Unknown Department',
      color: 'blue',
      description: 'Department information not found'
    };
  }
  return dept;
}

// Get section template by key
export function getSectionTemplate(key: SectionKey): SectionTemplate {
  return sectionTemplates.find(template => template.key === key)!;
}

// AI-enhanced content generation
export async function generateAIContent(
  department: DeptKey,
  sectionKey: SectionKey,
  ticketSubject: string,
  ticketBody: string
): Promise<{ content: string; atoms: DraftAtoms }> {
  try {
    // Dynamic import to avoid circular dependency
    const { generateSection, isGenEnabled } = await import('./generate');
    
    if (!isGenEnabled()) {
      throw new Error('AI generation not enabled');
    }

    const result = await generateSection(department, sectionKey, ticketSubject, ticketBody);
    return {
      content: result.html,
      atoms: result.atoms
    };
  } catch (error) {
    console.warn(`AI generation failed for ${department}-${sectionKey}, falling back to mock content:`, error);
    
    // Fallback to mock content
    const content = generateMockContent(department, sectionKey, ticketSubject);
    const atoms = parseContentToAtoms(content, sectionKey);
    
    return { content, atoms };
  }
}