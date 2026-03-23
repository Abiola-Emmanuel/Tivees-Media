"use client"

import { useSearchParams } from "next/navigation"
import { movies } from "@/data/movies";

const WatchParty = () => {
  const searchParams = useSearchParams();
  const movieId = searchParams.get("movieId");

  const movie = movies.find((m) => m.id === movieId);


  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <h1 className="text-3xl font-bold">Watch Party for {movie ? movie.title : "Unknown Movie"}</h1>
    </div>
  )
}

export default WatchParty