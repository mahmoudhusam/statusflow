import { LLMProvider } from './llm-provider.interface';
import { GroqProvider } from './groq.provider';

export function createLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER || 'groq';

  switch (provider.toLowerCase()) {
    case 'groq': {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error('GROQ_API_KEY environment variable is required');
      }
      const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
      return new GroqProvider(apiKey, model);
    }
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

export * from './llm-provider.interface';
export * from './groq.provider';
