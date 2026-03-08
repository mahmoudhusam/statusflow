import { StatusFlowClient } from '../statusflow';
import { Tool, ToolParameter } from './tool.interface';
import { formatRelativeTime } from '../utils/format';
import type { Incident } from '../statusflow/types';

export class GetRecentIncidentsTool implements Tool {
  name = 'get_recent_incidents';
  description =
    'Fetch recent downtime incidents across all monitors, or for a specific monitor. Use this when the user wants to know about downtime history, outages, or how long a service was down.';
  parameters: ToolParameter[] = [
    {
      name: 'monitor_id',
      type: 'string',
      description:
        'Optional monitor ID to filter incidents by a specific monitor',
      required: false,
    },
    {
      name: 'limit',
      type: 'number',
      description: 'Maximum number of recent incidents to return (default: 5)',
      required: false,
    },
  ];

  constructor(private readonly client: StatusFlowClient) {}

  async execute(args: Record<string, unknown>): Promise<string> {
    try {
      const monitorId =
        typeof args.monitor_id === 'string' ? args.monitor_id : undefined;

      // handle limit: could be number, string like "3", or missing
      let limit = 5;
      if (typeof args.limit === 'number') {
        limit = args.limit;
      } else if (typeof args.limit === 'string') {
        const parsed = parseInt(args.limit, 10);
        if (!isNaN(parsed)) limit = parsed;
      }

      const allIncidents = await this.client.getIncidents(monitorId);
      const incidents = allIncidents.slice(0, limit);

      if (incidents.length === 0) {
        return 'No incidents found — all monitors have been healthy.';
      }

      const formatted = incidents
        .map((incident: Incident, index: number) => {
          const duration = this.formatDuration(incident.duration);
          const monitorLabel =
            incident.monitorName ?? `Monitor ${incident.monitorId}`;
          const startedAgo = formatRelativeTime(new Date(incident.startedAt));
          const resolved = incident.resolvedAt ? '✓ Resolved' : '⚠️  Ongoing';

          return [
            `${index + 1}. ${monitorLabel} — down for ${duration}`,
            `   Started: ${startedAgo} | ${resolved}`,
          ].join('\n');
        })
        .join('\n');

      return `Recent Incidents (${incidents.length}):\n${formatted}`;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return `Error fetching recent incidents: ${message}`;
    }
  }

  private formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} mins`;
    return `${Math.floor(seconds / 3600)} hours`;
  }
}
