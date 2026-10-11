import { qdrantClient } from './qdrant.client';
import { env } from '../../../config/env';
import { prisma } from '../../../config/database';
import { logger } from '../../../config/logger';
import axios from 'axios';

export interface RetrievedMedicalContext {
  source: 'qdrant' | 'database' | 'medical_history';
  text: string;
  score?: number;
  documentType?: string;
  conditionName?: string;
}

export class RagService {
  // 1. Generate dense embeddings via Python FastAPI microservice
  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(
        `${env.PYTHON_SERVICE_URL}/embed`,
        { texts: [text] },
        {
          headers: { Authorization: `Bearer ${env.PYTHON_SERVICE_TOKEN}` },
          timeout: 10000,
        }
      );
      return response.data.embeddings[0];
    } catch (err: any) {
      logger.warn(`Embedding service call failed: ${err.message}`);
      return [];
    }
  }

  // 2. Hybrid RAG search: Qdrant semantic search + DB medical history
  async retrievePatientContext(
    patientId: string,
    query: string,
    conditionId?: string
  ): Promise<RetrievedMedicalContext[]> {
    const results: RetrievedMedicalContext[] = [];

    // Step A: Check specific condition if patient marked it relevant
    if (conditionId) {
      const historyRecord = await prisma.medicalHistory.findUnique({
        where: { id: conditionId },
      });
      if (historyRecord) {
        results.push({
          source: 'medical_history',
          conditionName: historyRecord.conditionName,
          text: `Condition: ${historyRecord.conditionName} (${historyRecord.conditionType}). Severity: ${historyRecord.severity || 'N/A'}. Details: ${historyRecord.description || 'None'}. Current Medications: ${historyRecord.medications.join(', ') || 'None'}.`,
        });
      }
    }

    // Step B: Query Qdrant vector database
    try {
      const queryVector = await this.getEmbedding(query);
      if (queryVector.length > 0) {
        const qdrantResults = await (qdrantClient as any).search(env.QDRANT_COLLECTION_NAME, {
          vector: queryVector,
          filter: {
            must: [{ key: 'patientId', match: { value: patientId } }],
          },
          limit: 3,
        });

        for (const item of qdrantResults) {
          if (item.payload?.text) {
            results.push({
              source: 'qdrant',
              text: String(item.payload.text),
              score: item.score,
              documentType: String(item.payload.documentType || 'REPORT'),
            });
          }
        }
      }
    } catch (err: any) {
      logger.warn(`Qdrant vector search failed: ${err.message}`);
    }

    // Step C: Fallback to recent processed documents in DB if Qdrant returned nothing
    if (results.length === 0) {
      const docs = await prisma.document.findMany({
        where: { patientId, isProcessed: true, extractedText: { not: null } },
        take: 2,
        orderBy: { uploadedAt: 'desc' },
      });

      for (const d of docs) {
        if (d.extractedText) {
          results.push({
            source: 'database',
            text: d.extractedText.slice(0, 500),
            documentType: d.documentType,
          });
        }
      }
    }

    return results;
  }

  // 3. Compress / format context chunks into a clean prompt string
  formatContextForPrompt(contexts: RetrievedMedicalContext[]): string {
    if (contexts.length === 0) return 'No relevant historical clinical documents found.';

    return contexts
      .map((c, idx) => `[Source ${idx + 1} (${c.source}${c.documentType ? ` - ${c.documentType}` : ''})]:\n${c.text}`)
      .join('\n\n');
  }
}

export const ragService = new RagService();
