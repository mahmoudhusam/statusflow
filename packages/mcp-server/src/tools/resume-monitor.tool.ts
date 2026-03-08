import { StatusFlowClient } from '../statusflow';
import { Tool, ToolParameter } from './tool.interface';

export class ResumeMonitorTool implements Tool {
  name = 'resume_monitor';
  description =
    'Resume a specific monitor by its ID. This restarts health checks on a previously paused monitor. Use this when the user wants to re-enable monitoring after maintenance or a planned pause.';
  parameters: ToolParameter[] = [
    {
      name: 'monitor_id',
      type: 'string',
      description: 'The unique ID of the monitor to resume',
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
      await this.client.resumeMonitor(monitorId);

      return `✓ Monitor "${monitor.name}" (id: ${monitorId}) has been resumed. Checks will restart shortly.`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return `Error resuming monitor: ${message}`;
    }
  }
}
