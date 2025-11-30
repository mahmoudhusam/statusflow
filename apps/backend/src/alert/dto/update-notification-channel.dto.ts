import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationChannelDto } from '@/alert/dto/create-notification-channel.dto';

export class UpdateNotificationChannelDto extends PartialType(
  CreateNotificationChannelDto,
) {}
