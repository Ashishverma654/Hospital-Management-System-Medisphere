import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doctorApi } from '../../services/apiServices';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  MapPin, 
  Calendar, 
  Clock, 
  Video, 
  Hospital,
  BookOpen,
  Play,
  Share2,
  Heart,
  ChevronDown,
  Award,
  BookMarked
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js';

export default function DoctorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('in-hospital');

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const data = await doctorApi.getById(id);
        setDoctor(data);
      } catch (err) {
        console.error("Failed to fetch doctor", err);
        toast.error("Doctor profile not found");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!doctor) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-xl font-semibold">Doctor not found</p>
      <Button onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );

  const stats = [
    { label: "Exp", value: `${doctor.experienceYears || 5}+ yrs` },
    { label: "Reviews", value: doctor.reviewsCount || 0 },
    { label: "Rating", value: doctor.rating || 0 },
  ];

  return (
    <div className="min-h-screen bg-muted/50/50 pb-20">
      {/* Premium Header Container */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
            
            {/* Left: Sticky Action Area / Avatar */}
            <div className="flex flex-col items-center gap-4 w-full md:w-auto">
              <button 
                onClick={() => navigate(-1)}
                className="self-start mb-4 p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              
              <div className="relative">
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white shadow-xl bg-muted">
                  <img 
                    src={doctor.userId.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.userId.name}`} 
                    alt={doctor.userId.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-card px-3 py-1 rounded-full shadow-md border border-slate-100 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold">{doctor.rating || '4.8'}</span>
                </div>
              </div>
            </div>

            {/* Middle: Doctor Info */}
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                  {doctor.title} {doctor.userId.name}
                </h1>
                <p className="text-lg font-medium text-muted-foreground">
                  {doctor.title} - {doctor.departmentId.name}
                </p>
                <p className="text-muted-foreground font-medium">Gastro Sciences</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(doctor.qualifications || []).map((q, i) => (
                  <span key={i} className="text-sm font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-md border border-border">
                    {q}
                  </span>
                ))}
              </div>

              <div className="flex gap-8 py-2">
                {stats.map(s => (
                  <div key={s.label}>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
                    <p className="text-xl font-bold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-4">
                <div className="flex items-center gap-2 bg-muted/50 border border-border px-4 py-2 rounded-xl text-sm font-medium">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Next Slot: Tomorrow 10:50 AM</span>
                </div>
                <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl text-sm font-medium text-rose-600">
                  <Video className="h-4 w-4" />
                  <span>Next Video Slot: Tomorrow 3:10 PM</span>
                </div>
              </div>
            </div>

            {/* Right: Booking Widget */}
            <div className="w-full md:w-[380px] shrink-0">
              <Card className="rounded-2xl overflow-hidden shadow-2xl border-none ring-1 ring-slate-200 bg-card">
                <div className="flex bg-muted/50 p-1 rounded-t-2xl">
                  <button 
                    onClick={() => setActiveTab('in-hospital')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'in-hospital' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Hospital className="h-4 w-4" />
                    In-Hospital
                  </button>
                  <button 
                    onClick={() => setActiveTab('video')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'video' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <Video className="h-4 w-4" />
                    Video
                  </button>
                </div>
                
                <CardContent className="p-6 space-y-6">
                  {/* Date Selector */}
                  <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                      {['Today', 'Tomorrow', '14 Mar\'26'].map((d, i) => (
                        <button key={i} className={`flex flex-col items-center gap-1 min-w-[70px] py-2 rounded-xl border-b-2 transition-all ${i === 1 ? 'border-primary' : 'border-transparent opacity-60'}`}>
                          <span className={`text-xs font-bold ${i === 1 ? 'text-primary' : 'text-muted-foreground'}`}>{d}</span>
                          <span className="text-[10px] font-bold text-green-600">{i === 1 ? '14 Slots' : 'No Slots'}</span>
                        </button>
                      ))}
                    </div>
                    <button className="p-2 hover:bg-muted rounded-full shrink-0">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Hospital Selection */}
                  <button className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-2xl border border-slate-100 group transition-all hover:bg-muted">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-card rounded-lg shadow-sm">
                        <Hospital className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-foreground">Medanta Hospital Lucknow</p>
                        <p className="text-[11px] font-bold text-muted-foreground">0 Slots Available Today | <span className="text-primary">₹{doctor.consultationFee}</span></p>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </button>

                  <Button className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20">
                    Book Appointment
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 md:py-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Left Column: Detailed Info */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* About Section */}
          <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground border-l-4 border-primary pl-4">
              About Dr. {doctor.userId.name.split(' ').pop()}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(doctor.expertise || []).slice(0, 3).map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
                  <p className="text-sm font-bold text-foreground">{item}</p>
                </div>
              ))}
            </div>

            <p className="text-muted-foreground leading-relaxed text-lg italic bg-muted/50 p-6 rounded-2xl border border-border">
              "{doctor.about || "A highly skilled professional dedicated to excellence in patient care and medical advancement."}"
            </p>
          </motion.section>

          {/* Collapsible Sections (Specialization, Articles, Media) */}
          <div className="space-y-4">
            
            {/* Specialization Accordion */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <button className="w-full flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-xl font-bold text-foreground">Specialization and Expertise</span>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="px-6 pb-6 pt-2 divide-y divide-slate-100">
                {(doctor.expertise || []).map((exp, i) => (
                  <div key={i} className="py-4 text-muted-foreground font-medium">{exp}</div>
                ))}
              </div>
            </div>

            {/* Articles Accordion */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <button className="w-full flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <BookMarked className="h-5 w-5 text-primary" />
                  <span className="text-xl font-bold text-foreground">Articles</span>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="px-6 pb-6 pt-2 space-y-6">
                {(doctor.articles || []).length > 0 ? (
                  doctor.articles.map((art, i) => (
                    <div key={i} className="flex gap-4 group cursor-pointer">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0">
                        <img src={art.image || "https://images.unsplash.com/photo-1576091160550-217359f41f4a?auto=format&fit=crop&q=80&w=200"} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-xs font-bold text-rose-500">{art.date}</p>
                        <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{art.title}</h4>
                        <p className="text-sm text-muted-foreground font-medium">By Dr. {doctor.userId.name}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm italic py-4">No articles published yet.</p>
                )}
              </div>
            </div>

            {/* Media Accordion */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <button className="w-full flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Play className="h-5 w-5 text-primary" />
                  <span className="text-xl font-bold text-foreground">Media</span>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="px-6 pb-6 pt-2">
                <div className="aspect-video w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden relative group">
                  <img src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=1200" alt="Video cover" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl shadow-primary/40 group-hover:scale-110 transition-transform">
                      <Play className="h-8 w-8 fill-white ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Secondary Widgets / Ads / Similar */}
        <div className="space-y-8">
           <Card className="rounded-2xl border-none ring-1 ring-slate-200 shadow-sm overflow-hidden">
             <div className="p-6 bg-primary/5 border-b border-primary/10">
                <h3 className="text-lg font-bold text-foreground">Need Help?</h3>
                <p className="text-sm text-muted-foreground font-medium">Chat with our medical assistant for guidance.</p>
             </div>
             <CardContent className="p-6">
                <Button variant="outline" className="w-full h-12 rounded-xl text-primary font-bold border-primary/20 hover:bg-primary/5">
                  Get Assistance
                </Button>
             </CardContent>
           </Card>

           <div className="p-8 rounded-3xl bg-indigo-900 text-white relative overflow-hidden">
             <div className="relative z-10 space-y-4">
                <h3 className="text-2xl font-bold leading-tight">Video Consultation from Home</h3>
                <p className="text-indigo-200 text-sm font-medium">Safe, secure, and convenient medical advice from your favorite doctors.</p>
                <Button className="bg-card text-indigo-900 hover:bg-muted font-bold border-none shadow-xl">
                  Book Video Slot
                </Button>
             </div>
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-card/10 rounded-full blur-3xl" />
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
