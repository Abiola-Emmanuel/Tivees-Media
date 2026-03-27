'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MdClose, MdShare, MdPerson, MdMessage } from 'react-icons/md';
import AttendeesPanel from '@/components/AttendesPanel';
import CommentsPanel from '@/components/CommentsPanel';

const WatchPartyPlayer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Parameters
  const partyId = searchParams.get('partyId');
  const cfid = searchParams.get('cfid');
  const userIdParam = searchParams.get('userId');

  // State
  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [activePanel, setActivePanel] = useState(null);
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [playerReady, setPlayerReady] = useState(false);
  const [userId, setUserId] = useState(userIdParam || null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate and get userId from localStorage if not in URL
  useEffect(() => {
    if (!userId) {
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      setUserId(user?._id || null);
    }
    setIsHydrated(true);
  }, []);

  // Refs
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const wsRef = useRef(null);
  const isSyncingRef = useRef(false);

  // Initialize player
  useEffect(() => {
    if (!cfid) return;

    const initPlayer = () => {
      if (!iframeRef.current) {
        console.warn('Iframe ref not yet available, retrying...');
        setTimeout(initPlayer, 100);
        return;
      }

      if (window.Stream) {
        try {
          // Set the iframe source - initially without controls
          iframeRef.current.src = `https://iframe.videodelivery.net/${cfid}?controls=false`;

          // Initialize Stream player
          playerRef.current = window.Stream(iframeRef.current);
          console.log('✅ Player initialized');
          setPlayerReady(true);
        } catch (err) {
          console.error('Error initializing player:', err);
        }
      } else {
        // Load SDK if not already loaded
        const script = document.createElement('script');
        script.src = 'https://embed.videodelivery.net/embed/sdk.latest.js';
        script.async = true;
        script.onload = () => {
          try {
            iframeRef.current.src = `https://iframe.videodelivery.net/${cfid}?controls=false`;
            playerRef.current = window.Stream(iframeRef.current);
            console.log('✅ Player initialized after SDK load');
            setPlayerReady(true);
          } catch (err) {
            console.error('Error initializing player after SDK load:', err);
          }
        };
        script.onerror = () => {
          console.error('Failed to load Stream SDK');
        };
        document.body.appendChild(script);
      }
    };

    initPlayer();
  }, [cfid]);

  // Update controls when host status changes
  useEffect(() => {
    if (!iframeRef.current || !playerReady) return;

    const controls = isHost ? 'true' : 'false';
    iframeRef.current.src = `https://iframe.videodelivery.net/${cfid}?controls=${controls}`;
    console.log(`🎮 Controls updated for ${isHost ? 'host' : 'guest'}: ${controls}`);
  }, [isHost, playerReady, cfid]);

  // Attach player event listeners (only for host)
  useEffect(() => {
    if (!playerReady || !playerRef.current || !isHost) return;

    console.log('🎬 Attaching player event listeners (host)');

    const handlePlay = () => {
      console.log('▶️ Play event');
      if (!isSyncingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'play' }));
        console.log('📤 Play sent to guests');
      }
    };

    const handlePause = () => {
      console.log('⏸️ Pause event');
      if (!isSyncingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'pause' }));
        console.log('📤 Pause sent to guests');
      }
    };

    const handleSeeked = () => {
      console.log('⏩ Seek event');
      if (!isSyncingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'seek',
            currentTime: playerRef.current.currentTime,
          })
        );
        console.log('📤 Seek sent to guests');
      }
    };

    playerRef.current.addEventListener('play', handlePlay);
    playerRef.current.addEventListener('pause', handlePause);
    playerRef.current.addEventListener('seeked', handleSeeked);

    return () => {
      playerRef.current?.removeEventListener('play', handlePlay);
      playerRef.current?.removeEventListener('pause', handlePause);
      playerRef.current?.removeEventListener('seeked', handleSeeked);
    };
  }, [playerReady, isHost]);

  // WebSocket connection
  useEffect(() => {
    if (!partyId || !cfid || !userId || !playerReady) return;

    const wsProtocol = process.env.NEXT_PUBLIC_WS_PROTOCOL;
    const wsHost = process.env.NEXT_PUBLIC_WS_HOST;
    const wsUrl = `${wsProtocol}://${wsHost}/ws/watchparty?partyId=${partyId}&cfid=${cfid}&userId=${userId}`;

    console.log('🔌 Connecting to:', wsUrl);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('✅ WebSocket connected');
      setConnectionStatus('connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📩 WS Message:', data);

      if (data.type === 'sync') {
        // User just joined
        const userIsHost = data.hostId === userId;
        setIsHost(userIsHost);
        console.log('🎥 Host?', userIsHost);

        // Apply initial state
        isSyncingRef.current = true;
        setTimeout(() => {
          if (playerRef.current && data.state) {
            try {
              playerRef.current.currentTime = data.state.currentTime || 0;
              if (data.state.isPlaying) {
                const playResult = playerRef.current.play();
                if (playResult && typeof playResult.catch === 'function') {
                  playResult.catch(() => {});
                }
              } else {
                const pauseResult = playerRef.current.pause();
                if (pauseResult && typeof pauseResult.catch === 'function') {
                  pauseResult.catch(() => {});
                }
              }
            } catch (err) {
              console.error('Error applying sync:', err);
            }
          }
          isSyncingRef.current = false;
        }, 300);
      }

      if (data.type === 'play') {
        console.log('▶️ Received play command');
        isSyncingRef.current = true;
        if (playerRef.current) {
          const playResult = playerRef.current.play();
          if (playResult && typeof playResult.catch === 'function') {
            playResult.catch(() => {});
          }
        }
        isSyncingRef.current = false;
      }

      if (data.type === 'pause') {
        console.log('⏸️ Received pause command');
        isSyncingRef.current = true;
        if (playerRef.current) {
          const pauseResult = playerRef.current.pause();
          if (pauseResult && typeof pauseResult.catch === 'function') {
            pauseResult.catch(() => {});
          }
        }
        isSyncingRef.current = false;
      }

      if (data.type === 'seek') {
        console.log('⏩ Received seek command');
        isSyncingRef.current = true;
        if (playerRef.current) {
          playerRef.current.currentTime = data.currentTime;
        }
        isSyncingRef.current = false;
      }

      if (data.type === 'attendeeCount') {
        setAttendeeCount(data.count);
      }
    };

    wsRef.current.onerror = () => {
      console.error('❌ WebSocket error');
      setConnectionStatus('error');
    };

    wsRef.current.onclose = () => {
      console.log('🔌 WebSocket closed');
      setConnectionStatus('disconnected');
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [partyId, cfid, userId, playerReady]);

  const handleShareParty = () => {
    const shareUrl = `${window.location.origin}/watchparty/play?partyId=${partyId}&cfid=${cfid}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Watch party link copied!');
  };

  if (!isHydrated) {
    return null; // Wait for hydration before rendering
  }

  if (!partyId || !cfid || !userId) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <h2 className="text-2xl font-bold">❌ Error</h2>
        <p className="text-gray-400">Missing watch party parameters</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black flex overflow-hidden font-sans text-white">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 z-20 cursor-pointer transition text-white hover:opacity-70"
      >
        ← Back
      </button>

      {/* Connection Status */}
      <div
        className="absolute top-6 right-6 z-20 flex items-center gap-2 px-3 py-2 rounded-full"
        style={{
          backgroundColor:
            connectionStatus === 'connected' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
        }}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: connectionStatus === 'connected' ? '#22c55e' : '#ef4444',
            animation: connectionStatus === 'connected' ? 'pulse 2s infinite' : 'none',
          }}
        />
        <span className="text-xs font-medium">
          {connectionStatus === 'connected' ? 'Live' : 'Connecting...'}
        </span>
      </div>

      <div className="relative flex-1 flex flex-col justify-between p-6">
        {/* Title */}
        <div className="flex justify-between items-start z-10">
          <div className="invisible" />
          <h2 className="text-sm font-medium opacity-80 uppercase tracking-widest text-center max-w-xs">
            Watch Party
            {isHost && <span className="ml-2 text-red-500 text-xs">👑 HOST</span>}
          </h2>
          <button
            onClick={() => setActivePanel(null)}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Player Container */}
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <iframe
            ref={iframeRef}
            id="cf-player"
            allowFullScreen
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            className="absolute inset-0 w-full h-full"
          />
        </div>

        {/* Bottom Controls */}
        <div className="z-10 flex flex-col gap-6">
          {/* Guest Notice */}
          {!isHost && (
            <div className="px-3 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-xs text-blue-200">
              👑 Only host controls the video
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <div className="flex-1 flex flex-col items-end gap-5">
              <button
                onClick={handleShareParty}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title="Share watch party"
              >
                <MdShare size={22} />
              </button>

              <button
                onClick={() => setActivePanel(activePanel === 'attendees' ? null : 'attendees')}
                className="relative p-2 hover:bg-white/10 rounded-lg transition"
                title="View attendees"
              >
                <MdPerson size={22} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {attendeeCount}
                </span>
              </button>

              <button
                onClick={() => setActivePanel(activePanel === 'comments' ? null : 'comments')}
                className="relative p-2 hover:bg-white/10 rounded-lg transition"
                title="View comments"
              >
                <MdMessage size={22} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  0
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Side Panels */}
        {activePanel && (
          <div className="w-80 h-full bg-black border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300">
            {activePanel === 'comments' ? <CommentsPanel /> : <AttendeesPanel />}
          </div>
        )}

        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default function WatchPartyPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <WatchPartyPlayer />
    </Suspense>
  );
}
