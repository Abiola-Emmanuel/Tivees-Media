'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import MetricCard from '../../component/admin/MetricCard';
import UserGrowthChart from '../../component/admin/UserGrowthChart';
import RecentActivity from '../../component/admin/RecentActivity';
import { useAuthToken } from '@/store/hooks';
import { Loader2 } from 'lucide-react';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://tivess-be-89v3.onrender.com';

interface PreviewMetric {
  total: number;
  change?: number;
  changePositive?: boolean;
  latest?: unknown[];
  ongoing?: unknown[];
}

interface AdminHomePreview {
  users: PreviewMetric;
  movies: PreviewMetric;
  watchParties: PreviewMetric;
}

function formatChange(change: number | undefined): string {
  if (change == null) return '—';
  const prefix = change > 0 ? '+' : '';
  return `${prefix}${change}%`;
}

interface AdminHomeResponse {
  status: string;
  preview: AdminHomePreview;
}

async function fetchAdminHome(token: string | null): Promise<AdminHomePreview | null> {
  if (!token) return null;
  const res = await fetch(`${API_BASE}/api/v1/admin/admin-home`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as AdminHomeResponse;
  if (json.status !== 'SUCCESS' || !json.preview) return null;
  return json.preview;
}

export default function AdminHomePage() {
  const router = useRouter();
  const token = useAuthToken();

  const { data: preview, isLoading, isError } = useQuery({
    queryKey: ['admin-home', token],
    queryFn: () => fetchAdminHome(token),
    enabled: !!token,
  });

  const handleNewContent = () => {
    router.push('/admin/content');
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8 bg-black min-h-screen pt-16 lg:pt-8 w-full overflow-x-hidden">
      <div className="max-w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Home</h1>
          <button
            onClick={handleNewContent}
            className="w-full sm:w-auto bg-[#2a2a2a] hover:bg-[#333] text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors border border-gray-700"
          >
            + New Content
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-6 md:mb-8">
          {isLoading ? (
            <div className="col-span-full flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-gray-500" />
            </div>
          ) : isError || !preview ? (
            <>
              <MetricCard label="Users" value="—" change="—" />
              <MetricCard label="Movies" value="—" change="—" />
              <MetricCard label="Watch Parties" value="—" change="—" />
            </>
          ) : (
            <>
              <MetricCard
                label="Users"
                value={String(preview.users.total)}
                change={formatChange(preview.users.change)}
                changePositive={preview.users.changePositive ?? (preview.users.change != null && preview.users.change >= 0)}
              />
              <MetricCard
                label="Movies"
                value={String(preview.movies.total)}
                change={formatChange(preview.movies.change)}
                changePositive={preview.movies.changePositive ?? (preview.movies.change != null && preview.movies.change >= 0)}
              />
              <MetricCard
                label="Watch Parties"
                value={String(preview.watchParties.total)}
                change={formatChange(preview.watchParties.change)}
                changePositive={preview.watchParties.changePositive ?? (preview.watchParties.change != null && preview.watchParties.change >= 0)}
              />
            </>
          )}
        </div>

        {/* Bottom Section: User Growth and Recent Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          <UserGrowthChart />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
