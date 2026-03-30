import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { pharmacyOrderApi, prescriptionApi } from '../../services/apiServices.js';
import { toast } from 'sonner';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { staggerContainer, staggerItem } from '../../lib/animation-variants.js'; // eslint-disable-line no-unused-vars

export default function PatientPrescriptions() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appointmentFilter = searchParams.get('appointmentId');
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placingId, setPlacingId] = useState('');

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const data = await prescriptionApi.getMy();
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load prescriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const filteredPrescriptions = useMemo(() => {
    if (!appointmentFilter) return prescriptions;
    return prescriptions.filter((item) => String(item.appointmentId?._id || item.appointmentId) === String(appointmentFilter));
  }, [appointmentFilter, prescriptions]);

  const handleDownloadPdf = async (id) => {
    try {
      const blob = await prescriptionApi.downloadPdf(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription-${id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Unable to download PDF.');
    }
  };

  const placeOrder = async (prescription) => {
    try {
      setPlacingId(prescription._id);
      await pharmacyOrderApi.placeFromPrescription(prescription._id, {
        items: (prescription.medicines || []).map((item, index) => ({
          prescriptionMedicineIndex: index,
          quantity: Number(item.quantity || 1),
        })),
      });
      toast.success('Medicine order placed successfully.');
      await loadPrescriptions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place medicine order.');
    } finally {
      setPlacingId('');
    }
  };

  return (
    <motion.section variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <div className="rounded-2xl bg-card p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.15em] text-muted-foreground">Pharmacy Link</p>
        <h2 className="mt-2 text-3xl font-semibold text-foreground">Prescriptions</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Review doctor-issued prescriptions and place medicine orders while you are still inside the hospital.
        </p>
      </div>

      {appointmentFilter && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Showing prescriptions for appointment {appointmentFilter.slice(-8).toUpperCase()}.
          <Button
            variant="outline"
            className="ml-3"
            onClick={() => navigate('/patient/prescriptions')}
          >
            Clear filter
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {filteredPrescriptions.map((prescription) => (
          <article key={prescription._id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-foreground">
                  Prescription {String(prescription._id).slice(-8).toUpperCase()}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Doctor: {prescription.doctorId?.userId?.name || 'Hospital Doctor'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Issued on {new Date(prescription.issuedAt || prescription.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground">
                  {prescription.status || 'active'}
                </span>
                {prescription.pharmacyOrderId && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Order placed
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Diagnosis</p>
                  <p className="mt-2 text-sm text-foreground">{prescription.diagnosis || prescription.clinicalNotes || 'Not specified'}</p>
                </div>
                <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Advice</p>
                  <p className="mt-2 text-sm text-foreground">{prescription.advice || 'No special advice.'}</p>
                </div>
              </div>
              {prescription.followUpDate && (
                <div className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Follow-up</p>
                  <p className="mt-2 text-sm text-foreground">
                    {new Date(prescription.followUpDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {prescription.admissionRecommended && (
                <div className="rounded-xl border border-amber-300/50 bg-amber-50/30 p-4 text-sm text-amber-800">
                  Admission has been recommended by your doctor.
                </div>
              )}
            </div>

            <div className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Medicine</th>
                    <th className="px-4 py-3">Dosage</th>
                    <th className="px-4 py-3">Frequency</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {(prescription.medicines || []).map((medicine, index) => (
                    <tr key={`${prescription._id}-${index}`} className="border-t border-border/60">
                      <td className="px-4 py-3 font-semibold text-foreground">{medicine.name}</td>
                      <td className="px-4 py-3">{medicine.dosage || '—'}</td>
                      <td className="px-4 py-3">{medicine.frequency || '—'}</td>
                      <td className="px-4 py-3">{medicine.duration || '—'}</td>
                      <td className="px-4 py-3">{medicine.quantity ? `${medicine.quantity} ${medicine.unit || ''}` : '—'}</td>
                    </tr>
                  ))}
                  {(prescription.medicines || []).length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-4 text-center text-sm text-muted-foreground">
                        No medicines listed for this prescription.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => handleDownloadPdf(prescription._id)}>
                Download PDF
              </Button>
              {!prescription.pharmacyOrderId && (
                <Button disabled={placingId === prescription._id} onClick={() => placeOrder(prescription)}>
                  {placingId === prescription._id ? 'Placing order...' : 'Place medicine order'}
                </Button>
              )}
            </div>
          </article>
        ))}

        {!loading && filteredPrescriptions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No prescriptions are available for this selection yet.
          </div>
        )}
      </div>
    </motion.section>
  );
}
