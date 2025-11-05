
import {
  IsArray,
  IsDateString,
  IsString,
  ArrayNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateReportDto {
  @ApiProperty({
    description: 'Array of monitor IDs to include in the report',
    example: ['uuid-1', 'uuid-2'],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  monitorIds: string[];

  @ApiProperty({
    description: 'Start date for the report period (ISO 8601 format)',
    example: '2025-10-27T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date for the report period (ISO 8601 format)',
    example: '2025-11-03T23:59:59.999Z',
  })
  @IsDateString()
  endDate: string;
}
