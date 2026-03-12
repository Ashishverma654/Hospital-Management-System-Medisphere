import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button } from '../../components/ui/button';
import { 
  Search, 
  Phone, 
  Stethoscope, 
  Activity, 
  HeartPulse, 
  Pill, 
  Ambulance, 
  FlaskConical, 
  HeartHandshake,
  Loader2
} from 'lucide-react';
import BookingOverlay from './BookingOverlay';
import LocationSelectionModal from '../../components/ui/LocationSelectionModal';

import { 
  getServices,
  getDepartments
} from '../../services/apiServices';

export default function Home() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  
  const [diagnosticServices, setDiagnosticServices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const services = await getServices();
      setDiagnosticServices(Array.isArray(services) ? services : services?.data || []);
      
      const depts = await getDepartments();
      setDepartments(Array.isArray(depts) ? depts : depts?.data || []);
    } catch (err) {
      toast.error("Unable to load latest services. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiagnosticClick = (title) => {
    setSelectedService(title);
    setIsLocationModalOpen(true);
  };

  const handleAuthGatedClick = (actionName) => {
    if (!user) {
      navigate('/login');
    } else {
      console.log(`Proceeding with ${actionName} for user ${user.patientId || user._id}`);
      alert(`Proceeding to ${actionName}`);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-50/50 font-sans pb-20">
      {/* Custom Hero Header matching the Patient Landing design */}
      <div className="bg-[#ee4c35] text-white relative h-[250px] md:h-[280px] overflow-hidden">
        {/* Wavy background mockup using CSS */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ 
            backgroundImage: `repeating-radial-gradient(ellipse at center, transparent 0, transparent 2px, white 3px, white 4px)`,
            backgroundSize: '100px 50px',
            backgroundPosition: '0 0, 50px 25px'
          }}
        ></div>

        <div className="container mx-auto px-4 md:px-8 h-full pt-10 flex justify-between items-start relative z-10">
          <div className="flex flex-col gap-1">
            <div className="text-xl md:text-2xl font-bold mt-2 tracking-wide">
              Hello, <span className="underline underline-offset-4 decoration-2">{user ? user.name : "Guest"}</span>
            </div>
            {user && (
              <button 
                onClick={() => navigate(`/${user.role}`)}
                className="text-white/80 hover:text-white text-xs font-bold tracking-widest uppercase flex items-center gap-1 transition-all group mt-1"
              >
                Go to Dashboard <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            )}
          </div>
          <div className="flex gap-4 items-center">
            <Button 
              onClick={() => handleAuthGatedClick("Emergency")}
              variant="outline" 
              className="text-white border-white hover:bg-white hover:text-[#ee4c35] rounded-full px-5 py-2 h-auto flex items-center gap-2 bg-transparent font-semibold shadow-sm transition-all"
            >
              Emergency <Ambulance className="h-5 w-5 ml-1" />
            </Button>
            <Button 
              onClick={() => handleAuthGatedClick("Call")}
              variant="outline" 
              size="icon" 
              className="text-white border-white hover:bg-white hover:text-[#ee4c35] rounded-full h-11 w-11 bg-transparent shadow-sm flex items-center justify-center transition-all"
            >
              <Phone className="h-5 w-5 fill-current" />
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Search Card */}
      <div className="container mx-auto px-4 md:px-8 -mt-24 md:-mt-32 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 md:p-8 max-w-4xl mx-auto border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Book Doctor Appointment</h2>
              <p className="text-gray-500 text-sm md:text-base mt-2 flex items-center gap-2">
                In-hospital or Video Consultation
              </p>
            </div>
            <div className="bg-gray-100 p-4 rounded-full flex items-center justify-center ring-4 ring-gray-50">
               <Stethoscope className="h-7 w-7 text-gray-700" />
            </div>
          </div>
          
          <div className="relative group" onClick={() => setIsBookingOpen(true)}>
            <input 
              type="text" 
              placeholder="Search For Doctors or Speciality" 
              className="w-full bg-[#f4f5f7] border-none rounded-xl py-5 px-6 pr-12 text-gray-700 text-lg outline-none focus:ring-2 focus:ring-[#ee4c35]/30 transition-shadow placeholder:text-gray-500 font-medium cursor-pointer"
              readOnly
            />
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-200 transition-colors">
              <Search className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="container mx-auto px-4 md:px-8 py-16 max-w-5xl">
        
        {/* Diagnostic Services */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-800 pl-2">Book Diagnostic Services</h3>
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-[#ee4c35]" />}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {(diagnosticServices.length > 0 ? diagnosticServices : [
              { name: "X-Ray, MRI, CT, ECHO", type: "X-Ray" },
              { name: "Health Check Packages", type: "Other" },
              { name: "Lab Tests", type: "Lab Test" }
            ]).map((service, idx) => (
              <ServiceCard 
                key={service._id || idx}
                icon={service.type === "Lab Test" ? <FlaskConical className="h-10 w-10 text-[#ee4c35]" /> : 
                      service.type === "X-Ray" ? <Activity className="h-10 w-10 text-[#ee4c35]" /> :
                      <HeartPulse className="h-10 w-10 text-[#ee4c35]" />} 
                title={service.name} 
                onClick={() => handleDiagnosticClick(service.name)}
              />
            ))}
          </div>
        </div>

        {/* Other Services */}
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-6 pl-2">Other Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <ServiceCard 
              icon={<Stethoscope className="h-10 w-10 text-[#ee4c35]" />} 
              title="Second Opinion" 
              onClick={() => handleAuthGatedClick("Second Opinion")}
            />
            <ServiceCard 
              icon={<Pill className="h-10 w-10 text-[#ee4c35]" />} 
              title="Medicine Delivery" 
              onClick={() => handleAuthGatedClick("Medicine Delivery")}
            />
            <ServiceCard 
              icon={<HeartHandshake className="h-10 w-10 text-[#ee4c35]" />} 
              title="Homecare Services" 
              onClick={() => handleAuthGatedClick("Homecare Services")}
            />
          </div>
        </div>

      </div>

      {/* The Booking Search Overlay */}
      <BookingOverlay 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
      />

      {/* Reusable Location Selection Modal */}
      <LocationSelectionModal 
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        title={`Select Location for ${selectedService}`}
        onSelect={(location) => {
           console.log(`Selected ${location} for ${selectedService}`);
           alert(`Proceeding to ${location} for ${selectedService}`);
        }}
      />
    </div>
  );
}

function ServiceCard({ icon, title, onClick }) {
  return (
    <div onClick={onClick} className="bg-white rounded-2xl border border-gray-100 p-8 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group">
      <div className="mb-5 p-4 rounded-full bg-gray-50 text-[#ee4c35] transform group-hover:-translate-y-1 transition-transform duration-300 ring-1 ring-gray-100/50 group-hover:ring-[#ee4c35]/20">
        {icon}
      </div>
      <p className="text-gray-700 font-medium">{title}</p>
    </div>
  );
}
