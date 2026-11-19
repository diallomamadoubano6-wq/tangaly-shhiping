import { getAdminDashboardStats } from '@/actions/admin';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export default async function AdminDashboard() {
  const { stats, recentShipments, trendShipments } = await getAdminDashboardStats();

  return (
    <AdminDashboardClient stats={stats} recentShipments={recentShipments} trendShipments={trendShipments} />
  );
}
