import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtGuard } from '../auth/guard/jwt.guard';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { Response } from 'express';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a report for selected monitors' })
  @ApiResponse({
    status: 200,
    description: 'Report generated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more monitors not found',
  })
  async generateReport(
    @Req() req: any,
    @Body() generateReportDto: GenerateReportDto,
  ) {
    const userId = req.user.userId;
    return await this.reportsService.generateReport(userId, generateReportDto);
  }

  @Post('export/csv')
  @ApiOperation({ summary: 'Export report as CSV' })
  @ApiResponse({
    status: 200,
    description: 'CSV file generated successfully',
  })
  async exportCsv(
    @Req() req: any,
    @Body() generateReportDto: GenerateReportDto,
    @Res() res: Response,
  ) {
    s;
    const userId = req.user.userId;
    const csvContent = await this.reportsService.exportCsv(
      userId,
      generateReportDto,
    );

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="status-report-${new Date().toISOString().split('T')[0]}.csv"`,
    );

    return res.status(HttpStatus.OK).send(csvContent);
  }

  @Post('export/json')
  @ApiOperation({ summary: 'Export report as JSON' })
  @ApiResponse({
    status: 200,
    description: 'JSON file generated successfully',
  })
  async exportJson(
    @Req() req: any,
    @Body() generateReportDto: GenerateReportDto,
    @Res() res: Response,
  ) {
    const userId = req.user.userId;
    const reportData = await this.reportsService.exportJson(
      userId,
      generateReportDto,
    );

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="status-report-${new Date().toISOString().split('T')[0]}.json"`,
    );

    return res.status(HttpStatus.OK).json(reportData);
  }
}
