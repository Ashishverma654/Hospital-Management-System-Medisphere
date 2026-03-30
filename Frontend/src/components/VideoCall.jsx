import { useEffect, useRef, useState } from 'react';
import { connectSocket } from '../services/socket.js';
import { rtcApi } from '../services/apiServices.js';
import { Button } from './ui/button.jsx';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const TURN_URL = import.meta.env.VITE_TURN_URL;
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME;
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL;
if (TURN_URL && TURN_USERNAME && TURN_CREDENTIAL) {
  ICE_SERVERS.push({ urls: TURN_URL, username: TURN_USERNAME, credential: TURN_CREDENTIAL });
}

export default function VideoCall({ appointmentId, role = 'patient', onEnd, onStatusChange, iceServers }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const endingRef = useRef(false);
  const offerSentRef = useRef(false);
  const localReadyRef = useRef(false);
  const canOfferRef = useRef(false);
  const reconnectingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);
  const [status, setStatus] = useState('Connecting...');
  const [sessionKey, setSessionKey] = useState(0);
  const [participantRole, setParticipantRole] = useState(null);
  const [resolvedIceServers, setResolvedIceServers] = useState(null);

  useEffect(() => {
    let mounted = true;
    const resolveIceServers = async () => {
      if (iceServers?.length) {
        if (mounted) setResolvedIceServers(iceServers);
        return;
      }
      try {
        const data = await rtcApi.getIce();
        const servers = data?.iceServers || data?.data?.iceServers || data?.v?.iceServers || [];
        if (mounted) {
          setResolvedIceServers(servers.length ? servers : ICE_SERVERS);
        }
      } catch {
        if (mounted) setResolvedIceServers(ICE_SERVERS);
      }
    };
    resolveIceServers();
    return () => {
      mounted = false;
    };
  }, [iceServers, appointmentId, sessionKey]);

  useEffect(() => {
    if (!appointmentId) return undefined;

    const socket = connectSocket();
    socketRef.current = socket;

    if (!resolvedIceServers) return undefined;
    const peer = new RTCPeerConnection({ iceServers: resolvedIceServers });
    peerRef.current = peer;
    offerSentRef.current = false;
    localReadyRef.current = false;
    canOfferRef.current = false;

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { appointmentId, candidate: event.candidate });
      }
    };

    const attachVideoStream = (videoEl, stream) => {
      if (!videoEl) return;
      videoEl.srcObject = stream;
      const playPromise = videoEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    };

    peer.ontrack = (event) => {
      const [stream] = event.streams;
      attachVideoStream(remoteVideoRef.current, stream);
    };

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const scheduleIceRestart = () => {
      if (role !== 'doctor') return;
      if (reconnectingRef.current) return;
      if (reconnectAttemptsRef.current >= 3) {
        setStatus('Connection failed.');
        return;
      }
      reconnectingRef.current = true;
      reconnectAttemptsRef.current += 1;
      setStatus('Reconnecting...');
      clearReconnectTimer();
      reconnectTimerRef.current = setTimeout(async () => {
        try {
          peer.restartIce();
          await createOffer({ iceRestart: true, force: true });
        } catch {
          setStatus('Connection failed.');
        } finally {
          reconnectingRef.current = false;
        }
      }, 2500);
    };

    peer.oniceconnectionstatechange = () => {
      const state = peer.iceConnectionState;
      if (state === 'connected' || state === 'completed') {
        clearReconnectTimer();
        reconnectAttemptsRef.current = 0;
        setStatus('Connected');
      }
      if (state === 'failed' || state === 'disconnected') {
        scheduleIceRestart();
      }
    };

    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      if (state === 'connected') {
        clearReconnectTimer();
        reconnectAttemptsRef.current = 0;
        setStatus('Connected');
      }
      if (state === 'failed') {
        scheduleIceRestart();
      }
    };

    const attachLocalStream = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      attachVideoStream(localVideoRef.current, stream);
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    };

    const createOffer = async (options = {}) => {
      try {
        if (offerSentRef.current && !options.force) return;
        if (!localReadyRef.current) return;
        if (!canOfferRef.current) return;
        const offer = await peer.createOffer(options.iceRestart ? { iceRestart: true } : undefined);
        await peer.setLocalDescription(offer);
        socket.emit('offer', { appointmentId, offer });
        offerSentRef.current = true;
      } catch {
        setStatus('Unable to start call.');
      }
    };

    const handleJoined = async () => {
      try {
        await attachLocalStream();
        localReadyRef.current = true;
        setStatus(role === 'doctor' ? 'Waiting for patient to join...' : 'Waiting for doctor to join...');
        if (role === 'doctor' && canOfferRef.current) {
          await createOffer();
        }
      } catch {
        setStatus('Camera/mic access denied.');
      }
    };

    socket.emit('join-room', { appointmentId });
    socket.on('joined-room', handleJoined);
    socket.on('join-error', (payload) => {
      setStatus(payload?.message || 'Unable to join video room.');
    });
    socket.on('participant-joined', async ({ role: joinedRole }) => {
      setParticipantRole(joinedRole || 'participant');
      setStatus(joinedRole === 'doctor' ? 'Doctor joined. Connecting...' : 'Patient joined. Connecting...');
      if (role === 'doctor') {
        canOfferRef.current = true;
        await createOffer();
      }
    });
    socket.on('room-ready', async ({ hasParticipant, participantRole: joinedRole }) => {
      if (!hasParticipant) return;
      setParticipantRole(joinedRole || 'participant');
      setStatus(joinedRole === 'doctor' ? 'Doctor joined. Connecting...' : 'Patient joined. Connecting...');
      if (role === 'doctor') {
        canOfferRef.current = true;
        await createOffer();
      }
    });
    socket.on('offer', async ({ offer }) => {
      try {
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('answer', { appointmentId, answer });
        setStatus('Connected');
      } catch {
        setStatus('Connection failed.');
      }
    });
    socket.on('answer', async ({ answer }) => {
      try {
        await peer.setRemoteDescription(answer);
        setStatus('Connected');
      } catch {
        setStatus('Connection failed.');
      }
    });
    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        await peer.addIceCandidate(candidate);
      } catch {
        /* ignore failed candidates */
      }
    });
    socket.on('participant-left', () => {
      setStatus('Participant disconnected.');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    socket.on('call-ended', ({ reason }) => {
      setStatus(reason || 'Call ended.');
      if (typeof onEnd === 'function' && !endingRef.current) {
        endingRef.current = true;
        onEnd();
      }
    });

    return () => {
      socket.off('joined-room', handleJoined);
      socket.off('join-error');
      socket.off('participant-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('participant-left');
      socket.off('call-ended');
      socket.off('room-ready');

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (peerRef.current) {
        peerRef.current.close();
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [appointmentId, role, sessionKey, resolvedIceServers, onEnd]);

  useEffect(() => {
    if (typeof onStatusChange === 'function') {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  const canReconnect = ['Participant disconnected.', 'Connection failed.', 'Unable to start call.'].includes(status);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
        {status}
        {participantRole && (
          <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {participantRole}
          </span>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-background/60 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">You</p>
          <video ref={localVideoRef} autoPlay playsInline muted className="mt-2 aspect-video w-full rounded-xl bg-black" />
        </div>
        <div className="rounded-2xl border border-border bg-background/60 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Participant</p>
          <video ref={remoteVideoRef} autoPlay playsInline className="mt-2 aspect-video w-full rounded-xl bg-black" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        {canReconnect && (
          <Button variant="outline" onClick={() => setSessionKey((k) => k + 1)}>
            Rejoin call
          </Button>
        )}
        <Button
          variant="destructive"
          onClick={() => {
            endingRef.current = true;
            socketRef.current?.emit('end-call', { appointmentId, reason: `${role} ended the call.` });
            if (typeof onEnd === 'function') {
              onEnd();
            }
          }}
        >
          End call
        </Button>
      </div>
    </div>
  );
}
