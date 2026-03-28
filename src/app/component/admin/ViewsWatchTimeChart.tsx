'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useAuthToken } from '@/store/hooks';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://tivess-be-89v3.onrender.com';

interface WatchPartiesGrowthPoint {
  date: string;
  value: number;
}

interface WatchPartiesGrowthResponse {
  status: string;
  data: WatchPartiesGrowthPoint[];
}

const fallbackWatchPartiesData: WatchPartiesGrowthPoint[] = [
  { date: 'Jan', value: 0 },
  { date: 'Feb', value: 0 },
  { date: 'Mar', value: 0 },
  { date: 'Apr', value: 0 },
  { date: 'May', value: 0 },
  { date: 'Jun', value: 0 },
  { date: 'Jul', value: 0 },
  { date: 'Aug', value: 0 },
  { date: 'Sep', value: 0 },
  { date: 'Oct', value: 0 },
  { date: 'Nov', value: 0 },
  { date: 'Dec', value: 0 },
];

async function fetchWatchPartiesGrowth(
  token: string | null
): Promise<WatchPartiesGrowthPoint[]> {
  if (!token) return fallbackWatchPartiesData;

  const res = await fetch(
    `${API_BASE}/api/v1/admin/admin-watchPartiesGrowth`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) return fallbackWatchPartiesData;

  const json = (await res.json()) as WatchPartiesGrowthResponse;
  if (json.status !== 'SUCCESS' || !Array.isArray(json.data)) {
    return fallbackWatchPartiesData;
  }

  return json.data;
}

export default function ViewsWatchTimeChart() {
  const token = useAuthToken();

  const { data = fallbackWatchPartiesData, isLoading, isError } = useQuery({
    queryKey: ['admin-watch-parties-growth', token],
    queryFn: () => fetchWatchPartiesGrowth(token),
    enabled: !!token,
  });

  const chartData = data.length ? data : fallbackWatchPartiesData;

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 sm:p-5 md:p-6 border border-gray-800 w-full min-w-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-white text-base sm:text-lg font-semibold">
          Watch Parties Growth
        </h2>
        {isLoading && (
          <Loader2 className="size-4 sm:size-5 animate-spin text-gray-400" />
        )}
      </div>
      {isError ? (
        <p className="text-gray-500 text-xs sm:text-sm">
          Failed to load watch parties growth data.
        </p>
      ) : (
        <div className="w-full h-[250px] sm:h-[280px] md:h-[300px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={{ stroke: '#374151' }}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={{ stroke: '#374151' }}
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                width={40}
              />
              <Bar
                dataKey="value"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

