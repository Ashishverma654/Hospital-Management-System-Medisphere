import { useEffect, useRef, useState } from 'react';
import { connectSocket } from '../services/socket.js';
import { Button } from './ui/button.jsx';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export default function VideoCall({ appointmentId, role = 'patient', onEnd, onStatusChange }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const [status, setStatus] = useState('Connecting...');
  const [sessionKey, setSessionKey] = useState(0);
  const [participantRole, setParticipantRole] = useState(null);

  useEffect(() => {
    if (!appointmentId) return undefined;

    const socket = connectSocket();
    socketRef.current = socket;

    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peerRef.current = peer;

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { appointmentId, candidate: event.candidate });
      }
    };

    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    const attachLocalStream = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    };

    const createOffer = async () => {
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('offer', { appointmentId, offer });
      } catch {
        setStatus('Unable to start call.');
      }
    };

    const handleJoined = async () => {
      try {
        await attachLocalStream();
        setStatus(role === 'doctor' ? 'Waiting for patient to join...' : 'Waiting for doctor to join...');
        if (role === 'doctor') {
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

    return () => {
      socket.off('joined-room', handleJoined);
      socket.off('join-error');
      socket.off('participant-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('participant-left');

      if (peerRef.current) {
        peerRef.current.close();
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    return () => {
      socket.off('joined-room', handleJoined);
      socket.off('join-error');
      socket.off('participant-joined');
      socket.off('offer');
      socket.off('answer');
      socket.off('ice-candidate');
      socket.off('participant-left');

      if (peerRef.current) {
        peerRef.current.close();
      }

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [appointmentId, role, sessionKey]);

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
        <Button variant="destructive" onClick={onEnd}>End call</Button>
      </div>
    </div>
  );
}
