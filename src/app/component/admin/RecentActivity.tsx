'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  UserPlus,
  CreditCard,
  MessageSquare,
  Activity,
  Loader2,
} from 'lucide-react';
import { useAuthToken } from '@/store/hooks';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://tivess-be-89v3.onrender.com';

interface ApiActivity {
  _id: string;
  activityType: string;
  status: string;
  comment: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface RecentActivitiesResponse {
  status: string;
  activities: ApiActivity[];
}

async function fetchRecentActivities(
  token: string | null
): Promise<ApiActivity[]> {
  if (!token) return [];
  const res = await fetch(
    `${API_BASE}/api/v1/admin/admin-recentActivities`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return [];
  const json = (await res.json()) as RecentActivitiesResponse;
  if (json.status !== 'SUCCESS' || !Array.isArray(json.activities))
    return [];
  return json.activities;
}

function getIconForType(activityType: string) {
  const t = (activityType ?? '').toUpperCase();
  if (t.includes('FRIEND') || t.includes('JOINED')) return { Icon: UserPlus, bg: 'bg-blue-600' };
  if (t.includes('PAYMENT') || t.includes('COMPLETED')) return { Icon: CreditCard, bg: 'bg-green-600' };
  if (t.includes('ALERT') || t.includes('WARNING')) return { Icon: AlertTriangle, bg: 'bg-yellow-600' };
  if (t.includes('MESSAGE') || t.includes('COMMENT')) return { Icon: MessageSquare, bg: 'bg-gray-600' };
  return { Icon: Activity, bg: 'bg-gray-600' };
}

function getDefaultText(activityType: string): string {
  const t = (activityType ?? '').toUpperCase();
  if (t === 'FRIEND_JOINED') return 'A friend joined.';
  if (t === 'PAYMENT_COMPLETED') return 'Payment completed.';
  return activityType?.replace(/_/g, ' ') ?? 'Activity';
}

export default function RecentActivity() {
  const token = useAuthToken();

  const { data: activities = [], isLoading, isError } = useQuery({
    queryKey: ['admin-recent-activities', token],
    queryFn: () => fetchRecentActivities(token),
    enabled: !!token,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalPages = Math.max(1, Math.ceil(activities.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedActivities = activities.slice(startIndex, endIndex);

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 sm:p-5 md:p-6 border border-gray-800 w-full min-w-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2">
        <h2 className="text-white text-base sm:text-lg font-semibold">
          Recent Activity
        </h2>
        <button
          className="text-blue-500 hover:text-blue-400 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
          aria-label="Mark all as read"
        >
          Mark all as read
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-gray-500" />
        </div>
      ) : isError ? (
        <p className="text-gray-500 text-sm">Failed to load activities.</p>
      ) : activities.length === 0 ? (
        <p className="text-gray-500 text-sm">No recent activity.</p>
      ) : (
        <>
          <div className="space-y-3 sm:space-y-4">
            {paginatedActivities.map((activity) => {
              const { Icon, bg } = getIconForType(activity.activityType);
              const text =
                activity.comment?.trim() ||
                getDefaultText(activity.activityType);
              const time = formatDistanceToNow(new Date(activity.createdAt), {
                addSuffix: true,
              });
              const unread = (activity.status ?? '').toUpperCase() === 'UNSEEN';

              return (
                <div
                  key={activity._id}
                  className="flex items-start space-x-3 sm:space-x-4 relative"
                >
                  <div
                    className={`${bg} rounded-full p-1.5 sm:p-2 flex-shrink-0`}
                  >
                    <Icon size={14} className="sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed break-words">
                      {text}
                    </p>
                    <p className="text-gray-500 text-[10px] sm:text-xs mt-1">
                      {time}
                    </p>
                  </div>
                  {unread && (
                    <div className="absolute right-0 top-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {activities.length > pageSize && (
            <div className="mt-4 flex items-center justify-between text-[10px] sm:text-xs text-gray-400">
              <span>
                Showing {startIndex + 1}-{Math.min(endIndex, activities.length)} of{' '}
                {activities.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={safeCurrentPage === 1}
                  className="px-2 py-1 rounded border border-gray-700 bg-[#111] text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span>
                  Page {safeCurrentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={safeCurrentPage === totalPages}
                  className="px-2 py-1 rounded border border-gray-700 bg-[#111] text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
