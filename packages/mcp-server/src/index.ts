import 'dotenv/config';
import { StatusFlowClient } from './statusflow';

async function main() {
  const client = new StatusFlowClient(
    process.env.STATUSFLOW_API_URL!,
    process.env.STATUSFLOW_API_KEY!,
  );

  const monitors = await client.getMonitors();
  console.log(`Found ${monitors.length} monitors:`);
  monitors.forEach((m) => console.log(` - ${m.name} [${m.status}]`));
}

main();
