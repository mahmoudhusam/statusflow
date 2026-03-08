import { LLMProvider, Message } from '../providers';
import { Tool } from '../tools';
import { buildSystemPrompt } from './prompts';

type AgentAction = {
  action: string;
  args: Record<string, unknown>;
};

export class Agent {
  private readonly toolMap: Map<string, Tool>;

  constructor(
    private readonly llm: LLMProvider,
    private readonly tools: Tool[],
  ) {
    // build once at construction, not on every call
    this.toolMap = new Map(tools.map((t) => [t.name, t]));
  }

  async run(userMessage: string): Promise<string> {
    const messages: Message[] = [
      { role: 'system', content: buildSystemPrompt(this.tools) },
      { role: 'user', content: userMessage },
    ];

    const MAX_ITERATIONS = 10;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const raw = await this.llm.chat(messages);

      let parsed: AgentAction;

      try {
        parsed = JSON.parse(raw) as AgentAction;
      } catch {
        console.log(
          `[Agent] Parse error on iteration ${i + 1}, self-correcting...`,
        );
        messages.push({ role: 'assistant', content: raw });
        messages.push({
          role: 'user',
          content:
            'Error: your response was not valid JSON. Respond with ONLY a JSON object in the required format.',
        });
        continue;
      }

      // final answer
      if (parsed.action === 'answer') {
        const response = parsed.args.response;
        return typeof response === 'string'
          ? response
          : JSON.stringify(response);
      }

      // known tool
      const tool = this.toolMap.get(parsed.action);
      if (tool) {
        console.log(
          `[Agent] Action: ${parsed.action} | Args: ${JSON.stringify(parsed.args)}`,
        );
        const result = await tool.execute(parsed.args);
        console.log(`[Agent] Result: ${result}`);

        messages.push({ role: 'assistant', content: raw });
        messages.push({ role: 'user', content: `Tool result: ${result}` });
        continue;
      }

      // unknown action — let agent recover
      console.log(
        `[Agent] Unknown action: "${parsed.action}", self-correcting...`,
      );
      messages.push({ role: 'assistant', content: raw });
      messages.push({
        role: 'user',
        content: `Error: unknown action "${parsed.action}". Use one of: ${[...this.toolMap.keys()].join(', ')} — or action: "answer".`,
      });
    }

    throw new Error(
      `Agent did not complete after ${MAX_ITERATIONS} iterations`,
    );
  }
}
