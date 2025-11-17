import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtGuard } from '@/auth/guard';
import { GetUser } from '@/auth/decorators';
import { User } from '@/user/user.entity';
import { AlertService } from './alert.service';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';
import { UpdateAlertRuleDto } from './dto/update-alert-rule.dto';
import { CreateNotificationChannelDto } from './dto/create-notification-channel.dto';
import { UpdateNotificationChannelDto } from './dto/update-notification-channel.dto';

@UseGuards(JwtGuard)
@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  // Alert Rules
  @Get('rules')
  async getAlertRules(
    @GetUser() user: User,
    @Query('monitorId') monitorId?: string,
  ) {
    return this.alertService.getAlertRules(user.id, monitorId);
  }

  @Get('rules/:id')
  async getAlertRule(@GetUser() user: User, @Param('id') id: string) {
    return this.alertService.getAlertRule(id, user.id);
  }

  @Post('rules')
  async createAlertRule(
    @GetUser() user: User,
    @Body() dto: CreateAlertRuleDto,
  ) {
    return this.alertService.createAlertRule(user.id, dto);
  }

  @Put('rules/:id')
  async updateAlertRule(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateAlertRuleDto,
  ) {
    return this.alertService.updateAlertRule(id, user.id, dto);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAlertRule(@GetUser() user: User, @Param('id') id: string) {
    return this.alertService.deleteAlertRule(id, user.id);
  }

  // Notification Channels
  @Get('channels')
  async getNotificationChannels(@GetUser() user: User) {
    return this.alertService.getNotificationChannels(user.id);
  }

  @Get('channels/:id')
  async getNotificationChannel(@GetUser() user: User, @Param('id') id: string) {
    return this.alertService.getNotificationChannel(id, user.id);
  }

  @Post('channels')
  async createNotificationChannel(
    @GetUser() user: User,
    @Body() dto: CreateNotificationChannelDto,
  ) {
    return this.alertService.createNotificationChannel(user.id, dto);
  }

  @Put('channels/:id')
  async updateNotificationChannel(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateNotificationChannelDto,
  ) {
    return this.alertService.updateNotificationChannel(id, user.id, dto);
  }

  @Delete('channels/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotificationChannel(
    @GetUser() user: User,
    @Param('id') id: string,
  ) {
    return this.alertService.deleteNotificationChannel(id, user.id);
  }

  // Test notification channel
  @Post('channels/:id/test')
  async testNotificationChannel(
    @GetUser() user: User,
    @Param('id') id: string,
  ): Promise<any> {
    return this.alertService.testNotificationChannel(id, user.id);
  }

  // Alert History
  @Get('history')
  async getAlertHistory(
    @GetUser() user: User,
    @Query('monitorId') monitorId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.alertService.getAlertHistory(user.id, {
      monitorId,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('history/:id')
  async getAlertHistoryItem(@GetUser() user: User, @Param('id') id: string) {
    return this.alertService.getAlertHistoryItem(id, user.id);
  }

  @Put('history/:id/acknowledge')
  async acknowledgeAlert(@GetUser() user: User, @Param('id') id: string) {
    return this.alertService.acknowledgeAlert(id, user.id);
  }

  @Put('history/:id/resolve')
  async resolveAlert(@GetUser() user: User, @Param('id') id: string) {
    return this.alertService.resolveAlert(id, user.id);
  }

  // Alert Templates
  @Get('templates')
  getAlertTemplates(): any[] {
    return this.alertService.getAlertTemplates();
  }
}
