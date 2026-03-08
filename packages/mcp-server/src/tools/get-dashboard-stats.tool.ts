import { Tool, ToolParameter } from './tool.interface';
import { StatusFlowClient } from '../statusflow';

export class GetDashboardStatsTool implements Tool {
  name = 'get_dashboard_stats';
  description =
    'Get an overall dashboard summary showing total monitors, how many are up/down/paused, and average uptime percentage. Use this when the user asks about overall health or system status.';
  parameters: ToolParameter[] = [];

  constructor(private readonly client: StatusFlowClient) {}

  async execute(_args: Record<string, unknown>): Promise<string> {
    try {
      const stats = await this.client.getDashboardStats();

      const uptime =
        stats.averageUptime !== null
          ? `${stats.averageUptime.toFixed(2)}%`
          : 'N/A';

      const summary = [
        'Dashboard Summary:',
        `- Total Monitors: ${stats.totalMonitors}`,
        `  • Up: ${stats.monitorsUp} | Down: ${stats.monitorsDown}`,
        `- Average Uptime: ${uptime}`,
      ]
        .filter(Boolean)
        .join('\n');

      return summary;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return `Error fetching dashboard stats: ${message}`;
    }
  }
}
