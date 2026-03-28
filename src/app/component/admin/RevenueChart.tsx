'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

const revenueData = [
  { month: 'Jan', revenue: 20 },
  { month: 'Feb', revenue: 35 },
  { month: 'Mar', revenue: 45 },
  { month: 'Apr', revenue: 30 },
  { month: 'May', revenue: 50 },
  { month: 'Jun', revenue: 65 },
  { month: 'Jul', revenue: 70 },
  { month: 'Aug', revenue: 55 },
  { month: 'Sep', revenue: 75 },
  { month: 'Oct', revenue: 80 },
  { month: 'Nov', revenue: 95 },
  { month: 'Dec', revenue: 85 },
];

export default function RevenueChart() {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 sm:p-5 md:p-6 border border-gray-800 w-full min-w-0 overflow-hidden">
      <h2 className="text-white text-base sm:text-lg font-semibold mb-4 sm:mb-6">Revenue Trend</h2>
      <div className="w-full h-[250px] sm:h-[280px] md:h-[300px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={revenueData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              width={40}
            />
            <Bar 
              dataKey="revenue" 
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-gray-400 text-xs sm:text-sm text-center mt-2">2021</p>
    </div>
  );
}

