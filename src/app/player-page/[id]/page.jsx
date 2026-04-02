"use client";

import { useState, useEffect, use } from 'react';
import axios from 'axios';
import TiveesPlayer from '@/components/TiveesPlayer'

const Player = ({ params }) => {
  const { id } = use(params);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        const response = await axios.get(
          `${url}/api/v1/users/movies/${id}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`
            }
          }
        );

        if (response.data.status === "SUCCESS") {
          setMovie(response.data.movie);
        }
      } catch (err) {
        console.error("Full error details:", err);
        console.error("Error response:", err.response?.data);
        console.error("Error status:", err.response?.status);
        setError(err.response?.data?.message || "Failed to load movie");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMovieDetails();
    }
  }, [id, url]);

  if (loading) {
    return <div className="w-full h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  if (error || !movie) {
    return <div className="w-full h-screen bg-black flex items-center justify-center text-white">{error || 'Movie not found'}</div>;
  }

  const hasPlayableVideo = !!(
    movie?.uid ||
    movie?.videoUid ||
    movie?.cfid ||
    movie?.streamEmbedUrl ||
    movie?.iframeUrl ||
    movie?.embedUrl
  );

  if (!hasPlayableVideo) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center px-6 text-center text-white">
        <h1 className="text-2xl font-semibold">{movie?.title || 'This movie'}</h1>
        <p className="mt-3 max-w-lg text-white/70">
          This movie was found, but its video stream is not available yet. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <>
      <TiveesPlayer movie={movie} />
    </>
  )
}

export default Player;
