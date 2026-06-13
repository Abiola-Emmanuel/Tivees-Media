'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface EngagementData {
  name: string;
  value: number;
  color?: string;
}

interface MovieEngagementPieProps {
  data?: EngagementData[];
  isLoading?: boolean;
  error?: string | null;
  title?: string;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#14b8a6', // teal
];

export default function MovieEngagementPie({
  data = [],
  isLoading = false,
  error = null,
  title = 'Engagement Breakdown',
}: MovieEngagementPieProps) {
  if (isLoading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800 w-full min-w-0 overflow-hidden flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-gray-400 text-sm">Loading data...</p>
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

  // Assign colors to data points
  const coloredData = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  // Calculate total
  const total = coloredData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 w-full min-w-0 overflow-hidden">
      <div className="p-6 sm:p-8">
        <h3 className="text-white text-lg sm:text-xl font-semibold mb-6">
          {title}
        </h3>
        <div className="w-full h-96 sm:h-[500px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={coloredData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {coloredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f0f0f',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f3f4f6' }}
                formatter={(value: number) => [
                  `${value} (${((value / total) * 100).toFixed(1)}%)`,
                  'Count',
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: '15px' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
