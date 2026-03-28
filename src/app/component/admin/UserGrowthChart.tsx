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

interface UserGrowthPoint {
  day: string;
  growth: number;
}

interface UserGrowthResponse {
  status: string;
  data: UserGrowthPoint[];
}

const fallbackGrowthData: UserGrowthPoint[] = [
  { day: 'Mon', growth: 0 },
  { day: 'Tue', growth: 0 },
  { day: 'Wed', growth: 0 },
  { day: 'Thu', growth: 0 },
  { day: 'Fri', growth: 0 },
  { day: 'Sat', growth: 0 },
  { day: 'Sun', growth: 0 },
];

async function fetchUserGrowthPerDay(
  token: string | null
): Promise<UserGrowthPoint[]> {
  if (!token) return fallbackGrowthData;

  const res = await fetch(
    `${API_BASE}/api/v1/admin/admin-userGrowthPerDay`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) return fallbackGrowthData;

  const json = (await res.json()) as UserGrowthResponse;
  if (json.status !== 'SUCCESS' || !Array.isArray(json.data)) {
    return fallbackGrowthData;
  }

  return json.data;
}

export default function UserGrowthChart() {
  const token = useAuthToken();

  const { data = fallbackGrowthData, isLoading, isError } = useQuery({
    queryKey: ['admin-user-growth-per-day', token],
    queryFn: () => fetchUserGrowthPerDay(token),
    enabled: !!token,
  });

  const growthData = data.length ? data : fallbackGrowthData;

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 sm:p-5 md:p-6 border border-gray-800 w-full min-w-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="text-white text-base sm:text-lg font-semibold">
          User Growth per day
        </h2>
        {isLoading && (
          <Loader2 className="size-4 sm:size-5 animate-spin text-gray-400" />
        )}
      </div>
      {isError ? (
        <p className="text-gray-500 text-xs sm:text-sm">
          Failed to load user growth data.
        </p>
      ) : (
        <div className="w-full h-[220px] sm:h-[230px] md:h-[250px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={growthData}
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis
                dataKey="day"
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
                dataKey="growth"
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

