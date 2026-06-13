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
  isOpen: boolean;
  onClose: () => void;
  data: MovieAnalyticsData;
  isLoading?: boolean;
  error?: string | null;
}

export default function MovieAnalyticsModal({
  isOpen,
  onClose,
  data,
  isLoading = false,
  error = null,
}: MovieAnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'views' | 'engagement'>(
    'overview'
  );

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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

  // Full-screen page-like view
  return (
    <div
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onClick={handleBackdropClick}
    >
      <div className="w-full h-full bg-[#0a0a0a] overflow-y-auto flex flex-col">
        {/* Header */}
        {/* <div className="sticky top-0 bg-[#1a1a1a] border-b border-gray-800 px-6 sm:px-8 py-4 sm:py-6 flex items-start justify-between gap-4 z-10 backdrop-blur-sm">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 truncate">
              {data.title}
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-gray-400 text-sm sm:text-base">
                ID: <span className="font-mono text-gray-300">{data.movieId}</span>
              </p>
              <button
                onClick={handleCopyId}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
                title="Copy ID"
              >
                {copiedId ? (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-gray-300" />
                )}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close analytics"
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400 hover:text-white" />
          </button>
        </div> */}

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
        <div className="px-6 sm:px-8 border-b border-gray-800 flex gap-1 bg-[#0f0f0f] sticky top-[100px] z-10">
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
    </div>
  );
}
