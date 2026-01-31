
import { AlertRule, Caregiver, HealthAlert } from './types';

export const INITIAL_RULES: AlertRule[] = [
  {
    id: 'hr',
    name: 'Heart Rate',
    unit: 'BPM',
    isActive: true,
    warning: { high: 100, low: 55 },
    critical: { high: 120, low: 40 }
  },
  {
    id: 'spo2',
    name: 'SpO2',
    unit: '%',
    isActive: true,
    warning: { high: 99, low: 94 },
    critical: { high: 100, low: 90 }
  },
  {
    id: 'bp',
    name: 'Blood Pressure',
    unit: 'Sys',
    isActive: true,
    warning: { high: 140, low: 90 },
    critical: { high: 160, low: 80 }
  }
];

export const MOCK_CAREGIVERS: Caregiver[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@email.com', avatarColor: 'bg-blue-100 text-blue-600' },
  { id: '2', name: 'Robert Miller', email: 'r.miller@carehub.org', avatarColor: 'bg-orange-100 text-orange-600' },
  { id: '3', name: 'Elena Rodriguez', email: 'elena.rod@provider.net', avatarColor: 'bg-green-100 text-green-600' }
];

export const MOCK_ALERTS: HealthAlert[] = [
  {
    id: 'a1',
    type: 'spo2',
    title: 'SpO2: 86%',
    description: 'Oxygen levels are dangerously low. Immediate attention required.',
    severity: 'critical',
    status: 'active',
    timestamp: new Date()
  },
  {
    id: 'a2',
    type: 'fall',
    title: 'Fall Detected',
    description: 'Bed Sensor A1 triggered a fall impact alert.',
    severity: 'warning',
    status: 'resolved',
    timestamp: new Date(Date.now() - 3600000)
  }
];
