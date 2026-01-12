import { Notification } from './types';

function isoMinutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

export let notifications: Notification[] = [
  { id: '1', title: 'Welcome', message: 'Thanks for joining!', type: 'info', timestamp: isoMinutesAgo(120), read: false, category: 'general' },
  { id: '2', title: 'Build passed', message: 'Your pipeline finished successfully.', type: 'success', timestamp: isoMinutesAgo(90), read: true, category: 'devops' },
  { id: '3', title: 'Usage warning', message: 'You are nearing your quota.', type: 'warning', timestamp: isoMinutesAgo(45), read: false, category: 'billing' },
  { id: '4', title: 'Security alert', message: 'New login detected from an unknown device.', type: 'warning', timestamp: isoMinutesAgo(80), read: false, category: 'security' },
  { id: '5', title: 'Password expired', message: 'Your password has expired. Please update it.', type: 'error', timestamp: isoMinutesAgo(30), read: false, category: 'security' },
  { id: '6', title: 'Payment successful', message: 'Your monthly subscription payment was processed.', type: 'success', timestamp: isoMinutesAgo(110), read: true, category: 'billing' },
  { id: '7', title: 'Action required', message: 'Verify your email address to continue using all features.', type: 'warning', timestamp: isoMinutesAgo(70), read: false, category: 'account' },
  { id: '8', title: 'System maintenance', message: 'Scheduled maintenance will occur tonight at 2 AM.', type: 'info', timestamp: isoMinutesAgo(200), read: true, category: 'system' },
  { id: '9', title: 'Deployment failed', message: 'Production deployment failed due to a config error.', type: 'error', timestamp: isoMinutesAgo(15), read: false, category: 'devops' },
  { id: '10', title: 'New feature available', message: 'You can now enable real-time notifications.', type: 'info', timestamp: isoMinutesAgo(25), read: false, category: 'product' },
  { id: '11', title: 'Quota reset', message: 'Your monthly usage quota has been reset.', type: 'success', timestamp: isoMinutesAgo(10), read: true, category: 'billing' },
  { id: '12', title: 'Backup completed', message: 'Daily backup completed successfully.', type: 'success', timestamp: isoMinutesAgo(55), read: true, category: 'system' },
  { id: '13', title: 'Session expired', message: 'You were logged out due to inactivity.', type: 'warning', timestamp: isoMinutesAgo(5), read: false, category: 'security' },
  { id: '14', title: 'Profile updated', message: 'Your profile information was updated.', type: 'info', timestamp: isoMinutesAgo(35), read: true, category: 'account' },
  { id: '15', title: 'Invoice generated', message: 'Your invoice for this month is now available.', type: 'info', timestamp: isoMinutesAgo(60), read: false, category: 'billing' },
];
