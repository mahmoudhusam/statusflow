import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class CreateMonitorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsNumber()
  @Min(10)
  @Max(3600)
  interval: number;

  @IsOptional()
  @IsString()
  @IsEnum(['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'PATCH', 'OPTIONS'])
  httpMethod?: string;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  @Max(30000)
  timeout?: number;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(10000)
  maxLatencyMs?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxConsecutiveFailures?: number;
}
