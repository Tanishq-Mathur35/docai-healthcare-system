import axios from 'axios';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export class TavilyService {
  private readonly apiUrl = 'https://api.tavily.com/search';

  async searchMedicalLiterature(query: string, maxResults = 3): Promise<TavilySearchResult[]> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          api_key: env.TAVILY_API_KEY,
          query: `medical clinical diagnosis guidelines: ${query}`,
          search_depth: 'advanced',
          include_domains: [
            'cdc.gov',
            'who.int',
            'nih.gov',
            'mayoclinic.org',
            'ncbi.nlm.nih.gov',
            'hopkinsmedicine.org',
            'webmd.com',
            'medlineplus.gov',
          ],
          max_results: maxResults,
        },
        { timeout: 8000 }
      );

      const results = response.data?.results || [];
      return results.map((r: any) => ({
        title: r.title || 'Clinical Reference',
        url: r.url || '',
        content: r.content || '',
        score: r.score || 0.8,
      }));
    } catch (err: any) {
      logger.warn(`Tavily search fallback failed: ${err.message}`);
      return [];
    }
  }

  async searchMedicationGuidelines(symptomsOrConditions: string, maxResults = 3): Promise<TavilySearchResult[]> {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          api_key: env.TAVILY_API_KEY,
          query: `first line treatments medications remedies dosage indications for: ${symptomsOrConditions}`,
          search_depth: 'advanced',
          include_domains: [
            'ncbi.nlm.nih.gov',
            'mayoclinic.org',
            'nih.gov',
            'webmd.com',
            'drugs.com',
            'medlineplus.gov',
            'hopkinsmedicine.org',
          ],
          max_results: maxResults,
        },
        { timeout: 9000 }
      );

      const results = response.data?.results || [];
      return results.map((r: any) => ({
        title: r.title || 'Medication Guideline',
        url: r.url || '',
        content: r.content || '',
        score: r.score || 0.85,
      }));
    } catch (err: any) {
      logger.warn(`Tavily medication search failed: ${err.message}`);
      return [];
    }
  }
}

export const tavilyService = new TavilyService();
