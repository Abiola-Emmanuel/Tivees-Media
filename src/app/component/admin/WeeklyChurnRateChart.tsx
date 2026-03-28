'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

const churnData = [
  { week: 'Week 1', value: 85 },
  { week: 'Week 2', value: 70 },
  { week: 'Week 3', value: 90 },
  { week: 'Week 4', value: 65 },
  { week: 'Week 5', value: 80 },
  { week: 'Week 6', value: 75 },
  { week: 'Week 7', value: 60 },
];

export default function WeeklyChurnRateChart() {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 sm:p-5 md:p-6 border border-gray-800 w-full min-w-0 overflow-hidden">
      <h2 className="text-white text-base sm:text-lg font-semibold mb-4 sm:mb-6">Weekly Churn Rate</h2>
      <div className="w-full h-[250px] sm:h-[280px] md:h-[300px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={churnData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis 
              dataKey="week" 
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
      <div className="flex items-center justify-center gap-2 mt-2">
        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
        <p className="text-gray-400 text-xs sm:text-sm">2023</p>
      </div>
    </div>
  );
}

