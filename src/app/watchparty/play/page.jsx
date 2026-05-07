'use client'

export const dynamic = 'force-dynamic';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MdClose, MdShare, MdPerson, MdMessage } from 'react-icons/md';
import AttendeesPanel from '@/components/AttendesPanel';
import CommentsPanel from '@/components/CommentsPanel';

const createMessageId = (message = {}) => {
  return (
    message.id ||
    message._id ||
    message.clientId ||
    `${message.userId || 'guest'}-${message.createdAt || Date.now()}-${message.text || ''}`
  )
}

const normalizeChatMessage = (payload, options = {}) => {
  if (!payload) {
    return null
  }

  const currentUserId = options.currentUserId || ''
  const currentUserName = options.currentUserName || 'Guest'

  const text = payload.text || payload.message || payload.body || payload.content || ''

  if (!String(text).trim()) {
    return null
  }

  const resolvedUserId =
    payload.userId || payload.senderId || payload.user?._id || payload.user?.id || ''

  const resolvedUserName =
    payload.userName ||
    payload.senderName ||
    payload.name ||
    payload.user?.name ||
    payload.user?.fullName ||
    (resolvedUserId && currentUserId && resolvedUserId === currentUserId ? currentUserName : '') ||
    'Guest'

  return {
    id: createMessageId(payload),
    text: String(text).trim(),
    userId: resolvedUserId,
    userName: resolvedUserName,
    createdAt: payload.createdAt || payload.timestamp || new Date().toISOString(),
    clientId: payload.clientId || ''
  }
}

const mergeMessages = (currentMessages, incomingMessages) => {
  const map = new Map(currentMessages.map((message) => [message.id, message]))

  incomingMessages.forEach((message) => {
    if (message?.id) {
      map.set(message.id, message)
    }
  })

  return Array.from(map.values()).sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  )
}

const WatchPartyPlayer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const partyId = searchParams.get('partyId');
  const cfid = searchParams.get('cfid');
  const userIdParam = searchParams.get('userId');

  const [isHost, setIsHost] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [activePanel, setActivePanel] = useState(null);
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [playerReady, setPlayerReady] = useState(false);
  const [userId, setUserId] = useState(userIdParam || null);
  const [userName, setUserName] = useState('Guest');
  const [isHydrated, setIsHydrated] = useState(false);
  const [audioActivationRequired, setAudioActivationRequired] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');

  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const wsRef = useRef(null);
  const isSyncingRef = useRef(false);
  const isHostRef = useRef(false);

  useEffect(() => {
    if (isHydrated) {
      startLocalVideo()
    }

    return () => {
      if (localStreamRef.current) {
        localStream.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [isHydrated])

  // To store the video streams for the UI
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});

  // To store the technical WebRTC objects
  const peersRef = useRef({});
  const localStreamRef = useRef(null);

  // Function to initialize the camera
  const startLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('Error accessing media devices.', err);
    }
  }

  // Peer conection login
  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    // Add the local video/audio to this connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      })
    }

    // Handle incoming video from the other person
    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [targetUserId]: event.streams[0]
      }))
    }

    // Handle finding a network path (ICE candidates)
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          candidate: event.candidate,
          targetUserId //The person we are sending this to
        }))
      }
    }

    // Store it in our registry
    peersRef.current[targetUserId] = pc;
    return pc;
  }

  useEffect(() => {
    if (!userId) {
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      setUserId(user?._id || null);
      setUserName(user?.name || user?.fullName || 'Guest');
    } else {
      const userString = localStorage.getItem('user');
      const user = userString ? JSON.parse(userString) : null;
      setUserName(user?.name || user?.fullName || 'Guest');
    }
    setIsHydrated(true);
  }, []);

  const setPlayerControls = (hostControlsEnabled) => {
    if (!playerRef.current) return;

    try {
      playerRef.current.controls = hostControlsEnabled;
      console.log(`Controls updated for ${hostControlsEnabled ? 'host' : 'guest'}:`, hostControlsEnabled);
    } catch (err) {
      console.error('Failed to update player controls:', err);
    }
  };

  const setPlayerMuted = (muted) => {
    if (!playerRef.current) return;

    try {
      playerRef.current.muted = muted;
      console.log('Player muted:', muted);
    } catch (err) {
      console.warn('Unable to update mute state:', err);
    }
  };

  const runRemoteAction = async (action, payload = {}) => {
    if (!playerRef.current) {
      console.warn(`Skipping ${action}: player not initialized`);
      return;
    }

    isSyncingRef.current = true;

    try {
      if (action === 'seek') {
        playerRef.current.currentTime = payload.currentTime || 0;
        console.log('Remote seek applied:', payload.currentTime || 0);
        return;
      }

      if (action === 'pause') {
        const pauseResult = playerRef.current.pause();
        if (pauseResult && typeof pauseResult.then === 'function') {
          await pauseResult;
        }
        console.log('Remote pause applied');
        return;
      }

      if (action === 'play') {
        try {
          const playResult = playerRef.current.play();
          if (playResult && typeof playResult.then === 'function') {
            await playResult;
          }
          setAudioActivationRequired(false);
        } catch (err) {
          if (isHostRef.current) {
            throw err;
          }

          console.warn('Guest autoplay with audio was blocked, retrying muted playback.');
          setPlayerMuted(true);

          const mutedPlayResult = playerRef.current.play();
          if (mutedPlayResult && typeof mutedPlayResult.then === 'function') {
            await mutedPlayResult;
          }

          setAudioActivationRequired(true);
        }
        console.log('Remote play applied');
      }
    } finally {
      isSyncingRef.current = false;
    }
  };

  useEffect(() => {
    if (!cfid) return;

    let retryTimeout;
    let sdkScript;

    const initializePlayer = () => {
      if (!iframeRef.current) {
        console.warn('Iframe ref not yet available, retrying...');
        retryTimeout = window.setTimeout(initializePlayer, 100);
        return;
      }

      try {
        iframeRef.current.src = `https://iframe.videodelivery.net/${cfid}?controls=false`;
        playerRef.current = window.Stream(iframeRef.current);
        setPlayerControls(false);
        setPlayerMuted(false);
        setPlayerReady(true);
        console.log('Player initialized');
      } catch (err) {
        console.error('Error initializing player:', err);
      }
    };

    if (window.Stream) {
      initializePlayer();
    } else {
      sdkScript = document.createElement('script');
      sdkScript.src = 'https://embed.videodelivery.net/embed/sdk.latest.js';
      sdkScript.async = true;
      sdkScript.onload = initializePlayer;
      sdkScript.onerror = () => {
        console.error('Failed to load Stream SDK');
        setConnectionStatus('error');
      };
      document.body.appendChild(sdkScript);
    }

    return () => {
      if (retryTimeout) {
        window.clearTimeout(retryTimeout);
      }

      if (sdkScript && document.body.contains(sdkScript)) {
        document.body.removeChild(sdkScript);
      }
    };
  }, [cfid]);

  useEffect(() => {
    if (!playerReady || !playerRef.current || !isHost) return;

    console.log('Attaching player event listeners for host');

    const handlePlay = () => {
      if (!isSyncingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'play' }));
        console.log('Play sent to guests');
      }
    };

    const handlePause = () => {
      if (!isSyncingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'pause' }));
        console.log('Pause sent to guests');
      }
    };

    const handleSeeked = () => {
      if (!isSyncingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'seek',
            currentTime: playerRef.current.currentTime,
          })
        );
        console.log('Seek sent to guests');
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

  useEffect(() => {
    if (!partyId || !cfid || !userId || !playerReady) return;

    const wsProtocol = process.env.NEXT_PUBLIC_WS_PROTOCOL;
    const wsHost = process.env.NEXT_PUBLIC_WS_HOST;
    const wsUrl = `${wsProtocol}://${wsHost}/ws/watchparty?partyId=${partyId}&cfid=${cfid}&userId=${userId}`;

    console.log('Connecting to:', wsUrl);
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
    };

    wsRef.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      console.log('WS Message:', data);

      if (data.type === 'sync') {
        const userIsHost = data.hostId === userId;
        isHostRef.current = userIsHost;
        setIsHost(userIsHost);
        setPlayerControls(userIsHost);
        setPlayerMuted(false);
        console.log('Host?', userIsHost);

        window.setTimeout(() => {
          if (!playerRef.current || !data.state) return;

          runRemoteAction('seek', { currentTime: data.state.currentTime || 0 })
            .then(() => (data.state.isPlaying ? runRemoteAction('play') : runRemoteAction('pause')))
            .catch((err) => {
              console.error('Error applying sync:', err?.name || err, err?.message || '');
            });
        }, 300);
      }

      if (data.type === 'play') {
        console.log('Received play command');
        runRemoteAction('play').catch((err) => {
          console.error('Guest failed to apply remote play:', err?.name || err, err?.message || '');
        });
      }

      if (data.type === 'pause') {
        console.log('Received pause command');
        runRemoteAction('pause').catch((err) => {
          console.error('Guest failed to apply remote pause:', err?.name || err, err?.message || '');
        });
      }

      if (data.type === 'seek') {
        console.log('Received seek command');
        runRemoteAction('seek', { currentTime: data.currentTime }).catch((err) => {
          console.error('Guest failed to apply remote seek:', err?.name || err, err?.message || '');
        });
      }

      if (data.type === 'attendeeCount') {
        setAttendeeCount(data.count);
      }

      if (data.type === 'chat' || data.type === 'message' || data.type === 'comment') {
        const nextMessage = normalizeChatMessage(data, {
          currentUserId: userId,
          currentUserName: userName
        });

        if (nextMessage) {
          setMessages((currentMessages) => mergeMessages(currentMessages, [nextMessage]));
        }
      }

      if (data.type === 'chatHistory' || data.type === 'messages' || data.type === 'comments') {
        const payloadMessages = Array.isArray(data.messages)
          ? data.messages
          : Array.isArray(data.comments)
            ? data.comments
            : Array.isArray(data.data)
              ? data.data
              : [];

        const normalizedMessages = payloadMessages
          .map((message) =>
            normalizeChatMessage(message, {
              currentUserId: userId,
              currentUserName: userName
            })
          )
          .filter(Boolean);

        if (normalizedMessages.length > 0) {
          setMessages((currentMessages) => mergeMessages(currentMessages, normalizedMessages));
        }
      }

      // Inside your websocket onmessage handler:
      if (data.type === 'offer') {
        const pc = createPeerConnection(data.senderId);

        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        wsRef.current.send(JSON.stringify({
          type: 'answer',
          answer: answer,
          targetUserId: data.senderId
        }));
      }

      if (data.type === 'answer') {
        const pc = peersRef.current[data.senderId];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
      }

      if (data.type === 'ice-candidate') {
        const pc = peersRef.current[data.senderId];
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      }
    };

    wsRef.current.onerror = () => {
      console.error('WebSocket error');
      setConnectionStatus('error');
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket closed');
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

  const handleEnableAudio = async () => {
    if (!playerRef.current) return;

    try {
      setPlayerMuted(false);
      const playResult = playerRef.current.play();
      if (playResult && typeof playResult.then === 'function') {
        await playResult;
      }
      setAudioActivationRequired(false);
    } catch (err) {
      console.error('Failed to enable guest audio:', err?.name || err, err?.message || '');
    }
  };

  const handleSendMessage = (event) => {
    event.preventDefault()

    const text = messageDraft.trim()

    if (!text || wsRef.current?.readyState !== WebSocket.OPEN) {
      return
    }

    const outgoingMessage = {
      type: 'chat',
      clientId: `${userId || 'guest'}-${Date.now()}`,
      partyId,
      userId,
      userName,
      text,
      message: text,
      createdAt: new Date().toISOString()
    }

    wsRef.current.send(JSON.stringify(outgoingMessage))
    setMessageDraft('')
  }

  if (!isHydrated) {
    return null;
  }

  if (!partyId || !cfid || !userId) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <h2 className="text-2xl font-bold">Error</h2>
        <p className="text-gray-400">Missing watch party parameters</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black flex overflow-hidden font-sans text-white">
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 z-20 cursor-pointer transition text-white hover:opacity-70"
      >
        Back
      </button>

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

        {/* Local Video Preview */}
        {
          localStream && (
            <video
              autoPlay
              muted
              ref={(el) => { if (el) el.srcObject = localStream }}
              className="w-32 h-24 rounded-lg border-2 border-blue-500"
            />
          )
        }

        {/* Remote Videos */}
        {
          Object.entries(remoteStreams).map(([userId, stream]) => (
            <video
              key={userId}
              autoPlay
              ref={(el) => { if (el) el.srcObject = stream }}
              className="w-32 h-24 rounded-lg border-2 border-white/20"
            />
          ))
        }
      </div>

      <div className="relative flex-1 flex flex-col justify-between p-6">
        <div className="flex justify-between items-start z-10">
          <div className="invisible" />
          <h2 className="text-sm font-medium opacity-80 uppercase tracking-widest text-center max-w-xs">
            Watch Party
            {isHost && <span className="ml-2 text-red-500 text-xs">HOST</span>}
          </h2>
          <button
            onClick={() => setActivePanel(null)}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
          >
            <MdClose size={20} />
          </button>
        </div>

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

        {audioActivationRequired && !isHost && (
          <div className="absolute inset-x-6 bottom-28 z-20">
            <button
              onClick={handleEnableAudio}
              className="w-full rounded-xl border border-white/20 bg-black/75 px-4 py-3 text-sm text-white backdrop-blur-sm transition hover:bg-black/85"
            >
              Tap to enable watch party audio
            </button>
          </div>
        )}

        <div className="z-10 flex flex-col gap-6">
          {!isHost && (
            <div className="px-3 py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg text-xs text-blue-200">
              Only host controls the video
            </div>
          )}

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
                  {messages.length}
                </span>
              </button>
            </div>
          </div>
        </div>

        {activePanel && (
          <div className="absolute inset-y-0 right-0 z-30 w-full max-w-sm border-l border-white/10 bg-black/95 shadow-2xl backdrop-blur-md animate-in slide-in-from-right duration-300 pointer-events-auto">
            {activePanel === 'comments' ? (
              <CommentsPanel
                messages={messages}
                draft={messageDraft}
                onDraftChange={setMessageDraft}
                onSend={handleSendMessage}
                currentUserId={userId}
                connectionStatus={connectionStatus}
                onClose={() => setActivePanel(null)}
              />
            ) : (
              <AttendeesPanel />
            )}
          </div>
        )}

        <style jsx>{`
          @keyframes pulse {
            0%,
            100% {
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
