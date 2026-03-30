import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button.jsx';
import VideoCall from '../VideoCall.jsx';
import { useDoctorVideoCall } from '../../context/DoctorVideoCallContext.jsx';
import { appointmentApi } from '../../services/apiServices.js';
import { toast } from 'sonner';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function VideoCallDock() {
  const { isOpen, videoAppointment, closeVideoCall } = useDoctorVideoCall();
  const dockRef = useRef(null);
  const dragState = useRef({ dragging: false, offsetX: 0, offsetY: 0 });
  const [position, setPosition] = useState({ x: null, y: null });
  const [endingCall, setEndingCall] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (position.x !== null && position.y !== null) return;
    const padding = 24;
    const width = dockRef.current?.offsetWidth || 360;
    const height = dockRef.current?.offsetHeight || 420;
    setPosition({
      x: window.innerWidth - width - padding,
      y: window.innerHeight - height - padding,
    });
  }, [isOpen, position.x, position.y]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleMouseMove = (event) => {
      if (!dragState.current.dragging || !dockRef.current) return;
      const width = dockRef.current.offsetWidth;
      const height = dockRef.current.offsetHeight;
      const nextX = clamp(event.clientX - dragState.current.offsetX, 12, window.innerWidth - width - 12);
      const nextY = clamp(event.clientY - dragState.current.offsetY, 12, window.innerHeight - height - 12);
      setPosition({ x: nextX, y: nextY });
    };
    const handleMouseUp = () => {
      dragState.current.dragging = false;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen]);

  if (!isOpen || !videoAppointment) return null;

  const handlePointerDown = (event) => {
    if (!dockRef.current) return;
    dragState.current.dragging = true;
    const rect = dockRef.current.getBoundingClientRect();
    dragState.current.offsetX = event.clientX - rect.left;
    dragState.current.offsetY = event.clientY - rect.top;
  };

  const handleEndConsultation = async () => {
    if (!videoAppointment?._id) return;
    try {
      setEndingCall(true);
      await appointmentApi.complete(videoAppointment._id);
      toast.success('Consultation completed');
      closeVideoCall();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete consultation');
    } finally {
      setEndingCall(false);
    }
  };

  return (
    <div
      ref={dockRef}
      className="fixed z-[60] w-[340px] max-w-[90vw] rounded-2xl border border-border/60 bg-card shadow-2xl md:w-[420px]"
      style={{ left: position.x ?? 24, top: position.y ?? 24 }}
    >
      <div
        className="flex cursor-move items-center justify-between border-b border-border/60 px-4 py-3"
        onMouseDown={handlePointerDown}
        role="button"
        tabIndex={0}
      >
        <div>
          <p className="text-sm font-semibold">Video Consultation</p>
          <p className="text-xs text-muted-foreground">
            Appointment {videoAppointment?._id?.slice(-6)} • {videoAppointment?.patientId?.name || 'Patient'}
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-border bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          onClick={closeVideoCall}
        >
          Close
        </button>
      </div>
      <div className="p-4">
        <VideoCall appointmentId={videoAppointment._id} role="doctor" onEnd={handleEndConsultation} />
      </div>
      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent('doctor:open-prescription', {
                detail: { appointmentId: videoAppointment._id },
              })
            );
          }}
        >
          Write prescription
        </Button>
        <Button variant="destructive" size="sm" onClick={handleEndConsultation} disabled={endingCall}>
          {endingCall ? 'Ending...' : 'End consultation'}
        </Button>
      </div>
    </div>
  );
}
