import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { FileText, Printer, Plus, CreditCard, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { billingApi, patientApi, prescriptionApi, pharmacyApi, labReportApi } from '../../services/apiServices';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { BILLING_STAFF_ROLES } from '../../auth/constants.js';

export default function Billing() {
  const { user } = useSelector((state) => state.auth);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Custom Dynamic Generator State
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [globalInventory, setGlobalInventory] = useState([]);

  // Active Interactive Form State
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [daysConsulted, setDaysConsulted] = useState(1);
  const [otherCharges, setOtherCharges] = useState(0);

  // Computed Context Arrays
  const [baseDoctorFee, setBaseDoctorFee] = useState(0);
  const [computedMedicines, setComputedMedicines] = useState([]);
  const [computedLabReports, setComputedLabReports] = useState([]);
  const [calculating, setCalculating] = useState(false);

  const fetchInvoices = () => {
    if (BILLING_STAFF_ROLES.includes(user?.role)) {
      setLoading(true);
      
      patientApi.getAll()
        .then(res => setPatients(Array.isArray(res) ? res : []))
        .catch(() => console.error("Failed to fetch patients mapping"));

      pharmacyApi.getAll()
        .then(res => setGlobalInventory(Array.isArray(res) ? res : []))
        .catch(() => console.error("Failed to fetch inventory mapping"));

      billingApi.getAll()
        .then((res) => setInvoices(Array.isArray(res) ? res : []))
        .catch(() => toast.error('Failed to load all invoices'))
        .finally(() => setLoading(false));
      return;
    }
    if (user?.role !== 'patient' || !user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    billingApi
      .getMy()
      .then((res) => setInvoices(Array.isArray(res) ? res : []))
      .catch(() => toast.error('Failed to load invoices'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, [user?.id, user?.role]);

  // Deep Resolver Engine triggered when Patient natively changes
  useEffect(() => {
    if (!selectedPatientId) {
      setBaseDoctorFee(0);
      setComputedMedicines([]);
      setComputedLabReports([]);
      return;
    }

    const computeDynamicContext = async () => {
      setCalculating(true);
      try {
        // 1. Fetch historical Prescriptions structurally
        const presRes = await prescriptionApi.getByPatient(selectedPatientId);
        const prescriptions = Array.isArray(presRes?.data) ? presRes.data : [];

        // Determine Base Doctor Fee chronologically (use most recent explicit appointment mapping)
        let docFee = 0;
        if (prescriptions.length > 0 && prescriptions[0]?.doctorId?.consultationFee) {
          docFee = Number(prescriptions[0].doctorId.consultationFee) || 0;
        }
        setBaseDoctorFee(docFee);

        // Map explicitly assigned Medicines against global Inventory Price structurally
        const assignedMedicines = [];
        prescriptions.forEach(p => {
          if (Array.isArray(p.medicines)) {
            p.medicines.forEach(m => {
              // strict case-insensitive cross-referencing
              const stockMatch = globalInventory.find(inv => inv.name?.toLowerCase() === m.name?.toLowerCase());
              assignedMedicines.push({
                name: m.name,
                price: stockMatch && stockMatch.price ? Number(stockMatch.price) : 0
              });
            });
          }
        });
        setComputedMedicines(assignedMedicines);

        // 2. Fetch structural historical Lab Reports
        const labRes = await labReportApi.getByPatient(selectedPatientId);
        const reports = Array.isArray(labRes?.data) ? labRes.data : [];
        const attachedReports = reports.map(r => ({
          reportName: r.reportName || r.reportType || "Internal Test",
          price: 0 // Explicitly allows Administrator injection visually
        }));
        setComputedLabReports(attachedReports);

      } catch (err) {
        toast.error("Failed to auto-resolve patient's clinical chronologies.");
      } finally {
        setCalculating(false);
      }
    };

    computeDynamicContext();
  }, [selectedPatientId]);

  // Handle Lab Price Mutator inline explicitly
  const updateLabPrice = (index, newPrice) => {
    const fresh = [...computedLabReports];
    fresh[index].price = Number(newPrice) || 0;
    setComputedLabReports(fresh);
  };

  // Math Extrapolations safely
  const aggregatedDoctorFee = baseDoctorFee * Math.max(1, Number(daysConsulted) || 0);
  const aggregatedMedicineCharges = computedMedicines.reduce((sum, m) => sum + m.price, 0);
  const aggregatedLabCharges = computedLabReports.reduce((sum, r) => sum + r.price, 0);
  const trueTotal = aggregatedDoctorFee + aggregatedMedicineCharges + aggregatedLabCharges + (Number(otherCharges) || 0);

  const handlePay = (id) => {
    billingApi
      .pay(id, { paymentMethod: 'card' })
      .then(() => {
        toast.success('Payment recorded');
        setInvoices((prev) =>
          prev.map((inv) => (inv._id === id ? { ...inv, paymentStatus: 'paid' } : inv))
        );
      })
      .catch(() => toast.error('Payment failed'));
  };

  const executeInvoiceGeneration = async () => {
    if (!selectedPatientId) return toast.error("Please explicitly select a patient mapping.");
    
    try {
      await billingApi.create({
        patientId: selectedPatientId,
        daysConsulted: Number(daysConsulted) || 1,
        doctorFee: aggregatedDoctorFee,
        medicineCharges: aggregatedMedicineCharges,
        labCharges: aggregatedLabCharges,
        otherCharges: Number(otherCharges) || 0,
        medicinesBreakdown: computedMedicines,
        labReportsBreakdown: computedLabReports
      });
      toast.success("Invoice generated structurally and securely auto-dispatched!");
      setShowGenerateModal(false);
      
      // Reset Modal natively
      setSelectedPatientId('');
      setDaysConsulted(1);
      setOtherCharges(0);

      fetchInvoices();
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to natively generate exact invoice constraints');
    }
  };

  const totalRevenue = invoices.filter((i) => i.paymentStatus === 'paid').reduce((s, i) => s + (i.totalAmount || 0), 0);
  const pending = invoices.filter((i) => i.paymentStatus !== 'paid');
  const pendingAmount = pending.reduce((s, i) => s + (i.totalAmount || 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Billing & Invoices</h2>
          <p className="text-muted-foreground">
            Manage patient billing, payments, and dynamically structured invoice generation.
          </p>
        </div>
        {BILLING_STAFF_ROLES.includes(user?.role) && (
          <Button className="shadow-md shadow-primary/20" onClick={() => setShowGenerateModal(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Revenue (Paid)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${pendingAmount.toFixed(2)}</div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-background/50 backdrop-blur-sm border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pending Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{pending.length}</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card className="border-border/50 bg-background/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[120px]">Invoice ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv._id}>
                    <TableCell className="font-medium text-primary">
                      {inv._id?.slice(-8) || inv.id || '—'}
                    </TableCell>
                    <TableCell>
                      {inv.createdAt
                        ? new Date(inv.createdAt).toLocaleDateString()
                        : inv.date || '—'}
                    </TableCell>
                    <TableCell className="font-medium">${(inv.totalAmount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          inv.paymentStatus === 'paid'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-yellow-500/10 text-yellow-600'
                        }`}
                      >
                        {inv.paymentStatus || 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" title="View details">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      {inv.paymentStatus !== 'paid' &&
                        BILLING_STAFF_ROLES.includes(user?.role) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Process Payment"
                            className="text-primary hover:text-primary"
                            onClick={() => handlePay(inv._id)}
                          >
                            <CreditCard className="h-4 w-4" />
                          </Button>
                        )}
                      <Button variant="ghost" size="icon" title="Print">
                        <Printer className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && invoices.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">No invoices found.</div>
          )}
        </div>
      </Card>

      {/* Advanced Custom Native Invoice Generator Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Master Invoice Integrator</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            
            {/* Context Selector */}
            <div className="space-y-4 rounded-md border p-4 bg-muted/20">
              <div className="space-y-2">
                <Label>1. Patient Matrix Selector</Label>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Target a specific Patient ID..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(p => (
                      <SelectItem key={p._id} value={p._id}>
                        {p.userId?.name || 'Unknown User Layer'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {calculating && (
                <div className="flex items-center space-x-2 text-sm text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Recursively resolving array footprints...</span>
                </div>
              )}
            </div>

            {selectedPatientId && !calculating && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                
                {/* DOCTOR EXTRAPOLATION */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-1">Doctor Consultation Physics</h3>
                  <div className="grid grid-cols-2 gap-4 items-center">
                    <div className="space-y-1">
                      <Label className="text-xs">Base Chronological Fee ($)</Label>
                      <div className="font-mono text-sm pl-2">{baseDoctorFee.toFixed(2)}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Days Computed</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        value={daysConsulted} 
                        onChange={(e) => setDaysConsulted(e.target.value)} 
                        className="h-8"
                      />
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold text-primary">
                    Doctor Total: ${(aggregatedDoctorFee).toFixed(2)}
                  </div>
                </div>

                {/* MEDICINE EXTRAPOLATION */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-1">Explicit Med Mappings</h3>
                  {computedMedicines.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic pl-2">No active prescriptions tied to exact matrix.</p>
                  ) : (
                    <div className="space-y-2">
                      {computedMedicines.map((med, i) => (
                        <div key={i} className="flex justify-between items-center bg-muted/30 p-2 rounded text-sm px-4">
                          <span>{med.name}</span>
                          <span className="font-mono text-primary">${(med.price).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="text-right text-sm font-semibold text-primary pt-1">
                        Pharmacy Total: ${(aggregatedMedicineCharges).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                {/* LAB TEST EXTRAPOLATION */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-1">Lab Testing Physics</h3>
                  {computedLabReports.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic pl-2">Zero clinical tests pulled from historical cache.</p>
                  ) : (
                    <div className="space-y-2">
                      {computedLabReports.map((lab, i) => (
                        <div key={i} className="flex justify-between items-center bg-muted/30 p-2 rounded gap-4 px-4">
                          <span className="text-sm truncate w-1/2">{lab.reportName}</span>
                          <div className="flex items-center gap-2 w-1/3">
                            <span className="text-sm text-muted-foreground">$</span>
                            <Input 
                              type="number" 
                              value={lab.price} 
                              onChange={(e) => updateLabPrice(i, e.target.value)}
                              className="h-7 text-right"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="text-right text-sm font-semibold text-primary pt-1">
                        Pathology Total: ${(aggregatedLabCharges).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                {/* OTHER / GENERIC EXTRAPOLATION */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground border-b pb-1">Manual Overrides</h3>
                  <div className="flex items-center gap-4 pl-2">
                    <Label className="w-1/3">Miscellaneous Buffer ($)</Label>
                    <Input 
                      type="number" 
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(e.target.value)}
                      className="w-1/3"
                    />
                  </div>
                </div>

                {/* GRAND TOTAL */}
                <div className="pt-4 border-t flex justify-between items-center">
                  <span className="font-bold text-lg">Rigorous Aggregation</span>
                  <span className="font-bold text-2xl text-primary">${trueTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mr-2">
            <Button variant="outline" onClick={() => setShowGenerateModal(false)}>Cancel Structuring</Button>
            <Button onClick={executeInvoiceGeneration} disabled={!selectedPatientId || calculating}>Distribute Native Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
