/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState } from 'react';

const DoctorVideoCallContext = createContext(null);

export function DoctorVideoCallProvider({ children }) {
  const [videoAppointment, setVideoAppointment] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const openVideoCall = (appointment) => {
    if (!appointment) return;
    setVideoAppointment(appointment);
    setIsOpen(true);
  };

  const closeVideoCall = () => {
    setIsOpen(false);
    setVideoAppointment(null);
  };

  const value = useMemo(
    () => ({
      isOpen,
      videoAppointment,
      openVideoCall,
      closeVideoCall,
      setVideoAppointment,
    }),
    [isOpen, videoAppointment]
  );

  return (
    <DoctorVideoCallContext.Provider value={value}>
      {children}
    </DoctorVideoCallContext.Provider>
  );
}

export function useDoctorVideoCall() {
  const context = useContext(DoctorVideoCallContext);
  if (!context) {
    throw new Error('useDoctorVideoCall must be used within DoctorVideoCallProvider');
  }
  return context;
}
