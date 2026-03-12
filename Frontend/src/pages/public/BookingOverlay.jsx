import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Search, ChevronRight, X, HeartPulse, Activity, Brain, 
  Stethoscope, Thermometer, Accessibility, Filter, ArrowUpDown 
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LocationSelectionModal from '../../components/ui/LocationSelectionModal';

import { 
  getDoctors, 
  getDepartments 
} from '../../services/apiServices';

export default function BookingOverlay({ isOpen, onClose }) {
  const navigate = useNavigate();
  // Valid views: 'main', 'specialities', 'doctors'
  const [view, setView] = useState('main'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState(null);
  
  // Dynamic data states
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Doctor filters
  const [videoConsult, setVideoConsult] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [sortOrder, setSortOrder] = useState(null); // 'fee-asc', 'fee-desc', 'exp-desc'
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Redux Auth
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const depts = await getDepartments();
      setDepartments(Array.isArray(depts) ? depts : depts?.data || []);
      
      const docs = await getDoctors();
      setDoctors(Array.isArray(docs) ? docs : docs?.data || []);
    } catch (err) {
      console.error("Failed to load booking data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // If overlay is closed, don't render content
  if (!isOpen) return null;

  const handleClose = () => {
    setView('main');
    setSearchQuery('');
    setSelectedSpeciality(null);
    onClose();
  };

  const handleSpecialitySelect = (name) => {
    setSelectedSpeciality(name);
    setView('doctors');
  };

  // Derive filtered specialities based on search
  const filteredSpecialities = departments.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtering and Sorting
  let displayedDoctors = doctors;
  if (selectedSpeciality) {
     displayedDoctors = displayedDoctors.filter(doc => doc.departmentId?.name === selectedSpeciality);
  }
  
  if (selectedLocation) {
     displayedDoctors = displayedDoctors.filter(doc => 
       doc.hospitalLocations?.some(loc => loc.name === selectedLocation)
     );
  }

  const sortedDoctors = [...displayedDoctors];
  if (sortOrder === 'fee-asc') {
    sortedDoctors.sort((a, b) => a.consultationFee - b.consultationFee);
  } else if (sortOrder === 'fee-desc') {
     sortedDoctors.sort((a, b) => b.consultationFee - a.consultationFee);
  } else if (sortOrder === 'exp-desc') {
     sortedDoctors.sort((a, b) => (b.experienceYear || 0) - (a.experienceYear || 0));
  }

  const handleBookClick = () => {
    if (!user) {
      navigate('/login');
    } else {
      alert("Proceeding to actual booking gateway.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#f4f5f7] overflow-y-auto w-full h-full flex flex-col">
      {/* Header Area */}
      <div className="bg-white border-b sticky top-0 z-10 px-4 py-3 shadow-sm flex items-center">
        <button 
          onClick={view === 'main' ? handleClose : () => {
            if (view === 'doctors') setView('specialities');
            else setView('main');
          }} 
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-700" />
        </button>
        <span className="text-xl font-bold font-sans text-gray-800">
          {view === 'main' && "Book Appointment"}
          {view === 'specialities' && "All Medanta Specialities"}
          {view === 'doctors' && "Book Appointment"}
        </span>
      </div>

      {/* Main Content Area based on View */}
      <div className="flex-1 w-full max-w-4xl mx-auto p-4 md:p-6">
        
        {/* VIEW 1: Main Search Overlay */}
        {view === 'main' && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-semibold text-gray-700 text-sm">Showing in</span>
              <div className="flex items-center text-[#ee4c35] font-semibold cursor-pointer">
                <MapPin className="h-4 w-4 mr-1" /> All Medanta Hospitals <span className="ml-1 text-xs">▼</span>
              </div>
            </div>

            <div 
              className="bg-white border rounded-xl p-4 flex items-center cursor-text shadow-sm hover:shadow transition-shadow"
              onClick={() => setView('specialities')}
            >
              <input 
                type="text" 
                placeholder="Search For Doctors or Speciality" 
                className="w-full outline-none text-gray-700 text-lg bg-transparent cursor-pointer pointer-events-none"
                readOnly
              />
              <Search className="h-6 w-6 text-gray-400" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6 mt-6">
              <h3 className="font-bold text-gray-800 mb-6 font-sans">All Medanta Specialities</h3>
              <div className="flex flex-wrap items-center justify-start gap-4">
                {departments.slice(0, 9).map((dept) => (
                  <button 
                    key={dept._id} 
                    onClick={() => handleSpecialitySelect(dept.name)}
                    className="flex flex-col items-center gap-2 p-3 min-w-[100px] rounded-xl border border-gray-100 hover:border-[#ee4c35] hover:bg-orange-50/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-[#ee4c35] group-hover:bg-white group-hover:shadow-md transition-all">
                      <HeartPulse className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 text-center uppercase tracking-tight line-clamp-2">{dept.name}</span>
                  </button>
                ))}
                
                <div 
                  className="flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform ml-2"
                  onClick={() => setView('specialities')}
                >
                  <div className="h-10 w-10 flex items-center justify-center mb-1">
                    <ArrowLeft className="h-5 w-5 text-[#ee4c35] rotate-180" />
                  </div>
                  <span className="text-[10px] text-[#ee4c35] font-bold text-center">View All</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: All Specialities List */}
        {view === 'specialities' && (
          <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="h-full flex flex-col">
            <div className="bg-white border rounded-xl p-4 flex items-center shadow-sm mb-4">
              <input 
                type="text" 
                placeholder="Search for specialities" 
                autoFocus
                className="w-full outline-none text-gray-700 text-lg bg-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="h-6 w-6 text-gray-400" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="max-h-[70vh] overflow-y-auto p-4">
                {filteredSpecialities.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No specialities found for "{searchQuery}"</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredSpecialities.map((dept) => (
                      <button 
                        key={dept._id}
                        onClick={() => handleSpecialitySelect(dept.name)}
                        className="p-4 rounded-xl border border-gray-100 bg-white text-gray-700 font-bold text-sm hover:border-[#ee4c35] hover:text-[#ee4c35] transition-all text-left shadow-sm flex items-center justify-between group"
                      >
                        {dept.name}
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: Doctors List */}
        {view === 'doctors' && (
          <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} className="space-y-4">
            
            <div className="bg-white border rounded-xl p-3 flex items-center justify-between shadow-sm">
              <span className="text-gray-700 font-bold pl-2">{selectedSpeciality}</span>
              <button 
                onClick={() => {
                  setSelectedSpeciality(null);
                  setView('specialities');
                }} 
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="flex gap-2 relative w-full justify-end">
                <Button 
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  variant="outline" 
                  className="h-9 gap-2 text-gray-600 bg-white shadow-sm border-gray-200 text-xs"
                >
                  <ArrowUpDown className="h-3 w-3" /> 
                  Sort ▼
                </Button>

                {showSortDropdown && (
                  <div className="absolute top-10 right-0 bg-white border border-gray-200 shadow-xl py-2 rounded-xl z-20 min-w-40 text-xs">
                     <button onClick={() => { setSortOrder('exp-desc'); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 font-medium">Experience: High to Low</button>
                     <button onClick={() => { setSortOrder('fee-asc'); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 font-medium">Fee: Low to High</button>
                     <button onClick={() => { setSortOrder('fee-desc'); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 font-medium">Fee: High to Low</button>
                     <button onClick={() => { setSortOrder(null); setShowSortDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-[#ffebeb] text-[#ee4c35] font-medium border-t mt-1">Clear Sort</button>
                  </div>
                )}

                <Button 
                  onClick={() => setIsFilterOpen(true)}
                  variant={selectedLocation ? "default" : "outline"} 
                  className={`h-9 gap-2 shadow-sm text-xs ${selectedLocation ? 'bg-[#ee4c35] text-white' : 'text-gray-600 bg-white border-gray-200'}`}
                >
                  <Filter className="h-3 w-3" /> 
                  {selectedLocation ? selectedLocation : 'Location'} ▼
                </Button>
              </div>
            </div>

            <div className="space-y-4 pb-12">
              {sortedDoctors.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-xl border border-dashed">
                   <p className="text-gray-400 font-medium">No doctors found for this criteria.</p>
                </div>
              ) : sortedDoctors.map((doc) => (
                <div key={doc._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex gap-4 flex-1">
                      <div className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                        {doc.userId?.profileImage ? (
                          <img src={doc.userId.profileImage} alt={doc.userId.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Stethoscope className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <h4 className="font-bold text-gray-800 text-lg">{doc.userId?.name || "Dr. Medanta"}</h4>
                        <p className="text-[#ee4c35] font-bold text-xs mb-1 uppercase tracking-wider">{doc.departmentId?.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                           <span>{doc.experienceYear}Y Exp</span>
                           <span className="text-gray-300">|</span>
                           <span className="font-bold text-gray-800">₹{doc.consultationFee}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-100 flex items-center gap-1">
                             ★ {doc.rating || 4.8}
                           </div>
                           <span className="text-[10px] text-gray-400">{doc.reviewsCount || 100}+ Satisfied Patients</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end justify-start sm:min-w-[150px]">
                      <span className="text-[10px] text-gray-400 mb-1">Next Availability</span>
                      <Button 
                        onClick={handleBookClick} 
                        variant="outline" 
                        className="w-full sm:w-auto text-blue-600 border-blue-100 bg-blue-50/30 hover:bg-blue-50 font-bold text-xs h-8"
                      >
                        Tomorrow 09:00 AM
                      </Button>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-2 flex items-center justify-center text-[10px] font-bold text-gray-500 border-t border-gray-100">
                    <MapPin className="h-3 w-3 mr-1 text-[#ee4c35]" /> {doc.hospitalLocations?.map(l => l.name).join(", ") || "Main Campus"}
                  </div>
                </div>
              ))}
            </div>

            <LocationSelectionModal 
               isOpen={isFilterOpen}
               onClose={() => setIsFilterOpen(false)}
               onSelect={(location) => setSelectedLocation(location)}
               title="Select Media Hospital Branch"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
