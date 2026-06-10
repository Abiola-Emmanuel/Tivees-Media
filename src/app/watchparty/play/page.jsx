'use client'

export const dynamic = 'force-dynamic';

import React, { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MdClose, MdShare, MdPerson, MdMessage, MdVideocam, MdVideocamOff, MdVolumeOff, MdVolumeUp } from 'react-icons/md';
import AttendeesPanel from '@/components/AttendesPanel';
import CommentsPanel from '@/components/CommentsPanel';
import { IoIosRefresh } from 'react-icons/io';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const createMessageId = (message = {}) => {
  return (
    message.id ||
    message._id ||
    message.clientId ||
    `${message.userId || 'guest'}-${message.createdAt || Date.now()}-${message.text || ''}`
  )
}

const isRealUserName = (name) => {
  return Boolean(name && String(name).trim() && String(name).trim().toLowerCase() !== 'guest')
}

const pickRealUserName = (...names) => {
  return names.find(isRealUserName) || ''
}

const normalizeChatMessage = (payload, options = {}) => {
  if (!payload) {
    return null
  }

  const currentUserId = options.currentUserId || ''
  const currentUserName = options.currentUserName || 'Guest'
  const userNamesById = options.userNamesById || {}

  const text = payload.text || payload.message || payload.body || payload.content || ''

  if (!String(text).trim()) {
    return null
  }

  const resolvedUserId =
    payload.userId || payload.senderId || payload.user?._id || payload.user?.id || ''

  const resolvedUserName =
    pickRealUserName(
      payload.userName,
      payload.senderName,
      payload.name,
      payload.user?.name,
      payload.user?.fullName,
      userNamesById[resolvedUserId]
    ) ||
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
      const existingMessage = map.get(message.id)
      const resolvedUserName =
        pickRealUserName(message.userName, existingMessage?.userName) ||
        message.userName ||
        existingMessage?.userName ||
        'Guest'

      map.set(message.id, {
        ...existingMessage,
        ...message,
        userName: resolvedUserName
      })
    }
  })

  return Array.from(map.values()).sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  )
}

const getSocketUserId = (payload = {}) => {
  return (
    payload.senderUserId ||
    payload.senderId ||
    payload.fromUserId ||
    payload.from ||
    payload.userId ||
    payload.participantId ||
    ''
  )
}

const getSocketPeerId = (payload = {}) => {
  return payload.senderPeerId || payload.fromPeerId || payload.peerId || getSocketUserId(payload)
}

const getSocketUserName = (payload = {}) => {
  return (
    payload.senderName ||
    payload.userName ||
    payload.name ||
    payload.user?.name ||
    payload.user?.fullName ||
    payload.participant?.name ||
    ''
  )
}

const getSocketTargetUserId = (payload = {}) => {
  return payload.targetUserId || payload.receiverId || payload.toUserId || payload.to || ''
}

const getSocketTargetPeerId = (payload = {}) => {
  return payload.targetPeerId || payload.recipientPeerId || ''
}

const isMessageForCurrentUser = (payload = {}, currentUserId = '', currentPeerId = '') => {
  const targetUserId = getSocketTargetUserId(payload)
  const targetPeerId = getSocketTargetPeerId(payload)

  return (
    (!targetUserId || !currentUserId || targetUserId === currentUserId) &&
    (!targetPeerId || !currentPeerId || targetPeerId === currentPeerId)
  )
}

const getStoredUserName = (user = {}) => {
  return user?.name || user?.fullName || user?.username || 'Guest'
}

const getStoredUser = () => {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const userString = window.localStorage.getItem('user')
    return userString ? JSON.parse(userString) : null
  } catch (error) {
    console.warn('Could not read stored user for chat message:', error)
    return null
  }
}

const getParticipantPeerId = (participant) => {
  return typeof participant === 'string'
    ? participant
    : participant.peerId || participant._id || participant.id || participant.userId
}

const getParticipantUserId = (participant, fallbackPeerId = '') => {
  return typeof participant === 'string'
    ? participant
    : participant.userId || participant.senderUserId || participant.user?._id || participant.user?.id || fallbackPeerId
}

const getParticipantName = (participant) => {
  return typeof participant === 'string'
    ? ''
    : participant.name || participant.userName || participant.senderName || participant.user?.name || participant.user?.fullName || ''
}

const getBackendErrorMessage = (payload = {}) => {
  if (typeof payload === 'string') {
    const messageText = payload.trim()
    const isWatchPartyAccessError = /authorization failed|invalid or expired token|signature failed|watch\s*party.*not available|watchparty.*not available|expired party|party.*ended/i.test(messageText)

    return isWatchPartyAccessError ? messageText : ''
  }

  const message =
    payload.message ||
    payload.error ||
    payload.reason ||
    payload.details ||
    payload.data?.message ||
    payload.data?.error ||
    ''

  const messageText = typeof message === 'string' ? message.trim() : ''

  if (!messageText) {
    return ''
  }

  const statusText = String(payload.status || payload.type || payload.code || '').toLowerCase()
  const isErrorPayload = ['error', 'failed', 'failure', 'unauthorized', 'forbidden'].some((value) =>
    statusText.includes(value)
  )
  const isWatchPartyAccessError = /authorization failed|invalid or expired token|signature failed|watch\s*party.*not available|watchparty.*not available|expired party|party.*ended/i.test(messageText)

  return isErrorPayload || isWatchPartyAccessError ? messageText : ''
}

const WatchPartyPlayer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const partyId = searchParams.get('partyId');
  const cfid = searchParams.get('cfid');
  const movieId = searchParams.get('movieId');
  const userIdParam = searchParams.get('userId');

  const [isHost, setIsHost] = useState(false);
  const [showGuestControlNotice, setShowGuestControlNotice] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [activePanel, setActivePanel] = useState(null);
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [playerReady, setPlayerReady] = useState(false);
  const [userId, setUserId] = useState(userIdParam || null);
  const [userName, setUserName] = useState('Guest');
  const [isHydrated, setIsHydrated] = useState(false);
  const [audioActivationRequired, setAudioActivationRequired] = useState(false);
  const [isPlayerMuted, setIsPlayerMuted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageDraft, setMessageDraft] = useState('');
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [backendErrorMessage, setBackendErrorMessage] = useState('');
  const [myPeerId, setMyPeerId] = useState('');
  const [knownPeerCount, setKnownPeerCount] = useState(0);
  const [remoteDisplayNames, setRemoteDisplayNames] = useState({});
  const [attendeeNames, setAttendeeNames] = useState({});

  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const wsRef = useRef(null);
  const isSyncingRef = useRef(false);
  const isHostRef = useRef(false);
  const hostIdRef = useRef('');
  const attendeeNamesRef = useRef({});

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

  useEffect(() => {
    if (isHost) {
      setShowGuestControlNotice(false);
      return;
    }

    setShowGuestControlNotice(true);
    const timeoutId = window.setTimeout(() => {
      setShowGuestControlNotice(false);
    }, 5000);

    return () => window.clearTimeout(timeoutId);
  }, [isHost]);

  // To store the video streams for the UI
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});

  // To store the technical WebRTC objects
  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const myPeerIdRef = useRef('');
  const activeRemotePeerIdsRef = useRef(new Set());
  const peerUserIdsRef = useRef(new Map());
  const peerDisplayNamesRef = useRef(new Map());
  const pendingIncomingOffersRef = useRef([]);
  const pendingOutboundPeersRef = useRef(new Set());
  const processedOfferSdpRef = useRef(new Map());
  const processedAnswerSdpRef = useRef(new Map());
  const pendingIceCandidatesRef = useRef({});
  const watchPartyEndedPatchSentRef = useRef(false);

  const sendSocketMessage = (message) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.warn('WebRTC/socket message skipped because socket is not open:', message.type);
      return false;
    }

    wsRef.current.send(JSON.stringify({
      partyId,
      userId,
      senderUserId: userId,
      peerId: myPeerIdRef.current || undefined,
      senderId: userId,
      senderName: userName,
      userName,
      ...message
    }));
    if (['camera-ready', 'webrtc-offer', 'webrtc-answer', 'webrtc-ice', 'offer', 'answer', 'ice-candidate'].includes(message.type)) {
      console.log('WebRTC/socket message sent:', message.type, {
        targetPeerId: message.targetPeerId || null,
        targetUserId: message.targetUserId || null,
        userId: message.userId || null
      });
    }
    return true;
  };

  const markWatchPartyEnded = useCallback(({ keepalive = false } = {}) => {
    if (!isHostRef.current || !partyId || watchPartyEndedPatchSentRef.current) {
      return;
    }

    const authToken = window.localStorage.getItem('authToken');

    if (!authToken || !API_BASE_URL) {
      console.warn('Watch party end status patch skipped: missing auth token or API base URL.');
      return;
    }

    watchPartyEndedPatchSentRef.current = true;

    fetch(`${API_BASE_URL}/api/v1/users/watchparty/${partyId}`, {
      method: 'PATCH',
      keepalive,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ status: 'ended' })
    }).catch((error) => {
      watchPartyEndedPatchSentRef.current = false;
      console.error('Failed to mark watch party as ended:', error);
    });
  }, [partyId]);

  const redirectGuestsAfterHostLeaves = () => {
    if (isHostRef.current) return;

    router.replace(movieId ? `/movies/${movieId}` : '/movies');
  };

  const isHostLeaveMessage = (payload = {}) => {
    return [
      'host-left',
      'host-disconnected',
      'watchparty-ended',
      'watchparty-closed',
      'party-ended',
      'party-closed'
    ].includes(payload.type);
  };

  const didHostLeave = (payload = {}) => {
    const knownHostId = hostIdRef.current;

    if (!knownHostId) {
      return false;
    }

    return [
      getSocketPeerId(payload),
      getSocketUserId(payload),
      payload.hostId,
      payload.senderId,
      payload.senderUserId,
      payload.userId,
      payload.peerId
    ].some((candidate) => candidate && candidate === knownHostId);
  };

  useEffect(() => {
    const announceHostLeaving = () => {
      if (!isHostRef.current) {
        return;
      }

      markWatchPartyEnded({ keepalive: true });

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'host-left',
          partyId,
          userId,
          hostId: userId,
          senderId: userId,
          senderUserId: userId,
          peerId: myPeerIdRef.current || userId
        }));
      }
    };

    window.addEventListener('beforeunload', announceHostLeaving);

    return () => {
      window.removeEventListener('beforeunload', announceHostLeaving);
    };
  }, [markWatchPartyEnded, partyId, userId]);

  const rememberAttendeeName = (nextUserId = '', nextUserName = '') => {
    if (!nextUserId || !isRealUserName(nextUserName)) {
      return;
    }

    attendeeNamesRef.current = {
      ...attendeeNamesRef.current,
      [nextUserId]: nextUserName
    };

    setAttendeeNames((currentNames) => ({
      ...currentNames,
      [nextUserId]: nextUserName
    }));
  };

  const announceUserProfile = (profileName = '') => {
    const storedUser = getStoredUser();
    const resolvedProfileName = pickRealUserName(profileName, getStoredUserName(storedUser), userName);

    if (wsRef.current?.readyState !== WebSocket.OPEN || !userId || !isRealUserName(resolvedProfileName)) {
      return;
    }

    const profileMessage = {
      type: 'user-profile',
      partyId,
      userId,
      senderId: userId,
      senderUserId: userId,
      userName: resolvedProfileName,
      senderName: resolvedProfileName,
      name: resolvedProfileName,
      user: {
        _id: userId,
        name: resolvedProfileName
      }
    };

    wsRef.current.send(JSON.stringify(profileMessage));
  };

  const announceCameraReady = () => {
    sendSocketMessage({
      type: 'camera-ready',
      userId,
      senderId: userId,
      senderName: userName,
      userName,
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
      await flushPendingRtc();

      return stream;
    } catch (err) {
      console.error('Error accessing media devices.', err);
      setCameraError('Camera unavailable');
      setIsCameraEnabled(false);
    }
  }

  // Peer conection login
  const rememberPeerName = (remotePeerId, displayName = '') => {
    if (!remotePeerId || !displayName) return;

    peerDisplayNamesRef.current.set(remotePeerId, displayName);
    setRemoteDisplayNames((currentNames) => ({
      ...currentNames,
      [remotePeerId]: displayName
    }));
  }

  const createPeerConnection = (remotePeerId, displayUserId = '', displayName = '') => {
    if (peersRef.current[remotePeerId]) {
      rememberPeerName(remotePeerId, displayName);
      return peersRef.current[remotePeerId];
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    if (displayUserId) {
      peerUserIdsRef.current.set(remotePeerId, displayUserId);
    }
    rememberPeerName(remotePeerId, displayName);

    console.log('WebRTC peer connection created for', remotePeerId);

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
        console.log('Remote stream received for', remotePeerId, receivedStream)
        setRemoteStreams(prev => ({
          ...prev,
          [remotePeerId]: receivedStream
        }))
      }
    }

    // Handle finding a network path (ICE candidates)
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSocketMessage({
          type: 'webrtc-ice',
          candidate: event.candidate.toJSON(),
          targetPeerId: remotePeerId,
          targetUserId: peerUserIdsRef.current.get(remotePeerId) || remotePeerId
        })

        sendSocketMessage({
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
          targetPeerId: remotePeerId,
          targetUserId: peerUserIdsRef.current.get(remotePeerId) || remotePeerId,
          receiverId: peerUserIdsRef.current.get(remotePeerId) || remotePeerId,
          toUserId: peerUserIdsRef.current.get(remotePeerId) || remotePeerId,
          userId,
          senderId: userId
        })
      }
    }

    pc.onconnectionstatechange = () => {
      console.log('WebRTC connection state for', remotePeerId, pc.connectionState);

      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        setRemoteStreams(prev => {
          const nextStreams = { ...prev };
          delete nextStreams[remotePeerId];
          return nextStreams;
        });
      }
    }

    // Store it in our registry
    peersRef.current[remotePeerId] = pc;
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

  const createOfferForPeer = async (remotePeerId, displayUserId = '', displayName = '') => {
    if (!remotePeerId || remotePeerId === myPeerIdRef.current || remotePeerId === userId) {
      return;
    }

    if (!localStreamRef.current) {
      pendingOutboundPeersRef.current.add(remotePeerId);
      if (displayUserId) {
        peerUserIdsRef.current.set(remotePeerId, displayUserId);
      }
      rememberPeerName(remotePeerId, displayName);
      return;
    }

    if (peersRef.current[remotePeerId]) {
      return;
    }

    const pc = createPeerConnection(remotePeerId, displayUserId, displayName);
    if (pc.signalingState !== 'stable') {
      console.log('WebRTC offer skipped because peer is not stable:', remotePeerId, pc.signalingState);
      return;
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const targetUserId = peerUserIdsRef.current.get(remotePeerId) || displayUserId || remotePeerId;
    console.log('WebRTC offer created for', remotePeerId);

    sendSocketMessage({
      type: 'webrtc-offer',
      sdp: offer.sdp,
      targetPeerId: remotePeerId,
      targetUserId
    });

    sendSocketMessage({
      type: 'offer',
      offer,
      sdp: offer.sdp,
      targetPeerId: remotePeerId,
      targetUserId,
      receiverId: targetUserId,
      toUserId: targetUserId,
      userId,
      senderId: userId
    });
  }

  const removeRemotePeer = (remotePeerId) => {
    if (!remotePeerId) return;

    peersRef.current[remotePeerId]?.close();
    delete peersRef.current[remotePeerId];
    delete pendingIceCandidatesRef.current[remotePeerId];
    activeRemotePeerIdsRef.current.delete(remotePeerId);
    peerUserIdsRef.current.delete(remotePeerId);
    peerDisplayNamesRef.current.delete(remotePeerId);
    setKnownPeerCount(activeRemotePeerIdsRef.current.size);
    setRemoteDisplayNames(prev => {
      const nextNames = { ...prev };
      delete nextNames[remotePeerId];
      return nextNames;
    });

    setRemoteStreams(prev => {
      const nextStreams = { ...prev };
      delete nextStreams[remotePeerId];
      return nextStreams;
    });
  }

  const shouldOfferToPeer = (remotePeerId) => {
    return Boolean(localStreamRef.current && myPeerIdRef.current && remotePeerId > myPeerIdRef.current);
  }

  const registerRemotePeer = (remotePeerId, displayUserId = '', autoOffer = true, displayName = '') => {
    if (!remotePeerId || remotePeerId === myPeerIdRef.current || remotePeerId === userId) {
      return;
    }

    activeRemotePeerIdsRef.current.add(remotePeerId);

    if (displayUserId) {
      peerUserIdsRef.current.set(remotePeerId, displayUserId);
    }
    rememberPeerName(remotePeerId, displayName);

    setKnownPeerCount(activeRemotePeerIdsRef.current.size);

    if (autoOffer && shouldOfferToPeer(remotePeerId)) {
      createOfferForPeer(remotePeerId, displayUserId, displayName).catch((err) => {
        console.error('Failed to create WebRTC offer:', err?.name || err, err?.message || '');
      });
    } else if (autoOffer && !localStreamRef.current) {
      pendingOutboundPeersRef.current.add(remotePeerId);
    }
  }

  const handleRemoteOffer = async (remotePeerId, sdp, displayUserId = '', displayName = '') => {
    if (!remotePeerId || remotePeerId === myPeerIdRef.current || !sdp) {
      return;
    }

    if (processedOfferSdpRef.current.get(remotePeerId) === sdp) {
      return;
    }

    processedOfferSdpRef.current.set(remotePeerId, sdp);
    registerRemotePeer(remotePeerId, displayUserId, false, displayName);

    if (!localStreamRef.current) {
      pendingIncomingOffersRef.current.push({ remotePeerId, sdp, displayUserId, displayName });
      return;
    }

    let pc = createPeerConnection(remotePeerId, displayUserId, displayName);

    if (pc.signalingState !== 'stable') {
      pc.close();
      delete peersRef.current[remotePeerId];
      pc = createPeerConnection(remotePeerId, displayUserId, displayName);
    }

    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
    await flushPendingIceCandidates(remotePeerId);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    const targetUserId = peerUserIdsRef.current.get(remotePeerId) || displayUserId || remotePeerId;

    sendSocketMessage({
      type: 'webrtc-answer',
      sdp: answer.sdp,
      targetPeerId: remotePeerId,
      targetUserId
    });

    sendSocketMessage({
      type: 'answer',
      answer,
      sdp: answer.sdp,
      targetPeerId: remotePeerId,
      targetUserId,
      receiverId: targetUserId,
      toUserId: targetUserId,
      userId,
      senderId: userId
    });
  }

  const handleRemoteAnswer = async (remotePeerId, sdp) => {
    const pc = peersRef.current[remotePeerId];
    if (!pc || !sdp) {
      return;
    }

    if (processedAnswerSdpRef.current.get(remotePeerId) === sdp) {
      return;
    }

    processedAnswerSdpRef.current.set(remotePeerId, sdp);
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
    await flushPendingIceCandidates(remotePeerId);
  }

  const handleRemoteIce = async (remotePeerId, candidate) => {
    if (!remotePeerId || !candidate) {
      return;
    }

    const pc = peersRef.current[remotePeerId];

    if (pc?.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
      return;
    }

    pendingIceCandidatesRef.current[remotePeerId] = [
      ...(pendingIceCandidatesRef.current[remotePeerId] || []),
      candidate
    ];
  }

  const flushPendingRtc = async () => {
    if (!localStreamRef.current || !myPeerIdRef.current) {
      return;
    }

    const incomingOffers = pendingIncomingOffersRef.current.splice(0);

    for (const offer of incomingOffers) {
      await handleRemoteOffer(offer.remotePeerId, offer.sdp, offer.displayUserId, offer.displayName);
    }

    const outboundPeers = Array.from(pendingOutboundPeersRef.current);
    pendingOutboundPeersRef.current.clear();

    for (const remotePeerId of outboundPeers) {
      if (shouldOfferToPeer(remotePeerId)) {
        await createOfferForPeer(remotePeerId, peerUserIdsRef.current.get(remotePeerId), peerDisplayNamesRef.current.get(remotePeerId));
      }
    }

    activeRemotePeerIdsRef.current.forEach((remotePeerId) => {
      if (shouldOfferToPeer(remotePeerId)) {
        createOfferForPeer(remotePeerId, peerUserIdsRef.current.get(remotePeerId), peerDisplayNamesRef.current.get(remotePeerId)).catch((err) => {
          console.error('Failed to create WebRTC offer:', err?.name || err, err?.message || '');
        });
      }
    });
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
    const storedUserName = getStoredUserName(user);
    rememberAttendeeName(user?._id || userId || null, storedUserName);

    if (!userId) {
      setUserId(user?._id || null);
      setUserName(storedUserName);
    } else {
      setUserName(storedUserName);
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
    setIsPlayerMuted(muted);

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
        sendSocketMessage({ type: 'play' });
        console.log('Play sent to guests');
      }
    };

    const handlePause = () => {
      if (!isSyncingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        sendSocketMessage({ type: 'pause' });
        console.log('Pause sent to guests');
      }
    };

    const handleSeeked = () => {
      if (!isSyncingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        sendSocketMessage({
          type: 'seek',
          currentTime: playerRef.current.currentTime,
        });
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
      rememberAttendeeName(userId, userName);
      announceUserProfile();
      if (localStreamRef.current) {
        announceCameraReady();
      }
    };

    wsRef.current.onmessage = async (event) => {
      let data;

      try {
        data = JSON.parse(event.data);
      } catch {
        const plainErrorMessage = getBackendErrorMessage({ message: event.data });

        if (plainErrorMessage) {
          setBackendErrorMessage(plainErrorMessage);
          setConnectionStatus('error');
        }

        return;
      }

      const backendMessage = getBackendErrorMessage(data);

      if (backendMessage) {
        setBackendErrorMessage(backendMessage);
        setConnectionStatus('error');
        return;
      }

      const socketUserId = data.senderUserId || data.userId || data.senderId || data.user?._id || data.user?.id || '';
      const socketUserName = getSocketUserName(data);

      rememberAttendeeName(socketUserId, socketUserName);

      const isWebRtcMessage = ['webrtc-offer', 'webrtc-answer', 'webrtc-ice', 'offer', 'answer', 'ice-candidate', 'camera-ready', 'user-camera-ready'].includes(data.type);

      if (isWebRtcMessage && !isMessageForCurrentUser(data, userId, myPeerIdRef.current)) {
        console.log('[WebRTC] ignored message for another user:', data.type, {
          targetUserId: getSocketTargetUserId(data),
          targetPeerId: getSocketTargetPeerId(data),
          currentPeerId: myPeerIdRef.current,
          currentUserId: userId
        });
        return;
      }

      if (isWebRtcMessage) {
        console.log('[WebRTC]', data.type, 'from:', getSocketPeerId(data) || 'UNKNOWN', '-> target:', getSocketTargetPeerId(data) || getSocketTargetUserId(data) || 'broadcast');
      }

      if (isHostLeaveMessage(data)) {
        redirectGuestsAfterHostLeaves();
        return;
      }

      if (data.type === 'sync') {
        const peerId = data.peerId || data.myPeerId || myPeerIdRef.current || userId;
        const userIsHost = data.hostId === userId || data.hostId === peerId;
        const roster = Array.isArray(data.peers)
          ? data.peers
          : Array.isArray(data.participants)
            ? data.participants
            : Array.isArray(data.attendees)
              ? data.attendees
              : [];

        myPeerIdRef.current = peerId;
        setMyPeerId(peerId);
        hostIdRef.current = data.hostId || '';
        isHostRef.current = userIsHost;
        setIsHost(userIsHost);
        setPlayerControls(userIsHost);
        setPlayerMuted(false);
        console.log('Host?', userIsHost);

        roster.forEach((participant) => {
          const remotePeerId = getParticipantPeerId(participant);
          const remoteUserId = getParticipantUserId(participant, remotePeerId);
          const remoteName = getParticipantName(participant);

          registerRemotePeer(remotePeerId, remoteUserId, true, remoteName);
        });

        flushPendingRtc().catch((err) => {
          console.error('Failed to flush pending WebRTC state:', err?.name || err, err?.message || '');
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
        setAttendeeCount(data.count);
      }

      if (data.type === 'user-profile' || data.type === 'participant-profile') {
        rememberAttendeeName(socketUserId, socketUserName);
      }

      if (data.type === 'chat' || data.type === 'message' || data.type === 'comment') {
        const nextMessage = normalizeChatMessage(data, {
          currentUserId: userId,
          currentUserName: userName,
          userNamesById: attendeeNamesRef.current
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
              currentUserName: userName,
              userNamesById: attendeeNamesRef.current
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
        const remotePeerId = getSocketPeerId(data);
        const remoteUserId = data.senderUserId || data.userId || data.senderId || remotePeerId;
        const remoteName = getSocketUserName(data);
        console.log('WebRTC peer discovery message received:', data.type, remotePeerId);
        rememberAttendeeName(remoteUserId, remoteName);
        announceUserProfile();
        registerRemotePeer(remotePeerId, remoteUserId, true, remoteName);
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
          const remotePeerId = getParticipantPeerId(participant);
          const remoteUserId = getParticipantUserId(participant, remotePeerId);
          const remoteName = getParticipantName(participant);

          rememberAttendeeName(remoteUserId, remoteName);
          registerRemotePeer(remotePeerId, remoteUserId, true, remoteName);
        });
      }

      if (data.type === 'peer-left' || data.type === 'camera-off' || data.type === 'user-left' || data.type === 'participant-left') {
        if (didHostLeave(data)) {
          redirectGuestsAfterHostLeaves();
          return;
        }

        removeRemotePeer(getSocketPeerId(data));
      }

      if (data.type === 'webrtc-offer' || data.type === 'offer') {
        const remotePeerId = getSocketPeerId(data);
        const remoteUserId = data.senderUserId || data.userId || data.senderId || peerUserIdsRef.current.get(remotePeerId);
        const remoteName = getSocketUserName(data);
        const offerSdp = data.sdp || data.offer?.sdp;

        await handleRemoteOffer(remotePeerId, offerSdp, remoteUserId, remoteName);
      }

      if (data.type === 'webrtc-answer' || data.type === 'answer') {
        await handleRemoteAnswer(getSocketPeerId(data), data.sdp || data.answer?.sdp);
      }

      if (data.type === 'webrtc-ice' || data.type === 'ice-candidate') {
        await handleRemoteIce(getSocketPeerId(data), data.candidate);
      }
    };

    wsRef.current.onerror = () => {
      console.error('WebSocket error');
      setConnectionStatus('error');
    };

    wsRef.current.onclose = (event) => {
      console.log('WebSocket closed');
      const closeMessage = getBackendErrorMessage({ message: event.reason });

      if (closeMessage) {
        setBackendErrorMessage(closeMessage);
        setConnectionStatus('error');
        return;
      }

      setConnectionStatus('disconnected');
    };

    return () => {
      if (isHostRef.current) {
        markWatchPartyEnded({ keepalive: true });
      }

      if (isHostRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'host-left',
          partyId,
          userId,
          hostId: userId,
          senderId: userId,
          senderUserId: userId,
          peerId: myPeerIdRef.current || userId
        }));
      }

      if (wsRef.current) wsRef.current.close();
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
      activeRemotePeerIdsRef.current = new Set();
      peerUserIdsRef.current = new Map();
      peerDisplayNamesRef.current = new Map();
      attendeeNamesRef.current = {};
      pendingIncomingOffersRef.current = [];
      pendingOutboundPeersRef.current = new Set();
      processedOfferSdpRef.current = new Map();
      processedAnswerSdpRef.current = new Map();
      pendingIceCandidatesRef.current = {};
      myPeerIdRef.current = '';
      setRemoteStreams({});
      setRemoteDisplayNames({});
      setAttendeeNames({});
      setMyPeerId('');
      setKnownPeerCount(0);
    };
  }, [partyId, cfid, userId, playerReady, markWatchPartyEnded]);

  const handleShareParty = () => {
    const shareUrl = `${window.location.origin}/watchparty/play?partyId=${partyId}&cfid=${cfid}${movieId ? `&movieId=${movieId}` : ''}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Watch party link copied!');
  };

  const handleReloadPage = () => {
    window.location.reload();
  };

  const handleToggleAudio = async () => {
    if (!playerRef.current) return;

    const shouldEnableAudio = isPlayerMuted || audioActivationRequired;

    try {
      setPlayerMuted(!shouldEnableAudio);

      if (shouldEnableAudio) {
        const playResult = playerRef.current.play();
        if (playResult && typeof playResult.then === 'function') {
          await playResult;
        }
        setAudioActivationRequired(false);
      }
    } catch (err) {
      console.error('Failed to enable guest audio:', err?.name || err, err?.message || '');
      setPlayerMuted(true);
      setAudioActivationRequired(true);
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

    const storedUser = getStoredUser()
    const senderName = getStoredUserName(storedUser) || userName || 'Guest'
    rememberAttendeeName(userId, senderName)
    announceUserProfile(senderName)

    const outgoingMessage = {
      type: 'chat',
      clientId: `${userId || 'guest'}-${Date.now()}`,
      partyId,
      userId,
      senderId: userId,
      senderUserId: userId,
      userName: senderName,
      senderName,
      name: senderName,
      user: {
        _id: userId,
        name: senderName
      },
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

  const moviesButtonClass = 'rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700';

  if (backendErrorMessage) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center px-6 text-center text-white gap-4">
        <h2 className="text-2xl font-bold">Watch party not available</h2>
        <p className="max-w-md text-gray-400">{backendErrorMessage}</p>
        <button
          type="button"
          onClick={() => router.push('/movies')}
          className={moviesButtonClass}
        >
          Back to movies
        </button>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <h2 className="text-2xl font-bold">Redirecting</h2>
        <p className="text-gray-400">You need to sign in to join the watch party</p>
        <button
          type="button"
          onClick={() => router.push('/movies')}
          className={moviesButtonClass}
        >
          Back to movies
        </button>
      </div>
    );
  }

  if (!partyId || !cfid || !userId) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
        <h2 className="text-2xl font-bold">Error</h2>
        <p className="text-gray-400">Missing watch party parameters</p>
        <button
          type="button"
          onClick={() => router.push('/movies')}
          className={moviesButtonClass}
        >
          Back to movies
        </button>
      </div>
    );
  }

  const cameraCount = (localStream ? 1 : 0) + Object.keys(remoteStreams).length;
  const getCameraDisplayName = (peerId = '') => {
    return remoteDisplayNames[peerId] || peerDisplayNamesRef.current.get(peerId) || peerId.slice(0, 8) || 'Guest'
  }

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
            {userName ? `${userName} (You)` : 'You'}
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
            {getCameraDisplayName(peerId)}
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

      {/* <div className="absolute right-6 top-20 z-20 flex max-w-[calc(100vw-3rem)] flex-col items-end gap-3">
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
      </div> */}

      <div className="relative flex min-w-0 flex-1 flex-col justify-between p-6">
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

        <div className="flex justify-center items-start z-10">
          <div className="invisible" />
          <h2 className="text-sm font-medium opacity-80 uppercase tracking-widest text-center max-w-xs">
            Watch Party
            {isHost && <span className="ml-2 text-red-500 text-xs">HOST</span>}
          </h2>
          {/* <button
            onClick={() => setActivePanel(null)}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
          >
            <MdClose size={20} />
          </button> */}
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

        <div className="z-10 flex flex-col gap-6">
          {!isHost && showGuestControlNotice && (
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
                type="button"
                onClick={handleToggleAudio}
                className={`p-2 rounded-lg transition ${audioActivationRequired || isPlayerMuted
                  ? 'bg-white/15 text-white hover:bg-white/25'
                  : 'hover:bg-white/10'
                  }`}
                title={audioActivationRequired || isPlayerMuted ? 'Enable audio' : 'Mute audio'}
                aria-label={audioActivationRequired || isPlayerMuted ? 'Enable audio' : 'Mute audio'}
              >
                {audioActivationRequired || isPlayerMuted ? <MdVolumeOff size={22} /> : <MdVolumeUp size={22} />}
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

      {activePanel && (
        <aside className="relative z-30 h-full w-[min(24rem,45vw)] min-w-[18rem] shrink-0 border-l border-white/10 bg-black/95 shadow-2xl backdrop-blur-md animate-in slide-in-from-right duration-300 pointer-events-auto">
          {activePanel === 'comments' ? (
            <CommentsPanel
              messages={messages}
              userNamesById={attendeeNames}
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
                <button
                  type="button"
                  onClick={handleReloadPage}
                  className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/15"
                >
                  <IoIosRefresh size={18} />
                  More faces
                </button>

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
                  <span>{knownPeerCount}</span>
                </div>
                <div className="mt-1 flex justify-between gap-3">
                  <span>Your peer</span>
                  <span className="max-w-32 truncate">{myPeerId || userId || 'waiting'}</span>
                </div>
              </div>
              {cameraError ? (
                <span className="ml-3 mb-3 text-xs text-red-200">{cameraError}</span>
              ) : null}

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                {renderCameraTiles()}
              </div>
            </div>
          ) : (
            <AttendeesPanel />
          )}
        </aside>
      )}


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
