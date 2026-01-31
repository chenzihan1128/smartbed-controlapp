
export type SystemStatus = 'normal' | 'warning' | 'critical' | 'disconnected';

export interface Vitals {
  heartRate: number;
  spo2: number;
  bloodPressure: string;
  respRate: number;
  temp: number;
}

export interface Thresholds {
  high: number;
  low: number;
}

export interface AlertRule {
  id: string;
  name: string;
  unit: string;
  warning: Thresholds;
  critical: Thresholds;
  isActive: boolean;
}

export interface Caregiver {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
}

export interface HealthAlert {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'resolved';
}
