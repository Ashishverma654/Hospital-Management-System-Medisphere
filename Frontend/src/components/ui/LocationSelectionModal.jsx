import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Search, Loader2 } from 'lucide-react';
import { getLocations } from '../../services/apiServices';

export default function LocationSelectionModal({ isOpen, onClose, onSelect, title = "Select Hospital Location" }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLocations();
    }
  }, [isOpen]);

  const fetchLocations = async () => {
    setIsLoading(true);
    try {
      const response = await getLocations();
      // Handle axios response structure or raw data depending on api.js interceptor
      const data = Array.isArray(response) ? response : response?.data || [];
      setLocations(data);
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Dynamically group locations by state
  const groupedData = locations.reduce((acc, loc) => {
    const region = loc.state || "Other";
    if (!acc[region]) acc[region] = [];
    
    const matchesSearch = 
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      loc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      region.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (matchesSearch) {
      acc[region].push(loc);
    }
    return acc;
  }, {});

  // Remove empty regions
  const filteredData = Object.entries(groupedData).filter(([_, hospitals]) => hospitals.length > 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by hospital name or city..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#ee4c35]/30 focus:border-[#ee4c35]/50 transition-all text-gray-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Location List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                 <Loader2 className="h-10 w-10 animate-spin mb-4 text-[#ee4c35]" />
                 <p className="font-medium">Loading locations...</p>
               </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No locations found matching "{searchQuery}"
              </div>
            ) : (
              filteredData.map(([region, hospitals]) => (
                <div key={region} className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-2">{region}</h4>
                  <div className="space-y-2">
                    {hospitals.map((loc) => (
                      <button
                        key={loc._id}
                        onClick={() => {
                          onSelect(loc.name);
                          onClose();
                        }}
                        className="w-full text-left px-4 py-4 rounded-xl border border-gray-100 hover:border-[#ee4c35] hover:bg-orange-50/30 hover:shadow-sm transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-gray-400 group-hover:text-[#ee4c35] transition-colors" />
                          <div className="flex flex-col">
                             <span className="font-semibold text-gray-700 group-hover:text-gray-900">{loc.name}</span>
                             <span className="text-xs text-gray-500">{loc.address}, {loc.city}</span>
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-[#ee4c35] flex items-center justify-center shrink-0">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#ee4c35] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
