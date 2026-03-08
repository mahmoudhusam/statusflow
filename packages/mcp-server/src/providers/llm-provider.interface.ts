export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export interface LLMProvider {
  chat(messages: Message[]): Promise<string>;
}
