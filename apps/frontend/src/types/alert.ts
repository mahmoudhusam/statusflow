export enum AlertType {
  DOWNTIME = 'downtime',
  LATENCY = 'latency',
  STATUS_CODE = 'status_code',
  SSL_EXPIRY = 'ssl_expiry',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  TRIGGERED = 'triggered',
  RESOLVED = 'resolved',
  ACKNOWLEDGED = 'acknowledged',
}

export enum ChannelType {
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  SMS = 'sms',
  SLACK = 'slack',
}

export interface AlertConditions {
  consecutiveFailures?: number;
  latencyThreshold?: number;
  statusCodes?: number[];
  sslDaysBeforeExpiry?: number;
}

export interface WebhookConfig {
  enabled: boolean;
  url?: string;
  headers?: Record<string, string>;
}

export interface SmsConfig {
  enabled: boolean;
  phoneNumbers?: string[];
}

export interface AlertChannels {
  email?: boolean;
  webhook?: WebhookConfig;
  sms?: SmsConfig;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  type: AlertType;
  severity: AlertSeverity;
  enabled: boolean;
  conditions: AlertConditions;
  channels: AlertChannels;
  userId: string;
  monitorId?: string;
  monitor?: {
    id: string;
    name: string;
    url: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationChannelConfig {
  emailAddresses?: string[];
  webhookUrl?: string;
  webhookHeaders?: Record<string, string>;
  webhookMethod?: string;
  phoneNumbers?: string[];
  slackWebhookUrl?: string;
  slackChannel?: string;
}

export interface QuietHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timezone: string;
  daysOfWeek?: number[];
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: ChannelType;
  enabled: boolean;
  isDefault: boolean;
  configuration: NotificationChannelConfig;
  quietHours?: QuietHours;
  userId: string;
  lastTestAt?: string;
  lastTestSuccess?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertHistory {
  id: string;
  status: AlertStatus;
  title: string;
  message: string;
  metadata?: {
    responseTime?: number;
    statusCode?: number;
    errorMessage?: string;
    consecutiveFailures?: number;
  };
  channelsNotified: {
    email?: boolean;
    webhook?: boolean;
    sms?: boolean;
  };
  alertRuleId: string;
  alertRule?: AlertRule;
  monitorId?: string;
  monitor?: {
    id: string;
    name: string;
    url: string;
  };
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  triggeredAt: string;
}

export interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  type: AlertType;
  severity: AlertSeverity;
  conditions: AlertConditions;
}
