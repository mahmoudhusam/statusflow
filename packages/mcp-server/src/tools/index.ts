import { Tool } from './tool.interface';
import { ListMonitorsTool } from './list-monitors.tool';
import { GetMonitorDetailsTool } from './get-monitor-details.tool';
import { GetDashboardStatsTool } from './get-dashboard-stats.tool';
import { StatusFlowClient } from '../statusflow';
import { GetRecentIncidentsTool } from './get-recent-incidents.tool';
import { ResumeMonitorTool } from './resume-monitor.tool';
import { PauseMonitorTool } from './pause-monitor.tool';

export { Tool } from './tool.interface';

export function createTools(client: StatusFlowClient): Tool[] {
  return [
    new ListMonitorsTool(client),
    new GetMonitorDetailsTool(client),
    new GetDashboardStatsTool(client),
    new GetRecentIncidentsTool(client),
    new ResumeMonitorTool(client),
    new PauseMonitorTool(client),
  ];
}
