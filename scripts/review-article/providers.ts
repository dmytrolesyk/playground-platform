// LLM provider implementations for the review CLI.

import { isRecord } from '@playground/knowledge-engine/frontmatter';
import { type Result, tryCatchAsync } from '@playground/knowledge-engine/result';
import type { LlmProvider } from './types.ts';

const REQUEST_TIMEOUT_MS = 120_000;

function isTextBlock(value: unknown): value is { type: string; text?: string } {
  return (
    isRecord(value) &&
    typeof value.type === 'string' &&
    (value.text === undefined || typeof value.text === 'string')
  );
}

function readAnthropicText(value: unknown): string {
  if (!(isRecord(value) && Array.isArray(value.content))) {
    throw new Error('Anthropic API returned an unexpected response shape');
  }

  const textBlock = value.content.find(isTextBlock);
  return textBlock?.text ?? '';
}

function isOpenAiChoice(value: unknown): value is { message: { content: string } } {
  return isRecord(value) && isRecord(value.message) && typeof value.message.content === 'string';
}

function readOpenAiText(value: unknown): string {
  if (!(isRecord(value) && Array.isArray(value.choices))) {
    throw new Error('OpenAI API returned an unexpected response shape');
  }

  const firstChoice = value.choices.find(isOpenAiChoice);
  return firstChoice?.message.content ?? '';
}

// ── Anthropic provider ──────────────────────────────────────────────────

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

          return readAnthropicText(await response.json());
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

          return readOpenAiText(await response.json());
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
      throw new Error(`Unknown provider: ${String(name)}`);
  }
}
