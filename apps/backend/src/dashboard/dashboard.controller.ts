import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { JwtGuard } from '@/auth/guard';
import { GetUser } from '@/auth/decorators/get-user.decorator';
import { DashboardService } from '@/dashboard/dashboard.service';

@UseGuards(JwtGuard)
@Controller('dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@GetUser('id') userId: string) {
    const start = Date.now();
    const data = await this.dashboardService.getStats(userId);
    this.logger.log(`[TIMING] getStats took ${Date.now() - start}ms`);
    return { success: true, data };
  }

  @Get('incidents')
  async getIncidents(
    @GetUser('id') userId: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: 'latest' | 'oldest',
  ) {
    const start = Date.now();
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const sortOrder = sort === 'oldest' ? 'oldest' : 'latest';
    const data = await this.dashboardService.getIncidents(
      userId,
      limitNum,
      sortOrder,
    );
    this.logger.log(`[TIMING] getIncidents took ${Date.now() - start}ms`);
    return { success: true, data };
  }

  @Get('notifications')
  async getNotifications(@GetUser('id') userId: string) {
    const start = Date.now();
    const data = await this.dashboardService.getNotifications(userId);
    this.logger.log(`[TIMING] getNotifications took ${Date.now() - start}ms`);
    return { success: true, data };
  }

  @Get('performance-trends')
  async getPerformanceTrends(
    @GetUser('id') userId: string,
    @Query('hours') hours?: string,
  ) {
    const start = Date.now();
    const hoursNum = hours ? parseInt(hours, 10) : 24;
    const data = await this.dashboardService.getPerformanceTrends(
      userId,
      hoursNum,
    );
    this.logger.log(
      `[TIMING] getPerformanceTrends took ${Date.now() - start}ms`,
    );
    return { success: true, data };
  }

  @Get('monitor-statuses')
  async getMonitorStatuses(@GetUser('id') userId: string) {
    const start = Date.now();
    const data = await this.dashboardService.getMonitorStatuses(userId);
    this.logger.log(`[TIMING] getMonitorStatuses took ${Date.now() - start}ms`);
    return { success: true, data };
  }
}
