import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guard';
import { MonitorService } from './monitor.service';
import { CreateMonitorDto, UpdateMonitorDto } from './dto';
import { User } from '../user/user.entity';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Monitor } from './monitor.entity';

@UseGuards(JwtGuard)
@Controller('monitors')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  //POST /monitors: Create new monitor
  @Post()
  async createMonitor(
    @Body() createMonitorDto: CreateMonitorDto,
    @GetUser() user: User,
  ) {
    return this.monitorService.createMonitor(
      createMonitorDto.name,
      createMonitorDto.interval,
      createMonitorDto.url,
      user.id,
      createMonitorDto as Partial<Monitor>,
    );
  }

  //GET /monitors: List all monitors for current user
  @Get()
  async getAllMonitors(@GetUser('id') userId: string) {
    return this.monitorService.getMonitorsByUser(userId);
  }

  //GET /monitors/:id: Get monitor details + latest status
  @Get(':id')
  async getMonitorById(
    @GetUser('id') userId: string,
    @Param('id') monitorId: string,
  ) {
    const monitor = await this.monitorService.getMonitorById(monitorId, userId);
    if (!monitor) {
      throw new NotFoundException('Monitor not found or access denied');
    }

    // Get latest check result
    const latestResult =
      await this.monitorService.getLatestCheckResult(monitorId);

    return {
      ...monitor,
      latestStatus: latestResult || null,
    };
  }

  //PATCH /monitors/:id: Update monitor configuration
  @Patch(':id')
  async updateMonitor(
    @GetUser('id') userId: string,
    @Param('id') monitorId: string,
    @Body() updateData: UpdateMonitorDto,
  ) {
    try {
      return await this.monitorService.updateMonitor(
        monitorId,
        userId,
        updateData,
      );
    } catch (error) {
      if (error.message === 'Monitor not found or access denied') {
        throw new NotFoundException('Monitor not found or access denied');
      }
      throw error;
    }
  }

  //DELETE /monitors/:id: Delete monitor and stop checks
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMonitor(
    @GetUser('id') userId: string,
    @Param('id') monitorId: string,
  ) {
    try {
      await this.monitorService.deleteMonitor(monitorId, userId);
    } catch (error) {
      if (error.message === 'Monitor not found or access denied') {
        throw new NotFoundException('Monitor not found or access denied');
      }
      throw error;
    }
  }

  //Additional endpoints for pause/resume
  @Patch(':id/pause')
  async pauseMonitor(
    @GetUser('id') userId: string,
    @Param('id') monitorId: string,
  ) {
    await this.monitorService.pauseMonitor(monitorId, userId);
    return { message: 'Monitor paused successfully' };
  }

  @Patch(':id/resume')
  async resumeMonitor(
    @GetUser('id') userId: string,
    @Param('id') monitorId: string,
  ) {
    await this.monitorService.resumeMonitor(monitorId, userId);
    return { message: 'Monitor resumed successfully' };
  }

  //GET /monitors/:id/stats - Get monitor statistics
  @Get(':id/stats')
  async getMonitorStats(
    @GetUser('id') userId: string,
    @Param('id') monitorId: string,
  ) {
    const stats = await this.monitorService.getMonitorStats(monitorId, userId);
    if (!stats) {
      throw new NotFoundException('Monitor not found or access denied');
    }
    return stats;
  }

  //Historical Data API Endpoint
  @Get(':id/metrics')
  async getMonitorMetrics(
    @GetUser('id') userId: string,
    @Param('id') monitorId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('interval') interval?: string,
  ) {
    const metrics = await this.monitorService.getMonitorMetrics(
      monitorId,
      userId,
      {
        from: from
          ? new Date(from)
          : new Date(Date.now() - 24 * 60 * 60 * 1000), // Default to last 24 hours
        to: to ? new Date(to) : new Date(),
        interval: interval || '1h', // Default to 1 hour interval
      },
    );

    if (!metrics) {
      throw new NotFoundException('Monitor not found or access denied');
    }
    return metrics;
  }
}
