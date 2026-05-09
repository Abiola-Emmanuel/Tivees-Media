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
  return payload.senderId || payload.userId || payload.fromUserId || payload.from || payload.participantId || ''
}

const getPeerIdFromPayload = (payload = {}) => {
  return payload.fromPeerId || payload.peerId || getSocketUserId(payload)
}

const logWatchParty = (...args) => {
  console.log('[WatchParty]', ...args);
}

const logWebRtc = (...args) => {
  console.log('[WebRTC]', ...args);
}

const WatchPartyPlayer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const partyId = searchParams.get('partyId');
  const cfid = searchParams.get('cfid') || searchParams.get('uid');
  const userIdParam = searchParams.get('userId');
  const wsParam = searchParams.get('ws');
  const wsBaseParam = searchParams.get('wsBase');

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
  const [cameraError, setCameraError] = useState('');
  const [myPeerId, setMyPeerId] = useState('');
  const [knownPeerCount, setKnownPeerCount] = useState(0);

  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const wsRef = useRef(null);
  const isSyncingRef = useRef(false);
  const isHostRef = useRef(false);
  const hostIdRef = useRef('');

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [remoteLabels, setRemoteLabels] = useState({});

  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const myPeerIdRef = useRef('');
  const activeRemotePeerIdsRef = useRef(new Set());
  const peerUserIdsRef = useRef(new Map());
  const pendingIceCandidatesRef = useRef({});

  const sendSocketMessage = (message) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('[WatchParty] Socket send skipped because socket is not open:', {
        type: message.type,
        readyState: wsRef.current?.readyState
      });
      return false;
    }

    wsRef.current.send(JSON.stringify(message));
    if (['webrtc-offer', 'webrtc-answer', 'webrtc-ice', 'camera-ready', 'offer', 'answer', 'ice-candidate'].includes(message.type)) {
      logWebRtc('sent signaling message', {
        type: message.type,
        targetPeerId: message.targetPeerId || message.targetUserId || null,
        userId: message.userId || null,
        hasSdp: Boolean(message.sdp),
        hasOffer: Boolean(message.offer),
        hasAnswer: Boolean(message.answer),
        hasCandidate: Boolean(message.candidate)
      });
    }
    return true;
  };

  const announceCameraReady = () => {
    if (!userId || !partyId) return;

    sendSocketMessage({
      type: 'camera-ready',
      userId,
      partyId
    });
  };

  const setRemotePeerStream = (remotePeerId, stream, displayUserId) => {
    logWebRtc('remote stream attached', {
      remotePeerId,
      displayUserId,
      tracks: stream.getTracks().map((track) => `${track.kind}:${track.readyState}`)
    });

    setRemoteStreams((currentStreams) => ({
      ...currentStreams,
      [remotePeerId]: stream
    }));

    setRemoteLabels((currentLabels) => ({
      ...currentLabels,
      [remotePeerId]: displayUserId || peerUserIdsRef.current.get(remotePeerId) || remotePeerId.slice(0, 8)
    }));
  };

  const removeRemotePeer = (remotePeerId) => {
    const pc = peersRef.current[remotePeerId];
    logWebRtc('removing remote peer', {
      remotePeerId,
      hadConnection: Boolean(pc),
      knownPeersBefore: activeRemotePeerIdsRef.current.size
    });

    if (pc) {
      try {
        pc.close();
      } catch (_) { }
    }

    delete peersRef.current[remotePeerId];
    delete pendingIceCandidatesRef.current[remotePeerId];
    activeRemotePeerIdsRef.current.delete(remotePeerId);
    peerUserIdsRef.current.delete(remotePeerId);

    setRemoteStreams((currentStreams) => {
      const nextStreams = { ...currentStreams };
      delete nextStreams[remotePeerId];
      return nextStreams;
    });

    setRemoteLabels((currentLabels) => {
      const nextLabels = { ...currentLabels };
      delete nextLabels[remotePeerId];
      return nextLabels;
    });
  };

  const flushPendingIceCandidates = async (remotePeerId) => {
    const pc = peersRef.current[remotePeerId];
    const candidates = pendingIceCandidatesRef.current[remotePeerId] || [];

    if (!pc || !pc.remoteDescription || candidates.length === 0) {
      return;
    }

    pendingIceCandidatesRef.current[remotePeerId] = [];
    logWebRtc('flushing pending ICE candidates', {
      remotePeerId,
      count: candidates.length
    });

    for (const candidate of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('ICE add failed', err);
      }
    }
  };

  const createPeerConnection = (remotePeerId, displayUserId) => {
    if (peersRef.current[remotePeerId]) {
      logWebRtc('reusing peer connection', { remotePeerId });
      return peersRef.current[remotePeerId];
    }

    logWebRtc('creating peer connection', {
      remotePeerId,
      displayUserId,
      hasLocalStream: Boolean(localStreamRef.current),
      localTracks: localStreamRef.current?.getTracks().map((track) => track.kind) || []
    });

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    if (displayUserId) {
      peerUserIdsRef.current.set(remotePeerId, displayUserId);
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        logWebRtc('local ICE candidate gathered', {
          remotePeerId,
          candidateType: event.candidate.type,
          protocol: event.candidate.protocol
        });

        sendSocketMessage({
          type: 'webrtc-ice',
          targetPeerId: remotePeerId,
          candidate: event.candidate.toJSON()
        });

        sendSocketMessage({
          type: 'ice-candidate',
          targetUserId: remotePeerId,
          userId,
          candidate: event.candidate.toJSON()
        });
      }
    };

    pc.ontrack = (event) => {
      const receivedStream = event.streams[0] || new MediaStream(event.track ? [event.track] : []);
      logWebRtc('remote track received', {
        remotePeerId,
        trackKind: event.track?.kind,
        streamTrackCount: receivedStream.getTracks().length
      });

      if (receivedStream && receivedStream.getTracks().length > 0) {
        setRemotePeerStream(remotePeerId, receivedStream, displayUserId);
      }
    };

    pc.onconnectionstatechange = () => {
      logWebRtc('connection state changed', {
        remotePeerId,
        connectionState: pc.connectionState,
        iceConnectionState: pc.iceConnectionState,
        signalingState: pc.signalingState
      });

      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        setRemoteStreams((currentStreams) => {
          const nextStreams = { ...currentStreams };
          delete nextStreams[remotePeerId];
          return nextStreams;
        });
      }
    };

    peersRef.current[remotePeerId] = pc;
    return pc;
  };

  const offerTo = async (remotePeerId, displayUserId) => {
    if (!localStreamRef.current || !myPeerIdRef.current || remotePeerId === myPeerIdRef.current) {
      logWebRtc('offer skipped', {
        remotePeerId,
        hasLocalStream: Boolean(localStreamRef.current),
        myPeerId: myPeerIdRef.current,
        reason: remotePeerId === myPeerIdRef.current ? 'self' : 'missing local stream or peer id'
      });
      return;
    }

    if (peersRef.current[remotePeerId]) {
      logWebRtc('offer skipped because connection already exists', { remotePeerId });
      return;
    }

    const pc = createPeerConnection(remotePeerId, displayUserId);
    logWebRtc('creating offer', { remotePeerId, signalingState: pc.signalingState });
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    logWebRtc('offer local description set', {
      remotePeerId,
      sdpLength: pc.localDescription?.sdp?.length || 0
    });

    sendSocketMessage({
      type: 'webrtc-offer',
      targetPeerId: remotePeerId,
      sdp: pc.localDescription?.sdp
    });

    sendSocketMessage({
      type: 'offer',
      targetUserId: remotePeerId,
      userId,
      offer: pc.localDescription
    });
  };

  const handleRemoteOffer = async (fromPeerId, sdp, displayUserId) => {
    if (!localStreamRef.current || fromPeerId === myPeerIdRef.current) {
      logWebRtc('remote offer ignored', {
        fromPeerId,
        hasLocalStream: Boolean(localStreamRef.current),
        myPeerId: myPeerIdRef.current
      });
      return;
    }

    logWebRtc('remote offer received', {
      fromPeerId,
      displayUserId,
      sdpLength: sdp?.length || 0
    });

    const pc = createPeerConnection(fromPeerId, displayUserId);
    await pc.setRemoteDescription({ type: 'offer', sdp });
    await flushPendingIceCandidates(fromPeerId);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    logWebRtc('answer local description set', {
      fromPeerId,
      sdpLength: pc.localDescription?.sdp?.length || 0
    });

    sendSocketMessage({
      type: 'webrtc-answer',
      targetPeerId: fromPeerId,
      sdp: pc.localDescription?.sdp
    });

    sendSocketMessage({
      type: 'answer',
      targetUserId: fromPeerId,
      userId,
      answer: pc.localDescription
    });
  };

  const handleRemoteAnswer = async (fromPeerId, sdp) => {
    const pc = peersRef.current[fromPeerId];
    if (!pc) {
      logWebRtc('remote answer ignored because peer connection is missing', { fromPeerId });
      return;
    }

    logWebRtc('remote answer received', {
      fromPeerId,
      sdpLength: sdp?.length || 0,
      signalingState: pc.signalingState
    });
    await pc.setRemoteDescription({ type: 'answer', sdp });
    await flushPendingIceCandidates(fromPeerId);
  };

  const handleRemoteIce = async (fromPeerId, candidate) => {
    if (!candidate || !fromPeerId) {
      logWebRtc('remote ICE ignored because candidate or peer id is missing', {
        fromPeerId,
        hasCandidate: Boolean(candidate)
      });
      return;
    }

    const pc = peersRef.current[fromPeerId];

    if (pc?.remoteDescription) {
      try {
        logWebRtc('adding remote ICE candidate', {
          fromPeerId,
          candidateType: candidate.type,
          protocol: candidate.protocol
        });
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('ICE add failed', err);
      }
      return;
    }

    logWebRtc('queueing remote ICE candidate until remote description exists', {
      fromPeerId,
      candidateType: candidate.type,
      queuedCount: (pendingIceCandidatesRef.current[fromPeerId] || []).length + 1
    });

    pendingIceCandidatesRef.current[fromPeerId] = [
      ...(pendingIceCandidatesRef.current[fromPeerId] || []),
      candidate
    ];
  };

  const connectOffersToRemotes = () => {
    if (!localStreamRef.current || !myPeerIdRef.current) {
      logWebRtc('connectOffersToRemotes skipped', {
        hasLocalStream: Boolean(localStreamRef.current),
        myPeerId: myPeerIdRef.current,
        knownPeerCount: activeRemotePeerIdsRef.current.size
      });
      return;
    }

    logWebRtc('checking remote peers for outbound offers', {
      myPeerId: myPeerIdRef.current,
      knownPeerIds: Array.from(activeRemotePeerIdsRef.current)
    });

    activeRemotePeerIdsRef.current.forEach((remotePeerId) => {
      if (remotePeerId > myPeerIdRef.current) {
        offerTo(remotePeerId, peerUserIdsRef.current.get(remotePeerId)).catch((err) => {
          console.error('Failed to create WebRTC offer:', err?.name || err, err?.message || '');
        });
      } else {
        logWebRtc('not offerer for peer based on peer id ordering', {
          myPeerId: myPeerIdRef.current,
          remotePeerId
        });
      }
    });
  };

  const startLocalVideo = async () => {
    try {
      setCameraError('');
      logWebRtc('requesting local camera');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });
      logWebRtc('local camera started', {
        tracks: stream.getTracks().map((track) => `${track.kind}:${track.readyState}`)
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      setIsCameraEnabled(true);
      announceCameraReady();

      Object.values(peersRef.current).forEach((pc) => {
        stream.getTracks().forEach((track) => {
          const alreadyAdded = pc.getSenders().some((sender) => sender.track === track);
          if (!alreadyAdded) {
            pc.addTrack(track, stream);
          }
        });
      });

      connectOffersToRemotes();

      return stream;
    } catch (err) {
      console.error('[WebRTC] Error accessing media devices.', err);
      setCameraError(`Camera: ${err?.message || 'unavailable'}`);
      setIsCameraEnabled(false);
    }
  }

  const stopLocalVideo = () => {
    logWebRtc('stopping local camera', {
      hadLocalStream: Boolean(localStreamRef.current),
      peerConnectionCount: Object.keys(peersRef.current).length
    });

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setIsCameraEnabled(false);

    Object.values(peersRef.current).forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        if (sender.track) {
          pc.removeTrack(sender);
        }
      });
    });
  };

  useEffect(() => {
    return () => {
      stopLocalVideo();
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
    }
  }, [])

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
  }, [userId]);

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
    const wsBase = wsBaseParam || `${wsProtocol}://${wsHost}/ws/watchparty`;
    const wsUrl =
      wsParam ||
      `${wsBase}?partyId=${encodeURIComponent(partyId)}&cfid=${encodeURIComponent(cfid)}&userId=${encodeURIComponent(userId)}`;

    logWatchParty('connecting websocket', {
      wsUrl,
      partyId,
      cfid,
      userId,
      wsOverrideUsed: Boolean(wsParam),
      wsBaseOverrideUsed: Boolean(wsBaseParam),
      envProtocol: wsProtocol,
      envHost: wsHost
    });
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      logWatchParty('websocket connected', { wsUrl });
      setConnectionStatus('connected');
      if (localStreamRef.current) {
        announceCameraReady();
      }
    };

    wsRef.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      if (['webrtc-offer', 'webrtc-answer', 'webrtc-ice'].includes(data.type)) {
        logWebRtc('received signaling message', {
          type: data.type,
          fromPeerId: data.fromPeerId,
          targetPeerId: data.targetPeerId,
          hasSdp: Boolean(data.sdp),
          hasCandidate: Boolean(data.candidate)
        });
      }
      if (data.type === 'sync') {
        myPeerIdRef.current = data.peerId || myPeerIdRef.current || userId;
        setMyPeerId(myPeerIdRef.current);
        hostIdRef.current = data.hostId || '';
        activeRemotePeerIdsRef.current = new Set();
        peerUserIdsRef.current = new Map();

        (data.peers || []).forEach((peer) => {
          const peerId = typeof peer === 'string'
            ? peer
            : peer.peerId || peer.userId || peer._id || peer.id;

          if (!peerId || peerId === myPeerIdRef.current || peerId === userId) return;
          activeRemotePeerIdsRef.current.add(peerId);
          peerUserIdsRef.current.set(peerId, typeof peer === 'string' ? peer : peer.userId || peer.name || peerId);
        });

        const userIsHost = data.hostId === userId || data.hostId === myPeerIdRef.current;

        if (!userIsHost && data.hostId && data.hostId !== myPeerIdRef.current && data.hostId !== userId) {
          activeRemotePeerIdsRef.current.add(data.hostId);
          peerUserIdsRef.current.set(data.hostId, data.hostId);
          logWatchParty('host added as fallback peer target', {
            hostId: data.hostId,
            myPeerId: myPeerIdRef.current
          });
        }

        setKnownPeerCount(activeRemotePeerIdsRef.current.size);
        logWatchParty('sync received', {
          myPeerId: myPeerIdRef.current,
          hostId: data.hostId,
          userIsHost,
          peerCount: activeRemotePeerIdsRef.current.size,
          peers: Array.from(activeRemotePeerIdsRef.current),
          hasState: Boolean(data.state),
          state: data.state || null
        });

        isHostRef.current = userIsHost;
        setIsHost(userIsHost);
        setPlayerControls(userIsHost);
        setPlayerMuted(false);
        logWatchParty('host status resolved', { userIsHost, userId, myPeerId: myPeerIdRef.current });

        startLocalVideo().then(() => {
          connectOffersToRemotes();

          if (!userIsHost && data.hostId && data.hostId !== myPeerIdRef.current) {
            logWebRtc('guest offering directly to host fallback', {
              hostId: data.hostId,
              myPeerId: myPeerIdRef.current
            });

            offerTo(data.hostId, peerUserIdsRef.current.get(data.hostId)).catch((err) => {
              console.error('Failed to create WebRTC offer for host fallback:', err?.name || err, err?.message || '');
            });
          }
        });

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
        logWatchParty('attendee count update', { count: data.count });
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
        data.type === 'peer-joined' ||
        data.type === 'camera-ready' ||
        data.type === 'user-camera-ready' ||
        data.type === 'user-joined' ||
        data.type === 'participant-joined'
      ) {
        const joinedPeerId = data.peerId || getPeerIdFromPayload(data);
        logWatchParty('peer joined', {
          type: data.type,
          peerId: joinedPeerId,
          userId: data.userId,
          myPeerId: myPeerIdRef.current
        });

        if (joinedPeerId && joinedPeerId !== myPeerIdRef.current && joinedPeerId !== userId) {
          activeRemotePeerIdsRef.current.add(joinedPeerId);
          peerUserIdsRef.current.set(joinedPeerId, data.userId || joinedPeerId);
          setKnownPeerCount(activeRemotePeerIdsRef.current.size);

          if (localStreamRef.current && joinedPeerId > myPeerIdRef.current) {
            await offerTo(joinedPeerId, data.userId);
          }
        }
        return;
      }

      if (data.type === 'participants' || data.type === 'attendees') {
        const participants = Array.isArray(data.participants)
          ? data.participants
          : Array.isArray(data.attendees)
            ? data.attendees
            : Array.isArray(data.users)
              ? data.users
              : [];

        logWatchParty('participants list received', {
          type: data.type,
          count: participants.length
        });

        participants.forEach((participant) => {
          const peerId = typeof participant === 'string'
            ? participant
            : participant.peerId || participant.userId || participant._id || participant.id;

          if (!peerId || peerId === myPeerIdRef.current || peerId === userId) return;
          activeRemotePeerIdsRef.current.add(peerId);
          peerUserIdsRef.current.set(peerId, typeof participant === 'string' ? participant : participant.userId || participant.name || peerId);

          if (localStreamRef.current && peerId > myPeerIdRef.current) {
            offerTo(peerId, peerUserIdsRef.current.get(peerId)).catch((err) => {
              console.error('Failed to create WebRTC offer:', err?.name || err, err?.message || '');
            });
          }
        });

        setKnownPeerCount(activeRemotePeerIdsRef.current.size);
      }

      if (data.type === 'peer-left') {
        logWatchParty('peer left', { peerId: data.peerId });
        removeRemotePeer(data.peerId);
        setKnownPeerCount(activeRemotePeerIdsRef.current.size);
        return;
      }

      if (data.type === 'camera-off' || data.type === 'user-left' || data.type === 'participant-left') {
        const targetUserId = data.peerId || data.fromPeerId || getSocketUserId(data);
        logWatchParty('participant removal message received', {
          type: data.type,
          targetUserId,
          raw: data
        });

        if (targetUserId) {
          removeRemotePeer(targetUserId);
          setKnownPeerCount(activeRemotePeerIdsRef.current.size);
        }
      }

      if (data.type === 'webrtc-offer') {
        await handleRemoteOffer(data.fromPeerId, data.sdp, peerUserIdsRef.current.get(data.fromPeerId));
        return;
      }

      if (data.type === 'offer') {
        const fromPeerId = getPeerIdFromPayload(data);
        const offerSdp = data.sdp || data.offer?.sdp;

        await handleRemoteOffer(fromPeerId, offerSdp, peerUserIdsRef.current.get(fromPeerId) || data.userId);
        return;
      }

      if (data.type === 'webrtc-answer') {
        await handleRemoteAnswer(data.fromPeerId, data.sdp);
        return;
      }

      if (data.type === 'answer') {
        const fromPeerId = getPeerIdFromPayload(data);
        const answerSdp = data.sdp || data.answer?.sdp;

        await handleRemoteAnswer(fromPeerId, answerSdp);
        return;
      }

      if (data.type === 'webrtc-ice') {
        await handleRemoteIce(data.fromPeerId, data.candidate);
        return;
      }

      if (data.type === 'ice-candidate') {
        await handleRemoteIce(getPeerIdFromPayload(data), data.candidate);
        return;
      }
    };

    wsRef.current.onerror = () => {
      console.error('[WatchParty] websocket error', { wsUrl });
      setConnectionStatus('error');
    };

    wsRef.current.onclose = (event) => {
      logWatchParty('websocket closed', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      setConnectionStatus('disconnected');
    };

    return () => {
      logWatchParty('cleaning up websocket and peer connections', {
        peerConnectionCount: Object.keys(peersRef.current).length
      });
      if (wsRef.current) wsRef.current.close();
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      activeRemotePeerIdsRef.current = new Set();
      peerUserIdsRef.current = new Map();
      pendingIceCandidatesRef.current = {};
      setRemoteStreams({});
      setRemoteLabels({});
      setMyPeerId('');
      setKnownPeerCount(0);
    };
  // The socket effect owns one connection lifecycle; helpers above intentionally read refs/state from this render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partyId, cfid, userId, userName, playerReady, wsBaseParam, wsParam]);

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
    if (isCameraEnabled) {
      stopLocalVideo();
      return;
    }

    if (!localStreamRef.current) {
      await startLocalVideo();
      return;
    }

    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = true;
    });

    setIsCameraEnabled(true);
    connectOffersToRemotes();
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

      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <div key={peerId} className="relative aspect-video overflow-hidden rounded-lg border-2 border-white/20 bg-black">
          <video
            autoPlay
            playsInline
            ref={(el) => { if (el) el.srcObject = stream }}
            className="h-full w-full bg-black object-cover"
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1 text-[10px] text-white">
            {remoteLabels[peerId] || peerId.slice(0, 8)}
          </span>
        </div>
      ))}
    </div>
  );

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
                  <div className="mt-1 flex justify-between gap-3">
                    <span>Known peers</span>
                    <span>{knownPeerCount}</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-3">
                    <span>Your peer</span>
                    <span className="max-w-32 truncate">{myPeerId || 'waiting'}</span>
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
