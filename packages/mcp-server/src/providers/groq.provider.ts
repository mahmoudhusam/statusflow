import Groq from 'groq-sdk';
import { LLMProvider, Message } from "./llm-provider.interface";

export class GroqProvider implements LLMProvider {
  private groq: Groq;
  private model: string;

  constructor(apiKey: string, model: string = 'llama-3.3-70b-versatile') {
    this.groq = new Groq({ apiKey });
    this.model = model;
  }

  async chat(messages: Message[]): Promise<string> {
    const response = await this.groq.chat.completions.create({
      model: this.model,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from Groq API');
    }

    return content;
  }
}