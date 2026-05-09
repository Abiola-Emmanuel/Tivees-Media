'use client'

export const dynamic = 'force-dynamic';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MdClose, MdShare, MdPerson, MdMessage, MdVideocam, MdVideocamOff } from 'react-icons/md';
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

const getSocketUserId = (payload = {}) => {
  return (
    payload.senderId ||
    payload.fromUserId ||
    payload.from ||
    payload.fromPeerId ||
    payload.peerId ||
    payload.userId ||
    payload.participantId ||
    ''
  )
}

const getSocketTargetUserId = (payload = {}) => {
  return payload.targetUserId || payload.receiverId || payload.toUserId || payload.to || payload.targetPeerId || ''
}

const isMessageForCurrentUser = (payload = {}, currentUserId = '') => {
  const targetUserId = getSocketTargetUserId(payload)
  return !targetUserId || !currentUserId || targetUserId === currentUserId
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
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [cameraError, setCameraError] = useState('');

  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const wsRef = useRef(null);
  const isSyncingRef = useRef(false);
  const isHostRef = useRef(false);
  const hostIdRef = useRef('');

  useEffect(() => {
    if (isHydrated) {
      startLocalVideo()
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [isHydrated])

  // To store the video streams for the UI
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});

  // To store the technical WebRTC objects
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const pendingIceCandidatesRef = useRef({});

  const sendSocketMessage = (message) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('WebRTC/socket message skipped because socket is not open:', message.type);
      return false;
    }

    wsRef.current.send(JSON.stringify({
      partyId,
      userId,
      senderId: userId,
      ...message
    }));
    if (['camera-ready', 'offer', 'answer', 'ice-candidate'].includes(message.type)) {
      console.log('WebRTC/socket message sent:', message.type, {
        targetUserId: message.targetUserId || null,
        userId: message.userId || null
      });
    }
    return true;
  };

  const announceCameraReady = () => {
    sendSocketMessage({
      type: 'camera-ready',
      userId,
      senderId: userId,
      partyId
    });
  };

  // Function to initialize the camera
  const startLocalVideo = async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsCameraEnabled(true);

      Object.values(peersRef.current).forEach((pc) => {
        stream.getTracks().forEach((track) => {
          const alreadyAdded = pc.getSenders().some((sender) => sender.track === track);
          if (!alreadyAdded) {
            pc.addTrack(track, stream);
          }
        });
      });

      announceCameraReady();

      Object.keys(peersRef.current).forEach((targetUserId) => {
        createOfferForPeer(targetUserId).catch((err) => {
          console.error('Failed to renegotiate WebRTC stream:', err?.name || err, err?.message || '');
        });
      });

      if (hostIdRef.current && hostIdRef.current !== userId) {
        createOfferForPeer(hostIdRef.current).catch((err) => {
          console.error('Failed to create WebRTC offer for host:', err?.name || err, err?.message || '');
        });
      }

      return stream;
    } catch (err) {
      console.error('Error accessing media devices.', err);
      setCameraError('Camera unavailable');
      setIsCameraEnabled(false);
    }
  }

  // Peer conection login
  const createPeerConnection = (targetUserId) => {
    if (peersRef.current[targetUserId]) {
      return peersRef.current[targetUserId];
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    console.log('WebRTC peer connection created for', targetUserId);

    // Add the local video/audio to this connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      })
    }

    // Handle incoming video from the other person
    pc.ontrack = (event) => {
      const receivedStream = event.streams[0] || new MediaStream(event.track ? [event.track] : [])
      if (receivedStream && receivedStream.getTracks().length > 0) {
        console.log('Remote stream received for', targetUserId, receivedStream)
        setRemoteStreams(prev => ({
          ...prev,
          [targetUserId]: receivedStream
        }))
      }
    }

    // Handle finding a network path (ICE candidates)
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSocketMessage({
          type: 'ice-candidate',
          candidate: event.candidate,
          targetUserId, //The person we are sending this to
          receiverId: targetUserId,
          toUserId: targetUserId,
          userId,
          senderId: userId
        })
      }
    }

    pc.onconnectionstatechange = () => {
      console.log('WebRTC connection state for', targetUserId, pc.connectionState);

      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        setRemoteStreams(prev => {
          const nextStreams = { ...prev };
          delete nextStreams[targetUserId];
          return nextStreams;
        });
      }
    }

    // Store it in our registry
    peersRef.current[targetUserId] = pc;
    return pc;
  }

  const flushPendingIceCandidates = async (targetUserId) => {
    const pc = peersRef.current[targetUserId];
    const candidates = pendingIceCandidatesRef.current[targetUserId] || [];

    if (!pc || !pc.remoteDescription || candidates.length === 0) {
      return;
    }

    pendingIceCandidatesRef.current[targetUserId] = [];

    for (const candidate of candidates) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }

  const createOfferForPeer = async (targetUserId) => {
    if (!targetUserId || targetUserId === userId || !localStreamRef.current) {
      return;
    }

    const pc = createPeerConnection(targetUserId);
    if (pc.signalingState !== 'stable') {
      console.log('WebRTC offer skipped because peer is not stable:', targetUserId, pc.signalingState);
      return;
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log('WebRTC offer created for', targetUserId);

    sendSocketMessage({
      type: 'offer',
      offer,
      sdp: offer.sdp,
      targetUserId,
      receiverId: targetUserId,
      toUserId: targetUserId,
      userId,
      senderId: userId
    });
  }

  const shouldCreateOfferForPeer = (targetUserId) => {
    if (!targetUserId || !userId || targetUserId === userId) {
      return false;
    }

    return !peersRef.current[targetUserId];
  }

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const userString = localStorage.getItem('user');

    if (!authToken || !userString) {
      setIsAuthenticated(false);
      router.push('/sign-in');
      return;
    }

    setIsAuthenticated(true);

    const user = JSON.parse(userString);

    if (!userId) {
      setUserId(user?._id || null);
      setUserName(user?.name || user?.fullName || 'Guest');
    } else {
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
    let retryCount = 0;
    const maxRetries = 50;
    let sdkScript;
    let cancelled = false;

    const initializePlayer = () => {
      if (cancelled) return;

      if (!iframeRef.current) {
        retryCount++;

        if (retryCount >= maxRetries) {
          console.error('Iframe ref not available after maximum retries');
          setConnectionStatus('error');
          return;
        }

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
      cancelled = true;

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
      if (localStreamRef.current) {
        announceCameraReady();
      }
    };

    wsRef.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      const isWebRtcMessage = ['offer', 'answer', 'ice-candidate', 'camera-ready', 'user-camera-ready'].includes(data.type);

      if (isWebRtcMessage && !isMessageForCurrentUser(data, userId)) {
        console.log('[WebRTC] ignored message for another user:', data.type, {
          targetUserId: getSocketTargetUserId(data),
          currentUserId: userId
        });
        return;
      }

      if (isWebRtcMessage) {
        console.log('[WebRTC]', data.type, 'from:', data.senderId || data.userId || 'UNKNOWN', '-> target:', getSocketTargetUserId(data) || 'broadcast');
      }
      if (data.type === 'sync') {
        const userIsHost = data.hostId === userId;
        hostIdRef.current = data.hostId || '';
        isHostRef.current = userIsHost;
        setIsHost(userIsHost);
        setPlayerControls(userIsHost);
        setPlayerMuted(false);
        console.log('Host?', userIsHost);

        if (!userIsHost && data.hostId && localStreamRef.current) {
          createOfferForPeer(data.hostId).catch((err) => {
            console.error('Failed to create WebRTC offer for host:', err?.name || err, err?.message || '');
          });
        }

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

      if (
        data.type === 'camera-ready' ||
        data.type === 'user-camera-ready' ||
        data.type === 'user-joined' ||
        data.type === 'participant-joined'
      ) {
        const targetUserId = getSocketUserId(data);
        console.log('WebRTC peer discovery message received:', data.type, targetUserId);

        if (shouldCreateOfferForPeer(targetUserId)) {
          createOfferForPeer(targetUserId).catch((err) => {
            console.error('Failed to create WebRTC offer:', err?.name || err, err?.message || '');
          });
        }
      }

      if (data.type === 'participants' || data.type === 'attendees') {
        const participants = Array.isArray(data.participants)
          ? data.participants
          : Array.isArray(data.attendees)
            ? data.attendees
            : Array.isArray(data.users)
              ? data.users
              : [];

        participants.forEach((participant) => {
          const targetUserId =
            typeof participant === 'string'
              ? participant
              : participant.userId || participant._id || participant.id;

          if (shouldCreateOfferForPeer(targetUserId)) {
            createOfferForPeer(targetUserId).catch((err) => {
              console.error('Failed to create WebRTC offer:', err?.name || err, err?.message || '');
            });
          }
        });
      }

      if (data.type === 'camera-off' || data.type === 'user-left' || data.type === 'participant-left') {
        const targetUserId = getSocketUserId(data);

        if (targetUserId) {
          peersRef.current[targetUserId]?.close();
          delete peersRef.current[targetUserId];

          setRemoteStreams(prev => {
            const nextStreams = { ...prev };
            delete nextStreams[targetUserId];
            return nextStreams;
          });
        }
      }

      // Inside your websocket onmessage handler:
      if (data.type === 'offer') {
        const senderId = getSocketUserId(data);
        if (!senderId || senderId === userId) return;

        console.log('WebRTC offer received from', senderId);

        const remoteOffer = data.offer || (data.sdp ? { type: 'offer', sdp: data.sdp } : null);
        if (!remoteOffer) {
          console.warn('WebRTC offer ignored because SDP is missing:', data);
          return;
        }

        let pc = createPeerConnection(senderId);

        if (pc.signalingState !== 'stable') {
          const shouldKeepLocalOffer = String(userId) > String(senderId);

          if (shouldKeepLocalOffer) {
            return;
          }

          pc.close();
          delete peersRef.current[senderId];
          pc = createPeerConnection(senderId);
        }

        await pc.setRemoteDescription(new RTCSessionDescription(remoteOffer));
        await flushPendingIceCandidates(senderId);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('WebRTC answer created for', senderId);

        sendSocketMessage({
          type: 'answer',
          answer: answer,
          sdp: answer.sdp,
          targetUserId: senderId,
          receiverId: senderId,
          toUserId: senderId,
          userId,
          senderId: userId
        });
      }

      if (data.type === 'answer') {
        const senderId = getSocketUserId(data);
        const pc = peersRef.current[senderId];
        if (pc) {
          const remoteAnswer = data.answer || (data.sdp ? { type: 'answer', sdp: data.sdp } : null);
          if (!remoteAnswer) {
            console.warn('WebRTC answer ignored because SDP is missing:', data);
            return;
          }

          console.log('WebRTC answer received from', senderId);
          await pc.setRemoteDescription(new RTCSessionDescription(remoteAnswer));
          await flushPendingIceCandidates(senderId);
        }
      }

      if (data.type === 'ice-candidate') {
        const senderId = getSocketUserId(data);
        const pc = peersRef.current[senderId];
        if (pc?.remoteDescription) {
          console.log('WebRTC ICE candidate received from', senderId);
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else if (senderId) {
          pendingIceCandidatesRef.current[senderId] = [
            ...(pendingIceCandidatesRef.current[senderId] || []),
            data.candidate
          ];
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
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      pendingIceCandidatesRef.current = {};
      setRemoteStreams({});
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

  const handleToggleCamera = async () => {
    if (!localStreamRef.current) {
      await startLocalVideo();
      return;
    }

    const nextEnabled = !isCameraEnabled;

    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = nextEnabled;
    });

    setIsCameraEnabled(nextEnabled);

    if (nextEnabled) {
      announceCameraReady();
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

  if (isAuthenticated === false) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <h2 className="text-2xl font-bold">Redirecting</h2>
        <p className="text-gray-400">You need to sign in to join the watch party</p>
      </div>
    );
  }

  if (!partyId || !cfid || !userId) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <h2 className="text-2xl font-bold">Error</h2>
        <p className="text-gray-400">Missing watch party parameters</p>
      </div>
    );
  }

  const cameraCount = (localStream ? 1 : 0) + Object.keys(remoteStreams).length;

  const renderCameraTiles = () => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {localStream ? (
        <div className="relative aspect-video overflow-hidden rounded-lg border-2 border-blue-500 bg-black">
          <video
            autoPlay
            muted
            playsInline
            ref={(el) => { if (el) el.srcObject = localStream }}
            className={`h-full w-full bg-black object-cover transition ${isCameraEnabled ? 'opacity-100' : 'opacity-45 grayscale'}`}
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1 text-[10px] text-white">
            You
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleToggleCamera}
          className="flex aspect-video items-center justify-center rounded-lg border border-white/15 bg-white/10 text-xs text-white transition hover:bg-white/15"
        >
          Start camera
        </button>
      )}

      {Object.entries(remoteStreams).map(([userId, stream]) => (
        <div key={userId} className="relative aspect-video overflow-hidden rounded-lg border-2 border-white/20 bg-black">
          <video
            autoPlay
            playsInline
            ref={(el) => { if (el) el.srcObject = stream }}
            className="h-full w-full bg-black object-cover"
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1 text-[10px] text-white">
            {userId.slice(0, 8)}
          </span>
        </div>
      ))}
    </div>
  );

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
      </div>

      <div className="absolute right-6 top-20 z-20 flex max-w-[calc(100vw-3rem)] flex-col items-end gap-3">
        <div className="flex items-center gap-2">
          {cameraError ? (
            <span className="rounded-full bg-red-500/20 px-3 py-2 text-xs text-red-100">
              {cameraError}
            </span>
          ) : null}

          <button
            type="button"
            onClick={handleToggleCamera}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/20"
            title={isCameraEnabled ? 'Turn camera off' : 'Turn camera on'}
            aria-label={isCameraEnabled ? 'Turn camera off' : 'Turn camera on'}
          >
            {isCameraEnabled ? <MdVideocam size={22} /> : <MdVideocamOff size={22} />}
          </button>
        </div>
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

              {/* Add attendee count later */}

              {/* <button
                onClick={() => setActivePanel(activePanel === 'attendees' ? null : 'attendees')}
                className="relative p-2 hover:bg-white/10 rounded-lg transition"
                title="View attendees"
              >
                <MdPerson size={22} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {attendeeCount}
                </span>
              </button> */}

              <button
                onClick={() => setActivePanel(activePanel === 'cameras' ? null : 'cameras')}
                className="relative p-2 hover:bg-white/10 rounded-lg transition"
                title="View cameras"
              >
                <MdVideocam size={22} />
                <span className="absolute -top-1 -right-1 bg-blue-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cameraCount}
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
            ) : activePanel === 'cameras' ? (
              <div className="flex h-full flex-col p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Faces in this room</p>
                    <h3 className="mt-1 text-lg font-semibold text-white">{cameraCount} camera{cameraCount === 1 ? '' : 's'}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePanel(null)}
                    className="rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                    aria-label="Close cameras"
                  >
                    <MdClose size={18} />
                  </button>
                </div>

                <div className="mb-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleCamera}
                    className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/15"
                  >
                    {isCameraEnabled ? <MdVideocamOff size={18} /> : <MdVideocam size={18} />}
                    {isCameraEnabled ? 'Stop camera' : 'Start camera'}
                  </button>
                  {cameraError ? (
                    <span className="text-xs text-red-200">{cameraError}</span>
                  ) : null}
                </div>

                <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs text-white/65">
                  <div className="flex justify-between gap-3">
                    <span>Socket</span>
                    <span className={connectionStatus === 'connected' ? 'text-green-300' : 'text-red-200'}>
                      {connectionStatus}
                    </span>
                  </div>
                  {connectionStatus === 'error' && (
                    <div className="mt-2 flex justify-center">
                      <button
                        onClick={() => {
                          setConnectionStatus('connecting');
                          // Trigger re-initialization by updating a dependency
                          setPlayerReady(false);
                          // Force re-run of useEffect by changing a state that affects it
                          window.location.reload();
                        }}
                        className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
                      >
                        Retry Connection
                      </button>
                    </div>
                  )}
                  <div className="mt-1 flex justify-between gap-3">
                    <span>Known peers</span>
                    <span>{cameraCount}</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-3">
                    <span>Your peer</span>
                    <span className="max-w-32 truncate">{userId || 'waiting'}</span>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  {renderCameraTiles()}
                </div>
              </div>
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
