import { Tool, ToolParameter } from './tool.interface';
import { StatusFlowClient } from '../statusflow';
import type { Monitor } from '../statusflow/types';

export class ListMonitorsTool implements Tool {
  name = 'list_monitors';
  description =
    'Retrieve all monitors for the authenticated user. Use this to show the user their current monitors, their status (up/down/paused), and when they were last checked. Perfect for giving an overview of what is being monitored.';
  parameters: ToolParameter[] = [];

  constructor(private readonly client: StatusFlowClient) {}

  async execute(): Promise<string> {
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
            ? this.formatRelativeTime(new Date(m.lastCheckedAt))
            : 'never';

          return `${i + 1}. ${statusIcon} ${m.name} [${m.status}] - ${m.url} (checked ${lastChecked})`;
        })
        .join('\n');

      return `Found ${monitors.length} monitor${monitors.length !== 1 ? 's' : ''}:\n${formatted}`;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      return `Error listing monitors: ${message}`;
    }
  }

  private formatRelativeTime(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  }
}