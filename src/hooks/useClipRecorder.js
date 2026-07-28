import { useCallback, useRef, useState } from 'react';

/**
 * Host-only "Clip that" recorder.
 *
 * Flow: host clicks -> browser's native tab-share picker appears once ->
 * records for `durationMs` -> auto-stops -> exposes a downloadable clip URL.
 *
 * Deliberately NOT retroactive (doesn't capture "the last N minutes before
 * the click") and NOT canvas-composited (no manual drawing of movie + faces).
 * It captures whatever's on screen in the shared tab, which already includes
 * the movie player and camera tiles as rendered — no extra compositing code
 * needed. Fully local to the host's browser; no socket/backend involved.
 *
 * Audio: prefers display-media tab/system audio when granted. If the picker
 * yields video-only, optionally falls back to HTMLMediaElement.captureStream()
 * audio from the movie player (getAudioElement).
 */

const DEFAULT_DURATION_MS = 180000; // 3 minutes

const NO_AUDIO_WARNING =
  'No audio captured. Share This Tab and enable “Share tab audio”.';

function pickSupportedMimeType() {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  return candidates.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || '';
}

function buildRecordingStream(displayStream, getAudioElement) {
  const videoTracks = displayStream.getVideoTracks();
  let audioTracks = displayStream.getAudioTracks();
  let elementStream = null;

  if (audioTracks.length === 0 && typeof getAudioElement === 'function') {
    const mediaElement = getAudioElement();
    if (mediaElement?.captureStream) {
      try {
        elementStream = mediaElement.captureStream();
        audioTracks = elementStream.getAudioTracks();
      } catch {
        elementStream = null;
        audioTracks = [];
      }
    }
  }

  const recordingStream = new MediaStream([...videoTracks, ...audioTracks]);

  return { recordingStream, elementStream, hasAudio: audioTracks.length > 0 };
}

export function useClipRecorder({
  durationMs = DEFAULT_DURATION_MS,
  getAudioElement,
} = {}) {
  const recorderRef = useRef(null);
  const captureStreamRef = useRef(null);
  const elementStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const countdownIntervalRef = useRef(null);
  const stopTimeoutRef = useRef(null);
  const getAudioElementRef = useRef(getAudioElement);
  getAudioElementRef.current = getAudioElement;

  const [isRecording, setIsRecording] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [clipUrl, setClipUrl] = useState('');
  const [clipError, setClipError] = useState('');
  const [clipWarning, setClipWarning] = useState('');

  const cleanupTimers = useCallback(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    countdownIntervalRef.current = null;
    stopTimeoutRef.current = null;
  }, []);

  const stopCapture = useCallback(() => {
    captureStreamRef.current?.getTracks().forEach((track) => track.stop());
    captureStreamRef.current = null;
    // Element-capture tracks are derived from the player; stop only the ones we added.
    elementStreamRef.current?.getAudioTracks().forEach((track) => track.stop());
    elementStreamRef.current = null;
    cleanupTimers();
    setIsRecording(false);
  }, [cleanupTimers]);

  const stopClip = useCallback(() => {
    const recorder = recorderRef.current;
    cleanupTimers();

    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      return;
    }

    stopCapture();
  }, [cleanupTimers, stopCapture]);

  const startClip = useCallback(async () => {
    if (isRecording) return;

    setClipError('');
    setClipWarning('');
    setClipUrl('');

    try {
      // Native "share a tab/window/screen" picker — host should choose "this tab"
      // and enable "Share tab audio" for full in-tab sound.
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        systemAudio: 'include',
      });

      const { recordingStream, elementStream, hasAudio } = buildRecordingStream(
        displayStream,
        getAudioElementRef.current
      );

      captureStreamRef.current = displayStream;
      elementStreamRef.current = elementStream;

      if (!hasAudio) {
        setClipWarning(NO_AUDIO_WARNING);
      }

      const mimeType = pickSupportedMimeType();
      chunksRef.current = [];

      const recorder = new MediaRecorder(recordingStream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
        setClipUrl(URL.createObjectURL(finalBlob));
        stopCapture();
      };

      recorder.start();
      setIsRecording(true);

      let remaining = Math.round(durationMs / 1000);
      setSecondsLeft(remaining);
      countdownIntervalRef.current = setInterval(() => {
        remaining -= 1;
        setSecondsLeft(remaining);
      }, 1000);

      stopTimeoutRef.current = setTimeout(() => {
        if (recorder.state !== 'inactive') recorder.stop();
      }, durationMs);

      // Host clicking the browser's own "Stop sharing" bar early
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        if (recorder.state !== 'inactive') recorder.stop();
      });
    } catch (err) {
      // User cancelled the share picker, or capture isn't supported
      setClipError(err?.message || 'Screen capture was cancelled or failed.');
      stopCapture();
    }
  }, [isRecording, durationMs, stopCapture]);

  return {
    isRecording,
    secondsLeft,
    clipUrl,
    clipError,
    clipWarning,
    startClip,
    stopClip,
  };
}
