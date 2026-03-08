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

  // Smoke test: list_monitors
  console.log('🧪 Smoke Test: list_monitors\n');
  const listResult = await tools[0].execute({});
  console.log(listResult);

  // Smoke test: get_recent_incidents
  console.log('\n🧪 Smoke Test: get_recent_incidents\n');
  const incidentTool = tools.find((t) => t.name === 'get_recent_incidents')!;
  const incidentResult = await incidentTool.execute({ limit: 3 });
  console.log(incidentResult);
}

main();
