"use client";


import TiveesPlayer from '@/components/TiveesPlayer'
import { useParams } from 'next/navigation';
import { movies } from '@/data/movies';

const Player = () => {

  const params = useParams();
  const movie = movies.find((m) => m.id === params.id);

  if (!movie) {
    return <div className="text-white">No movie selected</div>;
  }

  return (
    <>
      <TiveesPlayer movie={movie} />
    </>
  )
}

export default Player;