import { TrendingUp } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  change: string;
  changePositive?: boolean;
}

export default function MetricCard({ 
  label, 
  value, 
  change, 
  changePositive = true 
}: MetricCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 sm:p-5 md:p-6 border border-gray-800 w-full min-w-0">
      <p className="text-gray-400 text-xs sm:text-sm mb-2">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <h3 className="text-xl sm:text-2xl font-bold text-white break-words min-w-0 flex-1">{value}</h3>
        <div className={`flex items-center space-x-1 flex-shrink-0 ${changePositive ? 'text-green-500' : 'text-red-500'}`}>
          <TrendingUp size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium whitespace-nowrap">{change}</span>
        </div>
      </div>
    </div>
  );
}

