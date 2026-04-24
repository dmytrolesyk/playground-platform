// LLM provider implementations for the review CLI.

import { type Result, tryCatchAsync } from '@playground/knowledge-engine/result';
import type { LlmProvider } from './types.ts';

const REQUEST_TIMEOUT_MS = 120_000;

// ── Anthropic provider ──────────────────────────────────────────────────

interface AnthropicMessage {
  content: Array<{ type: string; text?: string }>;
}

function createAnthropicProvider(apiKey: string, model: string, baseUrl?: string): LlmProvider {
  const url = `${baseUrl ?? 'https://api.anthropic.com'}/v1/messages`;

  return {
    async complete(prompt: string): Promise<Result<string, string>> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const result = await tryCatchAsync(
        async () => {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model,
              max_tokens: 2048,
              messages: [{ role: 'user', content: prompt }],
            }),
            signal: controller.signal,
          });

          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Anthropic API error (${response.status}): ${errorBody.slice(0, 500)}`);
          }

          const data = (await response.json()) as AnthropicMessage;
          const textBlock = data.content.find((block) => block.type === 'text');
          return textBlock?.text ?? '';
        },
        (e: unknown) => {
          if (e instanceof Error && e.name === 'AbortError')
            return 'Anthropic API request timed out';
          return e instanceof Error ? e.message : String(e);
        },
      );

      clearTimeout(timeoutId);
      return result;
    },
  };
}

// ── OpenAI-compatible provider ──────────────────────────────────────────

interface OpenAiChatResponse {
  choices: Array<{ message: { content: string } }>;
}

function createOpenAiProvider(apiKey: string, model: string, baseUrl?: string): LlmProvider {
  const url = `${baseUrl ?? 'https://api.openai.com'}/v1/chat/completions`;

  return {
    async complete(prompt: string): Promise<Result<string, string>> {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const result = await tryCatchAsync(
        async () => {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              max_tokens: 2048,
              messages: [{ role: 'user', content: prompt }],
            }),
            signal: controller.signal,
          });

          if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${errorBody.slice(0, 500)}`);
          }

          const data = (await response.json()) as OpenAiChatResponse;
          const firstChoice = data.choices[0];
          return firstChoice?.message.content ?? '';
        },
        (e: unknown) => {
          if (e instanceof Error && e.name === 'AbortError') return 'OpenAI API request timed out';
          return e instanceof Error ? e.message : String(e);
        },
      );

      clearTimeout(timeoutId);
      return result;
    },
  };
}

// ── Factory ─────────────────────────────────────────────────────────────

export function createProvider(
  name: 'anthropic' | 'openai',
  apiKey: string,
  model: string,
  baseUrl?: string,
): LlmProvider {
  switch (name) {
    case 'anthropic':
      return createAnthropicProvider(apiKey, model, baseUrl);
    case 'openai':
      return createOpenAiProvider(apiKey, model, baseUrl);
    default:
      throw new Error(`Unknown provider: ${name as string}`);
  }
}
