// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { 
  Building2, 
  Calendar, 
  FileText, 
  Activity, 
  Video, 
  ShieldCheck,
  Stethoscope,
  Heart,
  Brain,
  Baby,
  Smile
} from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function Home() {
  return (
    <div className="w-full relative min-h-screen">
      <div className="absolute top-0 w-full h-[600px] bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/15 -z-10 blur-3xl" />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-32 flex flex-col items-center text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
            <Activity className="h-4 w-4 mr-2" />
            Leading Healthcare Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground mb-6">
            Smart Hospital <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Management System
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Experience seamless healthcare operations, advanced patient care, and administrative excellence all in one unified platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="rounded-full shadow-lg shadow-primary/30 bg-gradient-to-r from-primary to-secondary hover:opacity-95 h-12 px-8 text-md" asChild>
              <Link to="/login">Book Appointment</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-md border-2 border-primary/30 hover:bg-primary/10 hover:border-primary/50" asChild>
              <Link to="#doctors">Find Doctors</Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="bg-gradient-to-b from-primary/5 via-background to-secondary/5 py-24 border-y border-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Comprehensive Care Solutions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need for modern healthcare management, wrapped in an intuitive interface.
            </p>
          </div>
          
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { icon: Calendar, title: "Online Appointment Booking", desc: "Schedule visits easily with real-time doctor availability." },
              { icon: FileText, title: "Digital Prescriptions", desc: "Access and download electronic prescriptions instantly." },
              { icon: Activity, title: "Lab Reports Access", desc: "View diagnostic results securely from your device." },
              { icon: Video, title: "Telemedicine", desc: "Consult with specialists remotely via integrated video calls." },
              { icon: ShieldCheck, title: "Insurance Integration", desc: "Seamless billing and insurance claim processing." },
              { icon: Building2, title: "Ward Management", desc: "Real-time bed tracking and availability monitoring." }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeIn}>
                <Card className="bg-background/60 backdrop-blur-md border border-border/50 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Departments Section */}
      <section id="doctors" className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-full h-[400px] bg-gradient-to-t from-secondary/5 to-transparent -z-10 skew-y-3" />
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-4">Centers of Excellence</h2>
              <p className="text-muted-foreground max-w-2xl">
                Specialized departments equipped with state-of-the-art technology and leading experts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: Heart, name: "Cardiology", count: "12 Doctors" },
              { icon: Brain, name: "Neurology", count: "8 Doctors" },
              { icon: Building2, name: "Orthopedics", count: "15 Doctors" },
              { icon: Baby, name: "Pediatrics", count: "20 Doctors" },
              { icon: Smile, name: "Dermatology", count: "6 Doctors" }
            ].map((dept, i) => (
              <Card key={i} className="group hover:bg-gradient-to-br hover:from-primary hover:to-secondary hover:text-primary-foreground transition-all duration-300 cursor-pointer border-2 border-primary/10 hover:border-primary/30 shadow-lg hover:shadow-primary/20">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-full bg-muted group-hover:bg-primary-foreground/20 transition-colors">
                    <dept.icon className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{dept.name}</h3>
                    <p className="text-sm text-muted-foreground group-hover:text-primary-foreground/70">{dept.count}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <span className="font-bold text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4 inline-block">
              MediFlow
            </span>
            <p className="text-muted-foreground max-w-md mb-6">
              Empowering healthcare institutions with next-generation management software for better patient outcomes and streamlined operations.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link to="/login" className="hover:text-primary transition-colors">Patient Portal</Link></li>
              <li><Link to="/login" className="hover:text-primary transition-colors">Doctor Portal</Link></li>
              <li><Link to="/patient/book" className="hover:text-primary transition-colors">Book Appointment</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Emergency</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2 text-destructive font-medium">
                <ShieldCheck className="h-4 w-4" />
                Ambulance: 911
              </li>
              <li>Main Campus: 1-800-MEDIFLOW</li>
              <li>123 Health Avenue, Medical City</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 border-t border-border mt-12 pt-8 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} MediFlow Healthcare Solutions. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
