import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationChannelDto } from './create-notification-channel.dto';

export class UpdateNotificationChannelDto extends PartialType(
  CreateNotificationChannelDto,
) {}
