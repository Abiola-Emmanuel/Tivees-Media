"use client";

import TiveesPlayer from '@/components/TiveesPlayer'
import { useSearchParams } from "next/navigation"


const Player = () => {

  const searchParams = useSearchParams();
  const movieId = searchParams.get("movieId");

  return (
    <>
      <TiveesPlayer movieId={movieId} />
    </>
  )
}

export default Player