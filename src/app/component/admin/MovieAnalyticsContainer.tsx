'use client';

import { useQuery } from '@tanstack/react-query';
import MovieAnalyticsModal from './MovieAnalyticsModal';
import { useAuthToken } from '@/store/hooks';

interface ApiMovieDetails {
  _id?: string;
  id?: string;
  uid?: string;
  title?: string;
  posterUrl?: string;
  releaseDate?: string;
  genre?: string;
  duration?: number;
  category?: string;
  status?: string;
  createdAt?: string;
}

interface ApiMonthlyAnalytics {
  month: string;
  views: number;
  watchTime?: number;
}

interface MonthlyViewData {
  month: string;
  views: number;
  watchTime?: number;
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
  engagementData: [];
}

interface MovieAnalyticsContainerProps {
  movieId: string | null;
  title: string;
  posterUrl?: string;
  releaseDate?: string;
  genre?: string;
  onClose: () => void;
}

interface MovieDetailsResponse {
  status?: string;
  movie?: ApiMovieDetails;
  message?: string;
  error?: string;
}

interface MovieAnalyticsResponse {
  status?: string;
  movie?: ApiMovieDetails;
  totalWatchTimeSeconds?: number;
  uniqueViewers?: number;
  monthlyData?: ApiMonthlyAnalytics[];
  message?: string;
  error?: string;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'https://tivess-be-89v3.onrender.com';

async function readSuccessJson<T>(res: Response, fallbackMessage: string): Promise<T> {
  const json = (await res.json().catch(() => null)) as
    | (T & { status?: string; message?: string; error?: string })
    | null;

  if (!res.ok || json?.status !== 'SUCCESS') {
    throw new Error(json?.message ?? json?.error ?? fallbackMessage);
  }

  return json as T;
}

async function fetchMovieAnalytics(
  movieId: string,
  token: string | null,
  fallback: Pick<
    MovieAnalyticsData,
    'title' | 'posterUrl' | 'releaseDate' | 'genre'
  >,
): Promise<MovieAnalyticsData> {
  if (!movieId) {
    throw new Error('Movie ID is required');
  }

  if (!token) {
    throw new Error('Authentication required');
  }

  const headers = { Authorization: `Bearer ${token}` };
  const [detailsResponse, analyticsResponse] = await Promise.all([
    fetch(`${API_BASE}/api/v1/admin/admin-movie/${movieId}`, { headers }),
    fetch(`${API_BASE}/api/v1/admin/admin-movieAnalytics/${movieId}`, {
      headers,
    }),
  ]);

  const [detailsJson, analyticsJson] = await Promise.all([
    readSuccessJson<MovieDetailsResponse>(
      detailsResponse,
      'Failed to fetch movie details',
    ),
    readSuccessJson<MovieAnalyticsResponse>(
      analyticsResponse,
      'Failed to fetch movie analytics',
    ),
  ]);

  const movie = detailsJson.movie ?? analyticsJson.movie ?? {};
  const monthlyData = (analyticsJson.monthlyData ?? []).map((entry) => ({
    month: entry.month,
    views: entry.views ?? 0,
    watchTime:
      entry.watchTime === undefined ? undefined : Math.round(entry.watchTime / 60),
  }));
  const totalViews = monthlyData.reduce((sum, entry) => sum + entry.views, 0);

  return {
    movieId: movie._id ?? movie.id ?? movieId,
    title: movie.title ?? fallback.title,
    posterUrl: movie.posterUrl ?? fallback.posterUrl,
    releaseDate: movie.releaseDate ?? fallback.releaseDate,
    genre: movie.genre ?? fallback.genre,
    totalViews,
    totalWatchTimeSeconds: analyticsJson.totalWatchTimeSeconds ?? 0,
    uniqueViewers: analyticsJson.uniqueViewers ?? 0,
    monthlyData,
    engagementData: [],
  };
}

export default function MovieAnalyticsContainer({
  movieId,
  title,
  posterUrl,
  releaseDate,
  genre,
  onClose,
}: MovieAnalyticsContainerProps) {
  const token = useAuthToken();
  const isOpen = movieId !== null;

  const fallbackData: MovieAnalyticsData = {
    movieId: movieId || '',
    title,
    posterUrl,
    releaseDate,
    genre,
    monthlyData: [],
    engagementData: [],
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['movie-analytics', movieId, token],
    queryFn: () =>
      fetchMovieAnalytics(movieId!, token, {
        title,
        posterUrl,
        releaseDate,
        genre,
      }),
    enabled: isOpen && !!movieId,
  });

  return (
    <MovieAnalyticsModal
      isOpen={isOpen}
      onClose={onClose}
      data={data || fallbackData}
      isLoading={isLoading}
      error={error instanceof Error ? error.message : null}
    />
  );
}
