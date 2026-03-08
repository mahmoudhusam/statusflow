import { StatusFlowClient } from '../statusflow';
import { Tool, ToolParameter } from './tool.interface';

export class PauseMonitorTool implements Tool {
  name = 'pause_monitor';
  description =
    'Pause a specific monitor by its ID. This stops all health checks without deleting the monitor or its history. Use this when the user wants to temporarily stop monitoring a service — for maintenance, cost saving, or known downtime. Do not use this to fix a down monitor — pausing does not resolve incidents.';
  parameters: ToolParameter[] = [
    {
      name: 'monitor_id',
      type: 'string',
      description: 'The unique ID of the monitor to pause',
      required: true,
    },
  ];

  constructor(private readonly client: StatusFlowClient) {}

  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const monitorId = args.monitor_id;

      if (!monitorId || typeof monitorId !== 'string') {
        return 'Error: monitor_id parameter is required';
      }

      const monitor = await this.client.getMonitor(monitorId);
      await this.client.pauseMonitor(monitorId);

      return `✓ Monitor "${monitor.name}" (id: ${monitorId}) has been paused. Checks are now stopped.`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return `Error pausing monitor: ${message}`;
    }
  }
}
