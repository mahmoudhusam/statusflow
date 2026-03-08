import { Tool, ToolParameter } from './tool.interface';
import { StatusFlowClient } from '../statusflow';
import type { Monitor } from '../statusflow/types';
import { formatRelativeTime } from '../utils/format';

export class ListMonitorsTool implements Tool {
  name = 'list_monitors';
  description =
    'Retrieve all monitors for the authenticated user. Use this to show the user their current monitors, their status (up/down/paused), and when they were last checked. Perfect for giving an overview of what is being monitored.';
  parameters: ToolParameter[] = [];

  constructor(private readonly client: StatusFlowClient) {}

  async execute(_args: Record<string, unknown>): Promise<string> {
    try {
      const monitors = await this.client.getMonitors();

      if (monitors.length === 0) {
        return 'No monitors found. Create one to start monitoring.';
      }

      const formatted = monitors
        .map((m: Monitor, i: number) => {
          const statusIcon =
            m.status === 'up' ? '✓' : m.status === 'down' ? '✗' : '⏸';
          const lastChecked = m.lastCheckedAt
            ? formatRelativeTime(new Date(m.lastCheckedAt))
            : 'never';

          return `${i + 1}. ${statusIcon} ${m.name} [${m.status}] - ${m.url} (checked ${lastChecked})`;
        })
        .join('\n');

      return `Found ${monitors.length} monitor${monitors.length !== 1 ? 's' : ''}:\n${formatted}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return `Error listing monitors: ${message}`;
    }
  }
}
