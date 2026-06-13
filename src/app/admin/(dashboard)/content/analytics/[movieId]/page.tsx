'use client';

import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import MovieAnalyticsContainer from '@/app/component/admin/MovieAnalyticsContainer';

export default function AdminMovieAnalyticsPage() {
  const router = useRouter();
  const params = useParams<{ movieId: string }>();
  const movieId = params.movieId;

  return (
    <div className="min-h-screen bg-black p-4 sm:p-5 md:p-6 lg:p-8 pt-16 lg:pt-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push('/admin/content')}
            className="mb-3 inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-[#151515] px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-[#202020] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to content
          </button>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Movie Analytics
          </h1>
        </div>
      </div>

      <MovieAnalyticsContainer movieId={movieId} />
    </div>
  );
}
