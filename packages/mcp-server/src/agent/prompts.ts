import { Tool } from '../tools';

export function buildSystemPrompt(tools: Tool[]): string {
  const toolDescriptions = tools
    .map((tool) => {
      const params =
        tool.parameters.length === 0
          ? '  Parameters: none'
          : '  Parameters:\n' +
            tool.parameters
              .map(
                (p) =>
                  `    - ${p.name} (${p.type}, ${p.required ? 'required' : 'optional'}): ${p.description}`,
              )
              .join('\n');

      return `  Tool: ${tool.name}\n  Description: ${tool.description}\n${params}`;
    })
    .join('\n\n');

  return `You are an AI agent for StatusFlow, a service monitoring platform.
You help users manage their monitors and understand their system health.

You have access to the following tools:
<tools>
${toolDescriptions}
</tools>

To use a tool, respond with ONLY this JSON format:
{"action": "tool_name", "args": {"param": "value"}}

When you have enough information to answer the user, respond with ONLY this JSON format:
{"action": "answer", "args": {"response": "your answer here"}}

Rules:
- Always respond with valid JSON, nothing else
- Never make up monitor IDs — use list_monitors first if you don't know them
- Be concise in your final answer`;
}
