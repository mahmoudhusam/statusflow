import 'dotenv/config';
import { StatusFlowClient } from './statusflow';
import { createTools } from './tools';
import { createLLMProvider } from './providers';
import { Agent } from './agent';

async function main() {
  const apiUrl = process.env.STATUSFLOW_API_URL;
  const apiKey = process.env.STATUSFLOW_API_KEY;

  if (!apiUrl || !apiKey) {
    console.error(
      'Error: STATUSFLOW_API_URL and STATUSFLOW_API_KEY env vars required',
    );
    process.exit(1);
  }

  const client = new StatusFlowClient(apiUrl, apiKey);
  const tools = createTools(client);
  const llm = createLLMProvider();
  const agent = new Agent(llm, tools);

  const queries = [
    "What's the current status of all my monitors?",
    'Give me a summary of my system health',
  ];

  for (const query of queries) {
    console.log(`\n👤 User: ${query}`);
    console.log('─'.repeat(50));
    try {
      const answer = await agent.run(query);
      console.log(`🤖 Agent: ${answer}`);
    } catch (error) {
      console.error(
        'Agent error:',
        error instanceof Error ? error.message : error,
      );
    }
    console.log('─'.repeat(50));
  }
}

main();
