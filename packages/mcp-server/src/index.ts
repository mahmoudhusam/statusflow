import 'dotenv/config';
import { StatusFlowClient } from './statusflow';
import { createTools } from './tools';

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

  // Print available tools
  console.log('\n📋 Available Tools:\n');
  tools.forEach((t) => {
    const params = t.parameters.length
      ? ` (${t.parameters.map((p) => p.name).join(', ')})`
      : '';
    console.log(`  ✓ ${t.name}${params}`);
    console.log(`    → ${t.description}\n`);
  });

  // Execute list_monitors as a smoke test
  console.log('🧪 Smoke Test: Executing list_monitors...\n');
  try {
    const result = await tools[0].execute({});
    console.log(result);
  } catch (error) {
    console.error(
      'Test failed:',
      error instanceof Error ? error.message : error,
    );
  }
}

main();
