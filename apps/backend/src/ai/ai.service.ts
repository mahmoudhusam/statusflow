import { Injectable } from '@nestjs/common';
import { MonitorService } from '@/monitor/monitor.service';
import { DashboardService } from '@/dashboard/dashboard.service';
import { ConfigService } from '@nestjs/config';
import { StatusFlowClient } from '@statusflow/mcp-server/src/statusflow/client';
import { createTools } from '@statusflow/mcp-server/src/tools';
import { GroqProvider } from '@statusflow/mcp-server/src/providers/groq.provider';
import { Agent } from '@statusflow/mcp-server/src/agent';

@Injectable()
export class AiService {
  constructor(
    private readonly monitorService: MonitorService,
    private readonly dashboardService: DashboardService,
    private readonly configService: ConfigService,
  ) {}

  async chat(message: string, userToken: string): Promise<string> {
    const client = new StatusFlowClient(
      this.configService.get('BACKEND_INTERNAL_URL', 'http://localhost:5000'),
      userToken,
    );

    const tools = createTools(client);
    const llm = new GroqProvider(
      this.configService.get('GROQ_API_KEY'),
      this.configService.get('GROQ_MODEL', 'llama-3.3-70b-versatile'),
    );
    const agent = new Agent(llm, tools);

    return await agent.run(message);
  }
}
