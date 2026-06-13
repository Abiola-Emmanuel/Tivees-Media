'use client';

import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import Image from 'next/image';
import MovieViewsChart from './MovieViewsChart';

interface MonthlyViewData {
  month: string;
  views: number;
  watchTime?: number;
}

interface EngagementData {
  name: string;
  value: number;
  color?: string;
}

interface MovieAnalyticsData {
  movieId: string;
  title: string;
  posterUrl?: string;
  releaseDate?: string;
  genre?: string;
  totalViews?: number;
  totalWatchTimeSeconds?: number;
  uniqueViewers?: number;
  monthlyData: MonthlyViewData[];
  engagementData: EngagementData[];
}

interface MovieAnalyticsModalProps {
  data: MovieAnalyticsData;
  isLoading?: boolean;
  error?: string | null;
}

export default function MovieAnalyticsModal({
  data,
  isLoading = false,
  error = null,
}: MovieAnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'views' | 'engagement'>(
    'overview'
  );

  const formatWatchTime = (seconds?: number) => {
    if (seconds === undefined || seconds < 0) return '—';
    if (seconds === 0) return '0m';
    if (seconds < 60) return `${seconds}s`;

    const totalMinutes = Math.round(seconds / 60);
    if (totalMinutes < 60) return `${totalMinutes.toLocaleString()}m`;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return minutes > 0
      ? `${hours.toLocaleString()}h ${minutes}m`
      : `${hours.toLocaleString()}h`;
  };

  return (
    <div className="w-full bg-[#0a0a0a] flex flex-col">
        {/* Movie Details Bar */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-800 bg-[#0f0f0f]">
          <div className="flex gap-5 items-start flex-col sm:flex-row">
            {data.posterUrl && (
              <div className="w-20 h-32 shrink-0 relative rounded-lg overflow-hidden bg-gray-900">
                <Image
                  src={data.posterUrl}
                  alt={data.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    img.style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                    Total Views
                  </p>
                  <p className="text-white text-xl sm:text-2xl font-bold">
                    {data.totalViews?.toLocaleString() ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                    Unique Viewers
                  </p>
                  <p className="text-white text-xl sm:text-2xl font-bold">
                    {data.uniqueViewers?.toLocaleString() ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                    Total Watch Time
                  </p>
                  <p className="text-white text-xl sm:text-2xl font-bold">
                    {formatWatchTime(data.totalWatchTimeSeconds)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                    Genre
                  </p>
                  <p className="text-white text-xl sm:text-2xl font-bold truncate">
                    {data.genre || '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 sm:px-8 border-b border-gray-800 flex gap-1 bg-[#0f0f0f]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-base font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'overview'
              ? 'border-blue-500 text-white'
              : 'border-transparent text-gray-400 hover:text-white'
              }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Overview</span>
          </button>

        </div>

        {/* Content */}
        <div className="flex-1 px-6 sm:px-8 py-6 sm:py-8 overflow-y-auto">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 p-6 sm:p-8">
                <h3 className="text-white text-xl font-semibold mb-6">
                  Key Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">
                      Total Views
                    </p>
                    <p className="text-3xl sm:text-4xl font-bold text-blue-400">
                      {data.totalViews?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">
                      Unique Viewers
                    </p>
                    <p className="text-3xl sm:text-4xl font-bold text-purple-400">
                      {data.uniqueViewers?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">
                      Avg Views/Month
                    </p>
                    <p className="text-3xl sm:text-4xl font-bold text-emerald-400">
                      {data.monthlyData.length > 0
                        ? Math.round(
                          data.monthlyData.reduce((sum, m) => sum + m.views, 0) /
                          data.monthlyData.length
                        ).toLocaleString()
                        : '0'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">
                      Total Watch Time
                    </p>
                    <p className="text-3xl sm:text-4xl font-bold text-orange-400">
                      {formatWatchTime(data.totalWatchTimeSeconds)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1  gap-8">
                <div className="min-h-[500px]">
                  <MovieViewsChart
                    data={data.monthlyData}
                    isLoading={isLoading}
                    error={error}
                  />
                </div>
                {/* <div className="min-h-[500px]">
                  <MovieEngagementPie
                    data={data.engagementData}
                    isLoading={isLoading}
                    error={error}
                    title="Engagement"
                  />
                </div> */}
              </div>
            </div>
          )}

          {/* Views Tab */}
          {/* {activeTab === 'views' && (
            <div className="min-h-[600px]">
              <MovieViewsChart
                data={data.monthlyData}
                isLoading={isLoading}
                error={error}
              />
            </div>
          )} */}

          {/* Engagement Tab */}
          {/* {activeTab === 'engagement' && (
            <div className="min-h-[600px]">
              <MovieEngagementPie
                data={data.engagementData}
                isLoading={isLoading}
                error={error}
              />
            </div>
          )} */}
        </div>
    </div>
  );
}
