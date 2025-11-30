import { PartialType } from '@nestjs/mapped-types';
import { CreateAlertRuleDto } from '@/alert/dto/create-alert-rule.dto';

export class UpdateAlertRuleDto extends PartialType(CreateAlertRuleDto) {}
