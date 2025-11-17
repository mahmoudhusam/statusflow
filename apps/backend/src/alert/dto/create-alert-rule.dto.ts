import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AlertType, AlertSeverity } from '../entities/alert-rule.entity';

class AlertConditionsDto {
  @IsOptional()
  consecutiveFailures?: number;

  @IsOptional()
  latencyThreshold?: number;

  @IsOptional()
  statusCodes?: number[];

  @IsOptional()
  sslDaysBeforeExpiry?: number;
}

class WebhookConfigDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsObject()
  headers?: Record<string, string>;
}

class AlertChannelsDto {
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => WebhookConfigDto)
  webhook?: WebhookConfigDto;
}

export class CreateAlertRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(AlertType)
  type: AlertType;

  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ValidateNested()
  @Type(() => AlertConditionsDto)
  conditions: AlertConditionsDto;

  @ValidateNested()
  @Type(() => AlertChannelsDto)
  channels: AlertChannelsDto;

  @IsOptional()
  @IsUUID()
  monitorId?: string;
}
