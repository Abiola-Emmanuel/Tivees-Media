import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MdClose } from 'react-icons/md';

const TiveesPlayer = ({ movie, onPlayerReady, onPlaybackChange, onTimeUpdate }) => {
  const router = useRouter();
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const currentTimeRef = useRef(0);


  const videoUid = movie?.uid || movie?.videoUid || movie?.cfid || '';
  const iframeUrl = videoUid
    ? `https://iframe.videodelivery.net/${videoUid}?controls=true`
    : '';

  console.log("[TiveesPlayer] Selected Video UID:", videoUid);
  console.log("[TiveesPlayer] Iframe URL:", iframeUrl);

  useEffect(() => {
    if (!iframeUrl) {
      return;
    }

    let sdkScript = null;
    let cancelled = false;
    let timeUpdateInterval = null;

    const initializePlayer = () => {
      if (cancelled || !iframeRef.current || !window.Stream) {
        return;
      }

      try {
        const player = window.Stream(iframeRef.current);
        playerRef.current = player;

        // Expose methods to get current time
        player.currentTime = () => currentTimeRef.current;
        player.getCurrentTime = () => currentTimeRef.current;

        onPlayerReady?.(player);

        const handlePlay = () => onPlaybackChange?.(true);
        const handlePause = () => onPlaybackChange?.(false);

        // Listen for time updates
        player.addEventListener('timeupdate', (event) => {
          if (event.detail?.currentTime !== undefined) {
            currentTimeRef.current = event.detail.currentTime;
            onTimeUpdate?.(currentTimeRef.current);
          }
        });

        // Fallback: poll for time position using the Stream API
        timeUpdateInterval = setInterval(() => {
          try {
            // Try to get time from the player's internal state or iframe
            if (player?.currentTime?.() !== undefined) {
              const time = player.currentTime();
              if (time !== currentTimeRef.current) {
                currentTimeRef.current = time;
                onTimeUpdate?.(currentTimeRef.current);
              }
            }
          } catch (err) {
            // Silent fail for polling
          }
        }, 1000);

        player.addEventListener('play', handlePlay);
        player.addEventListener('pause', handlePause);

        return () => {
          player.removeEventListener?.('play', handlePlay);
          player.removeEventListener?.('pause', handlePause);
          if (timeUpdateInterval) {
            clearInterval(timeUpdateInterval);
          }
        };
      } catch (error) {
        console.error('Failed to initialize solo player:', error);
      }
    };

    let cleanupPlayer = null;

    if (window.Stream) {
      cleanupPlayer = initializePlayer();
    } else {
      sdkScript = document.createElement('script');
      sdkScript.src = 'https://embed.videodelivery.net/embed/sdk.latest.js';
      sdkScript.async = true;
      sdkScript.onload = () => {
        cleanupPlayer = initializePlayer();
      };
      sdkScript.onerror = () => {
        console.error('Failed to load Stream SDK');
      };
      document.body.appendChild(sdkScript);
    }

    return () => {
      cancelled = true;
      cleanupPlayer?.();
      onPlayerReady?.(null);
      playerRef.current = null;

      if (sdkScript && document.body.contains(sdkScript)) {
        document.body.removeChild(sdkScript);
      }
    };
  }, [iframeUrl, onPlaybackChange, onPlayerReady, onTimeUpdate]);

  return (
    <div className="relative w-full h-screen bg-black flex overflow-hidden font-sans text-white">

      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 z-20 cursor-pointer transition text-white hover:opacity-70"
      >
        ← Back
      </button>

      <div className="relative flex-1 flex flex-col justify-between p-6">
        <div className="flex justify-between items-start z-10">
          <div className="invisible" />
          <h2 className="text-sm font-medium opacity-80 uppercase tracking-widest text-center">
            {movie?.title || 'Loading...'}
          </h2>
          <button
            onClick={() => router.back()}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
            <MdClose size={20} />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
          {iframeUrl ? (
            <iframe
              ref={iframeRef}
              src={iframeUrl}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen
              frameBorder="0"
              width="100%"
              height="100%"
              className="absolute inset-0"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-white/70">
              Video unavailable for this movie.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TiveesPlayer;
