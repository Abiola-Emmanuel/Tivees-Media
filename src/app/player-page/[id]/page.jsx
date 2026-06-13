"use client";

import { useCallback, useRef, useState, useEffect, use } from 'react';
import axios from 'axios';
import TiveesPlayer from '@/components/TiveesPlayer'

const Player = ({ params }) => {
  const { id } = use(params);
  const [sessionId, setSessionId] = useState(null);
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef(null);
  const currentPositionRef = useRef(0);
  const isPlaybackPlayingRef = useRef(true);
  const watchSessionEndedRef = useRef(false);
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;

  const getCurrentPositionSeconds = useCallback(() => {
    try {
      // First try to get from player object methods
      if (playerRef.current?.currentTime) {
        const time = typeof playerRef.current.currentTime === 'function'
          ? playerRef.current.currentTime()
          : playerRef.current.currentTime;
        return Number(time || 0);
      }

      // Fallback to stored position
      return currentPositionRef.current || 0;
    } catch (err) {
      console.error('Error getting current position:', err);
      return currentPositionRef.current || 0;
    }
  }, []);

  const handlePlayerReady = useCallback((player) => {
    playerRef.current = player;
    setPlayerReady(Boolean(player));
  }, []);

  const handlePlaybackChange = useCallback((isPlaying) => {
    isPlaybackPlayingRef.current = isPlaying;
  }, []);

  const handleTimeUpdate = useCallback((currentTime) => {
    currentPositionRef.current = currentTime;
  }, []);

  const endWatchSession = useCallback(({ keepalive = false } = {}) => {
    if (!movie?._id || !sessionId || watchSessionEndedRef.current) {
      return;
    }

    const authToken = window.localStorage.getItem("authToken");

    if (!authToken || !url) {
      return;
    }

    watchSessionEndedRef.current = true;

    fetch(`${url}/api/v1/users/watch-session/end`, {
      method: 'POST',
      keepalive,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({
        movieId: movie._id,
        sessionId,
        currentPositionSeconds: getCurrentPositionSeconds(),
        isPlaying: false
      })
    }).then(async (response) => {
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        watchSessionEndedRef.current = false;
        console.error('Failed to end solo watch session:', data || response.statusText);
        return;
      }

      console.log('Solo watch session ended:', {
        movieId: movie._id,
        sessionId,
        currentPositionSeconds: getCurrentPositionSeconds(),
        timestamp: new Date().toISOString()
      });
    }).catch((err) => {
      watchSessionEndedRef.current = false;
      console.error('Error ending solo watch session:', err);
    });
  }, [getCurrentPositionSeconds, movie?._id, sessionId, url]);

  useEffect(() => {
    setSessionId(new URLSearchParams(window.location.search).get('sessionId'));
  }, []);

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

  useEffect(() => {
    if (!movie?._id || !sessionId || !playerReady || !playerRef.current) {
      return;
    }

    const sendHeartbeat = async () => {
      const authToken = window.localStorage.getItem("authToken");

      if (!authToken || !url || !playerRef.current) {
        return;
      }

      try {
        const currentPosition = getCurrentPositionSeconds();
        const isPlaying = isPlaybackPlayingRef.current;

        const response = await fetch(`${url}/api/v1/users/watch-session/heartbeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`
          },
          body: JSON.stringify({
            movieId: movie._id,
            sessionId,
            currentPositionSeconds: currentPosition,
            isPlaying
          })
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          console.error('Solo watch heartbeat failed:', data || response.statusText);
          return;
        }

        console.log('Solo watch heartbeat sent:', {
          movieId: movie._id,
          sessionId,
          currentPositionSeconds: currentPosition,
          isPlaying,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Error sending solo watch heartbeat:', err);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval for subsequent heartbeats
    const heartbeatIntervalId = window.setInterval(sendHeartbeat, 30000);

    return () => window.clearInterval(heartbeatIntervalId);
  }, [getCurrentPositionSeconds, movie?._id, playerReady, sessionId, url]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      endWatchSession({ keepalive: true });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endWatchSession({ keepalive: true });
    };
  }, [endWatchSession]);

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
      <TiveesPlayer
        movie={movie}
        onPlayerReady={handlePlayerReady}
        onPlaybackChange={handlePlaybackChange}
        onTimeUpdate={handleTimeUpdate}
      />
    </>
  )
}

export default Player;
