"use client";

export const dynamic = 'force-dynamic';

import TiveesPlayer from '@/components/TiveesPlayer'
import { useSearchParams } from "next/navigation"

const Player = () => {

  const searchParams = useSearchParams();
  const movieId = searchParams.get("movieId");

  if (!movieId) {
    return <div className="text-white">No movie selected</div>;
  }

  return (
    <>
      <TiveesPlayer movieId={movieId} />
    </>
  )
}

export default Player;