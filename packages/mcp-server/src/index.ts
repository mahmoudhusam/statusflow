import 'dotenv/config';
import { StatusFlowClient } from './statusflow';
import { createTools } from './tools';
import { createLLMProvider } from './providers';
import { Agent } from './agent';
import { CLI } from './cli';

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

  await new CLI(agent).start();
}

main().catch(console.error);
