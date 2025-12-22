import { DashboardClient } from './dashboard-client';

export const metadata = {
  title: 'Dashboard | StatusFlow',
  description: 'Monitor your services and view real-time status updates',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
