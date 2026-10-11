import { unifiedLLM } from '../llm.provider';
import { logger } from '../../../config/logger';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface MistralOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class MistralLLM {
  private temperature: number;
  private maxTokens: number;

  constructor(options: MistralOptions = {}) {
    this.temperature = options.temperature ?? 0.2;
    this.maxTokens = options.maxTokens ?? 2048;
  }

  async invoke(messages: any[]): Promise<{ content: string }> {
    try {
      const result = await unifiedLLM.invoke(messages, {
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        jsonMode: true,
      });
      return { content: result.content };
    } catch (err: any) {
      logger.error(`❌ LLM invocation failed across providers: ${err.message}`);
      throw err;
    }
  }
}

// Primary diagnostic reasoning model
export const mistralLLM = new MistralLLM({
  temperature: 0.2,
  maxTokens: 2048,
});

// Fast triage and sufficiency check model
export const mistralFastLLM = new MistralLLM({
  temperature: 0.1,
  maxTokens: 1024,
});
