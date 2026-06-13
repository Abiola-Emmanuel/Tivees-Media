'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface MonthlyViewData {
  month: string;
  views: number;
  watchTime?: number;
}

interface MovieViewsChartProps {
  data?: MonthlyViewData[];
  isLoading?: boolean;
  error?: string | null;
}

export default function MovieViewsChart({
  data = [],
  isLoading = false,
  error = null,
}: MovieViewsChartProps) {
  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800 w-full min-w-0 overflow-hidden flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-400 text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800 w-full min-w-0 overflow-hidden flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <p className="text-red-400 text-sm font-medium">Failed to load data</p>
          <p className="text-gray-500 text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800 w-full min-w-0 overflow-hidden flex items-center justify-center h-96">
        <p className="text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 w-full min-w-0 overflow-hidden">
      <div className="p-6 sm:p-8">
        <h3 className="text-white text-lg sm:text-xl font-semibold mb-6">
          Monthly Views
        </h3>
        <div className="w-full h-96 sm:h-[500px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={{ stroke: '#374151' }}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                axisLine={{ stroke: '#374151' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f0f0f',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '15px' }}
                iconType="circle"
              />
              <Bar
                dataKey="views"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                name="Views"
              />
              {data.some((d) => d.watchTime !== undefined && d.watchTime > 0) && (
                <Bar
                  dataKey="watchTime"
                  fill="#8b5cf6"
                  radius={[6, 6, 0, 0]}
                  name="Watch Time (min)"
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
