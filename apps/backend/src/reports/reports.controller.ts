import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { JwtGuard } from '@/auth/guard';
import { GetUser } from '@/auth/decorators';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto, ReportData } from './dto/generate-report.dto';

@UseGuards(JwtGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  async generateReport(
    @GetUser('id') userId: string,
    @Body() generateReportDto: GenerateReportDto,
  ): Promise<ReportData> {
    return await this.reportsService.generateReport(userId, generateReportDto);
  }

  @Get('export/csv')
  async exportCsv(
    @GetUser('id') userId: string,
    @Query() generateReportDto: GenerateReportDto,
    @Res() res: Response,
  ) {
    const csvContent = await this.reportsService.exportReportAsCsv(
      userId,
      generateReportDto,
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=monitor-report.csv',
    );
    res.status(HttpStatus.OK).send(csvContent);
  }

  @Get('export/json')
  async exportJson(
    @GetUser('id') userId: string,
    @Query() generateReportDto: GenerateReportDto,
    @Res() res: Response,
  ) {
    const reportData = await this.reportsService.exportReportAsJson(
      userId,
      generateReportDto,
    );

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=monitor-report.json',
    );
    res.status(HttpStatus.OK).json(reportData);
  }
}
