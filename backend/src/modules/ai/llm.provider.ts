import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMImage {
  mimeType: string;
  base64Data: string;
}

export interface LLMInvokeOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  images?: LLMImage[];
}

export class MultiProviderLLM {
  private getGeminiKey(): string {
    return process.env.GEMINI_API_KEY || (env as any).GEMINI_API_KEY || '';
  }

  private getGroqKey(): string {
    return process.env.GROQ_API_KEY || env.GROQ_API_KEY || '';
  }

  private getOpenAIKey(): string {
    return process.env.OPENAI_API_KEY || (env as any).OPENAI_API_KEY || '';
  }

  private getMistralKey(): string {
    return process.env.MISTRAL_API_KEY || env.MISTRAL_API_KEY || '';
  }

  async invoke(messages: any[], options: LLMInvokeOptions = {}): Promise<{ content: string; provider: string }> {
    const formattedMessages: ChatMessage[] = messages.map((m) => {
      let role: ChatMessage['role'] = 'user';
      const type = (typeof m._getType === 'function' ? m._getType() : m.role) || 'user';
      if (type === 'system') role = 'system';
      else if (type === 'ai' || type === 'assistant') role = 'assistant';
      else role = 'user';

      const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      return { role, content };
    });

    const errors: string[] = [];

    // 1. Try Google Gemini if key is provided
    const geminiKey = this.getGeminiKey();
    if (geminiKey) {
      try {
        const result = await this.callGemini(formattedMessages, geminiKey, options);
        return { content: result, provider: 'Google Gemini' };
      } catch (err: any) {
        errors.push(`Gemini: ${err.message}`);
        logger.warn(`⚠️ Google Gemini attempt failed: ${err.message}. Trying next provider...`);
      }
    }

    // 2. Try Groq (Llama 3.3 70B) if key is provided
    const groqKey = this.getGroqKey();
    if (groqKey) {
      try {
        const result = await this.callGroq(formattedMessages, groqKey, options);
        return { content: result, provider: 'Groq (Llama 3.3)' };
      } catch (err: any) {
        errors.push(`Groq: ${err.message}`);
        logger.warn(`⚠️ Groq attempt failed: ${err.message}. Trying next provider...`);
      }
    }

    // 3. Try OpenAI if key is provided
    const openaiKey = this.getOpenAIKey();
    if (openaiKey) {
      try {
        const result = await this.callOpenAI(formattedMessages, openaiKey, options);
        return { content: result, provider: 'OpenAI (GPT-4o-mini)' };
      } catch (err: any) {
        errors.push(`OpenAI: ${err.message}`);
        logger.warn(`⚠️ OpenAI attempt failed: ${err.message}. Trying next provider...`);
      }
    }

    // 4. Try Mistral if key is provided
    const mistralKey = this.getMistralKey();
    if (mistralKey) {
      try {
        const result = await this.callMistral(formattedMessages, mistralKey, options);
        return { content: result, provider: 'Mistral AI' };
      } catch (err: any) {
        errors.push(`Mistral: ${err.message}`);
        logger.warn(`⚠️ Mistral attempt failed: ${err.message}.`);
      }
    }

    throw new Error(`All LLM providers failed or no valid API keys configured: ${errors.join(' | ')}`);
  }

  // --- Provider 1: Google Gemini ---
  private async callGemini(messages: ChatMessage[], apiKey: string, options: LLMInvokeOptions): Promise<string> {
    const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
    const conversation = messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    const promptText = systemMessage
      ? `System Instructions:\n${systemMessage}\n\nConversation Context:\n${conversation}`
      : conversation;

    const parts: any[] = [{ text: promptText }];
    if (options.images && options.images.length > 0) {
      for (const img of options.images) {
        parts.push({
          inline_data: {
            mime_type: img.mimeType,
            data: img.base64Data,
          },
        });
      }
    }

    const models = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-pro-latest', 'gemini-2.5-pro'];
    let lastError: any = null;

    for (const model of models) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            contents: [
              {
                role: 'user',
                parts,
              },
            ],
            generationConfig: {
              temperature: options.temperature ?? 0.2,
              maxOutputTokens: options.maxTokens ?? 3000,
              responseMimeType: options.jsonMode !== false ? 'application/json' : 'text/plain',
            },
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
          }
        );

        const candidates = response.data?.candidates;
        if (!candidates || candidates.length === 0) {
          throw new Error('Gemini returned no candidates');
        }
        const text = candidates[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error('Gemini response part text is empty');
        }
        return text.trim();
      } catch (err: any) {
        lastError = err;
        logger.warn(`Gemini model ${model} error: ${err.response?.data?.error?.message || err.message}`);
      }
    }

    throw new Error(`Gemini failed: ${lastError?.response?.data?.error?.message || lastError?.message}`);
  }

  // --- Provider 2: Groq ---
  private async callGroq(messages: ChatMessage[], apiKey: string, options: LLMInvokeOptions): Promise<string> {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 2048,
        response_format: options.jsonMode !== false ? { type: 'json_object' } : undefined,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Groq returned empty choices');
    return content.trim();
  }

  // --- Provider 3: OpenAI ---
  private async callOpenAI(messages: ChatMessage[], apiKey: string, options: LLMInvokeOptions): Promise<string> {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 2048,
        response_format: options.jsonMode !== false ? { type: 'json_object' } : undefined,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenAI returned empty choices');
    return content.trim();
  }

  // --- Provider 4: Mistral AI ---
  private async callMistral(messages: ChatMessage[], apiKey: string, options: LLMInvokeOptions): Promise<string> {
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-small-latest',
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 2048,
        response_format: options.jsonMode !== false ? { type: 'json_object' } : undefined,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      }
    );

    const content = response.data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Mistral returned empty choices');
    return content.trim();
  }
}

export const unifiedLLM = new MultiProviderLLM();

