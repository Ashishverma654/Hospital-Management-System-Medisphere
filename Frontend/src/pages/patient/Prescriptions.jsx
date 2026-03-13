import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { pharmacyOrderApi, prescriptionApi } from '../../services/apiServices.js';
import { toast } from 'sonner';

export default function PatientPrescriptions() {
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

  const handleDownloadPdf = async (id) => {
    try {
      const blob = await prescriptionApi.downloadPdf(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription-${id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (_) {
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
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Pharmacy Link</p>
        <h2 className="mt-2 text-3xl font-semibold text-slate-900">Prescriptions</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Review doctor-issued prescriptions and place medicine orders while you are still inside the hospital.
        </p>
      </div>

      <div className="space-y-4">
        {prescriptions.map((prescription) => (
          <article key={prescription._id} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="font-semibold text-slate-900">
                  Prescription {String(prescription._id).slice(-8).toUpperCase()}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Doctor: {prescription.doctorId?.userId?.name || 'Hospital Doctor'}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Issued on {new Date(prescription.issuedAt || prescription.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {prescription.status || 'active'}
                </span>
                {prescription.pharmacyOrderId && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Order placed
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(prescription.medicines || []).map((medicine, index) => (
                <div key={`${prescription._id}-${index}`} className="rounded-[1.25rem] bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">{medicine.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {medicine.dosage || 'Dose not set'} • {medicine.frequency || 'Frequency not set'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{medicine.duration || 'Duration not set'}</p>
                </div>
              ))}
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

        {!loading && prescriptions.length === 0 && (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
            No prescriptions are available for this patient account yet.
          </div>
        )}
      </div>
    </section>
  );
}
