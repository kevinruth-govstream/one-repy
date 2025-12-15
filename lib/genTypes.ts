// Types for AI content generation
import { DeptKey, SectionKey, DraftAtoms } from '@/lib/store';

export interface GeneratorConfig {
  baseUrl: string;
  apiKey?: string; // Optional - stored in Supabase secrets for security
  model: string;
  enabled: boolean;
}

export interface GenerateRequest {
  dept: DeptKey;
  sectionKey: SectionKey;
  subject: string;
  body: string;
  config: GeneratorConfig;
}

export interface GenResult {
  html: string;     // final section HTML for this dept
  atoms: DraftAtoms;
}

export interface GenerateResponse {
  success: boolean;
  data?: GenResult;
  error?: string;
}

// Default generator settings
export const defaultGeneratorConfig: GeneratorConfig = {
  baseUrl: '',
  apiKey: '',
  model: 'llama-3.1-8b-instruct',
  enabled: false,
};

// Validation schema for AI responses
export const genResultSchema = {
  type: 'object',
  properties: {
    html: {
      type: 'string',
      description: 'HTML content for the section with proper formatting'
    },
    atoms: {
      type: 'object',
      properties: {
        situation: {
          type: 'object',
          properties: {
            understanding: {
              type: 'array',
              items: { type: 'string' }
            },
            propertyFacts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  value: { type: 'string' },
                  source: { type: 'string' }
                },
                required: ['key', 'value']
              }
            }
          }
        },
        guidance: {
          type: 'object',
          properties: {
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            },
            citations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  section: { type: 'string' },
                  description: { type: 'string' },
                  source: { type: 'string' }
                },
                required: ['code', 'section', 'description']
              }
            }
          }
        },
        nextsteps: {
          type: 'object',
          properties: {
            followups: {
              type: 'array',
              items: { type: 'string' }
            },
            actions: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      }
    }
  },
  required: ['html', 'atoms']
};