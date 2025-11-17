import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { ChannelType } from '../entities/notification-channel.entity';

export class CreateNotificationChannelDto {
  @IsString()
  name: string;

  @IsEnum(ChannelType)
  type: ChannelType;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsObject()
  configuration: {
    emailAddresses?: string[];
    webhookUrl?: string;
    webhookHeaders?: Record<string, string>;
    webhookMethod?: string;
    phoneNumbers?: string[];
    slackWebhookUrl?: string;
    slackChannel?: string;
  };

  @IsOptional()
  @IsObject()
  quietHours?: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
    daysOfWeek?: number[];
  };
}
