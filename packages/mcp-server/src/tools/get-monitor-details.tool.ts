import { Tool, ToolParameter } from './tool.interface';
import { StatusFlowClient } from '../statusflow';
import type { Monitor } from '../statusflow/types';
import { formatRelativeTime } from '../utils/format';

export class GetMonitorDetailsTool implements Tool {
  name = 'get_monitor_details';
  description =
    'Get detailed information about a specific monitor, including its URL, status, check interval, and when it was last checked. Use this when the user asks about a specific monitor or needs to know its exact configuration.';
  parameters: ToolParameter[] = [
    {
      name: 'monitor_id',
      type: 'string',
      description: 'The unique ID of the monitor to retrieve',
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

      if (!monitor) {
        return `Monitor with ID "${monitorId}" not found`;
      }

      const statusEmoji =
        monitor.status === 'up' ? '✓' : monitor.status === 'down' ? '✗' : '⏸';
      const lastChecked = monitor.lastCheckedAt
        ? formatRelativeTime(new Date(monitor.lastCheckedAt))
        : 'Never checked';

      const details = [
        `Monitor: ${monitor.name}`,
        `Status: ${statusEmoji} ${monitor.status.toUpperCase()}`,
        `URL: ${monitor.url}`,
        `Check Interval: ${monitor.interval} seconds`,
        `Last Checked: ${lastChecked}`,
      ]
        .filter(Boolean)
        .join('\n');

      return details;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return `Error fetching monitor details: ${message}`;
    }
  }
}
