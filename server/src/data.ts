import { Notification } from './types';

function isoMinutesAgo(mins: number): string {
  return new Date(Date.now() - mins * 60_000).toISOString();
}

export let notifications: Notification[] = [
  { id: '1', title: 'Welcome', message: 'Thanks for joining!', type: 'info', timestamp: isoMinutesAgo(120), read: false, category: 'general' },
  { id: '2', title: 'Build passed', message: 'Your pipeline finished successfully.', type: 'success', timestamp: isoMinutesAgo(90), read: true, category: 'devops' },
  { id: '3', title: 'Usage warning', message: 'You are nearing your quota.', type: 'warning', timestamp: isoMinutesAgo(45), read: false, category: 'billing' },
  { id: '4', title: 'Action required', message: 'Update your password.', type: 'error', timestamp: isoMinutesAgo(10), read: false, category: 'security' },
];
