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

    // MISTRAL ONLY: As explicitly requested, use ONLY Mistral AI (no Gemini, no OpenAI, no other providers)
    const mistralKey = this.getMistralKey();
    if (!mistralKey) {
      throw new Error('MISTRAL_API_KEY is not configured in backend/.env. Please set MISTRAL_API_KEY.');
    }

    try {
      const result = await this.callMistral(formattedMessages, mistralKey, options);
      return { content: result, provider: 'Mistral AI' };
    } catch (err: any) {
      logger.error(`❌ Mistral AI invocation failed: ${err.message}`);
      throw new Error(`Mistral AI failed: ${err.message}`);
    }
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

    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-flash-latest', 'gemini-pro-latest'];
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

  // --- Provider 1: OpenAI (Primary) ---
  private async callOpenAI(messages: ChatMessage[], apiKey: string, options: LLMInvokeOptions): Promise<string> {
    const model = process.env.OPENAI_MODEL || (env as any).OPENAI_MODEL || 'gpt-4o-mini';

    const messagesPayload: any[] = messages.map((m, idx) => {
      // If there are vision images and this is the last user message, attach multimodal contents
      if (options.images && options.images.length > 0 && m.role === 'user' && idx === messages.length - 1) {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content },
            ...options.images.map((img) => ({
              type: 'image_url',
              image_url: {
                url: `data:${img.mimeType};base64,${img.base64Data}`,
              },
            })),
          ],
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    });

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model,
          messages: messagesPayload,
          temperature: options.temperature ?? 0.2,
          max_tokens: options.maxTokens ?? 2500,
          response_format: options.jsonMode !== false ? { type: 'json_object' } : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 45000,
        }
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) throw new Error('OpenAI returned empty choices');
      return content.trim();
    } catch (err: any) {
      const apiErr = err.response?.data?.error?.message || err.message;
      throw new Error(`OpenAI API error (${model}): ${apiErr}`);
    }
  }

  // --- Mistral AI (Exclusive LLM Provider) ---
  private async callMistral(messages: ChatMessage[], apiKey: string, options: LLMInvokeOptions): Promise<string> {
    const configuredModel = process.env.MISTRAL_MODEL || (env as any).MISTRAL_MODEL || 'open-mistral-nemo';
    const modelsToTry = [configuredModel, 'open-mistral-7b', 'open-mixtral-8x7b', 'mistral-small-latest'].filter(
      (m, idx, self) => self.indexOf(m) === idx
    );

    let lastError: any = null;

    const messagesPayload: any[] = messages.map((m, idx) => {
      if (options.images && options.images.length > 0 && m.role === 'user' && idx === messages.length - 1) {
        return {
          role: m.role,
          content: [
            { type: 'text', text: m.content },
            ...options.images.map((img) => ({
              type: 'image_url',
              image_url: {
                url: `data:${img.mimeType};base64,${img.base64Data}`,
              },
            })),
          ],
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    });

    for (const model of modelsToTry) {
      try {
        const response = await axios.post(
          'https://api.mistral.ai/v1/chat/completions',
          {
            model,
            messages: messagesPayload,
            temperature: options.temperature ?? 0.2,
            max_tokens: options.maxTokens ?? 2500,
            response_format: options.jsonMode !== false ? { type: 'json_object' } : undefined,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 35000,
          }
        );

        const content = response.data.choices?.[0]?.message?.content;
        if (!content) throw new Error(`Mistral (${model}) returned empty choices`);
        return content.trim();
      } catch (err: any) {
        lastError = err;
        const msg = err.response?.data?.message || err.message;
        logger.warn(`⚠️ Mistral model ${model} error: ${msg}. Trying next Mistral model if available...`);
      }
    }

    const finalErrMsg = lastError?.response?.data?.message || lastError?.message || 'Unknown error';
    throw new Error(`Mistral AI error: ${finalErrMsg}`);
  }
}

export const unifiedLLM = new MultiProviderLLM();

