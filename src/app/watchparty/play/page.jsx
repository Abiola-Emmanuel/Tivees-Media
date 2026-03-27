'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MdClose, MdPlayArrow, MdPause, MdShare, MdPerson, MdMessage } from 'react-icons/md';
import AttendeesPanel from '@/components/AttendesPanel';
import CommentsPanel from '@/components/CommentsPanel';

const WatchPartyPlayer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Parameters
  const partyId = searchParams.get('partyId');
  const cfid = searchParams.get('cfid');
  let userId = searchParams.get('userId');


  if (!userId) {
    const userString = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const user = userString ? JSON.parse(userString) : null;
    userId = user?._id;
  }

  // Player & WebSocket refs
  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const wsRef = useRef(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [playerReady, setPlayerReady] = useState(false);
  const [wsAttempts, setWsAttempts] = useState(0);

  // Validate required parameters
  useEffect(() => {
    if (!partyId || !cfid || !userId) {
      console.warn('Missing watch party parameters:', { partyId, cfid, userId });
      setConnectionStatus('error');
    }
  }, [partyId, cfid, userId]);

  // Initialize Cloudflare Stream SDK and player
  useEffect(() => {
    if (!cfid || !iframeRef.current) return;

    const initializePlayer = () => {
      if (window.Stream) {
        const streamElement = iframeRef.current;

        // Set the full URL for the iframe with controls disabled
        streamElement.src = `https://iframe.videodelivery.net/${cfid}?controls=false`;

        // Initialize the Stream player
        playerRef.current = window.Stream(streamElement);

        // Disable native controls and allow only custom controls
        playerRef.current.controls = false;

        setPlayerReady(true);
        console.log('✅ Player initialized with controls disabled');
      }
    };

    // Check if Stream SDK is already loaded
    if (window.Stream) {
      initializePlayer();
    } else {
      // Load the SDK script
      const script = document.createElement('script');
      script.src = 'https://embed.videodelivery.net/embed/sdk.latest.js';
      script.async = true;

      script.onload = () => {
        initializePlayer();
      };

      script.onerror = () => {
        console.error('Failed to load Cloudflare Stream SDK');
        setConnectionStatus('error');
      };

      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, [cfid]);

  // Attach player event listeners
  const attachPlayerEvents = useCallback(() => {
    if (!playerRef.current || !playerReady) return;

    // Play event
    playerRef.current.addEventListener('play', () => {
      if (!isSyncing && isHost && wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('🎬 Host sending play event');
        wsRef.current.send(JSON.stringify({ type: 'play' }));
      }
      setIsPlaying(true);
    });

    // Pause event
    playerRef.current.addEventListener('pause', () => {
      if (!isSyncing && isHost && wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('⏸️ Host sending pause event');
        wsRef.current.send(JSON.stringify({ type: 'pause' }));
      }
      setIsPlaying(false);
    });

    // Seek event
    playerRef.current.addEventListener('seeked', () => {
      if (!isSyncing && isHost && wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('⏩ Host sending seek event');
        wsRef.current.send(
          JSON.stringify({
            type: 'seek',
            currentTime: playerRef.current.currentTime,
          })
        );
      }
    });
  }, [playerReady, isSyncing, isHost]);

  useEffect(() => {
    if (!partyId || !cfid || !userId) return;

    // Don't attempt reconnection if already failed
    if (wsAttempts > 0) {
      return;
    }

    const wsProtocol = process.env.NEXT_PUBLIC_WS_PROTOCOL;
    const wsHost = process.env.NEXT_PUBLIC_WS_HOST;
    const wsUrl = `${wsProtocol}://${wsHost}/ws/watchparty?partyId=${partyId}&cfid=${cfid}&userId=${userId}`;

    console.log('🔌 WS Config:', { wsProtocol, wsHost });
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    console.log('🔌 Parameters:', { partyId, cfid, userId });
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('✅ Connected to WebSocket');
      setConnectionStatus('connected');
      attachPlayerEvents();
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📩 WS Message:', data);

      if (!playerRef.current) return;

      if (data.type === 'sync') {
        // Initial sync when joining party
        const isUserHost = data.hostId === userId;
        setIsHost(isUserHost);
        console.log('🎥 Host?', isUserHost);

        setIsSyncing(true);
        setTimeout(() => {
          try {
            playerRef.current.currentTime = data.state.currentTime;

            if (data.state.isPlaying) {
              playerRef.current.play().catch(err => {
                console.error('Error playing during sync:', err);
              });
              setIsPlaying(true);
            } else {
              playerRef.current.pause().catch(err => {
                console.error('Error pausing during sync:', err);
              });
              setIsPlaying(false);
            }
          } catch (err) {
            console.error('Error applying sync:', err);
          }
          setIsSyncing(false);
        }, 500);
      }

      if (data.type === 'play') {
        // Host started playing
        console.log('▶️ Guest received play command');
        setIsSyncing(true);
        playerRef.current.play()
          .then(() => {
            console.log('✅ Guest video played successfully');
            setIsPlaying(true);
          })
          .catch(err => {
            console.error('❌ Error playing on guest:', err);
          })
          .finally(() => {
            setIsSyncing(false);
          });
      }

      if (data.type === 'pause') {
        // Host paused
        console.log('⏸️ Guest received pause command');
        setIsSyncing(true);
        playerRef.current.pause()
          .then(() => {
            console.log('✅ Guest video paused successfully');
            setIsPlaying(false);
          })
          .catch(err => {
            console.error('❌ Error pausing on guest:', err);
          })
          .finally(() => {
            setIsSyncing(false);
          });
      }

      if (data.type === 'seek') {
        // Host seeked
        setIsSyncing(true);
        try {
          playerRef.current.currentTime = data.currentTime;
          console.log('⏩ Guest seeked to:', data.currentTime);
        } catch (err) {
          console.error('Error seeking:', err);
        }
        setIsSyncing(false);
      }

      if (data.type === 'attendeeCount') {
        setAttendeeCount(data.count);
      }
    };

    wsRef.current.onerror = (error) => {
      setWsAttempts(prev => prev + 1);
      // Only log once to avoid console spam
      if (wsAttempts === 0) {
        console.warn('⚠️ WebSocket connection failed. Video will play without real-time sync.');
        console.log('Backend may be offline at:', `${wsProtocol}://${wsHost}/ws/watchparty`);
      }
      setConnectionStatus('error');
    };

    wsRef.current.onclose = () => {
      console.log('🔌 WebSocket closed');
      setConnectionStatus('disconnected');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [partyId, cfid, userId, wsAttempts]);

  // Manual controls (for host only)
  const manualPlay = () => {
    if (!isHost) {
      console.warn('⚠️ Only the host can control playback');
      return;
    }
    if (playerRef.current) {
      playerRef.current.play();
      console.log('▶️ Manual play');
      // Send sync message to all other users
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'play' }));
        console.log('📤 Play event sent via WebSocket');
      }
    }
  };

  const manualPause = () => {
    if (!isHost) {
      console.warn('⚠️ Only the host can control playback');
      return;
    }
    if (playerRef.current) {
      playerRef.current.pause();
      console.log('⏸️ Manual pause');
      // Send sync message to all other users
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'pause' }));
        console.log('📤 Pause event sent via WebSocket');
      }
    }
  };

  const handleShareParty = () => {
    const shareUrl = `${window.location.origin}/watchparty/play?partyId=${partyId}&cfid=${cfid}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Watch party link copied to clipboard!');
  };

  if (connectionStatus === 'error') {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <h2 className="text-2xl font-bold">❌ Error</h2>
        <p className="text-gray-400">Missing watch party parameters or failed to load player</p>
        <button
          onClick={() => router.back()}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
        >
          Go Back
        </button>
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

      {/* Connection Status Indicator */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2 px-3 py-2 rounded-full"
        style={{
          backgroundColor: connectionStatus === 'connected' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
        }}>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: connectionStatus === 'connected' ? '#22c55e' : '#ef4444',
            animation: connectionStatus === 'connected' ? 'pulse 2s infinite' : 'none'
          }}
        />
        <span className="text-xs font-medium">
          {connectionStatus === 'connected' ? 'Live' : 'Connecting...'}
        </span>
      </div>

      <div className="relative flex-1 flex flex-col justify-between p-6">
        {/* Title Bar */}
        <div className="flex justify-between items-start z-10">
          <div className="invisible" />
          <h2 className="text-sm font-medium opacity-80 uppercase tracking-widest text-center max-w-xs">
            Watch Party
            {isHost && <span className="ml-2 text-[#e50000] text-xs">👑 HOST</span>}
          </h2>
          <button
            onClick={() => setActivePanel(null)}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition">
            <MdClose size={20} />
          </button>
        </div>

        {/* Video Player Container */}
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

        {/* Controls */}
        <div className="z-10 flex flex-col gap-6">
          {/* Manual Controls (Host Only) */}
          {!isHost && (
            <div className="px-3 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-xs text-blue-200">
              👑 Only the host can control playback
            </div>
          )}
          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={manualPlay}
              disabled={!isHost}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${isHost
                ? 'bg-white/10 hover:bg-white/20 cursor-pointer'
                : 'bg-white/5 cursor-not-allowed opacity-50'
                }`}
              title={isHost ? 'Play' : 'Only host can play'}
            >
              <MdPlayArrow size={18} /> Play
            </button>
            <button
              onClick={manualPause}
              disabled={!isHost}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${isHost
                ? 'bg-white/10 hover:bg-white/20 cursor-pointer'
                : 'bg-white/5 cursor-not-allowed opacity-50'
                }`}
              title={isHost ? 'Pause' : 'Only host can pause'}
            >
              <MdPause size={18} /> Pause
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <div className="flex-1 flex flex-col items-end gap-5">
              <button
                onClick={handleShareParty}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title="Share watch party link"
              >
                <MdShare size={22} />
              </button>

              <button
                onClick={() => setActivePanel(activePanel === 'attendees' ? null : 'attendees')}
                className="relative group p-2 hover:bg-white/10 rounded-lg transition"
                title="View attendees"
              >
                <MdPerson size={22} />
                <span className="absolute -top-1 -right-1 bg-[#e50000] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {attendeeCount}
                </span>
              </button>

              <button
                onClick={() => setActivePanel(activePanel === 'comments' ? null : 'comments')}
                className="relative group p-2 hover:bg-white/10 rounded-lg transition"
                title="View comments"
              >
                <MdMessage size={22} />
                <span className="absolute -top-1 -right-1 bg-[#e50000] text-[10px] font-bold px-1.5 py-0.5 rounded-full">0</span>
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
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
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
